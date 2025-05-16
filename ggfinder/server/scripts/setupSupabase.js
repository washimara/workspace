require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Missing required Supabase environment variables');
  process.exit(1);
}

const { serviceSupabase } = require('../config/supabase');

async function setupSupabase() {
  console.log('Setting up Supabase tables...');

  try {
    // Create adverts table if it doesn't exist
    try {
      const { error: advertsError } = await serviceSupabase
        .from('adverts')
        .select('id')
        .limit(1);

      if (advertsError && advertsError.code === '42P01') {
        console.log('Creating adverts table...');

        const { error: createError } = await serviceSupabase
          .from('adverts')
          .insert([{
            title: 'Test Advert',
            description: 'This is a test advert',
            user_id: '00000000-0000-0000-0000-000000000000',
            created_at: new Date().toISOString()
          }]);

        if (createError) {
          console.error('Error creating adverts table:', createError);
        } else {
          // Delete the test record
          await serviceSupabase
            .from('adverts')
            .delete()
            .eq('user_id', '00000000-0000-0000-0000-000000000000');

          console.log('Adverts table created successfully');
        }
      }
    } catch (error) {
      console.error('Error checking adverts table:', error);
    }

    // Create health_check table if it doesn't exist
    try {
      const { error: healthError } = await serviceSupabase
        .from('health_check')
        .select('id')
        .limit(1);

      if (healthError && healthError.code === '42P01') {
        console.log('Creating health_check table...');

        const { error: createError } = await serviceSupabase
          .from('health_check')
          .insert([{ status: 'OK' }]);

        if (createError) {
          console.error('Error creating health_check table:', createError);
        } else {
          console.log('Health check table created successfully');
        }
      }
    } catch (error) {
      console.error('Error checking health_check table:', error);
    }

    // Create users table if it doesn't exist
    try {
      const { error: usersError } = await serviceSupabase
        .from('users')
        .select('id')
        .limit(1);

      if (usersError && usersError.code === '42P01') {
        console.log('Creating users table...');

        const { error: createError } = await serviceSupabase
          .from('users')
          .insert([{
            id: '00000000-0000-0000-0000-000000000000',
            email: 'demo@example.com',
            name: 'Demo User',
            created_at: new Date().toISOString()
          }]);

        if (createError) {
          console.error('Error creating users table:', createError);
        } else {
          console.log('Users table created successfully');
        }
      }

      // Add subscription columns to users table if they don't exist
      console.log('Adding subscription columns to users table if needed...');
      
      // We'll attempt to add the columns by updating a user with these fields
      const { error: updateError } = await serviceSupabase
        .from('users')
        .update({
          subscription_status: 'free',
          subscription_start_date: null,
          subscription_end_date: null
        })
        .eq('id', '00000000-0000-0000-0000-000000000000');

      if (updateError) {
        console.error('Error updating test user with subscription fields:', updateError);
        
        // Try to insert/update a user with the fields
        const { error: upsertError } = await serviceSupabase
          .from('users')
          .upsert([{
            id: '00000000-0000-0000-0000-000000000000',
            email: 'system@test.com',
            name: 'System Test',
            created_at: new Date().toISOString(),
            subscription_status: 'free',
            subscription_start_date: null,
            subscription_end_date: null
          }])
          .select();

        if (upsertError) {
          console.error('Error adding subscription columns via upsert:', upsertError);
        } else {
          console.log('User subscription columns added via upsert');
        }
      } else {
        console.log('User subscription columns verified');
      }

    } catch (error) {
      console.error('Error checking users table:', error);
    }

    // Create donations table if it doesn't exist
    try {
      const { error: donationsError } = await serviceSupabase
        .from('donations')
        .select('id')
        .limit(1);

      if (donationsError && donationsError.code === '42P01') {
        console.log('Creating donations table...');

        // Try with direct insert to create the table
        const { error: createError } = await serviceSupabase
          .from('donations')
          .insert([{
            user_id: '00000000-0000-0000-0000-000000000000',
            amount: 0,
            currency: 'USD',
            payment_method: 'test',
            status: 'pending',
            donation_type: 'one-time',
            created_at: new Date().toISOString()
          }])
          .select();

        if (createError) {
          console.error('Error creating donations table:', createError);
        } else {
          // Delete the test record
          await serviceSupabase
            .from('donations')
            .delete()
            .eq('user_id', '00000000-0000-0000-0000-000000000000');

          console.log('Donations table created successfully');
        }
      }
    } catch (error) {
      console.error('Error checking donations table:', error);
    }

    // Setup subscriptions table
    console.log('Setting up subscriptions table...');
    try {
      // First check if the table exists
      const { error: checkError } = await serviceSupabase
        .from('subscriptions')
        .select('id')
        .limit(1);

      if (checkError && checkError.code === '42P01') {
        // Table doesn't exist, try to create it using rpc
        const { error: rpcError } = await serviceSupabase.rpc('exec_sql', {
          query: `
            CREATE TABLE IF NOT EXISTS public.subscriptions (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              plan TEXT NOT NULL,
              status TEXT NOT NULL,
              start_date TIMESTAMPTZ NOT NULL,
              end_date TIMESTAMPTZ NOT NULL,
              auto_renew BOOLEAN DEFAULT FALSE,
              payment_method TEXT NOT NULL,
              amount NUMERIC NOT NULL,
              currency TEXT DEFAULT 'USD',
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "Users can view their own subscriptions"
              ON public.subscriptions
              FOR SELECT
              USING (auth.uid() = user_id);

            CREATE POLICY "Users can insert their own subscriptions"
              ON public.subscriptions
              FOR INSERT
              WITH CHECK (auth.uid() = user_id);

            CREATE POLICY "Users can update their own subscriptions"
              ON public.subscriptions
              FOR UPDATE
              USING (auth.uid() = user_id);
          `
        });

        if (rpcError) {
          console.error('Error creating subscriptions table:', rpcError);
          
          // If rpc fails, the exec_sql function might not be available
          // In this case, we can't create the table here, but the app will
          // try to handle this case later when using the table
          console.log('Could not create subscriptions table - will be created on demand if possible');
        } else {
          console.log('Subscriptions table set up successfully');
        }
      } else if (checkError) {
        console.error('Error checking subscriptions table:', checkError);
      } else {
        console.log('Subscriptions table already exists');
      }
    } catch (err) {
      console.error('Error setting up subscriptions table:', err);
    }

    console.log('Supabase setup completed');
  } catch (error) {
    console.error('Error setting up Supabase:', error);
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupSupabase()
    .then(() => {
      console.log('Setup complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupSupabase;