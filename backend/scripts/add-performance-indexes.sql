-- =====================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- For Cash Management System
-- Run this script to dramatically improve query speed
-- =====================================================

-- Drop existing indexes if they exist (to recreate with proper names)
DROP INDEX IF EXISTS idx_transactions_date;
DROP INDEX IF EXISTS idx_transactions_ledger_date;
DROP INDEX IF EXISTS idx_transactions_type_date;
DROP INDEX IF EXISTS idx_transactions_number;
DROP INDEX IF EXISTS idx_transactions_composite;
DROP INDEX IF EXISTS idx_transactions_user_date;
DROP INDEX IF EXISTS idx_ledgers_user;
DROP INDEX IF EXISTS idx_ledgers_active;

-- =====================================================
-- PRIMARY PERFORMANCE INDEXES
-- =====================================================

-- 1. Transaction Date Index (Most Common Query)
-- Used for: Date range filtering, ORDER BY date
CREATE INDEX idx_transactions_date 
ON transactions(transaction_date DESC, id DESC);

-- 2. Ledger + Date Composite Index
-- Used for: Filtering by specific ledger and date range
CREATE INDEX idx_transactions_ledger_date 
ON transactions(ledger_id, transaction_date DESC);

-- 3. Type + Date Composite Index  
-- Used for: Filtering by credit/debit type
CREATE INDEX idx_transactions_type_date 
ON transactions(type, transaction_date DESC);

-- 4. Transaction Number Index
-- Used for: Quick lookup by transaction number
CREATE INDEX idx_transactions_number 
ON transactions(transaction_number DESC);

-- 5. User + Date Index
-- Used for: Filtering transactions by user (if needed)
CREATE INDEX idx_transactions_user_date 
ON transactions(created_by, transaction_date DESC);

-- =====================================================
-- ADVANCED COMPOSITE INDEXES
-- =====================================================

-- 6. Multi-Column Composite Index
-- Used for: Complex queries with multiple filters
-- This is a covering index for most common query patterns
CREATE INDEX idx_transactions_composite 
ON transactions(
  ledger_id, 
  type, 
  transaction_date DESC, 
  transaction_number DESC
) WHERE deleted_at IS NULL;

-- =====================================================
-- LEDGER TABLE INDEXES
-- =====================================================

-- 7. Ledger User Index
CREATE INDEX idx_ledgers_user 
ON ledgers(created_by) WHERE deleted_at IS NULL;

-- 8. Ledger Active Index
CREATE INDEX idx_ledgers_active 
ON ledgers(is_active) WHERE deleted_at IS NULL;

-- =====================================================
-- STATISTICS UPDATE
-- =====================================================

-- Update table statistics for query planner
ANALYZE transactions;
ANALYZE ledgers;
ANALYZE users;

-- =====================================================
-- VERIFY INDEXES CREATED
-- =====================================================

-- Check all indexes on transactions table
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'transactions'
ORDER BY indexname;

-- =====================================================
-- PERFORMANCE TESTING QUERIES
-- =====================================================

-- Test 1: Date range query (should use idx_transactions_date)
EXPLAIN ANALYZE
SELECT * FROM transactions 
WHERE transaction_date >= '2025-10-01' 
  AND transaction_date <= '2025-10-14'
ORDER BY transaction_date DESC, id DESC
LIMIT 100;

-- Test 2: Ledger filter query (should use idx_transactions_ledger_date)
EXPLAIN ANALYZE
SELECT t.*, l.name as ledger_name
FROM transactions t
JOIN ledgers l ON t.ledger_id = l.id
WHERE t.ledger_id = '123e4567-e89b-12d3-a456-426614174000'
  AND t.transaction_date >= '2025-10-01'
ORDER BY t.transaction_date DESC
LIMIT 100;

-- Test 3: Type filter query (should use idx_transactions_type_date)
EXPLAIN ANALYZE
SELECT * FROM transactions 
WHERE type = 'credit'
  AND transaction_date >= '2025-10-01'
ORDER BY transaction_date DESC
LIMIT 100;

-- Test 4: Transaction number lookup (should use idx_transactions_number)
EXPLAIN ANALYZE
SELECT * FROM transactions 
WHERE transaction_number = 1234;

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================

-- Before indexes:
--   - Seq Scan on transactions (slow)
--   - Query time: 10-15 seconds for 35K records
--
-- After indexes:
--   - Index Scan using idx_transactions_date (fast)
--   - Query time: <100ms for 35K records
--
-- Look for these in EXPLAIN ANALYZE output:
--   ✅ "Index Scan using idx_transactions_..." = GOOD
--   ❌ "Seq Scan on transactions" = BAD (missing index)

-- =====================================================
-- MAINTENANCE COMMANDS
-- =====================================================

-- Reindex if performance degrades over time
-- REINDEX TABLE transactions;
-- REINDEX TABLE ledgers;

-- Update statistics after bulk inserts
-- ANALYZE transactions;

-- Check index usage stats
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'transactions'
-- ORDER BY idx_scan DESC;

-- =====================================================
-- CLEANUP (if needed to start fresh)
-- =====================================================

-- To remove all performance indexes (use with caution):
-- DROP INDEX IF EXISTS idx_transactions_date;
-- DROP INDEX IF EXISTS idx_transactions_ledger_date;
-- DROP INDEX IF EXISTS idx_transactions_type_date;
-- DROP INDEX IF EXISTS idx_transactions_number;
-- DROP INDEX IF EXISTS idx_transactions_composite;
-- DROP INDEX IF EXISTS idx_transactions_user_date;
-- DROP INDEX IF EXISTS idx_ledgers_user;
-- DROP INDEX IF EXISTS idx_ledgers_active;

-- =====================================================
-- NOTES
-- =====================================================

-- 1. Run this script when:
--    - Initial setup
--    - After large data imports
--    - When queries become slow
--
-- 2. Monitor index usage:
--    - Unused indexes waste space
--    - Check pg_stat_user_indexes regularly
--
-- 3. For very large datasets (100K+ transactions):
--    - Consider partitioning by date
--    - Consider separate archive database
--    - Consider read replicas
--
-- 4. Index maintenance:
--    - PostgreSQL auto-vacuums by default
--    - Manual REINDEX if heavy write load
--    - ANALYZE after bulk operations

-- =====================================================
-- PERFORMANCE TARGETS
-- =====================================================

-- With these indexes, expect:
--   - Date range queries: <100ms
--   - Ledger filter queries: <50ms  
--   - Transaction number lookup: <10ms
--   - Page load (100 records): <500ms total
--
-- Without indexes:
--   - Date range queries: 10-15s
--   - Ledger filter queries: 8-12s
--   - Transaction number lookup: 5-8s
--   - Page load (100 records): 15-20s total

COMMIT;
