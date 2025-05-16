const SupabaseDonationService = require('../services/supabaseDonationService');
const supabase = require('../config/supabase');

exports.createDonation = async (req, res) => {
  try {
    const { amount, currency, paymentMethod, donationType } = req.body;

    // Validate required fields
    if (!amount || !paymentMethod) {
      return res.status(400).json({ message: 'Amount and payment method are required' });
    }

    // Get user ID from auth token
    // The issue is here - we need to correctly extract the user ID
    console.log('Auth user object:', req.user);
    
    // Extract userId properly from the request
    let userId;
    if (req.user) {
      userId = req.user.id || req.user._id || req.user.userId;
      console.log('Extracted userId:', userId);
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in authentication token' });
    }

    // Create donation
    const donation = await SupabaseDonationService.createDonation({
      userId,
      amount,
      currency,
      paymentMethod,
      donationType
    });

    res.status(201).json({
      success: true,
      donation
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getUserDonations = async (req, res) => {
  try {
    // Get user ID from auth token
    console.log('Auth user object for donations:', req.user);
    
    // Extract userId properly from the request
    let userId;
    if (req.user) {
      userId = req.user.id || req.user._id || req.user.userId;
      console.log('Extracted userId for donations:', userId);
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in authentication token' });
    }

    const donations = await SupabaseDonationService.getUserDonations(userId);
    res.status(200).json({
      success: true,
      donations
    });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    // Get user ID from auth token
    console.log('Auth user object for subscription:', req.user);
    
    // Extract userId properly from the request
    let userId;
    if (req.user) {
      userId = req.user.id || req.user._id || req.user.userId;
      console.log('Extracted userId for subscription:', userId);
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in authentication token' });
    }

    const subscription = await SupabaseDonationService.getUserSubscriptionStatus(userId);

    res.status(200).json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ message: error.message });
  }
};