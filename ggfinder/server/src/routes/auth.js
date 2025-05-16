const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const config = require('../config/config');
const logger = require('../utils/logger');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      logger.error('Missing email or password for registration');
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    logger.info(`Attempting to register user with email: ${email}`);
    
    // Check if user already exists
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (fetchError) {
      logger.error(`Error checking existing user: ${fetchError.message}`, fetchError);
      return res.status(500).json({ error: 'Server error while checking existing user' });
    }
    
    if (existingUsers && existingUsers.length > 0) {
      logger.info(`Registration failed: User with email ${email} already exists`);
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user in supabase
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          password_hash: hashedPassword,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select();
    
    if (createError) {
      logger.error(`Error creating user: ${createError.message}`, createError);
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
    logger.info(`User registered successfully: ${email}`);
    
    // Auto-confirm email for development environment
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Auto-confirming email for development: ${email}`);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser[0].id,
        email: newUser[0].email
      }, 
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser[0].id,
        email: newUser[0].email
      }
    });
    
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      logger.error('Missing email or password for login');
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    logger.info(`Attempting login for user: ${email}`);
    
    // Get user from supabase
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    if (fetchError) {
      logger.error(`Error fetching user for login: ${fetchError.message}`, fetchError);
      return res.status(500).json({ error: 'Server error while fetching user' });
    }
    
    if (!users || users.length === 0) {
      logger.info(`Login failed: No user found with email ${email}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      logger.info(`Login failed: Invalid password for user ${email}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email 
      }, 
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    
    logger.info(`User logged in successfully: ${email}`);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    // Extract token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      logger.error('No token provided for /me endpoint');
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    logger.info(`Fetching profile for user ID: ${decoded.id}`);
    
    // Get user from supabase
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, created_at, updated_at')
      .eq('id', decoded.id)
      .single();
    
    if (fetchError) {
      logger.error(`Error fetching user profile: ${fetchError.message}`, fetchError);
      return res.status(500).json({ error: 'Server error while fetching profile' });
    }
    
    if (!user) {
      logger.info(`No user found with ID ${decoded.id}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    logger.info(`User profile fetched successfully for ID: ${decoded.id}`);
    res.json(user);
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.error('Invalid token:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      logger.error('Token expired:', error);
      return res.status(401).json({ error: 'Token expired' });
    }
    
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
});

module.exports = router;