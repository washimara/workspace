const Subscription = require('../models/Subscription');
const User = require('../models/User');
const PaymentService = require('./paymentService');

class SubscriptionService {
  /**
   * Create a new subscription
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription with user update result
   */
  static async createSubscription(subscriptionData) {
    try {
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

      // Create subscription record
      const subscription = new Subscription({
        userId: subscriptionData.userId,
        plan: 'premium',
        status: 'active',
        startDate: paymentResult.startDate,
        endDate: paymentResult.endDate,
        autoRenew: subscriptionData.autoRenew || false,
        paymentMethod: subscriptionData.paymentMethod,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency || 'USD'
      });

      await subscription.save();

      // Update user's subscription status
      const userUpdateResult = await User.findByIdAndUpdate(
        subscriptionData.userId, 
        {
          subscription: {
            status: 'premium',
            startDate: paymentResult.startDate,
            endDate: paymentResult.endDate
          }
        },
        { new: true }
      );

      return {
        subscription,
        user: userUpdateResult
      };
    } catch (err) {
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
      return await Subscription.findOne({ 
        userId, 
        status: 'active',
        endDate: { $gte: new Date() }
      }).sort({ createdAt: -1 });
    } catch (err) {
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
      return await Subscription.find({ userId }).sort({ createdAt: -1 });
    } catch (err) {
      throw new Error(`Error fetching user subscription history: ${err.message}`);
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
      const subscription = await Subscription.findOne({ _id: subscriptionId, userId });
      
      if (!subscription) {
        throw new Error('Subscription not found or does not belong to user');
      }

      subscription.status = 'cancelled';
      subscription.autoRenew = false;
      await subscription.save();

      // Keep the user's benefits until the end date
      // No need to update the user record here

      return subscription;
    } catch (err) {
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
      // Get the old subscription
      const oldSubscription = await Subscription.findOne({ _id: subscriptionId, userId });
      
      if (!oldSubscription) {
        throw new Error('Subscription not found or does not belong to user');
      }

      // Create new subscription data based on old one
      const newSubscriptionData = {
        userId,
        amount: oldSubscription.amount,
        currency: oldSubscription.currency,
        paymentMethod: oldSubscription.paymentMethod,
        autoRenew: oldSubscription.autoRenew
      };

      // Create a new subscription
      return await SubscriptionService.createSubscription(newSubscriptionData);
    } catch (err) {
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
      const user = await User.findById(userId);
      if (!user) return false;

      // Check if user has a valid subscription
      if (user.subscription?.status === 'premium' && 
          user.subscription.endDate && 
          new Date(user.subscription.endDate) > new Date()) {
        return true;
      }

      return false;
    } catch (err) {
      throw new Error(`Error checking premium access: ${err.message}`);
    }
  }
}

module.exports = SubscriptionService;