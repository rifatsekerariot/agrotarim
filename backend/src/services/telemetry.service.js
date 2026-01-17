const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TelemetryService = {
    /**
     * Process incoming sensor data from a device
     * @param {string} serialNumber - Device MAC/Serial
     * @param {Object} readings - Key-value pair of sensor codes and values e.g. { "t_air": 25.5, "h_air": 60 }
     */
    async ingestData(serialNumber, readings) {
        try {
            // 1. Find the device
            const device = await prisma.device.findUnique({
                where: { serialNumber },
                include: { sensors: true, deviceModel: true }
            });

            if (!device) {
                throw new Error(`Device not found: ${serialNumber}`);
            }

            // 2. Update Device Status
            await prisma.device.update({
                where: { id: device.id },
                data: {
                    lastSeen: new Date(),
                    status: 'online'
                }
            });

            // 3. Process each reading
            const operations = [];
            // Map existing sensor codes to IDs
            const sensorMap = new Map(device.sensors.map(s => [s.code, s.id]));
            const newSensors = [];

            for (const [code, value] of Object.entries(readings)) {
                let sensorId = sensorMap.get(code);

                // If sensor doesn't exist, create it on the fly
                if (!sensorId) {
                    console.log(`[Telemetry] Auto-creating sensor '${code}' for device ${device.name}`);

                    // Try to guess unit from code or model template
                    let unit = '';
                    let type = 'generic';
                    let name = code;

                    // Try to find definition in DeviceModel template
                    if (device.deviceModel?.sensorTemplate && Array.isArray(device.deviceModel.sensorTemplate)) {
                        const template = device.deviceModel.sensorTemplate.find(s => s.code === code);
                        if (template) {
                            unit = template.unit || '';
                            type = template.type || 'generic';
                            name = template.name || code;
                        }
                    }

                    // Fallback heuristics
                    if (!unit) {
                        if (code.includes('temp')) unit = '°C';
                        else if (code.includes('hum')) unit = '%';
                        else if (code.includes('batt')) unit = '%';
                        else if (code.includes('press')) unit = 'hPa';
                        else if (code.includes('co2')) unit = 'ppm';
                    }

                    const newSensor = await prisma.sensor.create({
                        data: {
                            deviceId: device.id,
                            code,
                            name: name.charAt(0).toUpperCase() + name.slice(1),
                            type,
                            unit
                        }
                    });

                    sensorId = newSensor.id;
                    sensorMap.set(code, sensorId); // Update map so we don't create twice if duplicate in payload
                }

                if (sensorId) {
                    operations.push(
                        prisma.telemetry.create({
                            data: {
                                sensorId,
                                value: parseFloat(value)
                            }
                        })
                    );
                }
            }

            if (operations.length > 0) {
                await prisma.$transaction(operations);
            }

            // 4. Trigger Alert Engine
            const AlertService = require('./alert.service');
            AlertService.checkRules(device.farmId, readings).catch(err => console.error("Alert Trigger Failed:", err));

            return { success: true, processed: operations.length };

        } catch (error) {
            console.error('Telemetry Ingestion Error:', error);
            throw error;
        }
    },

    /**
     * Get latest data for a farm's dashboard
     */
    async getFarmLiveStatus(farmId) {
        return prisma.device.findMany({
            where: { farmId },
            include: {
                sensors: {
                    include: {
                        telemetry: {
                            take: 12,
                            orderBy: { timestamp: 'desc' }
                        }
                    }
                }
            }
        });
    },

    /**
     * Get historical data for charts (last 24h)
     */
    async getDeviceHistory(serialNumber) {
        const device = await prisma.device.findUnique({
            where: { serialNumber },
            include: { sensors: true }
        });

        if (!device) throw new Error("Device not found");

        const history = {};
        const yesterday = new Date(new Date() - 24 * 60 * 60 * 1000);

        for (const sensor of device.sensors) {
            const data = await prisma.telemetry.findMany({
                where: {
                    sensorId: sensor.id,
                    timestamp: { gte: yesterday }
                },
                orderBy: { timestamp: 'asc' },
                // Take every Nth point to reduce volume if needed, 
                // for now take all (assuming 5min interval = ~288 points)
            });
            history[sensor.code] = data; // { "t_air": [...], "h_air": [...] }
        }

        return { deviceName: device.name, history };
    }
};

module.exports = TelemetryService;
