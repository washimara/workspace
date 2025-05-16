const supabase = require('../config/supabase');

/**
 * Initialize the health_check table in Supabase
 */
const initHealthCheckTable = async () => {
  try {
    console.log('Checking health_check table...');
    
    // Try to select from the table to see if it exists
    const { data, error } = await supabase
      .from('health_check')
      .select('*')
      .limit(1);
    
    // If table doesn't exist, the error code will be 42P01 (relation does not exist)
    if (error && error.code === '42P01') {
      console.log('health_check table does not exist. Creating...');
      
      // Create the health_check table with a simple entry
      try {
        // Using insert to create the table (Supabase will auto-create it)
        const { error: createError } = await supabase
          .from('health_check')
          .insert([{ 
            status: 'OK', 
            created_at: new Date().toISOString() 
          }]);
        
        if (createError) {
          console.error('Failed to create health_check table:', createError);
        } else {
          console.log('Successfully created health_check table');
        }
      } catch (createErr) {
        console.error('Error creating health_check table:', createErr);
      }
    } else if (error) {
      console.error('Error checking health_check table:', error);
    } else {
      console.log('health_check table exists');
    }
  } catch (err) {
    console.error('Error initializing health_check table:', err);
  }
};

module.exports = initHealthCheckTable;