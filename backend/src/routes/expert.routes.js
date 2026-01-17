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

module.exports = router;
