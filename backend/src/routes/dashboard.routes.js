const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middleware/auth');

// ✅ SECURITY FIX: Add authentication to dashboard endpoints
router.use(authenticateToken);

router.get('/:farmId', controller.getDashboardConfig);
router.post('/:farmId', controller.saveDashboardConfig);

module.exports = router;
