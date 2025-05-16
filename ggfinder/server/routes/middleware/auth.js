const jwt = require('jsonwebtoken');
const SupabaseUserService = require('../../services/supabaseUserService');

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    console.log('User in token:', decoded);

    req.user = { userId: decoded.userId };
    next();
  });
};

// Optional: Add Supabase session check middleware for additional security
exports.checkSupabaseSession = async (req, res, next) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('No active Supabase session detected');
      // We'll continue anyway as our JWT auth is primary
    }
    
    next();
  } catch (error) {
    console.error('Supabase session check error:', error);
    // Continue anyway as our JWT auth is primary
    next();
  }
};

// Add this middleware for optional authentication
exports.optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    // No token, but that's ok - continue as unauthenticated
    return next();
  }
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      // Invalid token, but that's ok for this route - continue as unauthenticated
      return next();
    }
    
    // Token is valid, attach user to request
    req.user = user;
    next();
  });
};