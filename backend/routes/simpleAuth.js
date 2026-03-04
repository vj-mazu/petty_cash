const express = require('express');
const router = express.Router();
const { simpleLogin, getSimpleProfile, verifySimpleToken } = require('../controllers/simpleAuthController');

// Simple login route - no middleware validation required
router.post('/simple-login', simpleLogin);

// Protected route for getting profile with simple auth
router.get('/simple-profile', verifySimpleToken, getSimpleProfile);

module.exports = router;