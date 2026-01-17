const express = require('express');
const router = express.Router();
const TelemetryController = require('../controllers/telemetry.controller');
// Add middleware if auth is needed. For ingestion, usually token-based or API key, 
// for now keeping it open or you can add a basic API key check.

router.post('/', TelemetryController.ingest);
router.get('/farm/:farmId', TelemetryController.getFarmStatus);

module.exports = router;
