// Simple Admin-Only Authentication Controller
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { Op } = require('sequelize');

// Hardcoded admin credentials (you can change these)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123', // This will be hashed
  email: 'admin@cashmanagement.com'
};

// Generate JWT token
const generateToken = (userData) => {
  return jwt.sign(userData, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Simple login - checks database user credentials
const simpleLogin = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    // Accept either username or email field
    const loginIdentifier = username || email;

    console.log('Simple login attempt:', { loginIdentifier });

    // First try to find user in database
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: loginIdentifier },
          { username: loginIdentifier }
        ]
      },
      attributes: ['id', 'username', 'email', 'password', 'role', 'isActive', 'lastLogin']
    });

    if (user && user.isActive) {
      // Check password using the model's comparePassword method
      const isMatch = await user.comparePassword(password);
      if (isMatch) {
        // Update last login
        await user.update({ lastLogin: new Date() });

        // Create user data for token
        const userData = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        };

        const token = generateToken(userData);

        console.log('Simple login successful for:', loginIdentifier);

        return res.json({
          success: true,
          message: 'Login successful',
          data: {
            user: userData,
            token
          }
        });
      }
    }

    // Fallback to hardcoded credentials if database user not found
    if (loginIdentifier === ADMIN_CREDENTIALS.username || loginIdentifier === ADMIN_CREDENTIALS.email) {
      if (password === ADMIN_CREDENTIALS.password) {
        // Create user data for token
        const userData = {
          id: 'admin-001',
          username: ADMIN_CREDENTIALS.username,
          email: ADMIN_CREDENTIALS.email,
          role: 'admin1',
          isActive: true
        };

        const token = generateToken(userData);

        console.log('Simple login successful for hardcoded admin:', loginIdentifier);

        return res.json({
          success: true,
          message: 'Login successful',
          data: {
            user: userData,
            token
          }
        });
      }
    }

    // If we get here, credentials are invalid
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });

  } catch (error) {
    console.error('Simple login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Get current user profile (simple version)
const getSimpleProfile = async (req, res) => {
  try {
    // Return the admin user data
    const userData = {
      id: 'admin-001',
      username: ADMIN_CREDENTIALS.username,
      email: ADMIN_CREDENTIALS.email,
      role: 'admin1',
      isActive: true,
      lastLogin: new Date()
    };

    res.json({
      success: true,
      data: { user: userData }
    });
  } catch (error) {
    console.error('Simple profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Verify token middleware for simple auth
const verifySimpleToken = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user data in request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = {
  simpleLogin,
  getSimpleProfile,
  verifySimpleToken,
  ADMIN_CREDENTIALS
};