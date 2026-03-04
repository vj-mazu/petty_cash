const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function resetDatabase() {
  console.log('🔄 Starting database reset...');

  // Connect to the default postgres database
  const sequelizeDefault = new Sequelize({
    database: 'postgres',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  });

  try {
    await sequelizeDefault.authenticate();
    console.log('✅ Connected to PostgreSQL server');

    // Drop the database if it exists
    const dbName = process.env.DB_NAME || 'cash_management';
    console.log(`🗑️  Dropping database "${dbName}" if it exists...`);
    
    // Terminate all connections to the database first
    await sequelizeDefault.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${dbName}'
      AND pid <> pg_backend_pid();
    `);
    
    // Now drop the database
    await sequelizeDefault.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    console.log(`✅ Dropped database "${dbName}"`);

    // Recreate the database
    console.log('🔄 Creating a new database...');
    await sequelizeDefault.query(`CREATE DATABASE "${dbName}"`);
    console.log(`✅ Created new database "${dbName}"`);

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await sequelizeDefault.close();
  }

  console.log('\n🎉 Database reset completed successfully!');
  console.log('📊 You now have a fresh database');
  console.log('🚀 Run your migrations to set up the schema');
  process.exit(0);
}

// Run the reset
resetDatabase();
