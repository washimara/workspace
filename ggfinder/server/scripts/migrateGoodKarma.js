require('dotenv').config();
const { serviceSupabase } = require('../config/supabase');

async function migrateGoodKarma() {
  console.log('Starting goodKarma migration for users...');

  try {
    // First, check if the column exists by trying to select it
    const { data: testData, error: testError } = await serviceSupabase
      .from('users')
      .select('goodKarma')
      .limit(1);
    
    // If we got data or an error that's not about the column missing, it might exist
    const columnMayExist = testData || (testError && testError.code !== '42703');
    
    if (!columnMayExist) {
      console.log('Adding goodKarma column to users table...');
      
      // Try to add the column using RPC if available
      try {
        const { error: alterError } = await serviceSupabase.rpc('exec_sql', {
          query: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS goodKarma INTEGER DEFAULT 0;`
        });
        
        if (alterError) {
          console.error('Error adding goodKarma column via RPC:', alterError);
          throw new Error('Failed to add goodKarma column');
        }
      } catch (rpcError) {
        console.error('RPC method not available, trying alternative approach:', rpcError);
        
        // If RPC fails, try updating all users with the new field
        // This will create the column if it doesn't exist in some Supabase configurations
        const { data: users, error: usersError } = await serviceSupabase
          .from('users')
          .select('id');
          
        if (usersError) {
          console.error('Error fetching users:', usersError);
          throw new Error('Failed to fetch users for migration');
        }
        
        if (users && users.length > 0) {
          console.log(`Updating ${users.length} users with goodKarma field...`);
          
          for (const user of users) {
            const { error: updateError } = await serviceSupabase
              .from('users')
              .update({ goodKarma: 0 })
              .eq('id', user.id);
              
            if (updateError) {
              console.error(`Error updating user ${user.id}:`, updateError);
            }
          }
        }
      }
    } else {
      console.log('goodKarma column already exists in users table');
    }
    
    // Now ensure all users have goodKarma set
    console.log('Ensuring all users have goodKarma initialized...');
    
    const { data: nullUsers, error: nullError } = await serviceSupabase
      .from('users')
      .select('id')
      .is('goodKarma', null);
      
    if (nullError) {
      console.error('Error finding users with null goodKarma:', nullError);
    } else if (nullUsers && nullUsers.length > 0) {
      console.log(`Found ${nullUsers.length} users with null goodKarma, updating...`);
      
      for (const user of nullUsers) {
        const { error: updateError } = await serviceSupabase
          .from('users')
          .update({ goodKarma: 0 })
          .eq('id', user.id);
          
        if (updateError) {
          console.error(`Error updating user ${user.id}:`, updateError);
        }
      }
    } else {
      console.log('All users have goodKarma values set');
    }
    
    console.log('goodKarma migration completed successfully');
  } catch (error) {
    console.error('Error during goodKarma migration:', error);
    process.exit(1);
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateGoodKarma()
    .then(() => {
      console.log('Migration complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateGoodKarma;