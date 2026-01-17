const express = require('express');
const router = express.Router();
const smsController = require('../controllers/sms.controller');
const authenticateToken = require('../auth/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// User endpoints - Send SMS
router.post('/send', smsController.sendSms);
router.post('/send-bulk', smsController.sendBulkSms);
router.get('/balance', smsController.checkBalance);
router.get('/logs', smsController.getLogs);

// Admin endpoints - Provider management
router.get('/providers', smsController.getProviders);
router.post('/providers', smsController.createProvider);
router.put('/providers/:id', smsController.updateProvider);
router.delete('/providers/:id', smsController.deleteProvider);
router.post('/providers/:id/test', smsController.testProvider);

module.exports = router;
