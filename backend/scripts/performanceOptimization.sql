-- Performance optimization script for handling 20k+ transactions
-- This script creates indexes and optimizations for high-volume transaction processing

-- Note: Using actual column names from the database schema

-- 1. Create performance indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_date_performance 
ON transactions (date DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_ledger_date 
ON transactions ("ledgerId", date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type_date 
ON transactions (transaction_type, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_number_unique 
ON transactions (transaction_number) WHERE transaction_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_amount_date 
ON transactions ("debitAmount", "creditAmount", date DESC);

-- 2. Create performance indexes for anamath_entries table
CREATE INDEX IF NOT EXISTS idx_anamath_date_performance 
ON anamath_entries (date DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_anamath_ledger_date 
ON anamath_entries (ledger_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_anamath_number_unique 
ON anamath_entries (transaction_number) WHERE transaction_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anamath_amount_date 
ON anamath_entries (amount, date DESC);

CREATE INDEX IF NOT EXISTS idx_anamath_status_date 
ON anamath_entries (is_closed, date DESC);

-- 3. Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_ledger_type_date 
ON transactions ("ledgerId", transaction_type, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_date_type_amount 
ON transactions (date DESC, transaction_type, "debitAmount", "creditAmount");

-- 4. Create indexes for join operations
CREATE INDEX IF NOT EXISTS idx_ledgers_name_performance 
ON ledgers (name, id);

-- 5. Create partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_transactions_active_recent 
ON transactions (date DESC, id DESC) 
WHERE date >= CURRENT_DATE - INTERVAL '1 year';

CREATE INDEX IF NOT EXISTS idx_anamath_active_recent 
ON anamath_entries (date DESC, id DESC) 
WHERE date >= CURRENT_DATE - INTERVAL '1 year';

-- 6. Create indexes for text search (if using search functionality)
CREATE INDEX IF NOT EXISTS idx_transactions_remarks_gin 
ON transactions USING gin(to_tsvector('english', remarks)) 
WHERE remarks IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_description_gin 
ON transactions USING gin(to_tsvector('english', description)) 
WHERE description IS NOT NULL;

-- 7. Update table statistics for better query planning
ANALYZE transactions;
ANALYZE anamath_entries;
ANALYZE ledgers;

-- Additional PostgreSQL configuration recommendations (to be set at database level):
/*
-- Add these to postgresql.conf for better performance with large datasets:

shared_buffers = 25% of RAM (e.g., '2GB' for 8GB RAM)
effective_cache_size = 75% of RAM (e.g., '6GB' for 8GB RAM)
work_mem = '64MB' (for complex queries)
maintenance_work_mem = '512MB'
checkpoint_completion_target = 0.9
wal_buffers = '16MB'
default_statistics_target = 100
random_page_cost = 1.1 (for SSD storage)

-- For high-volume inserts:
wal_compression = on
checkpoint_timeout = '15min'
max_wal_size = '2GB'
*/