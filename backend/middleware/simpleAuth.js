// Simple authentication middleware - no database required
const simpleAuthenticate = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // For simple auth, just check if token exists and starts with our prefix
    if (token && token.startsWith('simple-admin-token-')) {
      req.user = {
        id: 'admin-001',
        username: 'admin',
        email: 'admin@system.com',
        role: 'admin1'
      };
      return next();
    }
    
    return res.status(401).json({
      success: false,
      message: 'Access denied. No valid token provided.'
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = { simpleAuthenticate };