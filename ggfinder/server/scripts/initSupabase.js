require('dotenv').config();
const supabase = require('../config/supabase');

async function initSupabase() {
  console.log('Initializing Supabase database...');

  try {
    // Check if health_check table exists
    const { data: healthData, error: healthError } = await supabase
      .from('health_check')
      .select('*')
      .limit(1);

    if (healthError && healthError.code === '42P01') {
      console.log('Creating health_check table...');
      const { error } = await supabase
        .from('health_check')
        .insert([{ status: 'OK', created_at: new Date().toISOString() }]);

      if (error) {
        console.error('Error creating health_check table:', error);
      } else {
        console.log('Successfully created health_check table');
      }
    } else {
      console.log('health_check table exists');
    }

    // Create users table with proper structure
    // First check if users table exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (userError && userError.code === '42P01') {
      console.log('Users table does not exist, creating it...');

      // Creating initial demo user in the users table to create the table
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email: 'demo@example.com',
            name: 'Demo User',
            has_premium_access: false,
            goodKarma: 0, // Initialize goodKarma field
            created_at: new Date().toISOString()
          }
        ]);

      if (insertError) {
        console.error('Error creating users table:', insertError);
      } else {
        console.log('Successfully created users table');
      }
    } else {
      console.log('Users table exists');
    }

    console.log('Supabase initialization complete');
  } catch (error) {
    console.error('Error initializing Supabase:', error);
  }
}

initSupabase();

module.exports = { initSupabase };