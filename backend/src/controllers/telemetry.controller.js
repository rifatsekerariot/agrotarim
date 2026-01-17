const TelemetryService = require('../services/telemetry.service');

const TelemetryController = {
    // POST /api/telemetry
    // Body: { serial: "A1B2", readings: { "temp": 22, "hum": 40 } }
    async ingest(req, res) {
        try {
            const { serial, readings } = req.body;

            if (!serial || !readings) {
                return res.status(400).json({ error: 'Missing serial or readings' });
            }

            const result = await TelemetryService.ingestData(serial, readings);
            res.status(200).json(result);
        } catch (error) {
            if (error.message.includes('Device not found')) {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    // GET /api/telemetry/farm/:farmId
    async getFarmStatus(req, res) {
        try {
            const { farmId } = req.params;
            const data = await TelemetryService.getFarmLiveStatus(parseInt(farmId));
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // GET /api/telemetry/history/:serial
    async getHistory(req, res) {
        try {
            const { serial } = req.params;
            const hours = req.query.hours ? parseInt(req.query.hours) : 24;
            const data = await TelemetryService.getDeviceHistory(serial, hours);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = TelemetryController;
