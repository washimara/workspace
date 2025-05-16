require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function addGoodKarmaColumn() {
  console.log('Starting to add goodKarma column to users table...');

  // Create Supabase client with service role key
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
      }
    }
  );

  try {
    // Use SQL query directly with service role client
    console.log('Executing SQL to add goodKarma column...');
    
    // First, check if the column exists
    const { data: columnCheck, error: checkError } = await supabase
      .rpc('postgres_inspect_column', { 
        table_name: 'users', 
        column_name: 'goodKarma' 
      });

    if (checkError) {
      console.log('Error checking column existence, will try to add it anyway:', checkError.message);
    }
    
    if (checkError || (columnCheck && columnCheck.length === 0)) {
      console.log('Column does not exist, adding it now...');
      
      // Execute raw SQL to add the column
      const { data, error } = await supabase
        .from('_sql')
        .select('*')
        .execute(`
          ALTER TABLE public.users 
          ADD COLUMN IF NOT EXISTS "goodKarma" INTEGER DEFAULT 0;
        `);

      if (error) {
        // If the _sql approach fails, try direct PostgreSQL function
        console.log('Error with _sql method, trying alternative approach:', error.message);
        
        const { error: pgError } = await supabase
          .rpc('run_sql', { 
            query: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "goodKarma" INTEGER DEFAULT 0;` 
          });
          
        if (pgError) {
          console.error('Failed to add column using RPC:', pgError);
          throw new Error('Could not add goodKarma column');
        } else {
          console.log('Successfully added goodKarma column using run_sql RPC');
        }
      } else {
        console.log('Successfully added goodKarma column using _sql table');
      }
    } else {
      console.log('goodKarma column already exists');
    }

    // Now update all users to ensure they have goodKarma value set
    console.log('Updating all users to ensure goodKarma is initialized...');
    
    // First get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw new Error('Failed to fetch users for updating goodKarma');
    }
    
    if (users && users.length > 0) {
      console.log(`Found ${users.length} users to update`);
      
      // Update each user with goodKarma=0 if not already set
      for (const user of users) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ goodKarma: 0 })
          .eq('id', user.id)
          .is('goodKarma', null);
          
        if (updateError) {
          console.warn(`Warning: Could not update goodKarma for user ${user.id}:`, updateError.message);
        }
      }
      
      console.log('User updates completed');
    } else {
      console.log('No users found to update');
    }

    console.log('goodKarma column migration completed successfully');
  } catch (error) {
    console.error('Error during goodKarma column addition:', error);
    process.exit(1);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  addGoodKarmaColumn()
    .then(() => {
      console.log('Column addition complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Column addition failed:', error);
      process.exit(1);
    });
}

module.exports = addGoodKarmaColumn;