const Donation = require('../models/Donation');
const User = require('../models/User');
const PaymentService = require('./paymentService');

class DonationService {
  /**
   * Create a new donation
   * @param {Object} donationData - Donation data
   * @returns {Promise<Object>} Created donation
   */
  static async createDonation(donationData) {
    try {
      // Process the payment
      const paymentResult = await PaymentService.processDonation({
        amount: donationData.amount,
        currency: donationData.currency || 'USD',
        paymentMethod: donationData.paymentMethod,
        description: `Donation from ${donationData.userId}`
      });

      // Create donation record
      const donation = new Donation({
        userId: donationData.userId,
        amount: donationData.amount,
        currency: donationData.currency || 'USD',
        paymentMethod: donationData.paymentMethod,
        status: paymentResult.success ? 'completed' : 'failed',
        donationType: donationData.donationType || 'one-time'
      });

      await donation.save();

      // If this is a subscription donation, update the user's subscription status
      if (donationData.donationType === 'subscription' && paymentResult.success) {
        const now = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
        
        await User.findByIdAndUpdate(donationData.userId, {
          subscription: {
            status: 'premium',
            startDate: now,
            endDate: endDate
          }
        });
      }

      return donation;
    } catch (err) {
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
      return await Donation.find({ userId }).sort({ createdAt: -1 });
    } catch (err) {
      throw new Error(`Error fetching user donations: ${err.message}`);
    }
  }

  /**
   * Get all donations (admin only)
   * @returns {Promise<Array>} All donations
   */
  static async getAllDonations() {
    try {
      return await Donation.find().sort({ createdAt: -1 }).populate('userId', 'name email');
    } catch (err) {
      throw new Error(`Error fetching all donations: ${err.message}`);
    }
  }
}

module.exports = DonationService;