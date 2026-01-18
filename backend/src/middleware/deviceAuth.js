const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * ✅ SECURITY PHASE 2: Device Authentication Middleware
 * 
 * Validates IoT devices using API key before allowing telemetry data ingestion.
 * Prevents device spoofing and unauthorized data injection.
 * 
 * Usage:
 *   router.post('/telemetry', deviceAuth, TelemetryController.ingest);
 * 
 * Headers required:
 *   X-Device-Key: <api_key>
 * 
 * Body required:
 *   { serial: "DEVICE123", readings: { ... } }
 */
const deviceAuth = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-device-key'];
        const { serial } = req.body;

        // Check if API key is provided
        if (!apiKey) {
            return res.status(401).json({
                error: 'Device authentication required',
                details: 'Missing X-Device-Key header'
            });
        }

        // Check if serial is provided
        if (!serial) {
            return res.status(400).json({
                error: 'Missing device serial number'
            });
        }

        // ✅ Verify device exists, is active, and API key matches
        const device = await prisma.device.findFirst({
            where: {
                serial: serial,
                apiKey: apiKey,
                // Optional: Add more security checks
                farm: {
                    isActive: true // Farm must be active
                }
            },
            include: {
                farm: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!device) {
            // Generic error - don't reveal if serial or key is wrong
            return res.status(403).json({
                error: 'Invalid device credentials'
            });
        }

        // ✅ Attach authenticated device to request
        req.device = device;
        req.authenticatedDeviceId = device.id;

        next();
    } catch (error) {
        console.error('[DeviceAuth] Authentication error:', error);
        res.status(500).json({
            error: 'Authentication failed'
        });
    }
};

/**
 * Generate a secure API key for a device
 * @returns {string} 64-character hex string
 */
const generateApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Helper: Generate and assign API key to a device
 * @param {number} deviceId - Device ID
 * @returns {Promise<string>} Generated API key
 */
const assignApiKeyToDevice = async (deviceId) => {
    const apiKey = generateApiKey();

    await prisma.device.update({
        where: { id: deviceId },
        data: {
            apiKey: apiKey,
            apiKeyCreatedAt: new Date()
        }
    });

    return apiKey;
};

/**
 * Helper: Rotate API key for a device (security best practice)
 * @param {number} deviceId - Device ID
 * @returns {Promise<string>} New API key
 */
const rotateDeviceApiKey = async (deviceId) => {
    const newApiKey = generateApiKey();

    await prisma.device.update({
        where: { id: deviceId },
        data: {
            apiKey: newApiKey,
            apiKeyCreatedAt: new Date()
        }
    });

    return newApiKey;
};

module.exports = {
    deviceAuth,
    generateApiKey,
    assignApiKeyToDevice,
    rotateDeviceApiKey
};
