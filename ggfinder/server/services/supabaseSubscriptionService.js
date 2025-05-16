const supabase = require('../config/supabase');
const { serviceSupabase } = require('../config/supabase');
const PaymentService = require('./paymentService');

class SupabaseSubscriptionService {
  /**
   * Create a new subscription
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription with user update result
   */
  static async createSubscription(subscriptionData) {
    try {
      console.log(`Creating subscription for user ${subscriptionData.userId}`);

      if (!subscriptionData.userId) {
        throw new Error('User ID is required');
      }

      // Process the subscription payment
      const paymentResult = await PaymentService.createSubscription({
        userId: subscriptionData.userId,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency || 'USD',
        paymentMethod: subscriptionData.paymentMethod,
        plan: 'premium'
      });

      if (!paymentResult.success) {
        throw new Error('Payment processing failed');
      }

      // Create subscription record in subscriptions table
      const subscriptionRecord = {
        user_id: subscriptionData.userId,
        plan: 'premium',
        status: 'active',
        start_date: paymentResult.startDate,
        end_date: paymentResult.endDate,
        auto_renew: subscriptionData.autoRenew || false,
        payment_method: subscriptionData.paymentMethod,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency || 'USD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating subscription record:', subscriptionRecord);

      // First, ensure the subscriptions table exists
      await this.initializeSubscriptionsTable();

      // Insert the subscription record
      const { data: subscription, error: subscriptionError } = await serviceSupabase
        .from('subscriptions')
        .insert([subscriptionRecord])
        .select()
        .single();

      if (subscriptionError) {
        console.error('Error creating subscription record:', subscriptionError);
        throw new Error(`Error creating subscription record: ${subscriptionError.message}`);
      }

      console.log('Subscription record created:', subscription);

      // Update user's subscription status directly in users table
      const { data: user, error: userError } = await serviceSupabase
        .from('users')
        .update({
          subscription_status: 'premium',
          subscription_start_date: paymentResult.startDate,
          subscription_end_date: paymentResult.endDate,
          has_premium_access: true
        })
        .eq('id', subscriptionData.userId)
        .select()
        .single();

      if (userError) {
        console.error('Error updating user subscription status:', userError);
        throw new Error(`Error updating user subscription status: ${userError.message}`);
      }

      console.log(`Subscription created successfully for user ${subscriptionData.userId}`);

      // Transform the subscription record to match the expected format
      const transformedSubscription = {
        _id: subscription.id,
        userId: subscription.user_id,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        autoRenew: subscription.auto_renew,
        paymentMethod: subscription.payment_method,
        amount: subscription.amount,
        currency: subscription.currency,
        createdAt: subscription.created_at
      };

      return {
        subscription: transformedSubscription,
        user: {
          _id: user.id,
          name: user.name,
          email: user.email,
          subscription: {
            status: 'premium',
            startDate: paymentResult.startDate,
            endDate: paymentResult.endDate
          }
        }
      };
    } catch (err) {
      console.error('Error in createSubscription:', err);
      throw new Error(`Error creating subscription: ${err.message}`);
    }
  }

  /**
   * Get user's active subscription
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Active subscription or null
   */
  static async getUserActiveSubscription(userId) {
    try {
      console.log(`Getting active subscription for user ${userId}`);

      // First, ensure the subscriptions table exists
      await this.initializeSubscriptionsTable();

      // Try to get the subscription from the subscriptions table
      const { data: subscriptions, error: subscriptionError } = await serviceSupabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (subscriptionError) {
        console.error('Error fetching subscription:', subscriptionError);
        throw new Error(`Error fetching subscription: ${subscriptionError.message}`);
      }

      if (subscriptions && subscriptions.length > 0) {
        // Transform the subscription record to match the expected format
        return {
          _id: subscriptions[0].id,
          userId: subscriptions[0].user_id,
          plan: subscriptions[0].plan,
          status: subscriptions[0].status,
          startDate: subscriptions[0].start_date,
          endDate: subscriptions[0].end_date,
          autoRenew: subscriptions[0].auto_renew,
          paymentMethod: subscriptions[0].payment_method,
          amount: subscriptions[0].amount,
          currency: subscriptions[0].currency,
          createdAt: subscriptions[0].created_at
        };
      }

      // If no subscription found in the subscriptions table, check the user table
      const { data: user, error: userError } = await serviceSupabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw new Error(`Error fetching user data: ${userError.message}`);
      }

      // Check if user has an active premium subscription
      if (user.subscription_status === 'premium' &&
          user.subscription_end_date &&
          new Date(user.subscription_end_date) > new Date()) {

        // Create a subscription object based on the user's data
        return {
          _id: `sub-${Date.now()}`, // Generate a mock ID
          userId: user.id,
          plan: 'premium',
          status: 'active',
          startDate: user.subscription_start_date,
          endDate: user.subscription_end_date,
          autoRenew: true, // Assuming auto-renew is enabled
          paymentMethod: 'unknown', // We don't store this in the users table
          amount: 10, // Default amount
          currency: 'USD',
          createdAt: user.subscription_start_date
        };
      }

      return null;
    } catch (err) {
      console.error('Error in getUserActiveSubscription:', err);
      throw new Error(`Error fetching user subscription: ${err.message}`);
    }
  }

  /**
   * Get user's subscription history
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Subscription history
   */
  static async getUserSubscriptionHistory(userId) {
    try {
      console.log(`Getting subscription history for user ${userId}`);

      if (!userId) {
        throw new Error('User ID is required');
      }

      // First, ensure the subscriptions table exists
      await this.initializeSubscriptionsTable();

      // Try to get subscriptions from the subscriptions table
      const { data: subscriptions, error: subscriptionError } = await serviceSupabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (subscriptionError) {
        console.error('Error fetching subscriptions:', subscriptionError);
        throw new Error(`Error fetching subscriptions: ${subscriptionError.message}`);
      }

      if (subscriptions && subscriptions.length > 0) {
        console.log(`Found ${subscriptions.length} subscriptions in the subscriptions table`);
        
        // Transform the subscription records to match the expected format
        return subscriptions.map(sub => ({
          _id: sub.id,
          userId: sub.user_id,
          plan: sub.plan,
          status: sub.status,
          startDate: sub.start_date,
          endDate: sub.end_date,
          autoRenew: sub.auto_renew,
          paymentMethod: sub.payment_method,
          amount: sub.amount,
          currency: sub.currency,
          createdAt: sub.created_at
        }));
      }

      // If no subscriptions found in the subscriptions table, check the user table
      const { data: user, error: userError } = await serviceSupabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw new Error(`Error fetching user data: ${userError.message}`);
      }

      // Check if the user has any subscription information
      if (user.subscription_status) {
        console.log(`User has subscription_status: ${user.subscription_status}`);

        // Get recent donations to provide additional subscription context
        const { data: donations, error: donationsError } = await serviceSupabase
          .from('donations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (donationsError) {
          console.error('Error fetching donations:', donationsError);
        }

        // Create a subscription object based on the user's data
        const subscription = {
          _id: `sub-${Date.now()}`, // Generate a mock ID
          userId: user.id,
          plan: 'premium',
          status: user.subscription_status,
          startDate: user.subscription_start_date,
          endDate: user.subscription_end_date,
          autoRenew: true, // Assuming auto-renew is enabled
          paymentMethod: donations && donations.length > 0 ? donations[0].payment_method : 'unknown',
          amount: donations && donations.length > 0 ? donations[0].amount : 10,
          currency: 'USD',
          createdAt: user.subscription_start_date || (donations && donations.length > 0 ? donations[0].created_at : new Date().toISOString())
        };

        console.log('Created subscription object from user data:', subscription);
        return [subscription];
      }

      return [];
    } catch (err) {
      console.error('Error in getUserSubscriptionHistory:', err);
      throw new Error(`Error fetching subscription history: ${err.message}`);
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {string} userId - User ID for verification
   * @returns {Promise<Object>} Updated subscription
   */
  static async cancelSubscription(subscriptionId, userId) {
    try {
      console.log(`Cancelling subscription ${subscriptionId} for user ${userId}`);

      // First check if this is a real subscription ID or a mock one
      if (subscriptionId.startsWith('sub-')) {
        console.log('This is a mock subscription ID, updating user record only');
        
        // Update user's subscription status in the users table
        const { data: user, error: userError } = await serviceSupabase
          .from('users')
          .update({
            subscription_status: 'cancelled'
          })
          .eq('id', userId)
          .select()
          .single();

        if (userError) {
          console.error('Error updating user subscription status:', userError);
          throw new Error(`Error cancelling subscription: ${userError.message}`);
        }

        console.log(`Subscription cancelled for user ${userId}`);

        // Create a subscription object based on the updated user data
        return {
          _id: subscriptionId,
          userId: user.id,
          plan: 'premium',
          status: 'cancelled',
          startDate: user.subscription_start_date,
          endDate: user.subscription_end_date,
          autoRenew: false,
          paymentMethod: 'unknown',
          amount: 10,
          currency: 'USD',
          createdAt: user.subscription_start_date
        };
      }

      // This is a real subscription ID, update the subscription record
      const { data: subscription, error: subscriptionError } = await serviceSupabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          auto_renew: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .eq('user_id', userId) // Ensure the subscription belongs to the user
        .select()
        .single();

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        throw new Error(`Error cancelling subscription: ${subscriptionError.message}`);
      }

      if (!subscription) {
        throw new Error('Subscription not found or does not belong to user');
      }

      // Also update the user's subscription status
      const { data: user, error: userError } = await serviceSupabase
        .from('users')
        .update({
          subscription_status: 'cancelled'
        })
        .eq('id', userId)
        .select()
        .single();

      if (userError) {
        console.error('Error updating user subscription status:', userError);
        // Continue anyway since we've already updated the subscription
      }

      console.log(`Subscription ${subscriptionId} cancelled for user ${userId}`);

      // Transform the subscription record to match the expected format
      return {
        _id: subscription.id,
        userId: subscription.user_id,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        autoRenew: subscription.auto_renew,
        paymentMethod: subscription.payment_method,
        amount: subscription.amount,
        currency: subscription.currency,
        createdAt: subscription.created_at
      };
    } catch (err) {
      console.error('Error in cancelSubscription:', err);
      throw new Error(`Error cancelling subscription: ${err.message}`);
    }
  }

  /**
   * Renew a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {string} userId - User ID for verification
   * @returns {Promise<Object>} New subscription
   */
  static async renewSubscription(subscriptionId, userId) {
    try {
      console.log(`Renewing subscription ${subscriptionId} for user ${userId}`);

      // Get details of the old subscription
      let oldSubscription;
      let amount = 10;
      let paymentMethod = 'card';
      let autoRenew = true;

      // Check if this is a real subscription ID or a mock one
      if (!subscriptionId.startsWith('sub-')) {
        // Get the old subscription details
        const { data: oldSub, error: oldSubError } = await serviceSupabase
          .from('subscriptions')
          .select('*')
          .eq('id', subscriptionId)
          .eq('user_id', userId)
          .single();

        if (oldSubError) {
          console.error('Error fetching old subscription:', oldSubError);
        } else if (oldSub) {
          oldSubscription = oldSub;
          amount = oldSub.amount;
          paymentMethod = oldSub.payment_method;
          autoRenew = true; // Always set autoRenew to true when renewing a subscription
        }
      }

      // Create a new payment for 30 days
      const paymentResult = await PaymentService.createSubscription({
        userId: userId,
        amount: amount,
        currency: 'USD',
        paymentMethod: paymentMethod,
        plan: 'premium'
      });

      if (!paymentResult.success) {
        throw new Error('Payment processing failed');
      }

      // Create a new subscription record
      const subscriptionRecord = {
        user_id: userId,
        plan: 'premium',
        status: 'active',
        start_date: paymentResult.startDate,
        end_date: paymentResult.endDate,
        auto_renew: autoRenew,
        payment_method: paymentMethod,
        amount: amount,
        currency: 'USD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating new subscription record:', subscriptionRecord);

      // Insert the new subscription record
      const { data: subscription, error: subscriptionError } = await serviceSupabase
        .from('subscriptions')
        .insert([subscriptionRecord])
        .select()
        .single();

      if (subscriptionError) {
        console.error('Error creating new subscription record:', subscriptionError);
        throw new Error(`Error renewing subscription: ${subscriptionError.message}`);
      }

      // Update user's subscription status
      const { data: user, error: userError } = await serviceSupabase
        .from('users')
        .update({
          subscription_status: 'premium',
          subscription_start_date: paymentResult.startDate,
          subscription_end_date: paymentResult.endDate,
          has_premium_access: true
        })
        .eq('id', userId)
        .select()
        .single();

      if (userError) {
        console.error('Error updating user subscription status:', userError);
        throw new Error(`Error renewing subscription: ${userError.message}`);
      }

      console.log(`Subscription renewed for user ${userId}`);

      // Transform the subscription record to match the expected format
      const transformedSubscription = {
        _id: subscription.id,
        userId: subscription.user_id,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        autoRenew: subscription.auto_renew,
        paymentMethod: subscription.payment_method,
        amount: subscription.amount,
        currency: subscription.currency,
        createdAt: subscription.created_at
      };

      return {
        subscription: transformedSubscription,
        user: {
          _id: user.id,
          name: user.name,
          email: user.email,
          subscription: {
            status: 'premium',
            startDate: paymentResult.startDate,
            endDate: paymentResult.endDate
          }
        }
      };
    } catch (err) {
      console.error('Error in renewSubscription:', err);
      throw new Error(`Error renewing subscription: ${err.message}`);
    }
  }

  /**
   * Check if user has an active premium subscription
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether user has premium access
   */
  static async hasPremiumAccess(userId) {
    try {
      console.log(`Checking premium access for user ${userId}`);

      // First check if there's an active subscription in the subscriptions table
      const { data: subscriptions, error: subscriptionError } = await serviceSupabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .limit(1);

      if (!subscriptionError && subscriptions && subscriptions.length > 0) {
        console.log(`User ${userId} has an active subscription in the subscriptions table`);
        return true;
      }

      // If no active subscription found, check the user record
      const { data: user, error: userError } = await serviceSupabase
        .from('users')
        .select('has_premium_access, subscription_status, subscription_end_date')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error checking user subscription status:', userError);
        return false;
      }

      // Check if user has valid subscription based on status and end date
      if ((user.has_premium_access ||
           (user.subscription_status === 'premium' &&
            user.subscription_end_date &&
            new Date(user.subscription_end_date) > new Date()))) {
        console.log(`User ${userId} has premium access until ${user.subscription_end_date}`);
        return true;
      }

      console.log(`User ${userId} does not have premium access`);
      return false;
    } catch (err) {
      console.error('Error checking premium access:', err);
      return false; // Default to no premium access on error
    }
  }

  /**
   * Initialize subscriptions table if it doesn't exist
   */
  static async initializeSubscriptionsTable() {
    try {
      console.log('Checking if subscriptions table exists...');
      
      // Try to query the subscriptions table
      const { error } = await serviceSupabase
        .from('subscriptions')
        .select('id')
        .limit(1);

      // If the table doesn't exist, create it
      if (error && error.code === '42P01') {
        console.log('Subscriptions table does not exist, creating it...');
        
        // Create the table using SQL
        const { error: createError } = await serviceSupabase.rpc('exec_sql', {
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

        if (createError) {
          console.error('Error creating subscriptions table:', createError);
          
          // Try an alternative approach - insert a record to create the table
          const { error: insertError } = await serviceSupabase
            .from('subscriptions')
            .insert([{
              user_id: '00000000-0000-0000-0000-000000000000',
              plan: 'test',
              status: 'test',
              start_date: new Date().toISOString(),
              end_date: new Date().toISOString(),
              auto_renew: false,
              payment_method: 'test',
              amount: 0,
              currency: 'USD'
            }]);
            
          if (insertError && insertError.code !== '23505') { // Ignore unique constraint violation
            console.error('Error creating subscriptions table via insert:', insertError);
            throw new Error(`Failed to create subscriptions table: ${insertError.message}`);
          }
        }
        
        console.log('Subscriptions table created successfully');
      } else if (error) {
        console.error('Error checking subscriptions table:', error);
      } else {
        console.log('Subscriptions table already exists');
      }
      
      return true;
    } catch (err) {
      console.error('Error initializing subscriptions table:', err);
      throw new Error(`Failed to initialize subscriptions table: ${err.message}`);
    }
  }
}

module.exports = SupabaseSubscriptionService;