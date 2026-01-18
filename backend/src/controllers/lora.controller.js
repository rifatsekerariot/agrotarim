const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const loraCommandService = require('../services/lora-command.service');

/**
 * POST /api/lora/devices/:id/downlink
 * Manuel downlink komutu gönder
 */
exports.sendManualDownlink = async (req, res) => {
    try {
        const deviceId = parseInt(req.params.id);
        const { hexData, port = 1, command = 'Manual Command' } = req.body;

        // Validation
        if (!hexData) {
            return res.status(400).json({ error: 'hexData is required' });
        }

        // HEX format validation
        const hexRegex = /^[0-9A-Fa-f]+$/;
        if (!hexRegex.test(hexData)) {
            return res.status(400).json({ error: 'Invalid HEX format. Use only 0-9, A-F characters.' });
        }

        // Device kontrolü
        const device = await prisma.device.findUnique({
            where: { id: deviceId },
            include: { loraServer: true }
        });

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        if (!device.loraServerId) {
            return res.status(400).json({ error: 'Device is not a LoRa device' });
        }

        // LoRa command service ile gönder
        const result = await loraCommandService.sendDownlink(
            deviceId,
            hexData.toUpperCase(),
            parseInt(port),
            command,
            'MANUAL', // triggeredBy
            null      // ruleId (manual olduğu için null)
        );

        res.json({
            success: true,
            downlinkId: result.logId,
            message: 'Downlink command sent successfully',
            data: {
                device: device.name,
                command,
                hexData: hexData.toUpperCase(),
                port: parseInt(port)
            }
        });

    } catch (error) {
        console.error('[LoRaController] Error sending manual downlink:', error);
        res.status(500).json({
            error: 'Failed to send downlink command',
            details: error.message
        });
    }
};

/**
 * GET /api/lora/devices/:id/downlink-logs
 * Belirli bir cihaz için downlink loglarını getir
 */
exports.getDownlinkLogs = async (req, res) => {
    try {
        const deviceId = parseInt(req.params.id);
        const { limit = 50, status } = req.query;

        const whereClause = { deviceId };

        if (status && status !== 'all') {
            whereClause.status = status;
        }

        const logs = await prisma.downlinkLog.findMany({
            where: whereClause,
            include: {
                device: {
                    select: { id: true, name: true, devEui: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        res.json({
            success: true,
            count: logs.length,
            logs
        });

    } catch (error) {
        console.error('[LoRaController] Error fetching downlink logs:', error);
        res.status(500).json({
            error: 'Failed to fetch downlink logs',
            details: error.message
        });
    }
};

/**
 * GET /api/lora/downlink-logs
 * Tüm downlink loglarını getir (admin)
 */
exports.getAllDownlinkLogs = async (req, res) => {
    try {
        const { limit = 100, status, deviceId } = req.query;

        // ✅ SECURITY FIX #8: Filter by user's devices only
        const userId = req.user.userId;

        // Get all devices owned by user
        const userDevices = await prisma.device.findMany({
            where: {
                farm: {
                    userId: userId
                }
            },
            select: { id: true }
        });

        const userDeviceIds = userDevices.map(d => d.id);

        if (userDeviceIds.length === 0) {
            return res.json({
                success: true,
                count: 0,
                stats: {},
                logs: []
            });
        }

        const whereClause = {
            deviceId: { in: userDeviceIds } // ✅ Only user's devices
        };

        if (status && status !== 'all') {
            whereClause.status = status;
        }

        if (deviceId) {
            const parsedDeviceId = parseInt(deviceId);
            // ✅ Verify user owns this device
            if (!userDeviceIds.includes(parsedDeviceId)) {
                return res.status(403).json({
                    error: 'Access denied: Device does not belong to you'
                });
            }
            whereClause.deviceId = parsedDeviceId;
        }

        const logs = await prisma.downlinkLog.findMany({
            where: whereClause,
            include: {
                device: {
                    select: { id: true, name: true, devEui: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        // Aggregate stats (only for user's devices)
        const stats = await prisma.downlinkLog.groupBy({
            by: ['status'],
            where: { deviceId: { in: userDeviceIds } },
            _count: true
        });

        res.json({
            success: true,
            count: logs.length,
            stats: stats.reduce((acc, s) => {
                acc[s.status] = s._count;
                return acc;
            }, {}),
            logs
        });

    } catch (error) {
        console.error('[LoRaController] Error fetching all downlink logs:', error);
        res.status(500).json({
            error: 'Failed to fetch downlink logs',
            details: error.message
        });
    }
};
