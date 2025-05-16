const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../config/supabase');
const authenticateToken = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all adverts
router.get('/', async (req, res) => {
  try {
    logger.info('Fetching all adverts');
    const { data, error } = await supabase
      .from('adverts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching adverts:', error);
      return res.status(500).json({ error: error.message });
    }

    logger.info(`Successfully fetched ${data.length} adverts`);
    return res.status(200).json(data);
  } catch (error) {
    logger.error('Unexpected error fetching adverts:', error);
    return res.status(500).json({ error: 'Failed to fetch adverts' });
  }
});

// Get advert by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching advert with ID: ${id}`);

    const { data, error } = await supabase
      .from('adverts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error(`Error fetching advert with ID ${id}:`, error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      logger.warn(`Advert with ID ${id} not found`);
      return res.status(404).json({ error: 'Advert not found' });
    }

    logger.info(`Successfully fetched advert with ID: ${id}`);
    return res.status(200).json(data);
  } catch (error) {
    logger.error('Unexpected error fetching advert by ID:', error);
    return res.status(500).json({ error: 'Failed to fetch advert' });
  }
});

// Create a new advert
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, price, location, category, contact_info } = req.body;
    const user_id = req.user.id;

    logger.info(`Creating new advert for user: ${user_id}`);
    
    if (!title || !description) {
      logger.warn('Missing required fields for advert creation');
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // Use supabaseAdmin to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('adverts')
      .insert([
        { 
          title, 
          description, 
          price, 
          location, 
          category, 
          contact_info,
          user_id 
        }
      ])
      .select();

    if (error) {
      logger.error('Error creating advert:', error);
      return res.status(500).json({ error: error.message });
    }

    logger.info(`Successfully created advert with ID: ${data[0].id}`);
    return res.status(201).json(data[0]);
  } catch (error) {
    logger.error('Unexpected error creating advert:', error);
    return res.status(500).json({ error: 'Failed to create advert' });
  }
});

// Update an advert
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, location, category, contact_info } = req.body;
    const user_id = req.user.id;

    logger.info(`Updating advert with ID: ${id} for user: ${user_id}`);

    // Check if the advert exists and belongs to the user
    const { data: existingAdvert, error: fetchError } = await supabase
      .from('adverts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      logger.error(`Error fetching advert with ID ${id}:`, fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingAdvert) {
      logger.warn(`Advert with ID ${id} not found`);
      return res.status(404).json({ error: 'Advert not found' });
    }

    if (existingAdvert.user_id !== user_id) {
      logger.warn(`User ${user_id} attempted to update advert ${id} belonging to user ${existingAdvert.user_id}`);
      return res.status(403).json({ error: 'You are not authorized to update this advert' });
    }

    // Use supabaseAdmin to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('adverts')
      .update({ 
        title, 
        description, 
        price, 
        location, 
        category, 
        contact_info,
        updated_at: new Date()
      })
      .eq('id', id)
      .select();

    if (error) {
      logger.error(`Error updating advert with ID ${id}:`, error);
      return res.status(500).json({ error: error.message });
    }

    logger.info(`Successfully updated advert with ID: ${id}`);
    return res.status(200).json(data[0]);
  } catch (error) {
    logger.error('Unexpected error updating advert:', error);
    return res.status(500).json({ error: 'Failed to update advert' });
  }
});

// Delete an advert
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    logger.info(`Deleting advert with ID: ${id} for user: ${user_id}`);

    // Check if the advert exists and belongs to the user
    const { data: existingAdvert, error: fetchError } = await supabase
      .from('adverts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      logger.error(`Error fetching advert with ID ${id}:`, fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    if (!existingAdvert) {
      logger.warn(`Advert with ID ${id} not found`);
      return res.status(404).json({ error: 'Advert not found' });
    }

    if (existingAdvert.user_id !== user_id) {
      logger.warn(`User ${user_id} attempted to delete advert ${id} belonging to user ${existingAdvert.user_id}`);
      return res.status(403).json({ error: 'You are not authorized to delete this advert' });
    }

    // Use supabaseAdmin to bypass RLS policies
    const { error } = await supabaseAdmin
      .from('adverts')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error(`Error deleting advert with ID ${id}:`, error);
      return res.status(500).json({ error: error.message });
    }

    logger.info(`Successfully deleted advert with ID: ${id}`);
    return res.status(200).json({ message: 'Advert deleted successfully' });
  } catch (error) {
    logger.error('Unexpected error deleting advert:', error);
    return res.status(500).json({ error: 'Failed to delete advert' });
  }
});

// Get adverts by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    logger.info(`Fetching adverts for user: ${userId}`);

    const { data, error } = await supabase
      .from('adverts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Error fetching adverts for user ${userId}:`, error);
      return res.status(500).json({ error: error.message });
    }

    logger.info(`Successfully fetched ${data.length} adverts for user: ${userId}`);
    return res.status(200).json(data);
  } catch (error) {
    logger.error('Unexpected error fetching user adverts:', error);
    return res.status(500).json({ error: 'Failed to fetch user adverts' });
  }
});

// Get current user's adverts
router.get('/my/adverts', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    logger.info(`Fetching adverts for current user: ${user_id}`);

    const { data, error } = await supabase
      .from('adverts')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error(`Error fetching adverts for current user ${user_id}:`, error);
      return res.status(500).json({ error: error.message });
    }

    logger.info(`Successfully fetched ${data.length} adverts for current user: ${user_id}`);
    return res.status(200).json(data);
  } catch (error) {
    logger.error('Unexpected error fetching current user adverts:', error);
    return res.status(500).json({ error: 'Failed to fetch your adverts' });
  }
});

module.exports = router;