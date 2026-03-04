// controllers/ultraFastTransactionController.js
// Ultra-high-performance transaction controller with optimized queries

const { Transaction, Ledger, User, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');

/**
 * Ultra-fast transaction list with optimized raw SQL queries
 * Handles 1000s of transactions in under 1 second
 */
const getUltraFastTransactions = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const {
      page = 1,
      limit = 20,
      ledgerId,
      startDate,
      endDate,
      search,
      type,
      includeSuspended = 'false'
    } = req.query;

    // Parse and validate pagination
    const maxLimit = 50000;
    const parsedLimit = Math.min(parseInt(limit) || 20, maxLimit);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    console.log(`⚡ Ultra-fast query - Page: ${parsedPage}, Limit: ${parsedLimit}, Filters:`, {
      ledgerId, startDate, endDate, search, type, includeSuspended
    });

    // Build WHERE clause dynamically
    const conditions = [];
    const replacements = {};
    let paramIndex = 1;

    // Suspended filter
    if (includeSuspended !== 'true') {
      conditions.push(`t.is_suspended = false`);
    }

    // Ledger filter
    if (ledgerId) {
      conditions.push(`t."ledgerId" = :ledgerId`);
      replacements.ledgerId = ledgerId;
    }

    // Date range filter
    if (startDate && endDate) {
      conditions.push(`t.date BETWEEN :startDate AND :endDate`);
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    } else if (startDate) {
      conditions.push(`t.date >= :startDate`);
      replacements.startDate = startDate;
    } else if (endDate) {
      conditions.push(`t.date <= :endDate`);
      replacements.endDate = endDate;
    }

    // Transaction type filter
    if (type === 'debit') {
      conditions.push(`t."debitAmount" > 0`);
    } else if (type === 'credit') {
      conditions.push(`t."creditAmount" > 0`);
    }

    // Search filter - optimized with indexed columns
    if (search && search.trim()) {
      const searchTerm = `%${search.toLowerCase().trim()}%`;
      conditions.push(`(
        LOWER(t.description) LIKE :searchTerm 
        OR LOWER(t.reference) LIKE :searchTerm
        OR LOWER(t.remarks) LIKE :searchTerm
      )`);
      replacements.searchTerm = searchTerm;
    }

    // Active ledger filter
    conditions.push(`l."isActive" = true`);

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // OPTIMIZED COUNT QUERY - Fast count with covering index
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      INNER JOIN ledgers l ON t."ledgerId" = l.id
      ${whereClause}
    `;

    const countStart = Date.now();
    const [countResult] = await sequelize.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT
    });
    const totalCount = parseInt(countResult.total);
    console.log(`⚡ Count query: ${Date.now() - countStart}ms - Found ${totalCount} transactions`);

    // OPTIMIZED DATA QUERY - Use covering index and minimal joins
    const dataQuery = `
      SELECT 
        t.id,
        t.date,
        t."creditAmount",
        t."debitAmount",
        t.description,
        t.reference,
        t.transaction_number as "transactionNumber",
        t.is_suspended as "isSuspended",
        t."ledgerId",
        t."createdAt",
        t."updatedAt",
        t.remarks,
        t.transaction_type as "transactionType",
        l.id as "ledger_id",
        l.name as "ledger_name",
        l."ledgerType" as "ledger_type",
        u.id as "creator_id",
        u.username as "creator_username"
      FROM transactions t
      INNER JOIN ledgers l ON t."ledgerId" = l.id
      LEFT JOIN users u ON t."createdBy" = u.id
      ${whereClause}
      ORDER BY t.date DESC, t."createdAt" DESC
      LIMIT :limit OFFSET :offset
    `;

    const dataStart = Date.now();
    replacements.limit = parsedLimit;
    replacements.offset = offset;

    const rawTransactions = await sequelize.query(dataQuery, {
      replacements,
      type: QueryTypes.SELECT
    });
    console.log(`⚡ Data query: ${Date.now() - dataStart}ms - Retrieved ${rawTransactions.length} rows`);

    // Transform to expected format
    const transactions = rawTransactions.map(tx => ({
      id: tx.id,
      date: tx.date,
      creditAmount: parseFloat(tx.creditAmount || 0),
      debitAmount: parseFloat(tx.debitAmount || 0),
      description: tx.description,
      reference: tx.reference,
      transactionNumber: tx.transactionNumber,
      isSuspended: tx.isSuspended,
      ledgerId: tx.ledgerId,
      createdAt: tx.createdAt,
      updatedAt: tx.updatedAt,
      remarks: tx.remarks,
      transactionType: tx.transactionType,
      ledger: {
        id: tx.ledger_id,
        name: tx.ledger_name,
        ledgerType: tx.ledger_type
      },
      creator: tx.creator_id ? {
        id: tx.creator_id,
        username: tx.creator_username
      } : null
    }));

    // Calculate page totals (fast in-memory calculation)
    const totalsStart = Date.now();
    const pageTotals = transactions.reduce((acc, tx) => {
      acc.totalDebit += tx.debitAmount;
      acc.totalCredit += tx.creditAmount;
      return acc;
    }, { totalDebit: 0, totalCredit: 0 });
    console.log(`⚡ Totals calculation: ${Date.now() - totalsStart}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`✅ TOTAL RESPONSE TIME: ${totalTime}ms`);

    return res.json({
      success: true,
      data: {
        transactions,
        totals: pageTotals,
        summary: {
          openingBalance: 0,
          closingBalance: 0,
          totalDebit: pageTotals.totalDebit,
          totalCredit: pageTotals.totalCredit,
          netChange: pageTotals.totalCredit - pageTotals.totalDebit
        },
        pagination: {
          total: totalCount,
          page: parsedPage,
          pages: Math.ceil(totalCount / parsedLimit),
          limit: parsedLimit,
          unlimited: true
        }
      },
      performanceMs: totalTime
    });

  } catch (error) {
    console.error('❌ Ultra-fast transaction error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

module.exports = {
  getUltraFastTransactions
};
