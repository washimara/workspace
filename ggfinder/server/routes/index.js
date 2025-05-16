const express = require('express');
const router = express.Router();

const advertRoutes = require('./advertRoutes');
const authRoutes = require('./authRoutes');
const healthRoutes = require('./healthRoutes');
const donationRoutes = require('./donationRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');

// API routes
router.use('/adverts', advertRoutes);
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/donations', donationRoutes);
router.use('/subscriptions', subscriptionRoutes);

// Root route
router.get('/', (req, res) => {
  res.json({ message: 'Welcome to ggFinder API' });
});

// Simple health check
router.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

module.exports = router;