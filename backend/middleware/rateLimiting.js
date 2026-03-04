const rateLimit = require('express-rate-limit');

// General API rate limiting - DISABLED for unlimited access
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 999999, // Effectively unlimited requests
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => true // Skip all rate limiting
});

// Authentication rate limiting - VERY HIGH LIMIT
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Very high limit for auth requests
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

// Transaction rate limiting - UNLIMITED
const transactionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 999999, // Effectively unlimited transactions
  message: {
    success: false,
    message: 'Too many transaction requests, please slow down.'
  },
  skip: () => true // Skip all rate limiting for transactions
});

module.exports = {
  apiLimiter,
  authLimiter,
  transactionLimiter
};