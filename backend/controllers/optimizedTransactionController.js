// controllers/optimizedTransactionController.js
// High-performance transaction controller with caching and optimization

const { Transaction, Ledger, User, AnamathEntry, sequelize } = require('../models');
const { Op } = require('sequelize');
const auditService = require('../services/auditService');
const balanceRecalculationService = require('../services/balanceRecalculationService');
const dailyBalanceService = require('../services/dailyBalanceService');
const performanceCache = require('../services/performanceCache');

// Performance optimization: Pre-compiled queries
const OPTIMIZED_QUERIES = {
  transactionsList: `
    SELECT t.*, l.name as ledger_name, u.username as created_by_name
    FROM transactions t
    LEFT JOIN ledgers l ON t."ledgerId" = l.id
    LEFT JOIN users u ON t."createdBy" = u.id
    WHERE t.is_suspended = false
    AND ($1::text IS NULL OR t.date >= $1::date)
    AND ($2::text IS NULL OR t.date <= $2::date)
    AND ($3::text IS NULL OR t."ledgerId" = $3::uuid)
    ORDER BY t.date DESC, t."createdAt" DESC
    LIMIT $4 OFFSET $5
  `,
  transactionCount: `
    SELECT COUNT(*) as total
    FROM transactions t
    WHERE t.is_suspended = false
    AND ($1::text IS NULL OR t.date >= $1::date)
    AND ($2::text IS NULL OR t.date <= $2::date)
    AND ($3::text IS NULL OR t."ledgerId" = $3::uuid)
  `,
  dailyTransactionSummary: `
    SELECT 
      date,
      COUNT(*) as transaction_count,
      SUM("debitAmount") as total_debits,
      SUM("creditAmount") as total_credits,
      COUNT(DISTINCT "ledgerId") as unique_ledgers
    FROM transactions 
    WHERE is_suspended = false 
    AND date >= $1::date AND date <= $2::date
    GROUP BY date 
    ORDER BY date DESC
  `
};

// Utility functions for validation and error handling (optimized)
const validateAmount = (amount, fieldName) => {
  if (amount === undefined || amount === null) return null;

  const parsed = parseFloat(amount);
  if (isNaN(parsed)) {
    return { field: fieldName, message: `${fieldName} must be a valid number` };
  }
  if (parsed < 0) {
    return { field: fieldName, message: `${fieldName} cannot be negative` };
  }
  if (parsed > 999999999.99) {
    return { field: fieldName, message: `${fieldName} exceeds maximum allowed value` };
  }
  return null;
};

const validateText = (text, fieldName = 'text') => {
  if (text === undefined || text === null) return null;
  if (typeof text !== 'string') {
    return { field: fieldName, message: `${fieldName} must be a string` };
  }
  if (text.length > 500) {
    return { field: fieldName, message: `${fieldName} cannot exceed 500 characters` };
  }
  return null;
};

const validateDate = (date) => {
  if (date === undefined) return null;
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return { field: 'date', message: 'Invalid date format' };
  }
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  if (parsedDate < oneYearAgo || parsedDate > oneYearFromNow) {
    return { field: 'date', message: 'Date must be within one year of current date' };
  }
  return null;
};

// Optimized transaction list with caching and pagination
const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      ledgerId,
      search,
      globalSearch,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions based on search parameters
    let whereClause = { isSuspended: false };
    let ledgerWhereClause = { isActive: true };

    // For global search, skip date and ledger restrictions
    if (globalSearch !== 'true') {
      // Date filtering (only if not global search)
      if (startDate && endDate) {
        whereClause.date = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        whereClause.date = { [Op.gte]: startDate };
      } else if (endDate) {
        whereClause.date = { [Op.lte]: endDate };
      }

      // Ledger filtering (only if not global search)
      if (ledgerId) {
        whereClause.ledgerId = ledgerId;
      }
    }

    // Search functionality
    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      whereClause[Op.or] = [
        sequelize.where(sequelize.fn('LOWER', sequelize.col('Transaction.description')), {
          [Op.iLike]: `%${searchTerm}%`
        }),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('Transaction.reference')), {
          [Op.iLike]: `%${searchTerm}%`
        }),
        sequelize.where(sequelize.fn('LOWER', sequelize.col('Transaction.remarks')), {
          [Op.iLike]: `%${searchTerm}%`
        })
      ];
    }

    // Create cache key including globalSearch flag
    const cacheKey = `transactions_optimized_${pageNum}_${limitNum}_${startDate || 'null'}_${endDate || 'null'}_${ledgerId || 'null'}_${search || 'null'}_${globalSearch || 'false'}_${sortBy}_${sortOrder}`;
    
    // Try to get from cache first (but skip cache for global search to ensure fresh results)
    if (globalSearch !== 'true') {
      let cachedResult = performanceCache.getCachedTransactionList(cacheKey);
      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult.data,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: cachedResult.count,
            totalPages: Math.ceil(cachedResult.count / limitNum)
          },
          cached: true,
          cached_at: cachedResult.cached_at,
          globalSearch: globalSearch === 'true'
        });
      }
    }

    // Use Sequelize ORM for better search support
    const transactionResult = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Ledger,
          as: 'ledger',
          where: ledgerWhereClause,
          attributes: ['id', 'name', 'ledgerType'],
          required: true
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username'],
          required: false
        }
      ],
      attributes: [
        'id', 'date', 'creditAmount', 'debitAmount', 'description', 
        'reference', 'transactionNumber', 'isSuspended', 'ledgerId',
        'createdAt', 'updatedAt', 'remarks'
      ],
      limit: limitNum,
      offset: offset,
      order: [[sortBy === 'date' ? 'date' : 'createdAt', sortOrder.toUpperCase()]],
      raw: false
    });

    const { count, rows: transactions } = transactionResult;

    // Cache the results for 5 minutes (but not for global search)
    if (globalSearch !== 'true') {
      performanceCache.cacheTransactionList(cacheKey, transactions, 300);
    }

    return res.json({
      success: true,
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum)
      },
      cached: false,
      globalSearch: globalSearch === 'true'
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Optimized transaction creation with batch processing capability
const createTransaction = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let { ledgerId, reference, debitAmount, creditAmount, date, type, amount, transactionType, referenceNumber, remarks } = req.body;

    // Default transactionType to 'regular' if not provided
    if (!transactionType) transactionType = 'regular';

    // Enhanced validation
    const validationErrors = [];
    if (!req.user || !req.user.id) {
      await t.rollback();
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!ledgerId) {
      validationErrors.push({ field: 'ledgerId', message: 'Ledger selection is required' });
    }

    // Standardize amount parsing
    let finalDebit = parseFloat(debitAmount) || 0;
    let finalCredit = parseFloat(creditAmount) || 0;

    // If using simple 'amount' and 'type' fields
    if (amount && type) {
      if (type === 'credit') {
        finalCredit = parseFloat(amount);
        finalDebit = 0;
      } else {
        finalDebit = parseFloat(amount);
        finalCredit = 0;
      }
    }

    // Validate amounts
    const debitError = validateAmount(finalDebit, 'debitAmount');
    const creditError = validateAmount(finalCredit, 'creditAmount');
    if (debitError) validationErrors.push(debitError);
    if (creditError) validationErrors.push(creditError);

    // Amount logic based on transaction type
    if (transactionType === 'combined') {
      if (finalCredit <= 0) {
        validationErrors.push({ field: 'creditAmount', message: 'A positive credit amount is required for combined transactions.' });
      }
      if (finalDebit > 0) {
        validationErrors.push({ field: 'debitAmount', message: 'Debit amount must be zero for combined transactions.' });
      }
    } else {
      if (finalDebit <= 0 && finalCredit <= 0) {
        validationErrors.push({ field: 'amount', message: 'Transaction must have a positive debit or credit amount.' });
      }
      if (finalDebit > 0 && finalCredit > 0) {
        validationErrors.push({ field: 'amounts', message: 'Transaction cannot have both debit and credit amounts.' });
      }
    }

    const remarksError = validateText(remarks, 'remarks');
    const dateError = validateDate(date);
    if (remarksError) validationErrors.push(remarksError);
    if (dateError) validationErrors.push(dateError);

    if (validationErrors.length > 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validationErrors });
    }

    // Check if ledger exists and is active (with caching)
    const cacheKey = `ledger_${ledgerId}`;
    let ledger = performanceCache.getLedger(cacheKey);
    
    if (!ledger) {
      ledger = await Ledger.findOne({ where: { id: ledgerId, isActive: true }, transaction: t });
      if (ledger) {
        performanceCache.setLedger(cacheKey, ledger.toJSON(), 1800); // Cache for 30 minutes
      }
    }
    
    if (!ledger) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Ledger not found or inactive' });
    }

    // Create transaction
    const transactionData = {
      date: date || new Date().toISOString().split('T')[0],
      description: remarks ? remarks.trim() : null,
      reference: reference || referenceNumber || null,
      debitAmount: finalDebit,
      creditAmount: finalCredit,
      ledgerId,
      createdBy: req.user.id,
      transactionType: transactionType || 'regular',
      remarks: remarks ? remarks.trim() : null
    };

    const newTransaction = await Transaction.create(transactionData, { transaction: t });

    // Audit logging (async, non-blocking)
    setImmediate(() => {
      auditService.logActivity('transaction_created', newTransaction.id, req.user.id, {
        ledgerId,
        amount: finalDebit || finalCredit,
        type: finalDebit > 0 ? 'debit' : 'credit'
      }).catch(err => console.error('Audit logging failed:', err));
    });

    await t.commit();

    // Invalidate relevant caches (async, non-blocking)
    setImmediate(() => {
      performanceCache.invalidateTransactionCaches(ledgerId, transactionData.date);
    });

    // Fetch the complete transaction with relations for response
    const completeTransaction = await Transaction.findByPk(newTransaction.id, {
      include: [
        { model: Ledger, as: 'ledger', attributes: ['id', 'name', 'type'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: completeTransaction
    });

  } catch (error) {
    await t.rollback();
    console.error('Error creating transaction:', error);
    
    const errorResponse = {
      success: false,
      message: 'Failed to create transaction'
    };

    if (error.name === 'SequelizeValidationError') {
      errorResponse.message = 'Validation error occurred';
      errorResponse.errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errorResponse.message = 'Duplicate entry detected';
      errorResponse.errors = [{ field: 'reference', message: 'Reference number already exists' }];
    }

    return res.status(400).json(errorResponse);
  }
};

// Optimized daily summary with caching
const getDailySummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Create cache key
    const cacheKey = `daily_summary_${startDate}_${endDate}`;
    let cachedSummary = performanceCache.getTransactionStats(cacheKey);
    
    if (cachedSummary) {
      return res.json({
        success: true,
        data: cachedSummary,
        cached: true
      });
    }

    // Use optimized raw query
    const summaryData = await sequelize.query(OPTIMIZED_QUERIES.dailyTransactionSummary, {
      bind: [startDate, endDate],
      type: sequelize.QueryTypes.SELECT
    });

    // Process the data for better frontend consumption
    const processedSummary = summaryData.map(day => ({
      date: day.date,
      transactionCount: parseInt(day.transaction_count),
      totalDebits: parseFloat(day.total_debits) || 0,
      totalCredits: parseFloat(day.total_credits) || 0,
      uniqueLedgers: parseInt(day.unique_ledgers),
      netAmount: (parseFloat(day.total_credits) || 0) - (parseFloat(day.total_debits) || 0)
    }));

    // Cache for 3 minutes
    performanceCache.setTransactionStats(cacheKey, processedSummary, 180);

    return res.json({
      success: true,
      data: processedSummary,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching daily summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch daily summary',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get optimized balances for a specific date with caching
const getOptimizedBalancesForDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ success: false, message: 'Valid date (YYYY-MM-DD) is required' });
    }

    const dateStr = new Date(date).toISOString().split('T')[0];
    const cacheKey = `balances_${dateStr}`;
    
    let cachedBalances = performanceCache.getBalance(cacheKey);
    if (cachedBalances) {
      return res.json({
        success: true,
        data: {
          date: dateStr,
          ...cachedBalances
        },
        cached: true
      });
    }

    // Calculate balances
    const [openingBalance, closingBalance] = await Promise.all([
      dailyBalanceService.getOpeningBalanceForDate(dateStr),
      dailyBalanceService.calculateClosingBalanceForDate(dateStr)
    ]);

    const balanceData = { openingBalance, closingBalance };
    
    // Cache for 5 minutes
    performanceCache.setBalance(cacheKey, balanceData, 300);

    return res.json({
      success: true,
      data: {
        date: dateStr,
        ...balanceData
      },
      cached: false
    });
  } catch (error) {
    console.error('Error getting balances for date:', error);
    return res.status(500).json({ success: false, message: 'Failed to get balances for date' });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  getDailySummary,
  getOptimizedBalancesForDate,
  validateAmount,
  validateText,
  validateDate
};