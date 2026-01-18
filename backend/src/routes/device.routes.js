const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { authenticateToken } = require('../auth/auth.middleware');

// ✅ SECURITY FIX: Add authentication to all device endpoints
router.use(authenticateToken);

router.get('/', deviceController.getDevices);
router.post('/', deviceController.createDevice);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.deleteDevice);

module.exports = router;
