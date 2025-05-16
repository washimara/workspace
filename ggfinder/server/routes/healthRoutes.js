const express = require('express');
const router = express.Router();
const { checkSupabaseConnection } = require('../config/database');

/**
 * @route GET /api/health
 * @desc Check system health
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // Check Supabase connection
    const supabaseConnected = await checkSupabaseConnection();

    // Return health status
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        supabase: supabaseConnected ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/detailed
 * @desc Get detailed health information
 * @access Public
 */
router.get('/detailed', async (req, res) => {
  try {
    // Check Supabase connection
    const supabaseConnected = await checkSupabaseConnection();
    
    // Get environment info
    const env = process.env.NODE_ENV || 'development';
    
    // Return detailed health status
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env,
      database: {
        supabase: {
          connected: supabaseConnected,
          url: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 10)}...` : 'not configured',
          keysConfigured: !!process.env.SUPABASE_ANON_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      },
      api: {
        version: process.env.API_VERSION || '1.0.0',
        port: process.env.PORT || 3000
      }
    });
  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/database
 * @desc Check database connectivity specifically
 * @access Public
 */
router.get('/database', async (req, res) => {
  try {
    // Check Supabase connection
    const supabaseConnected = await checkSupabaseConnection();
    
    if (supabaseConnected) {
      res.json({
        status: 'ok',
        message: 'Database is connected',
        database: 'supabase',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'Database is disconnected',
        database: 'supabase',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;