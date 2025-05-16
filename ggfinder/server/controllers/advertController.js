const supabase = require('../config/supabase');
const { serviceSupabase } = require('../config/supabase');
const supabaseAdvertService = require('../services/supabaseAdvertService');
const logger = require('../services/loggingService');

// Get all adverts with optional search parameters
exports.getAdverts = async (req, res) => {
  try {
    const { query, tags, location, radius, lat, lng } = req.query;

    const adverts = await supabaseAdvertService.getAll({
      query,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
      location,
      radius,
      lat,
      lng
    });

    res.status(200).json({ adverts });
  } catch (error) {
    logger.error('Error in getAdverts controller:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get a single advert by ID
exports.getAdvertById = async (req, res) => {
  try {
    const { id } = req.params;
    const { key } = req.query;

    const advert = await supabaseAdvertService.getById(id, key);

    res.status(200).json({ advert });
  } catch (error) {
    if (error.requiresKey) {
      return res.status(403).json({
        message: error.message,
        requiresKey: true
      });
    }

    const statusCode = error.message === 'Advert not found' ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// Create a new advert
exports.createAdvert = async (req, res) => {
  try {
    const { title, description, image, location, custom_fields, customFields, tags, visibility } = req.body;
    const user = req.user;

    console.log('Creating advert with user:', user);
    console.log('Advert data:', { title, description, custom_fields: custom_fields || customFields });

    // Handle both customFields and custom_fields formats
    const fieldsToUse = custom_fields || customFields || [];

    // Fix: Pass the correct user ID format
    const userData = {
      id: user.id || user.userId // Handle both formats of user ID
    };

    const advert = await supabaseAdvertService.create(userData, {
      title,
      description,
      image,
      location,
      customFields: fieldsToUse,
      tags,
      visibility
    });

    res.status(201).json({
      advert,
      message: 'Advert created successfully'
    });
  } catch (error) {
    if (error.limitReached) {
      return res.status(403).json({
        message: error.message,
        limitReached: true
      });
    }

    logger.error('Error in createAdvert controller:', error);
    res.status(500).json({ message: error.message || 'Failed to create advert' });
  }
};

// Update an existing advert
exports.updateAdvert = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, location, customFields, tags, visibility } = req.body;

    // FIX: Use userId from the token, not id
    const userId = req.user.userId; // Changed from req.user.id to req.user.userId

    console.log(`Updating advert ${id} for user ${userId}`);

    const advert = await supabaseAdvertService.update(id, userId, {
      title,
      description,
      image,
      location,
      customFields,
      tags,
      visibility
    });

    res.status(200).json({
      advert,
      message: 'Advert updated successfully'
    });
  } catch (error) {
    const statusCode =
      error.message === 'Advert not found' ? 404 :
      error.message === 'Not authorized to update this advert' ? 403 : 500;

    res.status(statusCode).json({ message: error.message });
  }
};

// Delete an advert
exports.deleteAdvert = async (req, res) => {
  try {
    const { id } = req.params;

    // Log the user object to debug
    console.log('Delete advert - User object:', req.user);

    // Use userId instead of id from the user object
    const userId = req.user.userId; // Changed from req.user.id to req.user.userId

    console.log(`Attempting to delete advert ${id} for user ${userId}`);

    // Before deleting, get the advert to check if it has upvotes
    const { data: advert, error: advertError } = await supabase
      .from('adverts')
      .select('id, user_id, upvotes')
      .eq('id', id)
      .single();

    if (advertError) {
      console.error(`Error fetching advert before deletion:`, advertError);
      throw new Error(`Failed to fetch advert: ${advertError.message}`);
    }

    if (!advert) {
      throw new Error('Advert not found');
    }

    // Check if the user is authorized to delete this advert
    if (advert.user_id !== userId) {
      throw new Error('Not authorized to delete this advert');
    }

    // Fetch the current user's karma before deletion to ensure we maintain it
    if (advert.upvotes > 0) {
      console.log(`[AdvertController] Advert has ${advert.upvotes} upvotes. Ensuring karma is preserved.`);
      
      const { data: userData, error: userError } = await serviceSupabase
        .from('users')
        .select('goodKarma')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error(`[AdvertController] Error fetching user karma:`, userError);
        // Continue with deletion even if we can't fetch karma
      } else {
        console.log(`[AdvertController] Current user karma: ${userData.goodKarma || 0}`);
      }
    }

    // Delete the advert (which will also delete associated upvotes)
    await supabaseAdvertService.delete(id, userId);

    // After deletion, ensure we didn't lose karma by re-setting it to the original value if needed
    if (advert.upvotes > 0) {
      console.log(`[AdvertController] Verifying karma preservation after advert deletion`);
      
      const { data: userData, error: userError } = await serviceSupabase
        .from('users')
        .select('goodKarma')
        .eq('id', userId)
        .single();
        
      if (userError) {
        console.error(`[AdvertController] Error verifying user karma after deletion:`, userError);
      } else {
        console.log(`[AdvertController] User karma after deletion: ${userData.goodKarma || 0}`);
      }
    }

    res.status(200).json({ message: 'Advert deleted successfully' });
  } catch (error) {
    console.error(`Error in deleteAdvert controller:`, error);
    const statusCode =
      error.message === 'Advert not found' ? 404 :
      error.message === 'Not authorized to delete this advert' ? 403 : 500;

    res.status(statusCode).json({ message: error.message });
  }
};

// Get user's adverts
exports.getUserAdverts = async (req, res) => {
  try {
    // Add debugging to see what we're working with
    console.log('Getting adverts for user in controller:', req.user);

    // Make sure we have a valid user ID
    if (!req.user || !req.user.userId) {
      return res.status(400).json({ message: 'User ID is missing or invalid' });
    }

    // Pass the userId instead of the user object
    const adverts = await supabaseAdvertService.getUserAdverts(req.user.userId);

    res.status(200).json({ adverts });
  } catch (error) {
    logger.error('Error in getUserAdverts controller:', error);
    res.status(500).json({ message: error.message });
  }
};

// Upvote an advert
exports.upvoteAdvert = async (req, res) => {
  console.log('=== UPVOTE REQUEST RECEIVED ===');
  console.log('Request params:', req.params);
  console.log('Request user:', req.user);

  try {
    const { id } = req.params;
    // In req.user, the ID might be coming as either id or userId - handle both
    const userId = req.user?.id || req.user?.userId;

    console.log(`[UPVOTE DEBUG] Processing upvote for advert ${id} by user ${userId}`);

    // Ensure we have a valid user
    if (!userId) {
      console.log('[UPVOTE DEBUG] Authentication required - no userId');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get the advert to identify the author
    const { data: advert, error: advertError } = await supabase
      .from('adverts')
      .select('user_id, upvotes')
      .eq('id', id)
      .single();

    if (advertError) {
      console.error('[UPVOTE DEBUG] Error fetching advert:', advertError);
      throw new Error(`Failed to fetch advert: ${advertError.message}`);
    }

    if (!advert) {
      console.log('[UPVOTE DEBUG] Advert not found');
      throw new Error('Advert not found');
    }

    const authorId = advert.user_id;
    console.log(`[UPVOTE DEBUG] Advert author ID: ${authorId}`);

    // Prevent users from upvoting their own adverts
    if (userId === authorId) {
      console.log('[UPVOTE DEBUG] User cannot upvote their own advert');
      return res.status(403).json({
        message: 'You cannot upvote your own advert',
        cannotUpvoteOwn: true
      });
    }

    // Check if user has already upvoted this advert
    console.log(`[UPVOTE DEBUG] Checking if user ${userId} has already upvoted advert ${id}`);
    const { data: upvoteData, error: upvoteError } = await serviceSupabase
      .from('advert_upvotes')
      .select('*')
      .eq('advert_id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (upvoteError) {
      console.error('[UPVOTE DEBUG] Error checking upvote status:', upvoteError);
      throw new Error(`Failed to check upvote status: ${upvoteError.message}`);
    }

    const alreadyUpvoted = !!upvoteData;
    console.log(`[UPVOTE DEBUG] User has already upvoted: ${alreadyUpvoted}`);

    // Start a transaction by using multiple operations
    if (alreadyUpvoted) {
      console.log(`[UPVOTE DEBUG] Removing upvote for advert ${id} by user ${userId}`);

      // 1. Remove upvote record
      const { error: removeError } = await serviceSupabase
        .from('advert_upvotes')
        .delete()
        .eq('advert_id', id)
        .eq('user_id', userId);

      if (removeError) {
        console.error('[UPVOTE DEBUG] Error removing upvote:', removeError);
        throw new Error(`Failed to remove upvote: ${removeError.message}`);
      }
      console.log('[UPVOTE DEBUG] Successfully removed upvote record');

      // 2. Decrement upvote count on advert
      const { error: updateError } = await serviceSupabase
        .from('adverts')
        .update({ upvotes: Math.max(0, advert.upvotes - 1) })
        .eq('id', id);

      if (updateError) {
        console.error('[UPVOTE DEBUG] Error updating advert upvotes:', updateError);
        throw new Error(`Failed to update advert: ${updateError.message}`);
      }
      console.log('[UPVOTE DEBUG] Successfully decremented upvote count on advert');

      // 3. First get the current karma value
      const { data: userData, error: getUserError } = await serviceSupabase
        .from('users')
        .select('goodKarma')
        .eq('id', authorId)
        .single();

      if (getUserError) {
        console.error('[UPVOTE DEBUG] Error getting user karma:', getUserError);
      } else {
        // Then update the karma by decrementing it
        const currentKarma = userData.goodKarma || 0;
        const newKarma = Math.max(0, currentKarma - 1); // Ensure karma doesn't go below 0

        const { error: karmaError } = await serviceSupabase
          .from('users')
          .update({ goodKarma: newKarma })
          .eq('id', authorId);

        if (karmaError) {
          console.error('[UPVOTE DEBUG] Error updating user karma:', karmaError);
        } else {
          console.log(`[UPVOTE DEBUG] Decreased karma for user ${authorId} from ${currentKarma} to ${newKarma}`);
        }
      }

      console.log('[UPVOTE DEBUG] Sending response: upvoted=false');
      res.status(200).json({ upvotes: Math.max(0, advert.upvotes - 1), upvoted: false });
    } else {
      console.log(`[UPVOTE DEBUG] Adding upvote for advert ${id} by user ${userId}`);

      // 1. Add upvote record
      const { error: addError } = await serviceSupabase
        .from('advert_upvotes')
        .insert([{ advert_id: id, user_id: userId, created_at: new Date().toISOString() }]);

      if (addError) {
        console.error('[UPVOTE DEBUG] Error adding upvote:', addError);
        throw new Error(`Failed to add upvote: ${addError.message}`);
      }
      console.log('[UPVOTE DEBUG] Successfully added upvote record');

      // 2. Increment upvote count on advert
      const { error: updateError } = await serviceSupabase
        .from('adverts')
        .update({ upvotes: advert.upvotes + 1 })
        .eq('id', id);

      if (updateError) {
        console.error('[UPVOTE DEBUG] Error updating advert upvotes:', updateError);
        throw new Error(`Failed to update advert: ${updateError.message}`);
      }
      console.log('[UPVOTE DEBUG] Successfully incremented upvote count on advert');

      // 3. First get the current karma value
      const { data: userData, error: getUserError } = await serviceSupabase
        .from('users')
        .select('goodKarma')
        .eq('id', authorId)
        .single();

      if (getUserError) {
        console.error('[UPVOTE DEBUG] Error getting user karma:', getUserError);
      } else {
        // Then update the karma by incrementing it
        const currentKarma = userData.goodKarma || 0;
        const newKarma = currentKarma + 1;

        const { error: karmaError } = await serviceSupabase
          .from('users')
          .update({ goodKarma: newKarma })
          .eq('id', authorId);

        if (karmaError) {
          console.error('[UPVOTE DEBUG] Error updating user karma:', karmaError);
        } else {
          console.log(`[UPVOTE DEBUG] Increased karma for user ${authorId} from ${currentKarma} to ${newKarma}`);
        }
      }

      console.log('[UPVOTE DEBUG] Sending response: upvoted=true');
      res.status(200).json({ upvotes: advert.upvotes + 1, upvoted: true });
    }
  } catch (error) {
    console.error('[UPVOTE DEBUG] Error in upvoteAdvert controller:', error);
    const statusCode = error.message === 'Advert not found' ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// Track a view for an advert
exports.trackAdvertView = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await supabaseAdvertService.trackView(id);

    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Advert not found' ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// Get a shareable link for an advert
exports.getShareableLink = async (req, res) => {
  try {
    const { id } = req.params;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const result = await supabaseAdvertService.getShareableLink(id, baseUrl);

    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Advert not found' ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// Get advert statistics
exports.getAdvertStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.userId || req.user.id : null;

    console.log(`[SERVER] Getting stats for advert ${id}, user: ${userId || 'not logged in'}`);

    // Get the advert
    const { data: advert, error: advertError } = await supabase
      .from('adverts')
      .select('upvotes, views')
      .eq('id', id)
      .single();

    if (advertError) {
      console.error('[SERVER] Error fetching advert:', advertError);
      throw new Error(`Failed to get advert stats: ${advertError.message}`);
    }

    if (!advert) {
      throw new Error('Advert not found');
    }

    // Check if user is authenticated to determine if they upvoted
    let upvoted = false;
    if (userId) {
      console.log(`[SERVER] Checking if user ${userId} has upvoted advert ${id}`);
      // Check if there's an entry in the advert_upvotes table for this user and advert
      const { data: upvoteData, error: upvoteError } = await serviceSupabase
        .from('advert_upvotes')
        .select('*')
        .eq('advert_id', id)
        .eq('user_id', userId)
        .maybeSingle();

      if (upvoteError) {
        console.error('[SERVER] Error checking upvote status:', upvoteError);
      } else {
        upvoted = !!upvoteData;
        console.log(`[SERVER] User has upvoted: ${upvoted}`);
      }
    }

    const stats = {
      upvotes: advert.upvotes || 0,
      views: advert.views || 0,
      upvoted
    };

    console.log(`[SERVER] Returning stats:`, stats);
    res.status(200).json(stats);
  } catch (error) {
    logger.error('Error in getAdvertStats controller:', error);
    const statusCode = error.message === 'Advert not found' ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// Get a shareable link specifically for private adverts
exports.getPrivateShareableLink = async (req, res) => {
  try {
    const { id } = req.params;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const result = await supabaseAdvertService.getPrivateShareableLink(id, req.user.id, baseUrl);

    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in getPrivateShareableLink controller:', error);
    const statusCode =
      error.message === 'Advert not found' ? 404 :
      error.message === 'Not authorized to share this advert' ? 403 : 500;

    res.status(statusCode).json({ message: error.message });
  }
};