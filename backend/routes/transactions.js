const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getTransactionAuditLogs,
  getNextTransactionNumber,
  getBalancesForDate,
  getCurrentBusinessBalances,
  triggerDailyRollover,
  suspendTransaction,
  unsuspendTransaction,
  approveTransaction
} = require('../controllers/transactionController');
const { getUltraFastTransactions } = require('../controllers/ultraFastTransactionController');
const { authenticate, authorize, authorizeAdminOnly, authorizeCreate, authorizeEdit, authorizeDelete, authorizeView, authorizeExport } = require('../middleware/auth');
// const { transactionLimiter } = require('../middleware/rateLimiting'); // Disabled for unlimited access
const { handleValidation } = require('../middleware/errorHandler');
const {
  validateCreateTransaction,
  validateUpdateTransaction,
  validateDeleteTransaction,
  validateId,
  validatePagination,
  validateDateRange
} = require('../validators');

// All routes require authentication
router.use(authenticate);

// Get transaction statistics
router.get('/stats',
  validateDateRange,
  handleValidation,
  getTransactionStats
);

// Next transaction number
router.get('/next-number', getNextTransactionNumber);

// Current business balances
router.get('/business-balances', getCurrentBusinessBalances);

// Get balances for a specific date
router.get('/balances', getBalancesForDate);

// Daily rollover (admin only)
router.post('/daily-rollover',
  authorizeAdminOnly(),
  triggerDailyRollover
);

// Get audit logs
router.get('/audit/:id',
  getTransactionAuditLogs
);

router.get('/audit',
  getTransactionAuditLogs
);

// CRUD operations
router.post('/',
  authorizeCreate(), // Staff + Admin can create transactions
  validateCreateTransaction,
  handleValidation,
  createTransaction
);

router.get('/',
  authorizeView(), // Staff + Admin can view transactions
  validatePagination,
  validateDateRange,
  handleValidation,
  getUltraFastTransactions // ULTRA-FAST: Uses optimized raw SQL queries
);

router.get('/:id',
  authorizeView(), // Staff + Admin can view individual transactions
  validateId,
  handleValidation,
  getTransactionById
);

router.put('/:id',
  authorizeEdit(), // Admin1, Admin2, Staff can edit transactions
  validateUpdateTransaction,
  handleValidation,
  updateTransaction
);

router.delete('/:id',
  authorizeDelete(), // Only Admin1 can delete transactions
  validateDeleteTransaction,
  handleValidation,
  deleteTransaction
);

// Suspend transaction
router.patch('/:id/suspend',
  authorizeEdit(), // Admin1, Admin2, Staff can suspend transactions
  validateId,
  handleValidation,
  suspendTransaction
);

// Unsuspend transaction
router.patch('/:id/unsuspend',
  authorizeEdit(), // Admin, Manager can unsuspend transactions
  validateId,
  handleValidation,
  unsuspendTransaction
);

// Approve transaction
router.post('/:id/approve',
  authorizeEdit(), // Admin, Manager can approve transactions
  validateId,
  handleValidation,
  approveTransaction
);

module.exports = router;