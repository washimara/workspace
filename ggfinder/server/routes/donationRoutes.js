const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { authenticateToken } = require('./middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Create a donation
router.post('/', donationController.createDonation);

// Get user's donations
router.get('/history', donationController.getUserDonations);

// Get user's subscription status
router.get('/subscription', donationController.getSubscriptionStatus);

module.exports = router;