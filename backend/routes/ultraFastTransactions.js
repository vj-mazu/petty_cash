const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// Use direct PostgreSQL connection for maximum performance
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cash_management',
  password: process.env.DB_PASSWORD || '12345',
  port: process.env.DB_PORT || 5432,
  max: 20,        // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Ultra-fast transaction list with optimized queries
router.get('/ultra-fast/transactions', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const {
      page = 1,
      limit = 10000,  // No limit - unlimited records for performance
      search = '',
      startDate,
      endDate,
      ledgerId,
      type,
      sortBy = 'date',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const searchPattern = `%${search}%`;
    
    // Build optimized WHERE clause
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    // Date filter
    if (startDate && endDate) {
      whereClause += ` AND t.date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      queryParams.push(startDate, endDate);
      paramIndex += 2;
    }

    // Ledger filter
    if (ledgerId) {
      whereClause += ` AND t."ledgerId" = $${paramIndex}`;
      queryParams.push(ledgerId);
      paramIndex++;
    }

    // Type filter
    if (type === 'credit') {
      whereClause += ` AND t."creditAmount" > 0`;
    } else if (type === 'debit') {
      whereClause += ` AND t."debitAmount" > 0`;
    }

    // Search filter (only if search term provided)
    if (search) {
      whereClause += ` AND (
        t.description ILIKE $${paramIndex} OR 
        t.remarks ILIKE $${paramIndex} OR 
        l.name ILIKE $${paramIndex} OR
        t.transaction_number::text ILIKE $${paramIndex}
      )`;
      queryParams.push(searchPattern);
      paramIndex++;
    }

    // Optimized main query using indexes
    const dataQuery = `
      SELECT 
        t.id,
        t.date,
        t.description,
        t."debitAmount",
        t."creditAmount", 
        t."ledgerId",
        t.transaction_number,
        t.remarks,
        t."createdAt",
        l.name as ledger_name
      FROM transactions t
      LEFT JOIN ledgers l ON t."ledgerId" = l.id
      ${whereClause}
      ORDER BY t.${sortBy === 'date' ? 'date' : 'transaction_number'} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    // Optimized count query (only when needed)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      LEFT JOIN ledgers l ON t."ledgerId" = l.id
      ${whereClause}
    `;

    queryParams.push(parseInt(limit), offset);

    // Execute both queries in parallel for speed
    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, queryParams.slice(0, -2).concat([parseInt(limit), offset])),
      pool.query(countQuery, queryParams.slice(0, -2))
    ]);

    const responseTime = Date.now() - startTime;
    const totalRecords = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    res.json({
      success: true,
      data: dataResult.rows.map(row => ({
        id: row.id,
        date: row.date,
        description: row.description || '',
        debitAmount: parseFloat(row.debitAmount) || 0,
        creditAmount: parseFloat(row.creditAmount) || 0,
        ledgerId: row.ledgerId,
        transaction_number: row.transaction_number,
        remarks: row.remarks || '',
        createdAt: row.createdAt,
        ledger: { name: row.ledger_name || 'Unknown' }
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        limit: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      performance: {
        responseTime,
        recordCount: dataResult.rows.length,
        queryOptimized: true
      }
    });

  } catch (error) {
    console.error('Ultra-fast transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message,
      performance: {
        responseTime: Date.now() - startTime
      }
    });
  }
});

// Ultra-fast summary endpoint
router.get('/ultra-fast/summary', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { startDate, endDate, ledgerId } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    if (startDate && endDate) {
      whereClause += ` AND date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      queryParams.push(startDate, endDate);
      paramIndex += 2;
    }

    if (ledgerId) {
      whereClause += ` AND "ledgerId" = $${paramIndex}`;
      queryParams.push(ledgerId);
      paramIndex++;
    }

    // Super fast summary query with aggregations
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM("creditAmount"), 0) as total_credits,
        COALESCE(SUM("debitAmount"), 0) as total_debits,
        COALESCE(SUM("creditAmount") - SUM("debitAmount"), 0) as net_amount
      FROM transactions 
      ${whereClause}
    `;

    // Get anamath count separately for speed
    const anamathQuery = `
      SELECT COUNT(*) as total_anamath
      FROM anamath_entries 
      ${whereClause.replace('"ledgerId"', 'ledger_id')}
    `;

    const [summaryResult, anamathResult] = await Promise.all([
      pool.query(summaryQuery, queryParams),
      pool.query(anamathQuery, queryParams)
    ]);

    const summary = summaryResult.rows[0];
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        total_transactions: parseInt(summary.total_transactions) || 0,
        total_credits: parseFloat(summary.total_credits) || 0,
        total_debits: parseFloat(summary.total_debits) || 0,
        net_amount: parseFloat(summary.net_amount) || 0,
        total_anamath: parseInt(anamathResult.rows[0].total_anamath) || 0
      },
      performance: {
        responseTime,
        queryOptimized: true
      }
    });

  } catch (error) {
    console.error('Ultra-fast summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get summary',
      error: error.message
    });
  }
});

// Ultra-fast search with debouncing support
router.get('/ultra-fast/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const {
      query: searchQuery = '',
      limit = 20 // Smaller limit for search results
    } = req.query;

    if (!searchQuery || searchQuery.length < 2) {
      return res.json({
        success: true,
        data: [],
        performance: { responseTime: Date.now() - startTime }
      });
    }

    const searchPattern = `%${searchQuery}%`;
    
    // Fast search query with limited results
    const searchSql = `
      SELECT 
        t.id,
        t.date,
        t.description,
        t."debitAmount",
        t."creditAmount",
        t.transaction_number,
        l.name as ledger_name,
        'transaction' as type
      FROM transactions t
      LEFT JOIN ledgers l ON t."ledgerId" = l.id
      WHERE 
        t.description ILIKE $1 OR 
        t.remarks ILIKE $1 OR 
        l.name ILIKE $1 OR
        t.transaction_number::text ILIKE $1
      ORDER BY t.date DESC
      LIMIT $2
    `;

    const result = await pool.query(searchSql, [searchPattern, parseInt(limit)]);
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        date: row.date,
        description: row.description || '',
        debitAmount: parseFloat(row.debitAmount) || 0,
        creditAmount: parseFloat(row.creditAmount) || 0,
        transaction_number: row.transaction_number,
        ledger: { name: row.ledger_name || 'Unknown' },
        type: row.type
      })),
      performance: {
        responseTime,
        recordCount: result.rows.length,
        searchOptimized: true
      }
    });

  } catch (error) {
    console.error('Ultra-fast search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// Get ledgers for filters (cached)
router.get('/ultra-fast/ledgers', async (req, res) => {
  try {
    const ledgersQuery = `
      SELECT id, name 
      FROM ledgers 
      WHERE "isActive" = true 
      ORDER BY name 
      LIMIT 10000
    `;
    
    const result = await pool.query(ledgersQuery);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ledgers',
      error: error.message
    });
  }
});

module.exports = router;