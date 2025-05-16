const SubscriptionService = require('../services/supabaseSubscriptionService');
const supabase = require('../config/supabase');
const { serviceSupabase } = require('../config/supabase');

exports.createSubscription = async (req, res) => {
  try {
    const { amount, currency, paymentMethod, autoRenew } = req.body;

    // Fix: Extract userId correctly from req.user
    const userId = req.user?.userId || req.user?._id;
    
    console.log(`Creating subscription with user ID: ${userId}`);

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    if (!amount || !paymentMethod) {
      return res.status(400).json({ message: 'Amount and payment method are required' });
    }

    // Create subscription
    const result = await SubscriptionService.createSubscription({
      userId,
      amount,
      currency,
      paymentMethod,
      autoRenew
    });

    res.status(201).json({
      success: true,
      subscription: result.subscription,
      user: {
        _id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        subscription: result.user.subscription
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getActiveSubscription = async (req, res) => {
  try {
    // Fix: Extract userId correctly from req.user
    const userId = req.user?.userId || req.user?._id;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const subscription = await SubscriptionService.getUserActiveSubscription(userId);

    res.status(200).json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error fetching active subscription:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSubscriptionHistory = async (req, res) => {
  try {
    // Fix: Log the actual user ID from req.user
    console.log(`Getting subscription history for user (req.user):`, req.user);

    // Fix: Extract userId correctly from req.user
    const userId = req.user?.userId || req.user?._id;

    if (!userId) {
      return res.status(400).json({
        message: 'User ID is required',
        success: false
      });
    }

    console.log(`Getting subscription history for user ID: ${userId}`);

    // Check premium access first
    const hasPremium = await SubscriptionService.hasPremiumAccess(userId);
    console.log(`User premium access status: ${hasPremium ? 'Premium' : 'Free'}`);

    // Get user data for premium info
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('subscription_status, subscription_start_date, subscription_end_date')
      .eq('id', userId)
      .single();

    console.log("User subscription data from Supabase:", userData);

    // Get subscription history
    const subscriptions = await SubscriptionService.getUserSubscriptionHistory(userId);
    console.log(`Found ${subscriptions?.length || 0} subscriptions for user ${userId}`);

    // If no subscriptions but user has premium access, include premium user info
    if ((!subscriptions || subscriptions.length === 0) && hasPremium && userData) {
      console.log('User has premium access but no subscription records');
      res.status(200).json({
        success: true,
        subscriptions: [],
        hasPremiumAccess: true,
        premiumUser: {
          startDate: userData.subscription_start_date || new Date().toISOString(),
          endDate: userData.subscription_end_date || new Date(Date.now() + 30*24*60*60*1000).toISOString()
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      subscriptions: subscriptions || [],
      hasPremiumAccess: hasPremium
    });
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Fix: Extract userId correctly from req.user
    const userId = req.user?.userId || req.user?._id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!subscriptionId) {
      return res.status(400).json({ message: 'Subscription ID is required' });
    }

    const subscription = await SubscriptionService.cancelSubscription(subscriptionId, userId);

    res.status(200).json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.renewSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Fix: Extract userId correctly from req.user
    const userId = req.user?.userId || req.user?._id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!subscriptionId) {
      return res.status(400).json({ message: 'Subscription ID is required' });
    }

    const result = await SubscriptionService.renewSubscription(subscriptionId, userId);

    res.status(200).json({
      success: true,
      subscription: result.subscription,
      user: {
        _id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        subscription: result.user.subscription
      }
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.checkPremiumAccess = async (req, res) => {
  try {
    // Fix: Extract userId correctly from req.user
    const userId = req.user?.userId || req.user?._id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const hasPremium = await SubscriptionService.hasPremiumAccess(userId);

    res.status(200).json({
      success: true,
      hasPremiumAccess: hasPremium
    });
  } catch (error) {
    console.error('Error checking premium access:', error);
    res.status(500).json({ message: error.message });
  }
};