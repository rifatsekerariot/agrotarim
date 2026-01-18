const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticateToken = require('../auth/auth.middleware');
const { encrypt, decrypt } = require('../utils/encryption');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const extract = require('extract-zip');

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() === '.zip') {
            cb(null, true);
        } else {
            cb(new Error('Only ZIP files are allowed'));
        }
    }
});

// Helper to sanitize settings (hide passwords)
const sanitizeSetting = (setting) => {
    if (setting.key.includes('PASS') || setting.key.includes('SECRET') || setting.key.includes('KEY')) {
        return { ...setting, value: '********' };
    }
    return setting;
};

// GET /api/settings
router.get('/', authenticateToken, async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/settings (Upsert)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { key, value, description } = req.body;

        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description }
        });

        res.json(setting);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/settings/bulk (Update multiple)
router.post('/bulk', authenticateToken, async (req, res) => {
    try {
        const settings = req.body; // Array of {key, value}
        const results = [];

        for (const s of settings) {
            // Encrypt sensitive fields
            let valueToStore = s.value;
            if (s.key.includes('PASS') || s.key.includes('SECRET') || s.key.includes('KEY')) {
                try {
                    valueToStore = encrypt(s.value);
                    console.log(`[Settings] Encrypted sensitive field: ${s.key}`);
                } catch (encErr) {
                    console.error(`[Settings] Encryption failed for ${s.key}:`, encErr);
                }
            }

            const res = await prisma.systemSetting.upsert({
                where: { key: s.key },
                update: { value: valueToStore },
                create: { key: s.key, value: valueToStore }
            });
            results.push(res);
        }

        // Re-initialize email service after SMTP settings change
        const emailService = require('../services/email.service');
        await emailService.initialize();

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/settings/test-email
router.post('/test-email', authenticateToken, async (req, res) => {
    try {
        const { to } = req.body;

        if (!to) {
            return res.status(400).json({ error: 'Email address required' });
        }

        const emailService = require('../services/email.service');
        const result = await emailService.sendEmail(
            to,
            'Test Email - Sera Otomasyon',
            'Bu bir test emailidir. SMTP ayarlarınız doğru çalışıyor!',
            '<div style="font-family: Arial, sans-serif; padding: 20px;">' +
            '<h2 style="color: #4CAF50;">✅ Test Başarılı!</h2>' +
            '<p>SMTP ayarlarınız doğru şekilde yapılandırılmış.</p>' +
            '<p>Bu email <strong>Sera Otomasyon Sistemi</strong> tarafından gönderilmiştir.</p>' +
            '<hr />' +
            '<small style="color: #999;">Test tarihi: ' + new Date().toLocaleString('tr-TR') + '</small>' +
            '</div>'
        );

        if (result.success) {
            res.json({ success: true, message: 'Test email sent successfully', messageId: result.messageId });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('[Settings] Test email error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/settings/backup - Download all settings as ZIP
router.get('/backup', authenticateToken, async (req, res) => {
    try {
        const archiver = require('archiver');

        // Create archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Set response headers
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `backup_${timestamp}.zip`;
        res.attachment(filename);
        res.setHeader('Content-Type', 'application/zip');

        // Pipe archive to response
        archive.pipe(res);

        // Error handling
        archive.on('error', (err) => {
            console.error('[Backup] Archive error:', err);
            throw err;
        });

        // Gather all data
        const systemSettings = await prisma.systemSetting.findMany();
        const smsProviders = await prisma.smsProvider.findMany();
        const loraServers = await prisma.loraServer.findMany();
        const devices = await prisma.device.findMany({
            include: {
                deviceModel: true
            }
        });

        // NOTE: NO MASKING - We save raw data so restore works properly
        // User downloads this to their own secure computer

        // Create backup info
        const backupInfo = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            counts: {
                systemSettings: systemSettings.length,
                smsProviders: smsProviders.length,
                loraServers: loraServers.length,
                devices: devices.length
            }
        };

        // Add files to archive (with raw, unmasked data)
        archive.append(JSON.stringify(backupInfo, null, 2), { name: 'backup_info.json' });
        archive.append(JSON.stringify(systemSettings, null, 2), { name: 'system_settings.json' });
        archive.append(JSON.stringify(smsProviders, null, 2), { name: 'sms_providers.json' });
        archive.append(JSON.stringify(loraServers, null, 2), { name: 'lora_servers.json' });
        archive.append(JSON.stringify(devices, null, 2), { name: 'devices.json' });

        // Finalize archive
        await archive.finalize();

        console.log(`[Backup] Created backup: ${filename}`);
    } catch (error) {
        console.error('[Settings] Backup error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// POST /api/settings/restore - Upload and restore from backup ZIP
router.post('/restore', authenticateToken, upload.single('backup'), async (req, res) => {
    let extractPath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No backup file provided' });
        }

        console.log('[Restore] Starting restore from:', req.file.originalname);

        // Create temp directory for extraction
        extractPath = path.join('uploads', `extract_${Date.now()}`);
        await fs.mkdir(extractPath, { recursive: true });

        // Extract ZIP
        await extract(req.file.path, { dir: path.resolve(extractPath) });
        console.log('[Restore] ZIP extracted');

        // Read JSON files
        const backupInfo = JSON.parse(await fs.readFile(path.join(extractPath, 'backup_info.json'), 'utf8'));
        const systemSettings = JSON.parse(await fs.readFile(path.join(extractPath, 'system_settings.json'), 'utf8'));
        const smsProviders = JSON.parse(await fs.readFile(path.join(extractPath, 'sms_providers.json'), 'utf8'));
        const loraServers = JSON.parse(await fs.readFile(path.join(extractPath, 'lora_servers.json'), 'utf8'));
        const devices = JSON.parse(await fs.readFile(path.join(extractPath, 'devices.json'), 'utf8'));

        console.log('[Restore] Backup info:', backupInfo);

        // Restore data to database
        let restored = {
            systemSettings: 0,
            smsProviders: 0,
            loraServers: 0,
            devices: 0
        };

        // Restore system settings (upsert by key)
        for (const setting of systemSettings) {
            await prisma.systemSetting.upsert({
                where: { key: setting.key },
                update: { value: setting.value, description: setting.description },
                create: { key: setting.key, value: setting.value, description: setting.description }
            });
            restored.systemSettings++;
        }

        // Restore SMS providers (create new, ignore IDs from backup)
        for (const provider of smsProviders) {
            const { id, createdAt, updatedAt, ...providerData } = provider;
            await prisma.smsProvider.create({
                data: providerData
            });
            restored.smsProviders++;
        }

        // Restore LoRa servers (create new, ignore IDs from backup)
        for (const server of loraServers) {
            const { id, createdAt, updatedAt, ...serverData } = server;
            await prisma.loraServer.create({
                data: serverData
            });
            restored.loraServers++;
        }

        // Restore devices (create new, ignore IDs from backup)
        for (const device of devices) {
            const { id, createdAt, updatedAt, deviceModel, ...deviceData } = device;
            await prisma.device.create({
                data: deviceData
            });
            restored.devices++;
        }

        // Re-initialize services
        const emailService = require('../services/email.service');
        await emailService.initialize();

        const smsService = require('../services/sms.service');
        await smsService.reload();

        console.log('[Restore] Successfully restored:', restored);

        res.json({
            success: true,
            message: 'Backup restored successfully',
            backupInfo,
            restored
        });

    } catch (error) {
        console.error('[Settings] Restore error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Restore failed. Please check the backup file and try again.'
        });
    } finally {
        // Cleanup
        try {
            if (req.file) await fs.unlink(req.file.path);
            if (extractPath) await fs.rm(extractPath, { recursive: true, force: true });
        } catch (cleanupErr) {
            console.error('[Restore] Cleanup error:', cleanupErr);
        }
    }
});

module.exports = router;
