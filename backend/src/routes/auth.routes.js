const express = require('express');
const router = express.Router();
const { register, login, changeInitialPassword } = require('../auth/auth.controller');
const authenticateToken = require('../auth/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/change-initial-password', authenticateToken, changeInitialPassword);

module.exports = router;
