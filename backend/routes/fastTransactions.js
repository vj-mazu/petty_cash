const express = require('express');
const { Transaction, Ledger, AnamathEntry } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// Ultra-fast transaction endpoint - only loads 50 records at a time
router.get('/transactions/fast', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const {
      page = 1,
      limit = 50, // Default small limit for speed
      search = '',
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 100); // Cap at 100 for performance
    
    // Build optimized where conditions
    let whereConditions = {};
    
    if (startDate && endDate) {
      whereConditions.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    if (search) {
      whereConditions[Op.or] = [
        { description: { [Op.iLike]: `%${search}%` } },
        { remarks: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Ultra-optimized query with minimal data
    const { count, rows } = await Transaction.findAndCountAll({
      where: whereConditions,
      include: [{
        model: Ledger,
        as: 'ledger',
        attributes: ['name'], // Only get ledger name
        required: false
      }],
      attributes: [
        'id',
        'date', 
        'description',
        'debitAmount',
        'creditAmount',
        'transaction_number',
        'remarks'
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: maxLimit,
      offset: offset,
      distinct: true,
      subQuery: false,
      raw: false
    });

    const responseTime = Date.now() - startTime;
    const totalPages = Math.ceil(count / maxLimit);

    res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: count,
        limit: maxLimit,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      performance: {
        responseTime,
        recordCount: rows.length,
        optimized: true
      }
    });

  } catch (error) {
    console.error('Fast transaction fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Ultra-fast summary endpoint with caching
router.get('/transactions/summary', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Use raw SQL for maximum performance
    const [transactions] = await Transaction.sequelize.query(`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM("creditAmount"), 0) as total_credits,
        COALESCE(SUM("debitAmount"), 0) as total_debits,
        COALESCE(SUM("creditAmount"), 0) - COALESCE(SUM("debitAmount"), 0) as net_amount
      FROM transactions
    `);

    const [anamath] = await AnamathEntry.sequelize.query(`
      SELECT COUNT(*) as total_anamath
      FROM anamath_entries
    `);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        total_transactions: parseInt(transactions[0].total_transactions),
        total_credits: parseFloat(transactions[0].total_credits),
        total_debits: parseFloat(transactions[0].total_debits),
        net_amount: parseFloat(transactions[0].net_amount),
        total_anamath: parseInt(anamath[0].total_anamath)
      },
      performance: {
        responseTime,
        cached: false
      }
    });

  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get summary',
      error: error.message
    });
  }
});

// Get ledgers for filtering (cached)
router.get('/ledgers/list', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const ledgers = await Ledger.findAll({
      attributes: ['id', 'name'],
      where: { isActive: true },
      order: [['name', 'ASC']],
      limit: 100 // Reasonable limit
    });

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: ledgers,
      performance: {
        responseTime
      }
    });

  } catch (error) {
    console.error('Ledgers list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ledgers',
      error: error.message
    });
  }
});

module.exports = router;