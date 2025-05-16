const supabase = require("../utils/supabaseClient");
const logger = require("../utils/logger");

/**
 * Repository for advert-related database operations
 */
class AdvertRepository {
  /**
   * Delete an advert by ID
   * 
   * @param {string} id - The ID of the advert to delete
   * @returns {Promise<Object>} The deleted advert data
   */
  async deleteAdvert(id) {
    try {
      logger.info(`Deleting advert with ID: ${id}`);
      
      // First, we need to get any upvotes associated with this advert
      // to ensure we don't reduce user karma when the advert is deleted
      const { data: upvotes, error: upvotesError } = await supabase
        .from("upvotes")
        .select("userId")
        .eq("advertId", id);
      
      if (upvotesError) {
        logger.error(`Error fetching upvotes for advert ${id}: ${upvotesError.message}`, upvotesError);
        throw new Error(`Failed to fetch upvotes before advert deletion: ${upvotesError.message}`);
      }
      
      // Delete the upvotes first
      if (upvotes && upvotes.length > 0) {
        logger.info(`Removing ${upvotes.length} upvotes for advert ${id}`);
        const { error: deleteUpvotesError } = await supabase
          .from("upvotes")
          .delete()
          .eq("advertId", id);
        
        if (deleteUpvotesError) {
          logger.error(`Error deleting upvotes for advert ${id}: ${deleteUpvotesError.message}`, deleteUpvotesError);
          throw new Error(`Failed to delete upvotes: ${deleteUpvotesError.message}`);
        }
      }
      
      // Now delete the advert
      const { data, error } = await supabase
        .from("adverts")
        .delete()
        .eq("id", id)
        .single();
      
      if (error) {
        logger.error(`Error deleting advert with ID ${id}: ${error.message}`, error);
        throw new Error(`Failed to delete advert: ${error.message}`);
      }
      
      logger.info(`Successfully deleted advert with ID: ${id}`);
      return data;
    } catch (error) {
      logger.error(`Unexpected error in deleteAdvert for ID ${id}: ${error.message}`, error);
      throw error;
    }
  }
  
  /**
   * Get an advert by ID
   * 
   * @param {string} id - The ID of the advert to retrieve
   * @returns {Promise<Object>} The advert data
   */
  async getAdvertById(id) {
    try {
      logger.info(`Fetching advert with ID: ${id}`);
      
      const { data, error } = await supabase
        .from("adverts")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        logger.error(`Error fetching advert with ID ${id}: ${error.message}`, error);
        throw new Error(`Failed to fetch advert: ${error.message}`);
      }
      
      logger.info(`Successfully fetched advert with ID: ${id}`);
      return data;
    } catch (error) {
      logger.error(`Unexpected error in getAdvertById for ID ${id}: ${error.message}`, error);
      throw error;
    }
  }
}

module.exports = new AdvertRepository();