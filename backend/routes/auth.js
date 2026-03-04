const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserRole
} = require('../controllers/authController');
const { authenticate, authorize, authorizeAdminOnly } = require('../middleware/auth');
// const { authLimiter } = require('../middleware/rateLimiting'); // Disabled for unlimited access
const { handleValidation } = require('../middleware/errorHandler');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateId,
  validatePagination
} = require('../validators');

// Public routes
router.post('/register', /* authLimiter, */ validateRegister, handleValidation, register);
router.post('/login', /* authLimiter, */ validateLogin, handleValidation, login);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', getProfile);
router.put('/profile', validateUpdateProfile, handleValidation, updateProfile);
router.put('/change-password', validateChangePassword, handleValidation, changePassword);

// Admin only routes - user management
router.get('/users', 
  authorizeAdminOnly(), // Only admins can view all users
  validatePagination, 
  handleValidation, 
  getAllUsers
);

router.put('/users/:id/role', 
  authorize('admin1'), // Only admin1 can change user roles
  validateId, 
  handleValidation, 
  updateUserRole
);

module.exports = router;