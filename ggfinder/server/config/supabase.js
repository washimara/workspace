const { createClient } = require('@supabase/supabase-js');

// Check for required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Missing required Supabase environment variables');
  process.exit(1);
}

// Log key information for debugging (don't log full keys in production)
console.log('SUPABASE_URL is set:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY is set:', !!process.env.SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY is set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY first 10 chars:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) : 'not available');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
    }
  }
);

// Initialize service role client for admin operations
const serviceSupabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
    }
  }
);

// Export both clients
module.exports = supabase;
module.exports.serviceSupabase = serviceSupabase;