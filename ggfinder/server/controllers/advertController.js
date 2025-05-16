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

    await supabaseAdvertService.delete(id, userId);

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
  try {
    const { id } = req.params;
    const result = await supabaseAdvertService.upvoteAdvert(id, req.user.id);
    
    res.status(200).json(result);
  } catch (error) {
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
    const userId = req.user ? req.user.id : null;
    
    const stats = await supabaseAdvertService.getStats(id, userId);
    
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