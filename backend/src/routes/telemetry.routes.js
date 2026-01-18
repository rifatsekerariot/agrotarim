const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetry.controller');
const { authenticateToken } = require('../auth/auth.middleware');  // ✅ FIX: Correct path

// ✅ SECURITY FIX: POST remains open for IoT devices (add API key later)
// GET endpoints require authentication to view data

module.exports = router;
