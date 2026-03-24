const express = require('express');
const router = express.Router();
const optimizedTransactionController = require('../controllers/optimizedTransactionController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/transactions/optimized - Get transactions with optimized performance
router.get('/', optimizedTransactionController.getTransactions);

module.exports = router;