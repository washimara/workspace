const express = require('express');
const router = express.Router();
const { checkSupabaseConnection } = require('../config/database');
const supabase = require('../config/supabase');

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
      status: supabaseConnected ? 'ok' : 'error',
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

    // Check Supabase tables
    let tablesStatus = 'unknown';
    try {
      const { data: healthData, error: healthError } = await supabase
        .from('health_check')
        .select('*')
        .limit(1);
      
      const { data: advertsData, error: advertsError } = await supabase
        .from('adverts')
        .select('id')
        .limit(1);
      
      tablesStatus = !healthError && !advertsError ? 'ok' : 'error';
    } catch (e) {
      tablesStatus = 'error';
      console.error('Table check error:', e);
    }

    // Return detailed health status
    res.json({
      status: supabaseConnected ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      environment: env,
      database: {
        supabase: {
          connected: supabaseConnected,
          url: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 10)}...` : 'not configured',
          keysConfigured: !!process.env.SUPABASE_ANON_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          tablesStatus
        }
      },
      api: {
        version: process.env.API_VERSION || '1.0.0',
        port: process.env.PORT || 3000,
        allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*']
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
      // Get some basic database stats
      let stats = {};
      try {
        const { data: advertsCount, error: advertsError } = await supabase
          .from('adverts')
          .select('id', { count: 'exact' });
        
        if (!advertsError) {
          stats.adverts = advertsCount ? advertsCount.length : 0;
        }

        const { data: usersCount, error: usersError } = await supabase
          .from('users')
          .select('id', { count: 'exact' });
        
        if (!usersError) {
          stats.users = usersCount ? usersCount.length : 0;
        }
      } catch (e) {
        console.error('Stats error:', e);
      }

      res.json({
        status: 'ok',
        message: 'Database is connected',
        database: 'supabase',
        timestamp: new Date().toISOString(),
        stats
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