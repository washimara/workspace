const { supabase } = require('../config/supabaseClient');
const logger = require('../utils/logger');

/**
 * User repository for handling user-related database operations
 */
class UserRepository {
  /**
   * Get a user by their ID
   * @param {string} userId - The user's ID
   * @returns {Promise<Object|null>} - The user object or null if not found
   */
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error(`Error fetching user by ID: ${error.message}`, { error, userId });
        throw new Error(`Failed to fetch user: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error(`Unexpected error in getUserById: ${error.message}`, { error, userId });
      throw error;
    }
  }

  /**
   * Update a user's good karma count
   * @param {string} userId - The user's ID
   * @param {number} karmaChange - The amount to change the karma by (positive or negative)
   * @returns {Promise<Object>} - The updated user object
   */
  async updateUserKarma(userId, karmaChange) {
    try {
      logger.info(`Updating user karma for user ${userId} by ${karmaChange}`);
      
      // First get the current user to ensure they exist and to get current karma
      const user = await this.getUserById(userId);
      
      if (!user) {
        logger.error(`User not found for karma update: ${userId}`);
        throw new Error('User not found');
      }

      // Calculate new karma value (ensuring it doesn't go below 0)
      const currentKarma = user.goodKarma || 0;
      const newKarma = Math.max(0, currentKarma + karmaChange);
      
      logger.info(`Updating karma for user ${userId} from ${currentKarma} to ${newKarma}`);

      // Update the user's karma in the database
      const { data, error } = await supabase
        .from('users')
        .update({ goodKarma: newKarma })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        logger.error(`Error updating user karma: ${error.message}`, { error, userId, karmaChange });
        throw new Error(`Failed to update user karma: ${error.message}`);
      }

      return data;
    } catch (error) {
      logger.error(`Unexpected error in updateUserKarma: ${error.message}`, { error, userId, karmaChange });
      throw error;
    }
  }
}

module.exports = new UserRepository();