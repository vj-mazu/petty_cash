const { sequelize } = require('./models');

(async () => {
  try {
    const [result] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position
    `);
    
    console.log('✅ Transactions table columns:');
    result.forEach(row => console.log(`   - ${row.column_name}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
