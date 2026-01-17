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
                include: { sensors: true }
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
            const sensorMap = new Map(device.sensors.map(s => [s.code, s.id]));

            for (const [code, value] of Object.entries(readings)) {
                const sensorId = sensorMap.get(code);

                if (sensorId) {
                    // Add telemetry insert to transaction
                    operations.push(
                        prisma.telemetry.create({
                            data: {
                                sensorId,
                                value: parseFloat(value)
                            }
                        })
                    );
                } else {
                    console.warn(`Unknown sensor code '${code}' for device ${serialNumber}`);
                }
            }

            if (operations.length > 0) {
                await prisma.$transaction(operations);
            }

            // 4. Trigger Alert Engine (Fire & Forget)
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
                            take: 1,
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
