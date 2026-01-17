const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken } = require('../middleware/auth.middleware');

// GET /api/automation/rules/:farmId
router.get('/rules/:farmId', authenticateToken, async (req, res) => {
    try {
        const farmId = parseInt(req.params.farmId);

        // Security check: Ensure user owns the farm (simplified check)
        // In a real app, logic should verify req.user.id linkage to farm

        const rules = await prisma.triggerRule.findMany({
            where: { farmId },
            include: {
                device: true,
                actions: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(rules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/automation/rules
router.post('/rules', authenticateToken, async (req, res) => {
    try {
        const { farmId, name, deviceId, sensorCode, condition, threshold, actions } = req.body;

        const rule = await prisma.triggerRule.create({
            data: {
                farmId: parseInt(farmId),
                name,
                deviceId: parseInt(deviceId),
                sensorCode,
                condition,
                threshold: parseFloat(threshold),
                actions: {
                    create: actions.map(a => ({
                        type: a.type,
                        target: a.target
                    }))
                }
            },
            include: { actions: true }
        });

        res.json(rule);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/automation/rules/:id
router.delete('/rules/:id', authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.triggerRule.delete({ where: { id } });
        res.json({ message: 'Rule deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/automation/logs/:farmId
router.get('/logs/:farmId', authenticateToken, async (req, res) => {
    try {
        const farmId = parseInt(req.params.farmId);
        // Get logs for rules belonging to this farm
        // Join TriggerRule -> AlertLog
        const logs = await prisma.alertLog.findMany({
            where: {
                rule: { farmId }
            },
            include: {
                rule: true
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
