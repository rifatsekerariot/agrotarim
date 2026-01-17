const express = require('express');
const router = express.Router();
const { MgmService } = require('../mgm/mgm.service');
const { calculateRisk } = require('../risk/risk.engine');
const authenticateToken = require('../auth/auth.middleware');

// Public endpoints for drop-downs
router.get('/provinces', async (req, res) => {
    try {
        const data = await MgmService.getProvinces();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/centers', async (req, res) => {
    try {
        const { il, ilce } = req.query;
        const data = await MgmService.getCenters(il, ilce);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Protected endpoints needing analysis
router.get('/analysis', authenticateToken, async (req, res) => {
    try {
        const { stationId } = req.query; // MGM station ID
        if (!stationId) return res.status(400).json({ error: 'stationId required' });

        // 1. Fetch raw data
        const latestStatus = await MgmService.getLatestStatus(stationId);
        if (!latestStatus || latestStatus.length === 0) {
            return res.status(404).json({ error: 'No data found for this station' });
        }
        const data = latestStatus[0];

        // 2. Calculate Deterministic Risk
        const riskReport = calculateRisk(data);

        // 3. Construct "Verifiable Payload"
        // This payload contains BOTH the raw truth and the server's derived truth
        const payload = {
            meta: {
                stationId,
                timestamp: new Date().toISOString()
            },
            raw_data: data,       // "Ham Veri" for User Proof
            risk_report: riskReport // "Backend's Truth"
        };

        // Note: In a real app, we would log this to DB for audit here
        // await prisma.weatherLog.create(...) 

        res.json(payload);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
