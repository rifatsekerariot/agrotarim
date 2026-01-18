const express = require('express');
const router = express.Router();
const { register, login, changeInitialPassword } = require('../auth/auth.controller');
const authenticateToken = require('../auth/auth.middleware');
const rateLimit = require('express-rate-limit');

// ✅ SECURITY FIX #1: Rate limiting for login endpoint
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/change-initial-password', authenticateToken, changeInitialPassword);

module.exports = router;
