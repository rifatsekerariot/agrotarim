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
        const configData = req.body;

        console.log(`[Dashboard] Saving config for farm ${farmId}:`, JSON.stringify(configData).substring(0, 200));

        const farm = await prisma.farm.findUnique({
            where: { id: parseInt(farmId) }
        });

        if (!farm) {
            console.error(`[Dashboard] Farm ${farmId} not found`);
            return res.status(404).json({ error: 'Farm not found' });
        }

        await prisma.farm.update({
            where: { id: parseInt(farmId) },
            data: { dashboardConfig: configData }
        });

        console.log(`[Dashboard] Config saved successfully for farm ${farmId}`);
        res.json({ message: 'Dashboard config saved successfully', widgetCount: configData.widgets?.length || 0 });
    } catch (error) {
        console.error("[Dashboard] Save Dashboard Config Error:", error);
        res.status(500).json({ error: 'Failed to save dashboard config', details: error.message });
    }
};
