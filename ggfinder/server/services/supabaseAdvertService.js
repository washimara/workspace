const { createClient } = require('@supabase/supabase-js');
const supabase = require('../config/supabase');
const { serviceSupabase } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const { geocodeAddress } = require('../utils/geocoding');
const logger = require('./loggingService');

class SupabaseAdvertService {
  constructor() {
    this.tableName = 'adverts';
    this.log = logger.child({ service: 'SupabaseAdvertService' });
  }
  
  async initializeTable() {
    return this._createTableWithMinimalData();
  }
  
  async getAll(params = {}) {
    try {
      const { query, tags, location, radius = 50, lat, lng } = params;
      
      let queryBuilder = supabase
        .from(this.tableName)
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      
      // Handle text search
      if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }
      
      // Handle tags
      if (tags && tags.length > 0) {
        // For array contains in Supabase
        const tagArray = Array.isArray(tags) ? tags : [tags];
        queryBuilder = queryBuilder.contains('tags', tagArray);
      }
      
      const { data: rawAdverts, error } = await queryBuilder;
      
      if (error) {
        this.log.error('Error getting adverts', error);
        throw new Error(`Failed to get adverts: ${error.message}`);
      }
      
      // Transform adverts to frontend format
      const adverts = rawAdverts.map(advert => this._transformAdvertFromSupabase(advert));
      
      // Process location filtering if needed
      if (location || (lat && lng)) {
        let filteredAdverts = adverts;
        
        // If we have direct coordinates
        if (lat && lng) {
          const searchCoords = { lat: parseFloat(lat), lng: parseFloat(lng) };
          const radiusKm = parseFloat(radius);
          
          // Filter and add distance
          filteredAdverts = this._filterByDistance(adverts, searchCoords, radiusKm);
        }
        // If we have a location string that needs geocoding
        else if (location) {
          // Simple text matching first
          filteredAdverts = adverts.filter(advert => 
            advert.location && advert.location.toLowerCase().includes(location.toLowerCase())
          );
          
          // If we have geocoding capability, enhance with distance
          const searchCoords = await geocodeAddress(location);
          if (searchCoords) {
            filteredAdverts = this._filterByDistance(filteredAdverts, searchCoords, parseFloat(radius));
          }
        }
        
        return filteredAdverts;
      }
      
      return adverts;
    } catch (error) {
      this.log.error('Error in getAll method', error);
      throw error;
    }
  }
  
  async getById(id, key) {
    try {
      const { data: advert, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        this.log.error(`Error getting advert by ID ${id}`, error);
        throw new Error(`Failed to get advert: ${error.message}`);
      }
      
      if (!advert) {
        throw new Error('Advert not found');
      }
      
      // Check if advert is private and key doesn't match
      if (advert.visibility === 'private' && advert.private_key !== key) {
        throw {
          message: 'This is a private advert that requires a valid access key',
          requiresKey: true
        };
      }
      
      return this._transformAdvertFromSupabase(advert);
    } catch (error) {
      this.log.error(`Error in getById method for ID ${id}`, error);
      throw error;
    }
  }
  
  async create(userData, advertData) {
    try {
      const { title, description, image, location, customFields, tags, visibility } = advertData;
      const userId = userData.id;

      console.log('Creating advert for user:', userId);
      console.log('User data:', userData);

      if (!userId) {
        throw new Error('User ID is required to create an advert');
      }

      // Create a simplified advert object
      const newAdvert = {
        title,
        description,
        image: image || null,
        location: location || null,
        custom_fields: customFields || [],
        tags: tags || [],
        visibility: visibility || 'public',
        user_id: userId,
        upvotes: 0,
        views: 0,
        upvoted_by: [],
        created_at: new Date().toISOString()
      };

      // Generate privateKey for private adverts
      if (newAdvert.visibility === 'private') {
        newAdvert.private_key = uuidv4();
      }

      // If location is provided, try to geocode it
      if (location) {
        const coordinates = await geocodeAddress(location);
        if (coordinates) {
          newAdvert.coordinates = {
            lng: coordinates.lng,
            lat: coordinates.lat
          };
        }
      }

      // Try to insert the advert using the imported serviceSupabase
      console.log('Attempting to insert advert into database:', newAdvert);

      // Use the imported serviceSupabase instead of creating a new client
      const { data, error } = await serviceSupabase
        .from(this.tableName)
        .insert([newAdvert])
        .select();

      if (error) {
        console.error('Error inserting advert:', error);
        throw new Error(`Failed to create advert: ${error.message}`);
      }

      console.log('Successfully created advert:', data[0]);
      return data[0];
    } catch (error) {
      this.log.error('Error in create method', error);
      throw error;
    }
  }
  
  async update(id, userId, advertData) {
    try {
      console.log(`Starting update operation for advert ${id} by user ${userId}`);
      
      // First get the current advert
      const { data: existingAdvert, error: fetchError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        this.log.error(`Error fetching advert ${id} for update`, fetchError);
        throw new Error(`Failed to fetch advert: ${fetchError.message}`);
      }

      if (!existingAdvert) {
        throw new Error('Advert not found');
      }

      // Log the full user ID from the advert for debugging
      console.log(`Advert ${id} belongs to user: ${existingAdvert.user_id}`);
      console.log(`Request from user: ${userId}`);
      
      // Compare IDs properly, trimming any whitespace
      const ownerUserId = String(existingAdvert.user_id).trim();
      const requestUserId = String(userId).trim();
      
      console.log(`Comparing: "${ownerUserId}" with "${requestUserId}"`);
      
      if (ownerUserId !== requestUserId) {
        this.log.warn(`Unauthorized update attempt: user ${userId} tried to update advert ${id} owned by ${existingAdvert.user_id}`);
        throw new Error('Not authorized to update this advert');
      }

      const { title, description, image, location, customFields, tags, visibility } = advertData;

      console.log(`Building update object for advert ${id}`);
      const updatedAdvert = {
        title: title || existingAdvert.title,
        description: description || existingAdvert.description,
        image: image !== undefined ? image : existingAdvert.image,
        location: location !== undefined ? location : existingAdvert.location,
        custom_fields: customFields || existingAdvert.custom_fields,
        tags: tags || existingAdvert.tags,
      };

      // Handle visibility change
      if (visibility && visibility !== existingAdvert.visibility) {
        updatedAdvert.visibility = visibility;

        // Generate privateKey if changing to private
        if (visibility === 'private' && !existingAdvert.private_key) {
          updatedAdvert.private_key = uuidv4();
        }
      }

      // Update coordinates if location changed
      if (location !== undefined && location !== existingAdvert.location) {
        if (location) {
          const coordinates = await geocodeAddress(location);
          if (coordinates) {
            updatedAdvert.coordinates = {
              lng: coordinates.lng,
              lat: coordinates.lat
            };
          } else {
            updatedAdvert.coordinates = null;
          }
        } else {
          updatedAdvert.coordinates = null;
        }
      }

      console.log(`Executing update operation for advert ${id}`);
      const { data, error } = await serviceSupabase
        .from(this.tableName)
        .update(updatedAdvert)
        .eq('id', id)
        .select();

      if (error) {
        this.log.error(`Error updating advert ${id}: ${error.message}`, error);
        throw new Error(`Failed to update advert: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No advert was updated');
      }

      console.log(`Successfully updated advert ${id}`);
      return this._transformAdvertFromSupabase(data[0]);
    } catch (error) {
      this.log.error(`Error in update method for ID ${id}: ${error.message}`, error);
      throw error;
    }
  }
  
  async delete(id, userId) {
    try {
      console.log(`[SupabaseAdvertService] Deleting advert ${id} by user ${userId}`);

      // First get the advert to verify ownership
      const { data: advert, error: advertError } = await supabase
        .from('adverts')
        .select('user_id, upvotes')
        .eq('id', id)
        .single();

      if (advertError) {
        console.error(`[SupabaseAdvertService] Error fetching advert:`, advertError);
        throw new Error(`Failed to fetch advert: ${advertError.message}`);
      }

      if (!advert) {
        throw new Error('Advert not found');
      }

      if (advert.user_id !== userId) {
        throw new Error('Not authorized to delete this advert');
      }

      // If the advert has upvotes, get the author's current karma
      let authorKarma = 0;
      if (advert.upvotes > 0) {
        const { data: authorData, error: authorError } = await serviceSupabase
          .from('users')
          .select('goodKarma')
          .eq('id', advert.user_id)
          .single();

        if (!authorError && authorData) {
          authorKarma = authorData.goodKarma || 0;
          console.log(`[SupabaseAdvertService] Current karma for user ${advert.user_id}: ${authorKarma}`);
        } else {
          console.error(`[SupabaseAdvertService] Error getting author karma:`, authorError);
        }
      }

      // Log that we're preserving karma
      console.log(`[SupabaseAdvertService] Deleting advert with ${advert.upvotes || 0} upvotes. User karma will be preserved.`);

      // Delete all upvote records for this advert
      const { error: upvoteDeleteError } = await serviceSupabase
        .from('advert_upvotes')
        .delete()
        .eq('advert_id', id);

      if (upvoteDeleteError) {
        console.error(`[SupabaseAdvertService] Error deleting upvote records:`, upvoteDeleteError);
        // Continue with deletion even if upvote records can't be deleted
        // This is to prevent orphaned adverts
      }

      // Delete the advert
      const { error: deleteError } = await supabase
        .from('adverts')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error(`[SupabaseAdvertService] Error deleting advert:`, deleteError);
        throw new Error(`Failed to delete advert: ${deleteError.message}`);
      }

      // After deletion, if the advert had upvotes, ensure the author's karma is preserved
      if (advert.upvotes > 0) {
        // Check the current karma after deletion
        const { data: currentAuthorData, error: currentAuthorError } = await serviceSupabase
          .from('users')
          .select('goodKarma')
          .eq('id', advert.user_id)
          .single();

        if (!currentAuthorError && currentAuthorData) {
          const currentKarma = currentAuthorData.goodKarma || 0;
          console.log(`[SupabaseAdvertService] Karma after deletion: ${currentKarma}`);
          
          // If karma was reduced, restore it
          if (currentKarma < authorKarma) {
            console.log(`[SupabaseAdvertService] Restoring karma from ${currentKarma} to ${authorKarma}`);
            
            const { error: karmaError } = await serviceSupabase
              .from('users')
              .update({ goodKarma: authorKarma })
              .eq('id', advert.user_id);
              
            if (karmaError) {
              console.error(`[SupabaseAdvertService] Error restoring karma:`, karmaError);
            } else {
              console.log(`[SupabaseAdvertService] Successfully restored karma to ${authorKarma}`);
            }
          }
        } else {
          console.error(`[SupabaseAdvertService] Error checking current karma:`, currentAuthorError);
        }
      }

      return { success: true };
    } catch (error) {
      console.error(`[SupabaseAdvertService] Error in delete:`, error);
      throw error;
    }
  }
  
  async getUserAdverts(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required to get user adverts');
      }

      console.log('Getting adverts for user with ID:', userId);
      this.log.info(`Fetching adverts for user: ${userId}`);

      const { data: rawAdverts, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Error in getUserAdverts Supabase query:`, error);
        this.log.error(`Error getting user adverts for user ${userId}`, error);
        throw new Error(`Failed to get user adverts: ${error.message}`);
      }

      console.log(`Found ${rawAdverts ? rawAdverts.length : 0} adverts for user ${userId}`);
      if (rawAdverts && rawAdverts.length > 0) {
        console.log('First raw advert from Supabase:', JSON.stringify(rawAdverts[0]));
      }

      // Transform adverts to frontend format
      const transformedAdverts = rawAdverts.map(advert => this._transformAdvertFromSupabase(advert));
      console.log('Transformed adverts count:', transformedAdverts.length);
      if (transformedAdverts.length > 0) {
        console.log('First transformed advert:', JSON.stringify(transformedAdverts[0]));
      }
      
      return transformedAdverts;
    } catch (error) {
      console.error(`Detailed error in getUserAdverts:`, error);
      this.log.error(`Error in getUserAdverts method for user ${userId}`, error);
      throw error;
    }
  }
  
  async upvoteAdvert(advertId, userId) {
    try {
      console.log(`Processing upvote in service for advert ${advertId} by user ${userId}`);
    
      // Check if advert exists
      const { data: advert, error: advertError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', advertId)
        .single();

      if (advertError) {
        this.log.error(`Error fetching advert ${advertId}`, advertError);
        throw new Error(`Failed to fetch advert: ${advertError.message}`);
      }

      if (!advert) {
        throw new Error('Advert not found');
      }

      // Check if user has already upvoted
      const { data: upvote, error: upvoteError } = await supabase
        .from('advert_upvotes')
        .select('*')
        .eq('advert_id', advertId)
        .eq('user_id', userId)
        .maybeSingle();

      if (upvoteError) {
        this.log.error(`Error checking upvote status for advert ${advertId}`, upvoteError);
        throw new Error(`Failed to check upvote status: ${upvoteError.message}`);
      }

      let upvoted = false;
      let upvoteCount = advert.upvotes || 0;

      if (!upvote) {
        // Add upvote
        const { error: addError } = await supabase
          .from('advert_upvotes')
          .insert([{ 
            advert_id: advertId, 
            user_id: userId, 
            created_at: new Date().toISOString() 
          }]);

        if (addError) {
          this.log.error(`Error adding upvote for advert ${advertId}`, addError);
          throw new Error(`Failed to add upvote: ${addError.message}`);
        }

        // Increment upvote count
        upvoteCount += 1;
        const { error: updateError } = await supabase
          .from(this.tableName)
          .update({ upvotes: upvoteCount })
          .eq('id', advertId);

        if (updateError) {
          this.log.error(`Error updating upvote count for advert ${advertId}`, updateError);
          throw new Error(`Failed to update upvote count: ${updateError.message}`);
        }

        // Increment author's karma
        const { error: karmaError } = await serviceSupabase
          .from('users')
          .update({ goodKarma: serviceSupabase.raw('goodKarma + 1') })
          .eq('id', advert.user_id);

        if (karmaError) {
          this.log.error(`Error updating karma for user ${advert.user_id}`, karmaError);
          // Don't throw - continue with the upvote operation
        }

        upvoted = true;
      } else {
        // Remove upvote
        const { error: removeError } = await supabase
          .from('advert_upvotes')
          .delete()
          .eq('advert_id', advertId)
          .eq('user_id', userId);

        if (removeError) {
          this.log.error(`Error removing upvote for advert ${advertId}`, removeError);
          throw new Error(`Failed to remove upvote: ${removeError.message}`);
        }

        // Decrement upvote count
        upvoteCount = Math.max(0, upvoteCount - 1);
        const { error: updateError } = await supabase
          .from(this.tableName)
          .update({ upvotes: upvoteCount })
          .eq('id', advertId);

        if (updateError) {
          this.log.error(`Error updating upvote count for advert ${advertId}`, updateError);
          throw new Error(`Failed to update upvote count: ${updateError.message}`);
        }

        // Decrement author's karma
        const { error: karmaError } = await serviceSupabase
          .from('users')
          .update({
            goodKarma: serviceSupabase.raw('GREATEST(goodKarma - 1, 0)')
          })
          .eq('id', advert.user_id);

        if (karmaError) {
          this.log.error(`Error updating karma for user ${advert.user_id}`, karmaError);
          // Don't throw - continue with the upvote operation
        }

        upvoted = false;
      }

      return {
        upvotes: upvoteCount,
        upvoted
      };
    } catch (error) {
      this.log.error(`Error in upvoteAdvert method for ID ${advertId}`, error);
      throw error;
    }
  }
  
  async trackView(id) {
    try {
      // First get the current advert
      const { data: advert, error: fetchError } = await supabase
        .from(this.tableName)
        .select('views')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        this.log.error(`Error fetching advert ${id} for view tracking`, fetchError);
        throw new Error(`Failed to fetch advert: ${fetchError.message}`);
      }
      
      if (!advert) {
        throw new Error('Advert not found');
      }
      
      const newViews = (advert.views || 0) + 1;
      
      const { error } = await supabase
        .from(this.tableName)
        .update({ views: newViews })
        .eq('id', id);
      
      if (error) {
        this.log.error(`Error tracking view for advert ${id}`, error);
        throw new Error(`Failed to track view: ${error.message}`);
      }
      
      return { views: newViews };
    } catch (error) {
      this.log.error(`Error in trackView method for ID ${id}`, error);
      throw error;
    }
  }
  
  async getStats(id, userId = null) {
    try {
      const { data: advert, error } = await supabase
        .from(this.tableName)
        .select('upvotes, views, upvoted_by')
        .eq('id', id)
        .single();
      
      if (error) {
        this.log.error(`Error getting stats for advert ${id}`, error);
        throw new Error(`Failed to get advert stats: ${error.message}`);
      }
      
      if (!advert) {
        throw new Error('Advert not found');
      }
      
      // Check if user is authenticated to determine if they upvoted
      let upvoted = false;
      if (userId) {
        const upvotedBy = advert.upvoted_by || [];
        upvoted = upvotedBy.includes(userId);
      }
      
      return {
        upvotes: advert.upvotes || 0,
        views: advert.views || 0,
        upvoted
      };
    } catch (error) {
      this.log.error(`Error in getStats method for ID ${id}`, error);
      throw error;
    }
  }
  
  async getShareableLink(id, baseUrl) {
    try {
      const { data: advert, error } = await supabase
        .from(this.tableName)
        .select('visibility, private_key')
        .eq('id', id)
        .single();
      
      if (error) {
        this.log.error(`Error getting advert ${id} for shareable link`, error);
        throw new Error(`Failed to get advert: ${error.message}`);
      }
      
      if (!advert) {
        throw new Error('Advert not found');
      }
      
      let url = `${baseUrl}/advert/${id}`;
      
      // Add privateKey to URL if advert is private
      if (advert.visibility === 'private' && advert.private_key) {
        url += `?key=${advert.private_key}`;
      }
      
      return { url };
    } catch (error) {
      this.log.error(`Error in getShareableLink method for ID ${id}`, error);
      throw error;
    }
  }
  
  async getPrivateShareableLink(id, userId, baseUrl) {
    try {
      // First get the current advert
      const { data: advert, error: fetchError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        this.log.error(`Error fetching advert ${id} for private sharing`, fetchError);
        throw new Error(`Failed to fetch advert: ${fetchError.message}`);
      }
      
      if (!advert) {
        throw new Error('Advert not found');
      }
      
      // Check if user owns the advert
      if (advert.user_id !== userId) {
        throw new Error('Not authorized to share this advert');
      }
      
      let privateKey = advert.private_key;
      let updateNeeded = false;
      
      // If advert is currently public, convert it to private and generate a key
      if (advert.visibility !== 'private') {
        privateKey = uuidv4();
        updateNeeded = true;
      }
      
      // If the private key doesn't exist, generate one
      if (!privateKey) {
        privateKey = uuidv4();
        updateNeeded = true;
      }
      
      if (updateNeeded) {
        const { error } = await supabase
          .from(this.tableName)
          .update({
            visibility: 'private',
            private_key: privateKey
          })
          .eq('id', id);
        
        if (error) {
          this.log.error(`Error updating advert ${id} for private sharing`, error);
          throw new Error(`Failed to update advert: ${error.message}`);
        }
      }
      
      const url = `${baseUrl}/advert/${id}?key=${privateKey}`;
      
      return {
        url,
        key: privateKey,
        message: 'Private sharing link generated successfully'
      };
    } catch (error) {
      this.log.error(`Error in getPrivateShareableLink method for ID ${id}`, error);
      throw error;
    }
  }
  
  // Helper method to filter and sort adverts by distance
  _filterByDistance(adverts, searchCoords, radiusKm) {
    return adverts
      .map(advert => {
        const advertCopy = { ...advert };
        
        // Calculate distance if advert has coordinates
        if (advert.coordinates && advert.coordinates.lat && advert.coordinates.lng) {
          advertCopy.distance = this._calculateDistance(
            searchCoords.lat,
            searchCoords.lng,
            advert.coordinates.lat,
            advert.coordinates.lng
          );
        }
        
        return advertCopy;
      })
      .filter(advert => !advert.distance || advert.distance <= radiusKm)
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  }
  
  // Haversine formula to calculate distance between two points
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this._deg2rad(lat2 - lat1);
    const dLon = this._deg2rad(lon2 - lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this._deg2rad(lat1)) * Math.cos(this._deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  }
  
  _deg2rad(deg) {
    return deg * (Math.PI/180);
  }
  
  // Helper method for creating the table
  async _createTableWithMinimalData() {
    try {
      console.log('Creating adverts table with minimal data');
      
      // Create a minimal record to establish the table structure
      const minimalAdvert = {
        title: 'Initial Advert',
        description: 'This is a placeholder to create the table',
        user_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('adverts')
        .insert([minimalAdvert]);
        
      if (error && error.code !== '23505') { // Ignore unique constraint violations
        console.error('Error creating table with minimal data:', error);
        return false;
      }
      
      console.log('Successfully created adverts table');
      return true;
    } catch (error) {
      console.error('Error in _createTableWithMinimalData:', error);
      return false;
    }
  }
  
  // Helper method to transform advert from Supabase
  _transformAdvertFromSupabase(advert) {
    if (!advert) return null;
    
    console.log("Transforming Supabase advert with ID:", advert.id);
    console.log("Original Supabase advert structure:", JSON.stringify(advert));
    
    const transformed = {
      _id: advert.id,
      title: advert.title,
      description: advert.description,
      image: advert.image,
      location: advert.location,
      coordinates: advert.coordinates,
      customFields: advert.custom_fields,
      tags: advert.tags,
      createdAt: advert.created_at,
      userId: advert.user_id,
      upvotes: advert.upvotes,
      views: advert.views,
      upvotedBy: advert.upvoted_by,
      visibility: advert.visibility,
      privateKey: advert.private_key
    };
    
    console.log("Transformed advert:", JSON.stringify(transformed));
    return transformed;
  }
}

const supabaseAdvertService = new SupabaseAdvertService();

// Initialize the table when the module is loaded
(async () => {
  try {
    await supabaseAdvertService.initializeTable();
    console.log('Adverts table initialized successfully');
  } catch (error) {
    console.error('Failed to initialize adverts table:', error);
  }
})();

module.exports = supabaseAdvertService;