const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const DEFAULT_PASSWORD = '12345';

// Public registration disabled
const register = async (req, res) => {
    return res.status(403).json({ error: 'Public registration is disabled. Please contact administrator.' });
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
            expiresIn: '24h',
        });

        // Check if using default password
        const isDefaultPassword = await bcrypt.compare(DEFAULT_PASSWORD, user.password_hash);

        res.json({
            token,
            user: { id: user.id, username: user.username },
            mustChangePassword: isDefaultPassword
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
};

// Change initial password endpoint
const changeInitialPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.user.userId; // From JWT middleware

        if (!newPassword || newPassword.length < 5) {
            return res.status(400).json({ error: 'Password must be at least 5 characters' });
        }

        // Verify user is still on default password
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const isDefaultPassword = await bcrypt.compare(DEFAULT_PASSWORD, user.password_hash);

        if (!isDefaultPassword) {
            return res.status(400).json({ error: 'You are not using the default password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password_hash: hashedPassword }
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Password change failed', details: error.message });
    }
};

module.exports = { register, login, changeInitialPassword };
