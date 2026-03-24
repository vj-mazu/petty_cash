const path = require('path');
const { sequelize, User, Ledger, Transaction } = require(path.join(__dirname, '..', 'models'));
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Delete all data in order (respecting foreign key constraints)
    console.log('🗑️  Deleting all transactions...');
    await Transaction.destroy({ where: {}, force: true });
    
    console.log('🗑️  Deleting all ledgers...');
    await Ledger.destroy({ where: {}, force: true });
    
    console.log('🗑️  Deleting all users...');
    await User.destroy({ where: {}, force: true });

    // Note: No need to reset sequences as tables use UUIDs
    console.log('✅ Database reset completed successfully!');
    console.log('📊 All tables are now empty and ready for fresh data');
    console.log('🎯 You can now start testing with a clean database');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase();