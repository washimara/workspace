const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const logger = require('../utils/logger');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey, // Using service role key for admin access
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Initialize a public Supabase client for client-side operations
const supabasePublic = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Function to initialize database by creating necessary tables
async function initializeDatabase() {
  try {
    logger.info('Initializing Supabase database...');
    
    // Check if health_check table exists, create if not
    const { error: healthCheckError } = await supabase
      .from('health_check')
      .select('*')
      .limit(1);

    if (healthCheckError && healthCheckError.code === 'PGRST116') {
      logger.info('Creating health_check table...');
      const { error } = await supabase.rpc('create_health_check_table');
      if (error) {
        logger.error('Error creating health_check table:', error);
      } else {
        logger.info('health_check table created successfully');
      }
    } else {
      logger.info('health_check table exists');
    }

    // Check if users table exists, create if not
    const { error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError && usersError.code === 'PGRST116') {
      logger.info('Creating users table...');
      const { error } = await supabase.rpc('create_users_table');
      if (error) {
        logger.error('Error creating users table:', error);
      } else {
        logger.info('Users table created successfully');
      }
    } else {
      logger.info('Users table exists');
    }

    // Add password_hash column to users table if it doesn't exist
    try {
      logger.info('Adding password_hash column to users table...');
      const { error } = await supabase.rpc('add_password_hash_column_if_not_exists');
      if (error) {
        logger.error('Error adding password_hash column:', error);
      }
    } catch (error) {
      logger.error('Error adding password_hash column:', error);
    }

    // Check if adverts table exists, create if not
    const { error: advertsError } = await supabase
      .from('adverts')
      .select('*')
      .limit(1);

    if (advertsError && advertsError.code === 'PGRST116') {
      logger.info('Creating adverts table...');
      const { error } = await supabase.rpc('create_adverts_table');
      if (error) {
        logger.error('Error creating adverts table:', error);
      } else {
        logger.info('Adverts table created successfully');
      }
    } else {
      logger.info('Adverts table exists');
    }

    logger.info('Supabase initialization complete');
  } catch (error) {
    logger.error('Error initializing Supabase database:', error);
    throw error;
  }
}

// Function to check Supabase connection
async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from('health_check')
      .select('*')
      .limit(1);

    if (error) {
      logger.error('Supabase connection error:', error);
      return false;
    }

    logger.info('Supabase connected successfully');
    return true;
  } catch (error) {
    logger.error('Error checking Supabase connection:', error);
    return false;
  }
}

// Function to get detailed health information
async function getDetailedHealth() {
  try {
    const { data, error } = await supabase
      .from('health_check')
      .select('*')
      .limit(1);

    if (error) {
      logger.error('Supabase health check error:', error);
      return {
        status: 'error',
        details: error
      };
    }

    logger.info('Supabase connection verified in detailed health check');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error in Supabase detailed health check:', error);
    return {
      status: 'error',
      details: error.message
    };
  }
}

// In development, auto-confirm user emails
async function autoConfirmEmail(email) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  try {
    logger.info(`Auto-confirming email for development: ${email}`);
    // Get user by email
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .limit(1);

    if (userError || !users || users.length === 0) {
      logger.error('Error finding user for auto-confirmation:', userError || 'User not found');
      return;
    }

    // Update email_confirmed_at for the user
    const { error: updateError } = await supabase
      .from('auth.users')
      .update({ email_confirmed_at: new Date().toISOString() })
      .eq('id', users[0].id);

    if (updateError) {
      logger.error('Error auto-confirming email:', updateError);
    } else {
      logger.info(`Successfully auto-confirmed email for ${email}`);
    }
  } catch (error) {
    logger.error('Exception in auto-confirming email:', error);
  }
}

// Create a new advert using service role access
async function createAdvert(advertData) {
  try {
    logger.info('Creating new advert:', JSON.stringify(advertData));
    const { data, error } = await supabase
      .from('adverts')
      .insert([advertData])
      .select();

    if (error) {
      logger.error('Error creating advert:', error);
      throw error;
    }

    logger.info('Advert created successfully:', data[0].id);
    return data[0];
  } catch (error) {
    logger.error('Exception in creating advert:', error);
    throw error;
  }
}

// Get user's adverts
async function getUserAdverts(userId) {
  try {
    logger.info(`Fetching adverts for user: ${userId}`);
    const { data, error } = await supabase
      .from('adverts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching user adverts:', error);
      throw error;
    }

    logger.info(`Retrieved ${data.length} adverts for user ${userId}`);
    return data;
  } catch (error) {
    logger.error('Exception in fetching user adverts:', error);
    throw error;
  }
}

// Get all public adverts
async function getAllAdverts() {
  try {
    logger.info('Fetching all public adverts');
    const { data, error } = await supabase
      .from('adverts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching all adverts:', error);
      throw error;
    }

    logger.info(`Retrieved ${data.length} public adverts`);
    return data;
  } catch (error) {
    logger.error('Exception in fetching all adverts:', error);
    throw error;
  }
}

module.exports = {
  supabase,
  supabasePublic,
  initializeDatabase,
  checkConnection,
  getDetailedHealth,
  autoConfirmEmail,
  createAdvert,
  getUserAdverts,
  getAllAdverts
};