const pool = require('../config/database');
const { format, parseISO, startOfDay, endOfDay } = require('date-fns');

class HighPerformanceTransactionController {
  // Get transactions with advanced pagination and filtering
  static async getTransactions(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        ledger_id,
        type,
        start_date,
        end_date,
        search,
        tx_number,
        no_count = 'false',
        sort_by = 'transaction_date',
        sort_order = 'DESC',
        include_balance = 'false'
      } = req.query;

      // Validate and sanitize inputs
      const validSortFields = ['transaction_date', 'amount', 'id', 'transaction_number'];
      const validSortOrders = ['ASC', 'DESC'];
      
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'transaction_date';
      const sortDirection = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
      
      // Calculate offset for pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const pageLimit = Math.min(parseInt(limit), 1000); // Max 1000 records per page
      
      // Build dynamic query with performance optimizations
      let baseQuery = `
        SELECT 
          t.id,
          t.ledger_id,
          t.amount,
          t.type,
          t.remarks,
          t.transaction_number,
          t.transaction_date,
          t.created_at,
          l.name as ledger_name
        FROM transactions t
        INNER JOIN ledgers l ON t.ledger_id = l.id
      `;
      
      let countQuery = `
        SELECT COUNT(*) as total
        FROM transactions t
        INNER JOIN ledgers l ON t.ledger_id = l.id
      `;
      
      const conditions = [];
      const params = [];
      let paramIndex = 1;
      
      // Add filters
      if (ledger_id) {
        conditions.push(`t.ledger_id = $${paramIndex}`);
        params.push(parseInt(ledger_id));
        paramIndex++;
      }
      
      if (type) {
        conditions.push(`t.type = $${paramIndex}`);
        params.push(type);
        paramIndex++;
      }
      
      if (start_date) {
        conditions.push(`t.transaction_date >= $${paramIndex}`);
        params.push(startOfDay(parseISO(start_date)));
        paramIndex++;
      }
      
      if (end_date) {
        conditions.push(`t.transaction_date <= $${paramIndex}`);
        params.push(endOfDay(parseISO(end_date)));
        paramIndex++;
      }
      
      // If tx_number is provided and numeric, prefer exact match (fast)
      if (tx_number) {
        const asNum = Number(tx_number);
        if (!isNaN(asNum)) {
          conditions.push(`t.transaction_number = $${paramIndex}`);
          params.push(asNum);
          paramIndex++;
        } else {
          // fallback to ILIKE search when tx_number is non-numeric
          conditions.push(`t.transaction_number::text ILIKE $${paramIndex}`);
          params.push(`%${tx_number}%`);
          paramIndex++;
        }
      }

      if (search) {
        conditions.push(`(
          t.remarks ILIKE $${paramIndex} OR 
          l.name ILIKE $${paramIndex}
        )`);
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      // Add WHERE clause if conditions exist
      if (conditions.length > 0) {
        const whereClause = ` WHERE ${conditions.join(' AND ')}`;
        baseQuery += whereClause;
        countQuery += whereClause;
      }
      
      // Add sorting and pagination
      baseQuery += ` ORDER BY t.${sortField} ${sortDirection}, t.id ${sortDirection}`;
      baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(pageLimit, offset);
      
      const startTimeMs = Date.now();

      // Execute transactions query
      const transactionsResult = await pool.query(baseQuery, params);

      let total = 0;
      let countResult = null;

      // Only run count query when explicitly requested (no_count=false)
      if (no_count !== 'true') {
        countResult = await pool.query(countQuery, params.slice(0, -2)); // Remove limit and offset for count
        total = parseInt(countResult.rows[0].total);
      } else {
        // When no_count=true, estimate total as transactions returned (client should rely on has_next flag)
        total = transactionsResult.rows.length + (parseInt(page) - 1) * pageLimit;
      }

      const endTimeMs = Date.now();
      const queryMs = endTimeMs - startTimeMs;
      
  const transactions = transactionsResult.rows;
  const totalPages = Math.ceil(total / pageLimit);
      
      // Calculate running balance if requested (only for small datasets)
      let transactionsWithBalance = transactions;
      if (include_balance === 'true' && pageLimit <= 100) {
        transactionsWithBalance = await this.addRunningBalance(transactions, ledger_id);
      }
      
      res.json({
        success: true,
        data: {
          transactions: transactionsWithBalance,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_records: total,
            per_page: pageLimit,
            has_next: parseInt(page) < totalPages,
            has_prev: parseInt(page) > 1
          },
          filters: {
            ledger_id,
            type,
            start_date,
            end_date,
            search,
            sort_by: sortField,
            sort_order: sortDirection
          }
        },
        performance: {
          query_time_ms: queryMs,
          cached: false
        }
      });
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
        error: error.message
      });
    }
  }
  
  // Get transaction summary with optimized aggregation
  static async getTransactionSummary(req, res) {
    try {
      const { start_date, end_date, ledger_id } = req.query;
      
      let query = `
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN type = 'credit' THEN 1 END) as credit_count,
          COUNT(CASE WHEN type = 'debit' THEN 1 END) as debit_count,
          COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as total_credits,
          COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as total_debits,
          COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) as net_amount,
          MIN(transaction_date) as earliest_date,
          MAX(transaction_date) as latest_date,
          AVG(amount) as average_amount
        FROM transactions t
      `;
      
      const conditions = [];
      const params = [];
      let paramIndex = 1;
      
      if (start_date) {
        conditions.push(`t.transaction_date >= $${paramIndex}`);
        params.push(startOfDay(parseISO(start_date)));
        paramIndex++;
      }
      
      if (end_date) {
        conditions.push(`t.transaction_date <= $${paramIndex}`);
        params.push(endOfDay(parseISO(end_date)));
        paramIndex++;
      }
      
      if (ledger_id) {
        conditions.push(`t.ledger_id = $${paramIndex}`);
        params.push(parseInt(ledger_id));
        paramIndex++;
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      const result = await pool.query(query, params);
      const summary = result.rows[0];
      
      // Format numbers for better readability
      const formattedSummary = {
        ...summary,
        total_credits: parseFloat(summary.total_credits),
        total_debits: parseFloat(summary.total_debits),
        net_amount: parseFloat(summary.net_amount),
        average_amount: parseFloat(summary.average_amount || 0)
      };
      
      res.json({
        success: true,
        data: formattedSummary
      });
      
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction summary',
        error: error.message
      });
    }
  }
  
  // Get daily transaction aggregates for charts
  static async getDailyAggregates(req, res) {
    try {
      const { start_date, end_date, ledger_id } = req.query;
      
      let query = `
        SELECT 
          DATE(transaction_date) as date,
          COUNT(*) as transaction_count,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as daily_credits,
          SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as daily_debits,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END) as daily_net
        FROM transactions t
      `;
      
      const conditions = [];
      const params = [];
      let paramIndex = 1;
      
      if (start_date) {
        conditions.push(`t.transaction_date >= $${paramIndex}`);
        params.push(startOfDay(parseISO(start_date)));
        paramIndex++;
      }
      
      if (end_date) {
        conditions.push(`t.transaction_date <= $${paramIndex}`);
        params.push(endOfDay(parseISO(end_date)));
        paramIndex++;
      }
      
      if (ledger_id) {
        conditions.push(`t.ledger_id = $${paramIndex}`);
        params.push(parseInt(ledger_id));
        paramIndex++;
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` GROUP BY DATE(transaction_date) ORDER BY DATE(transaction_date) DESC LIMIT 90`;
      
      const result = await pool.query(query, params);
      
      res.json({
        success: true,
        data: result.rows.map(row => ({
          ...row,
          daily_credits: parseFloat(row.daily_credits),
          daily_debits: parseFloat(row.daily_debits),
          daily_net: parseFloat(row.daily_net)
        }))
      });
      
    } catch (error) {
      console.error('Error fetching daily aggregates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch daily aggregates',
        error: error.message
      });
    }
  }
  
  // Add running balance calculation (for small datasets only)
  static async addRunningBalance(transactions, ledgerId) {
    if (!ledgerId || transactions.length === 0) {
      return transactions;
    }
    
    try {
      // Get opening balance
      const openingResult = await pool.query(
        'SELECT balance FROM opening_balances WHERE ledger_id = $1 ORDER BY created_at DESC LIMIT 1',
        [ledgerId]
      );
      
      let runningBalance = openingResult.rows[0]?.balance || 0;
      
      // Sort transactions by date and calculate running balance
      const sortedTransactions = [...transactions].sort((a, b) => 
        new Date(a.transaction_date) - new Date(b.transaction_date)
      );
      
      return sortedTransactions.map(transaction => {
        if (transaction.type === 'credit') {
          runningBalance += parseFloat(transaction.amount);
        } else {
          runningBalance -= parseFloat(transaction.amount);
        }
        
        return {
          ...transaction,
          running_balance: runningBalance
        };
      });
      
    } catch (error) {
      console.error('Error calculating running balance:', error);
      return transactions;
    }
  }
  
  // Bulk create transactions for better performance
  static async bulkCreateTransactions(req, res) {
    const client = await pool.connect();
    
    try {
      const { transactions } = req.body;
      
      if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Transactions array is required'
        });
      }
      
      await client.query('BEGIN');
      
      // Prepare bulk insert query
      const values = [];
      const placeholders = [];
      
      transactions.forEach((transaction, index) => {
        const baseIndex = index * 6;
        placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`);
        values.push(
          transaction.ledger_id,
          transaction.amount,
          transaction.type,
          transaction.remarks,
          transaction.transaction_number,
          transaction.transaction_date || new Date()
        );
      });
      
      const query = `
        INSERT INTO transactions (ledger_id, amount, type, remarks, transaction_number, transaction_date)
        VALUES ${placeholders.join(', ')}
        RETURNING id, transaction_number
      `;
      
      const result = await client.query(query, values);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `Successfully created ${result.rows.length} transactions`,
        data: result.rows
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error bulk creating transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create transactions',
        error: error.message
      });
    } finally {
      client.release();
    }
  }
}

module.exports = HighPerformanceTransactionController;