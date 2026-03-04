const express = require('express');
const { Transaction, Ledger } = require('../models');

// Simple test route that works with existing schema
const router = express.Router();

// Test high-performance transactions endpoint
router.get('/hp/transactions-test', async (req, res) => {
  try {
    const startTime = Date.now();
    
    const {
      page = 1,
      limit = 10000 // No limit - unlimited records
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // High-performance query using existing endpoints structure
    const { count, rows } = await Transaction.findAndCountAll({
      include: [{
        model: Ledger,
        as: 'ledger',
        attributes: ['name'],
        required: false
      }],
      attributes: [
        'id',
        'date', 
        'description',
        'debitAmount',
        'creditAmount',
        'ledgerId',
        'transaction_number',
        'remarks',
        'createdAt',
        'updatedAt'
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      distinct: true,
      subQuery: false
    });

    const responseTime = Date.now() - startTime;
    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: count,
        limit: parseInt(limit)
      },
      performance: {
        responseTime,
        recordCount: rows.length,
        queryOptimized: true
      }
    });

  } catch (error) {
    console.error('High-performance transaction test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Test summary endpoint
router.get('/hp/summary-test', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Get transaction summary
    const transactions = await Transaction.findAll({
      attributes: [
        [Transaction.sequelize.fn('COUNT', Transaction.sequelize.col('id')), 'total_transactions'],
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('creditAmount')), 'total_credits'],
        [Transaction.sequelize.fn('SUM', Transaction.sequelize.col('debitAmount')), 'total_debits']
      ],
      raw: true
    });

    const summary = transactions[0];
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        total_transactions: parseInt(summary.total_transactions) || 0,
        total_credits: parseFloat(summary.total_credits) || 0,
        total_debits: parseFloat(summary.total_debits) || 0,
        net_amount: (parseFloat(summary.total_credits) || 0) - (parseFloat(summary.total_debits) || 0)
      },
      performance: {
        responseTime,
        queryOptimized: true
      }
    });

  } catch (error) {
    console.error('Summary test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get summary',
      error: error.message
    });
  }
});

module.exports = router;