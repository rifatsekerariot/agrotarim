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
            const res = await prisma.systemSetting.upsert({
                where: { key: s.key },
                update: { value: s.value },
                create: { key: s.key, value: s.value }
            });
            results.push(res);
        }
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
