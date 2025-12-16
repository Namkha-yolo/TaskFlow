const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, school, major, year, avatar_url')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Optional auth - doesn't fail if no token, just doesn't set req.user
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, school, major, year, avatar_url')
        .eq('id', decoded.id)
        .single();

      if (!error && user) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

module.exports = { auth, optionalAuth };
