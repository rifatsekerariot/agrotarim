const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardConfig = async (req, res) => {
    try {
        const { farmId } = req.params;
        const farm = await prisma.farm.findUnique({
            where: { id: parseInt(farmId) },
            select: { dashboardConfig: true }
        });

        if (!farm) return res.status(404).json({ error: 'Farm not found' });
        res.json(farm.dashboardConfig || { widgets: [] });
    } catch (error) {
        console.error("Get Dashboard Config Error:", error);
        res.status(500).json({ error: 'Failed to fetch dashboard config' });
    }
};

exports.saveDashboardConfig = async (req, res) => {
    try {
        const { farmId } = req.params;
        // Allows saving entire config object (widgets, settings, etc.)
        const configData = req.body;

        await prisma.farm.update({
            where: { id: parseInt(farmId) },
            data: { dashboardConfig: configData }
        });

        res.json({ message: 'Dashboard config saved successfully' });
    } catch (error) {
        console.error("Save Dashboard Config Error:", error);
        res.status(500).json({ error: 'Failed to save dashboard config' });
    }
};
