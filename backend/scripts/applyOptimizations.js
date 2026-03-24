const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'cash_management',
  user: 'postgres',
  password: '12345'
});

async function applyOptimizations() {
  try {
    console.log('🔧 Applying performance optimizations...');
    
    const sql = fs.readFileSync('./scripts/performanceOptimization_fixed.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Performance optimizations applied successfully');
    
    console.log('📊 Verifying database counts...');
    const result = await pool.query(`
      SELECT COUNT(*) as count, 'transactions' as table_name FROM transactions 
      UNION ALL 
      SELECT COUNT(*) as count, 'anamath_entries' as table_name FROM anamath_entries
    `);
    
    let total = 0;
    result.rows.forEach(row => {
      console.log(`${row.table_name}: ${row.count}`);
      total += parseInt(row.count);
    });
    console.log(`🎯 Total records: ${total}`);
    
    // Test query performance
    console.log('⏱️ Testing query performance...');
    const startTime = Date.now();
    await pool.query(`
      SELECT t.id, t.date, t.description, t."creditAmount", t."debitAmount", l.name as ledger_name
      FROM transactions t
      JOIN ledgers l ON t."ledgerId" = l.id
      ORDER BY t.date DESC
      LIMIT 100
    `);
    const queryTime = Date.now() - startTime;
    console.log(`🚀 Query executed in ${queryTime}ms`);
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
  }
}

applyOptimizations();