const express = require('express');
const router = express.Router();
const HighPerformanceTransactionController = require('../controllers/highPerformanceTransactionController');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for high-volume endpoints
const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for high-volume testing
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

const bulkOperationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limited bulk operations per hour
  message: {
    success: false,
    message: 'Too many bulk operations, please try again later.'
  }
});

// Cache middleware for read operations
const cacheMiddleware = (duration = 300) => {
  const cache = new Map();
  
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < duration * 1000) {
      return res.json({
        ...cached.data,
        performance: {
          ...cached.data.performance,
          cached: true,
          cache_age: Math.floor((Date.now() - cached.timestamp) / 1000)
        }
      });
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      if (data.success) {
        cache.set(key, {
          data,
          timestamp: Date.now()
        });
        
        // Clean up old cache entries
        if (cache.size > 100) {
          const oldestKey = cache.keys().next().value;
          cache.delete(oldestKey);
        }
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// High-performance transaction routes
router.get('/hp/transactions', 
  standardRateLimit,
  auth,
  HighPerformanceTransactionController.getTransactions
);

router.get('/hp/transactions/summary',
  standardRateLimit,
  auth,
  HighPerformanceTransactionController.getTransactionSummary
);

router.get('/hp/transactions/daily-aggregates',
  standardRateLimit,
  auth,
  HighPerformanceTransactionController.getDailyAggregates
);

router.post('/hp/transactions/bulk',
  bulkOperationLimit,
  auth,
  HighPerformanceTransactionController.bulkCreateTransactions
);

// Performance monitoring endpoint
router.get('/hp/performance/stats', auth, async (req, res) => {
  try {
    const pool = require('../config/database');
    
    // Get database performance stats
    const [transactionCount, anamathCount, indexStats] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM transactions'),
      pool.query('SELECT COUNT(*) as count FROM anamath_entries'),
      pool.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
        LIMIT 10
      `)
    ]);
    
    // Get table sizes
    const tableSizes = await pool.query(`
      SELECT 
        table_name,
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
        pg_total_relation_size(quote_ident(table_name)) as size_bytes
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC
    `);
    
    res.json({
      success: true,
      data: {
        record_counts: {
          transactions: parseInt(transactionCount.rows[0].count),
          anamath_entries: parseInt(anamathCount.rows[0].count)
        },
        table_sizes: tableSizes.rows,
        top_indexes: indexStats.rows,
        cache_status: {
          enabled: true,
          entries: cache?.size || 0
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching performance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance stats',
      error: error.message
    });
  }
});

module.exports = router;