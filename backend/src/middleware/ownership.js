const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * ✅ SECURITY FIX: Farm Ownership Validation Middleware
 * 
 * Ensures that the authenticated user has access to the requested farm.
 * This prevents users from accessing other users' farms by changing farmId in URL.
 * 
 * Usage:
 *   router.get('/rules/:farmId', authenticateToken, validateFarmOwnership, ...)
 */
const validateFarmOwnership = async (req, res, next) => {
    try {
        const farmId = parseInt(req.params.farmId);

        if (isNaN(farmId)) {
            return res.status(400).json({ error: 'Invalid farm ID' });
        }

        // Get authenticated user ID from JWT (set by authenticateToken middleware)
        const userId = req.user.userId;

        // Check if farm exists and belongs to user
        const farm = await prisma.farm.findFirst({
            where: {
                id: farmId,
                user_id: userId // ✅ User ownership validation
            }
        });

        if (!farm) {
            return res.status(403).json({
                error: 'Access denied: Farm not found or you do not have permission'
            });
        }

        // Attach farm to request for later use
        req.farm = farm;
        next();
    } catch (error) {
        console.error('[validateFarmOwnership] Error:', error);
        res.status(500).json({ error: 'Farm validation failed' });
    }
};

/**
 * ✅ SECURITY FIX: Device Ownership Validation Middleware
 * 
 * Ensures that the device belongs to a farm owned by the authenticated user.
 * Prevents unauthorized users from controlling other users' devices.
 * 
 * Usage:
 *   router.post('/devices/:id/downlink', authenticateToken, validateDeviceOwnership, ...)
 */
const validateDeviceOwnership = async (req, res, next) => {
    try {
        const deviceId = parseInt(req.params.id);

        if (isNaN(deviceId)) {
            return res.status(400).json({ error: 'Invalid device ID' });
        }

        const userId = req.user.userId;

        // Check if device exists and belongs to user's farm
        const device = await prisma.device.findFirst({
            where: {
                id: deviceId,
                farm: {
                    user_id: userId // ✅ User ownership validation via farm
                }
            },
            include: {
                farm: {
                    select: { id: true, user_id: true }
                }
            }
        });

        if (!device) {
            return res.status(403).json({
                error: 'Access denied: Device not found or you do not have permission'
            });
        }

        // Attach device to request
        req.device = device;
        next();
    } catch (error) {
        console.error('[validateDeviceOwnership] Error:', error);
        res.status(500).json({ error: 'Device validation failed' });
    }
};

module.exports = {
    validateFarmOwnership,
    validateDeviceOwnership
};
