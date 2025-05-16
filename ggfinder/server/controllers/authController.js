const User = require('../models/User');
const jwt = require('jsonwebtoken');
const SupabaseUserService = require('../services/supabaseUserService');
const supabase = require('../config/supabase');

// Token generation functions
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Create new user using Supabase
    const user = await SupabaseUserService.create({
      name,
      email,
      password
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);

    // Send response
    res.status(201).json({
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        goodKarma: user.goodKarma || 0
      }
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate user
    const user = await SupabaseUserService.authenticateWithPassword(email, password);

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Send response
    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        goodKarma: user.goodKarma || 0
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);

    // Handle email confirmation errors specifically
    if (error.message.includes("Email not confirmed")) {
      return res.status(401).json({
        message: 'Email not confirmed. Please check your email for a confirmation link or try again later.',
        errorCode: 'EMAIL_NOT_CONFIRMED'
      });
    }

    res.status(500).json({ message: error.message });
  }
};

// Logout user (client will clear tokens but we also sign out from Supabase)
exports.logout = async (req, res) => {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase signout error:', error);
      // Continue despite error since frontend will clear tokens anyway
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    // Still return success as frontend will clear tokens
    res.status(200).json({ message: 'Logged out successfully' });
  }
};

// Refresh access token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Generate new tokens
    const accessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by the auth middleware
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get user from Supabase to ensure we have the latest data including goodKarma
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data including goodKarma
    res.json({
      user: {
        _id: userData.id,
        email: userData.email,
        name: userData.name,
        has_premium_access: userData.has_premium_access || false,
        goodKarma: userData.goodKarma || 0 // Ensure goodKarma is included
      }
    });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({ message: error.message });
  }
};