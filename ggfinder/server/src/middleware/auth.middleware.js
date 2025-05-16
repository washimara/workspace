// server/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env.config');
const logger = require('../utils/logger');

/**
 * Authentication middleware to verify JWT tokens and protect routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify the token
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        logger.error(`Token verification failed: ${err.message}`);
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      
      logger.info(`User authenticated: ${user.email || user.id}`);
      req.user = user;
      next();
    });
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`, { stack: error.stack });
    return res.status(500).json({ error: 'Authentication process failed' });
  }
};

/**
 * Optional authentication middleware that doesn't block requests without tokens
 * but still attaches user data if a valid token is present
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuthentication = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.debug('No authentication token provided for optional auth route');
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        logger.debug(`Optional authentication token invalid: ${err.message}`);
        return next();
      }
      
      logger.info(`User authenticated (optional): ${user.email || user.id}`);
      req.user = user;
      next();
    });
  } catch (error) {
    logger.error(`Optional authentication error: ${error.message}`, { stack: error.stack });
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuthentication
};