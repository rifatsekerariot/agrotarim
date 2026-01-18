const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticateToken = require('../auth/auth.middleware');
const { encrypt, decrypt } = require('../utils/encryption');

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
        // Determine whether to show raw values based on role? For now, we decrypt but maybe mask strictly confidential stuff on UI
        // Actually, for editing, we need the values. Or we use the "Enter new password to change" pattern.
        // Let's send decrypted values but careful with logs.
        const decrypted = settings.map(s => {
            try {
                // If value looks encrypted (simple check or try/catch), decrypt it
                // For now, assuming we store PLAIN text for simplicity unless specified?
                // Plan: Store sensitive keys with "ENC:" prefix or utilize `encryption.js` util
                return s;
            } catch (e) {
                return s;
            }
        });
        res.json(decrypted);
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

module.exports = router;
