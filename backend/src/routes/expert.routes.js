const express = require('express');
const router = express.Router();
const AdvisorService = require('../services/advisor.service');

// GET /api/expert/:farmId
router.get('/:farmId', async (req, res) => {
    try {
        const { farmId } = req.params;
        const advice = await AdvisorService.generateAdvice(parseInt(farmId));
        res.json(advice);
    } catch (error) {
        console.error("Expert Error:", error);
        res.status(500).json({ error: "Expert Analysis Failed" });
    }
});

// POST /api/expert/:farmId/config
router.post('/:farmId/config', async (req, res) => {
    try {
        const { farmId } = req.params;
        const { crop, city } = req.body;

        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const updateData = {};
        if (crop) updateData.crop_type = crop;
        if (city) updateData.city = city;

        await prisma.farm.update({
            where: { id: parseInt(farmId) },
            data: updateData
        });

        res.json({ success: true, message: `Ayarlar güncellendi: ${crop || ''} ${city || ''}` });
    } catch (error) {
        console.error("Config Update Error:", error);
        res.status(500).json({ error: "Ayarlar güncellenemedi" });
    }
});

// GET Dashboard Layout
router.get('/:farmId/dashboard', async (req, res) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
        const farm = await prisma.farm.findUnique({
            where: { id: parseInt(req.params.farmId) },
            select: { dashboardConfig: true }
        });
        res.json(farm?.dashboardConfig || { widgets: [] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// SAVE Dashboard Layout
router.post('/:farmId/dashboard', async (req, res) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
        await prisma.farm.update({
            where: { id: parseInt(req.params.farmId) },
            data: { dashboardConfig: req.body }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
