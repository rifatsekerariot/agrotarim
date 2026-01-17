const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authenticateToken = require('../auth/auth.middleware');

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

        if (!farmId || !deviceId || !name || !sensorCode || !condition || threshold === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const parsedFarmId = parseInt(farmId);
        const parsedDeviceId = parseInt(deviceId);
        const parsedThreshold = parseFloat(threshold);

        console.log(`[Rule Create] Attempting to create rule: Farm=${parsedFarmId}, Device=${parsedDeviceId}, Name=${name}`);

        if (isNaN(parsedFarmId) || isNaN(parsedDeviceId) || isNaN(parsedThreshold)) {
            return res.status(400).json({ error: 'Invalid ID or threshold format' });
        }

        // Check availability
        const farmExists = await prisma.farm.findUnique({ where: { id: parsedFarmId } });
        if (!farmExists) return res.status(404).json({ error: `Farm with ID ${parsedFarmId} not found` });

        const deviceExists = await prisma.device.findUnique({ where: { id: parsedDeviceId } });
        if (!deviceExists) return res.status(404).json({ error: `Device with ID ${parsedDeviceId} not found` });

        const rule = await prisma.triggerRule.create({
            data: {
                farmId: parsedFarmId,
                name,
                deviceId: parsedDeviceId,
                sensorCode,
                condition,
                threshold: parsedThreshold,
                actions: {
                    create: actions.map(a => ({
                        type: a.type,
                        target: a.target
                    }))
                }
            },
            include: { actions: true }
        });

        console.log(`[Rule Create] Success: Rule ID ${rule.id}`);
        res.json(rule);
    } catch (error) {
        console.error("[Rule Create Error]", error);
        if (error.code === 'P2003') {
            return res.status(400).json({ error: 'Foreign Key Violation: Farm or Device ID invalid.' });
        }
        res.status(500).json({ error: error.message, details: error });
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
