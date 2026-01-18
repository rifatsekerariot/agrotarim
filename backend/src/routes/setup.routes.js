const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

/**
 * Check if initial setup is needed
 * Returns true if no users or farms exist
 */
router.get('/status', async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        const farmCount = await prisma.farm.count();

        const needsSetup = userCount === 0 || farmCount === 0;

        res.json({
            needsSetup,
            userCount,
            farmCount
        });
    } catch (error) {
        console.error('[Setup] Status check error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Initialize system with first admin user and farm
 */
router.post('/initialize', async (req, res) => {
    try {
        const { username, email, password, farmName, farmLocation } = req.body;

        // Validation
        if (!username || !password || !farmName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if setup already completed
        const userCount = await prisma.user.count();
        if (userCount > 0) {
            return res.status(403).json({ error: 'Setup already completed' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user and farm in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create admin user
            const user = await tx.user.create({
                data: {
                    username,
                    email: email || `${username}@agrometa.local`,
                    password_hash: hashedPassword,
                    role: 'ADMIN'
                }
            });

            // Create first farm
            const farm = await tx.farm.create({
                data: {
                    name: farmName,
                    location: farmLocation || 'Türkiye',
                    user_id: user.id
                }
            });

            return { user, farm };
        });

        console.log(`[Setup] System initialized with user: ${username}, farm: ${farmName}`);

        res.json({
            success: true,
            message: 'Setup completed successfully',
            userId: result.user.id,
            farmId: result.farm.id
        });

    } catch (error) {
        console.error('[Setup] Initialization error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
