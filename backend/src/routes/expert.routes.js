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
        const { crop } = req.body;

        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        await prisma.farm.update({
            where: { id: parseInt(farmId) },
            data: { crop_type: crop }
        });

        res.json({ success: true, message: `Ürün ${crop} olarak güncellendi.` });
    } catch (error) {
        console.error("Config Update Error:", error);
        res.status(500).json({ error: "Ayarlar güncellenemedi" });
    }
});

module.exports = router;
