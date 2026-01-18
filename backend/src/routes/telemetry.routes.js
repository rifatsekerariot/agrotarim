const express = require('express');
const router = express.Router();
const TelemetryController = require('../controllers/telemetry.controller');
const { authenticateToken } = require('../middleware/auth');

// ✅ SECURITY FIX: POST remains open for IoT devices (add API key later)
// GET endpoints require authentication to view data
router.post('/', TelemetryController.ingest);
router.get('/farm/:farmId', authenticateToken, TelemetryController.getFarmStatus);
router.get('/history/:serial', authenticateToken, TelemetryController.getHistory);

module.exports = router;
