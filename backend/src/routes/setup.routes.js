const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const prisma = new PrismaClient();

// ✅ SECURITY: Rate limit setup endpoint (prevent brute force)
const setupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 attempts
    message: { error: 'Too many setup attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Check if initial setup is needed
 * Returns true if no users exist
 */
router.get('/status', async (req, res) => {
    try {
        const userCount = await prisma.user.count();

        res.json({
            needsSetup: userCount === 0,
            userCount: userCount > 0 ? 'configured' : 0 // Don't leak exact count
        });
    } catch (error) {
        console.error('[Setup] Status check error:', error);
        // Assume setup needed on error (fail-safe)
        res.json({ needsSetup: true, userCount: 0 });
    }
});

/**
 * Initialize system with first admin user and farm
 * ✅ SECURITY: Rate limited, validated, restricted
 */
router.post('/initialize', setupLimiter, async (req, res) => {
    try {
        const { username, email, password, farmName, farmLocation } = req.body;

        // ✅ SECURITY: Check if setup already completed (double-check)
        const userCount = await prisma.user.count();
        if (userCount > 0) {
            return res.status(403).json({ error: 'Setup already completed. Please use login.' });
        }

        // ✅ SECURITY: Input validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Username validation (alphanumeric + underscore, 3-20 chars)
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return res.status(400).json({
                error: 'Username must be 3-20 characters (letters, numbers, underscore only)'
            });
        }

        // ✅ SECURITY: Password strength requirements
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
        }

        if (!/[a-z]/.test(password)) {
            return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
        }

        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ error: 'Password must contain at least one number' });
        }

        // Email validation (if provided)
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Farm name validation (if provided)
        if (farmName && farmName.length > 100) {
            return res.status(400).json({ error: 'Farm name too long (max 100 characters)' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user and farm in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create admin user
            const user = await tx.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    email: email || `${username}@local.host`,
                    role: 'ADMIN',
                    isActive: true
                }
            });

            // Create first farm
            const farm = await tx.farm.create({
                data: {
                    userId: user.id,
                    name: farmName || 'Sera 1',
                    location: farmLocation || 'Merkez'
                }
            });

            return { user, farm };
        });

        console.log(`[Setup] ✅ System initialized - User: ${username}, Farm: ${farmName || 'Sera 1'}`);

        res.json({
            success: true,
            message: 'Setup completed successfully',
            userId: result.user.id,
            farmId: result.farm.id
        });

    } catch (error) {
        console.error('[Setup] Initialization error:', error);

        // Handle duplicate username/email
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        res.status(500).json({ error: 'Setup failed. Please try again.' });
    }
});

module.exports = router;
