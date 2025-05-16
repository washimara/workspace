const mongoose = require('mongoose');
const supabase = require('./supabase');

// Function to check Supabase connection
exports.checkSupabaseConnection = async () => {
  try {
    // Check if health_check table exists first
    const { data, error } = await supabase
      .from('health_check')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Supabase health check table error:', error);

      // Try to create the table if it doesn't exist
      if (error.code === '42P01') { // relation does not exist
        console.log('Attempting to create health_check table...');

        try {
          // Use the REST API to create a table rather than SQL
          const { error: createError } = await supabase
            .from('health_check')
            .insert([{ 
              status: 'OK', 
              created_at: new Date().toISOString() 
            }]);

          if (createError) {
            console.error('Failed to create health_check table:', createError);
            return false;
          } else {
            console.log('Successfully created health_check table');
            return true;
          }
        } catch (createErr) {
          console.error('Error creating health_check table:', createErr);
          return false;
        }
      }

      return false;
    }

    // Update the status to ensure the table is writable, but don't try to update updated_at
    try {
      const { error: updateError } = await supabase
        .from('health_check')
        .update({ status: 'OK' })
        .eq('status', 'OK');

      if (updateError) {
        console.error('Failed to update health check entry:', updateError);
        return false;
      }
    } catch (updateErr) {
      console.error('Error updating health check entry:', updateErr);
      return false;
    }

    console.log('Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

// Function to connect to MongoDB (legacy)
exports.connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not defined, skipping MongoDB connection');
    return false;
  }

  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.warn('Running without MongoDB connection - using Supabase instead');
    return false;
  }
};

// Export Supabase client for direct use in services
exports.supabase = supabase;