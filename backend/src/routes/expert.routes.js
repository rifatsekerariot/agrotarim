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
        if (city) {
            updateData.city = city;
            // Also update station_id for MGM forecasts
            updateData.station_id = getStationIdForCity(city);
        }

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

// Helper: Map cities to MGM station IDs
function getStationIdForCity(city) {
    const stationMap = {
        'Adana': 17351,
        'Ankara': 17130,
        'Antalya': 17300,
        'Bursa': 17116,
        'Diyarbakır': 17280,
        'İstanbul': 17064,
        'İzmir': 17220,
        'Konya': 17244,
        'Trabzon': 17038,
        'Samsun': 17030,
        'Gaziantep': 17261,
        'Şanlıurfa': 17270,
        'Mersin': 17340,
        'Hatay': 17372,
        'Ardahan': 17045,
        'Rize': 17040,
        'Ordu': 17033
    };
    return stationMap[city] || null;
}

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
