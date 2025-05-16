const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('./middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/me', authenticateToken, authController.getCurrentUser);

module.exports = router;