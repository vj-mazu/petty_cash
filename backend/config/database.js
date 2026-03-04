const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// PostgreSQL configuration with optimized performance settings
const sequelizeOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,

  // Optimized connection pool for high transaction volume
  pool: {
    max: 20,           // Increased max connections for high throughput
    min: 5,            // Keep minimum connections warm
    acquire: 60000,    // 60 seconds to acquire connection
    idle: 30000,       // 30 seconds idle before release
    evict: 1000,       // Check for idle connections every second
    handleDisconnects: true
  },

  // Performance optimizations
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: false,
      rejectUnauthorized: false
    } : false,

    // PostgreSQL-specific performance settings
    application_name: 'cash_management_system',
    statement_timeout: 30000,     // 30 second query timeout
    idle_in_transaction_session_timeout: 60000, // 60 seconds

    // Connection-level optimizations
    options: process.env.NODE_ENV === 'production'
      ? '-c shared_preload_libraries=pg_stat_statements -c track_activity_query_size=2048'
      : undefined
  },

  // Query optimization settings
  benchmark: process.env.NODE_ENV === 'development',
  omitNull: false,
  native: false,
  define: {
    underscored: false,
    freezeTableName: true,
    charset: 'utf8',
    dialectOptions: {
      collate: 'utf8_general_ci'
    },
    timestamps: true
  },

  // Retry configuration for connection failures
  retry: {
    match: [
      /ConnectionError/,
      /ConnectionTimedOutError/,
      /TimeoutError/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    max: 3
  }
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, sequelizeOptions)
  : new Sequelize({
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    ...sequelizeOptions
  });

console.log('🐘 Using PostgreSQL database');

module.exports = sequelize;