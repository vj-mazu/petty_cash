-- High-Performance Database Optimizations for 20,000+ Transactions
-- This script creates indexes optimized for fast querying of large datasets

-- Transactions table optimizations
CREATE INDEX IF NOT EXISTS idx_transactions_date_performance ON transactions ("date" DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_ledger_performance ON transactions ("ledgerId");
CREATE INDEX IF NOT EXISTS idx_transactions_amount_performance ON transactions ("creditAmount", "debitAmount");
CREATE INDEX IF NOT EXISTS idx_transactions_composite_performance ON transactions ("date" DESC, "ledgerId");
CREATE INDEX IF NOT EXISTS idx_transactions_number_performance ON transactions (transaction_number);
CREATE INDEX IF NOT EXISTS idx_transactions_created_performance ON transactions ("createdAt" DESC);

-- Anamath entries table optimizations  
CREATE INDEX IF NOT EXISTS idx_anamath_date_performance ON anamath_entries ("date" DESC);
CREATE INDEX IF NOT EXISTS idx_anamath_ledger_performance ON anamath_entries (ledger_id);
CREATE INDEX IF NOT EXISTS idx_anamath_amount_performance ON anamath_entries (amount DESC);
CREATE INDEX IF NOT EXISTS idx_anamath_composite_performance ON anamath_entries ("date" DESC, ledger_id);
CREATE INDEX IF NOT EXISTS idx_anamath_number_performance ON anamath_entries (transaction_number);

-- Ledgers table optimizations
CREATE INDEX IF NOT EXISTS idx_ledgers_name_performance ON ledgers (name);
CREATE INDEX IF NOT EXISTS idx_ledgers_active_performance ON ledgers ("isActive") WHERE "isActive" = true;