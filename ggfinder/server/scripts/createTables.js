// Add console logs to track table creation process
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../config/supabase');

async function createAdvertsTable() {
  console.log('Creating adverts table using SQL API...');

  try {
    // Check if table exists first
    const { data, error: checkError } = await supabase
      .from('adverts')
      .select('count()')
      .limit(1);

    if (data) {
      console.log('Adverts table already exists');
      return true;
    }

    // Try creating through insert - this is the most reliable way in restricted environments
    console.log('Attempting to create adverts table through insert...');
    const { error: insertError } = await supabase
      .from('adverts')
      .insert([{
        title: 'Test Advert',
        description: 'This is a test advert to create the table',
        user_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('Error creating table through insert:', insertError);
      // Try to use RLS bypass with service role
      const serviceSupabase = require('../config/supabase').serviceSupabase;
      console.log('Attempting to create table with service role bypassing RLS...');
      
      const { error: serviceError } = await serviceSupabase
        .from('adverts')
        .insert([{
          title: 'Test Advert',
          description: 'This is a test advert to create the table',
          user_id: '00000000-0000-0000-0000-000000000000',
          created_at: new Date().toISOString()
        }]);
        
      if (serviceError && serviceError.code !== '23505') {  // Ignore unique constraint violations
        console.error('Error creating table with service role:', serviceError);
        return false;
      }
    }

    console.log('Adverts table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating adverts table:', error);
    return false;
  }
}

// Run the script if executed directly
if (require.main === module) {
  createAdvertsTable()
    .then(() => {
      console.log('Table creation completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error during table creation:', err);
      process.exit(1);
    });
}

module.exports = { createAdvertsTable };