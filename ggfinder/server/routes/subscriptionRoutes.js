const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('./middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Create a subscription
router.post('/', subscriptionController.createSubscription);

// Get active subscription
router.get('/active', subscriptionController.getActiveSubscription);

// Get subscription history
router.get('/history', subscriptionController.getSubscriptionHistory);

// Cancel subscription
router.post('/:subscriptionId/cancel', subscriptionController.cancelSubscription);

// Renew subscription
router.post('/:subscriptionId/renew', subscriptionController.renewSubscription);

// Check premium access
router.get('/check-premium', subscriptionController.checkPremiumAccess);

module.exports = router;