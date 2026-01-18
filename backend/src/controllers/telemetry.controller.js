const TelemetryService = require('../services/telemetry.service');

// ✅ SECURITY FIX #2: IoT Input Validation
// Define acceptable sensor value ranges
const SENSOR_LIMITS = {
    temperature: { min: -50, max: 80 },
    humidity: { min: 0, max: 100 },
    soilMoisture: { min: 0, max: 100 },
    battery: { min: 0, max: 100 },
    pressure: { min: 300, max: 1100 },
    co2: { min: 0, max: 5000 },
    light: { min: 0, max: 100000 }
};

const TelemetryController = {
    // POST /api/telemetry
    // Body: { serial: "A1B2", readings: { "temp": 22, "hum": 40 } }
    async ingest(req, res) {
        try {
            const { serial, readings } = req.body;

            if (!serial || !readings) {
                return res.status(400).json({ error: 'Missing serial or readings' });
            }

            // ✅ Validate readings object
            if (typeof readings !== 'object' || Array.isArray(readings)) {
                return res.status(400).json({ error: 'Invalid readings format: must be an object' });
            }

            // ✅ Limit sensor count (prevents storage exhaustion)
            const sensorCount = Object.keys(readings);
            if (sensorCount.length > 50) {
                return res.status(400).json({
                    error: `Too many sensors: ${sensorCount} (max: 50)`
                });
            }

            if (sensorCount.length === 0) {
                return res.status(400).json({ error: 'No sensor readings provided' });
            }

            // ✅ Validate each sensor value
            for (const [key, value] of Object.entries(readings)) {
                // Type validation
                if (typeof value !== 'number') {
                    return res.status(400).json({
                        error: `Invalid value type for sensor '${key}': expected number, got ${typeof value}`
                    });
                }

                // Finite number check (prevents NaN, Infinity)
                if (!isFinite(value)) {
                    return res.status(400).json({
                        error: `Invalid numeric value for sensor '${key}': ${value}`
                    });
                }

                // Range validation (if sensor type is known)
                const limit = SENSOR_LIMITS[key] || SENSOR_LIMITS[key.toLowerCase()];
                if (limit) {
                    if (value < limit.min || value > limit.max) {
                        return res.status(400).json({
                            error: `Value out of range for sensor '${key}': ${value} (allowed: ${limit.min} to ${limit.max})`
                        });
                    }
                }

                // Generic sanity check for unknown sensors
                if (!limit && (value < -999999 || value > 999999)) {
                    return res.status(400).json({
                        error: `Suspicious value for sensor '${key}': ${value} (exceeds reasonable bounds)`
                    });
                }
            }

            // ✅ All validations passed, proceed with ingestion
            const result = await TelemetryService.ingestData(serial, readings);
            res.status(200).json(result);
        } catch (error) {
            if (error.message.includes('Device not found')) {
                return res.status(404).json({ error: error.message });
            }
            // ✅ SECURITY: Don't leak internal error details
            console.error('[Telemetry] Ingestion error:', error);
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
            console.error('[Telemetry] Farm status error:', error);
            res.status(500).json({ error: 'Failed to retrieve farm status' });
        }
    },

    // GET /api/telemetry/history/:serial
    async getHistory(req, res) {
        try {
            const { serial } = req.params;
            const hours = req.query.hours ? parseInt(req.query.hours) : 24;

            // ✅ Validate hours parameter
            if (isNaN(hours) || hours < 1 || hours > 720) {
                return res.status(400).json({
                    error: 'Invalid hours parameter: must be between 1 and 720'
                });
            }

            const data = await TelemetryService.getDeviceHistory(serial, hours);
            res.json(data);
        } catch (error) {
            console.error('[Telemetry] History error:', error);
            res.status(500).json({ error: 'Failed to retrieve device history' });
        }
    }
};

module.exports = TelemetryController;
