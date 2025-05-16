const supabase = require('../config/supabase');
const { serviceSupabase } = require('../config/supabase');
const PaymentService = require('./paymentService');

class SupabaseDonationService {
  /**
   * Get donations table
   * @private
   */
  static get table() {
    return 'donations';
  }

  /**
   * Check if donations table exists, create if it doesn't
   * @private
   */
  static async ensureTable() {
    try {
      console.log('Checking if donations table exists...');
      // Try to query the table
      const { error } = await serviceSupabase
        .from(this.table)
        .select('id')
        .limit(1);

      // If table doesn't exist, create it
      if (error && error.code === '42P01') {
        console.log('Creating donations table...');

        // Use the direct SQL method with Supabase's REST API
        try {
          // First method: Try using direct insert to create the table implicitly
          console.log('Attempting to create donations table with direct insert...');
          
          const { error: insertError } = await serviceSupabase
            .from(this.table)
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

          if (insertError) {
            console.error('Error creating donations table with insert:', insertError);
            throw new Error(`Failed to create donations table: ${insertError.message}`);
          }

          // Delete the test record
          await serviceSupabase
            .from(this.table)
            .delete()
            .eq('user_id', '00000000-0000-0000-0000-000000000000');

          console.log('Donations table created successfully');
        } catch (err) {
          console.error('Error in table creation attempt:', err.message);
          throw new Error(`Failed to create donations table: ${err.message}`);
        }
      } else if (error) {
        console.error('Error checking donations table:', error);
        throw new Error(`Error checking donations table: ${error.message}`);
      } else {
        console.log('Donations table already exists');
      }
    } catch (err) {
      console.error('Error in ensureTable:', err);
      throw new Error(`Error ensuring donations table: ${err.message}`);
    }
  }

  /**
   * Ensure users table has subscription columns
   * @private
   */
  static async ensureUserSubscriptionColumns() {
    try {
      console.log('Checking if users table has subscription columns...');

      // Check if subscription_status column exists
      const { data, error } = await serviceSupabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Error checking users table:', error);
        throw new Error(`Error checking users table: ${error.message}`);
      }

      // Check if any of the users have the subscription_status column
      // If not, we'll add it using direct SQL methods
      console.log('Attempting to add subscription columns to users...');
      
      // We'll add the columns by updating a user with these fields
      // This implicitly creates the columns if they don't exist in some Supabase configurations
      const { error: updateError } = await serviceSupabase
        .from('users')
        .update({
          subscription_status: 'free',
          subscription_start_date: null,
          subscription_end_date: null
        })
        .eq('id', '00000000-0000-0000-0000-000000000000');

      // Even if we get an error here, it might just mean the user doesn't exist
      if (updateError) {
        console.log('Could not update test user, attempting to create test user with subscription fields');
        
        // Try to insert a user with the fields
        const { error: insertError } = await serviceSupabase
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

        if (insertError) {
          console.error('Error adding subscription columns:', insertError);
          throw new Error(`Error adding subscription columns: ${insertError.message}`);
        }
      }

      console.log('User subscription columns verified/added');
    } catch (err) {
      console.error('Error ensuring user subscription columns:', err);
      throw new Error(`Error ensuring user subscription columns: ${err.message}`);
    }
  }

  /**
   * Create a new donation
   * @param {Object} donationData - Donation data
   * @returns {Promise<Object>} Created donation
   */
  static async createDonation(donationData) {
    try {
      // Ensure both table and user columns exist
      await this.ensureTable();
      await this.ensureUserSubscriptionColumns();

      console.log(`Processing donation for user ${donationData.userId}`);

      // Process the payment
      const paymentResult = await PaymentService.processDonation({
        amount: donationData.amount,
        currency: donationData.currency || 'USD',
        paymentMethod: donationData.paymentMethod,
        description: `Donation from ${donationData.userId}`
      });

      console.log('Payment processing result:', paymentResult);

      // Create donation record in Supabase
      const donationRecord = {
        user_id: donationData.userId,
        amount: donationData.amount,
        currency: donationData.currency || 'USD',
        payment_method: donationData.paymentMethod,
        status: paymentResult.success ? 'completed' : 'failed',
        donation_type: donationData.donationType || 'one-time',
        created_at: new Date().toISOString()
      };

      console.log('Creating donation record:', donationRecord);

      const { data, error } = await supabase
        .from(this.table)
        .insert([donationRecord])
        .select();

      if (error) {
        console.error('Error creating donation:', error);
        throw new Error(`Error creating donation: ${error.message}`);
      }

      console.log('Donation created successfully:', data);

      // If this is a subscription donation, update the user's subscription status
      if (donationData.donationType === 'subscription' && paymentResult.success) {
        const now = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

        console.log('Updating user subscription status');

        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: 'premium',
            subscription_start_date: now.toISOString(),
            subscription_end_date: endDate.toISOString()
          })
          .eq('id', donationData.userId);

        if (updateError) {
          console.error('Error updating user subscription:', updateError);
        } else {
          console.log('User subscription updated successfully');
        }
      }

      // Format the return data to match the MongoDB format
      return {
        _id: data[0].id,
        userId: data[0].user_id,
        amount: data[0].amount,
        currency: data[0].currency,
        paymentMethod: data[0].payment_method,
        status: data[0].status,
        donationType: data[0].donation_type,
        createdAt: data[0].created_at
      };
    } catch (err) {
      console.error('Error in createDonation:', err);
      throw new Error(`Error creating donation: ${err.message}`);
    }
  }

  /**
   * Get donations for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} User's donations
   */
  static async getUserDonations(userId) {
    try {
      await this.ensureTable();
      console.log(`Getting donations for user ${userId}`);

      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user donations:', error);
        throw new Error(`Error fetching user donations: ${error.message}`);
      }

      console.log(`Found ${data ? data.length : 0} donations for user ${userId}`);

      // Format the return data to match the MongoDB format
      return data ? data.map(donation => ({
        _id: donation.id,
        userId: donation.user_id,
        amount: donation.amount,
        currency: donation.currency,
        paymentMethod: donation.payment_method,
        status: donation.status,
        donationType: donation.donation_type,
        createdAt: donation.created_at
      })) : [];
    } catch (err) {
      console.error('Error in getUserDonations:', err);
      throw new Error(`Error fetching user donations: ${err.message}`);
    }
  }

  /**
   * Get user subscription status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Subscription status
   */
  static async getUserSubscriptionStatus(userId) {
    try {
      // Ensure user table has subscription columns
      await this.ensureUserSubscriptionColumns();

      console.log(`Getting subscription status for user ${userId}`);

      const { data, error } = await supabase
        .from('users')
        .select('subscription_status, subscription_start_date, subscription_end_date')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching subscription status:', error);
        
        // Return default values if there's an error - might be that columns don't exist yet
        return {
          status: 'free',
          startDate: null,
          endDate: null
        };
      }

      if (!data || !data.subscription_status) {
        console.log(`No subscription found for user ${userId}, returning free status`);
        return {
          status: 'free',
          startDate: null,
          endDate: null
        };
      }

      console.log(`Subscription status for user ${userId}:`, data);

      return {
        status: data.subscription_status,
        startDate: data.subscription_start_date,
        endDate: data.subscription_end_date
      };
    } catch (err) {
      console.error('Error in getUserSubscriptionStatus:', err);
      // Return default values rather than throwing, as this is less critical
      return {
        status: 'free',
        startDate: null,
        endDate: null
      };
    }
  }
}

module.exports = SupabaseDonationService;