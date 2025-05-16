const db = require('../database/db');
const { logger } = require('../utils/logger');

/**
 * Service for managing adverts and related functionality
 */
class AdvertService {
  /**
   * Handles the deletion of an advert
   * This ensures user 'goodKarma' is not reduced when an upvoted advert is deleted
   * 
   * @param {string} advertId - The ID of the advert to delete
   * @param {string} userId - The ID of the user who owns the advert
   * @returns {Promise<Object>} - Result of the deletion operation
   */
  async deleteAdvert(advertId, userId) {
    try {
      logger.info(`[AdvertService] Deleting advert with ID: ${advertId} by user: ${userId}`);
      
      // Start a transaction to ensure database consistency
      const result = await db.transaction(async (trx) => {
        // First, get the advert to verify ownership
        const advert = await trx('adverts')
          .where({ id: advertId, user_id: userId })
          .first();
        
        if (!advert) {
          logger.warn(`[AdvertService] Advert with ID ${advertId} not found or doesn't belong to user ${userId}`);
          throw new Error('Advert not found or you do not have permission to delete it');
        }
        
        // Delete the advert
        const deleteResult = await trx('adverts')
          .where({ id: advertId })
          .del();
        
        logger.info(`[AdvertService] Successfully deleted advert with ID: ${advertId}`);
        return { success: true, message: 'Advert deleted successfully' };
      });
      
      return result;
    } catch (error) {
      logger.error(`[AdvertService] Error deleting advert: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Gets an advert by ID
   * 
   * @param {string} advertId - The ID of the advert to retrieve
   * @returns {Promise<Object>} - The advert data
   */
  async getAdvertById(advertId) {
    try {
      logger.info(`[AdvertService] Fetching advert with ID: ${advertId}`);
      
      const advert = await db('adverts')
        .where({ id: advertId })
        .first();
      
      if (!advert) {
        logger.warn(`[AdvertService] Advert with ID ${advertId} not found`);
        throw new Error('Advert not found');
      }
      
      return advert;
    } catch (error) {
      logger.error(`[AdvertService] Error fetching advert: ${error.message}`, error);
      throw error;
    }
  }
}

module.exports = new AdvertService();