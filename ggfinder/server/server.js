// Load environment variables
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB, checkSupabaseConnection } = require('./config/database');
const setupSupabase = require('./scripts/setupSupabase');
const initHealthCheckTable = require('./scripts/initHealthCheck');

// Import routes
const authRoutes = require('./routes/authRoutes');
const advertRoutes = require('./routes/advertRoutes');
const donationRoutes = require('./routes/donationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const healthRoutes = require('./routes/healthRoutes');
const indexRoutes = require('./routes/index');

// Init express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:5173', 'http://localhost:3000', '*'],
  credentials: true
}));

// Increase request size limit for uploading images
app.use(express.json({ limit: process.env.REQUEST_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.REQUEST_LIMIT || '1mb' }));

// Initialize Supabase tables
setupSupabase().catch(err => {
  console.error('Error setting up Supabase tables:', err);
});

// Initialize health check table
initHealthCheckTable().catch(err => {
  console.error('Error initializing health check table:', err);
});

// Connect to database (legacy MongoDB support)
connectDB().catch(err => {
  console.warn('MongoDB connection not available, using Supabase only');
});

// Check Supabase connection
checkSupabaseConnection().then(connected => {
  if (!connected) {
    console.error('Could not connect to Supabase. Please check your configuration.');
  } else {
    console.log('Supabase connection successful');
  }
});

// Initialize Supabase subscriptions table
const SupabaseSubscriptionService = require('./services/supabaseSubscriptionService');
SupabaseSubscriptionService.initializeSubscriptionsTable()
  .then(() => console.log('Subscription table initialized successfully'))
  .catch(err => console.error('Error initializing subscription table:', err));

// Set up routes
app.use('/api', require('./routes'));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});