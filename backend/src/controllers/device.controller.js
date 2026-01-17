const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all devices for the first farm (Simulated single-tenant for now)
exports.getDevices = async (req, res) => {
    try {
        const farm = await prisma.farm.findFirst({
            include: { devices: { include: { sensors: true } } }
        });

        if (!farm) {
            return res.json([]);
        }
        res.json(farm.devices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createDevice = async (req, res) => {
    try {
        const { name, serialNumber, model, farmId, telemetryMappings, latitude, longitude } = req.body;

        // Ensure Farm exists
        let targetFarmId = farmId;
        if (!targetFarmId) {
            const farm = await prisma.farm.findFirst();
            if (farm) targetFarmId = farm.id;
        }

        const device = await prisma.device.create({
            data: {
                name,
                serialNumber,
                model,
                farmId: parseInt(targetFarmId),
                telemetryMappings: telemetryMappings || {},
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                status: 'offline'
            }
        });
        res.json(device);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, telemetryMappings, latitude, longitude } = req.body;

        const device = await prisma.device.update({
            where: { id: parseInt(id) },
            data: {
                name,
                telemetryMappings,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null
            }
        });
        res.json(device);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;
        // Optional: Delete related sensors/telemetry first or rely on cascade if configured
        // For safety, just delete the device now.
        await prisma.device.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
