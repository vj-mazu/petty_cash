const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// PostgreSQL configuration with optimized performance settings
const sequelizeOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,

  // Optimized connection pool for high transaction volume
  // Connection pool optimized for high throughput
  pool: {
    max: 25,           // Increased for concurrent queries
    min: 5,            // Keep minimum connections warm
    acquire: 30000,    // 30 seconds to acquire (fail fast)
    idle: 10000,       // 10 seconds idle before release
    evict: 1000,       // Check for idle connections every second
    handleDisconnects: true
  },

  // Performance optimizations
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: false,
      rejectUnauthorized: false
    } : false,

    // PostgreSQL performance settings for 10M+ records
    application_name: 'petty_cash_prod',
    statement_timeout: 10000,     // 10s query timeout (fast-fail)
    idle_in_transaction_session_timeout: 5000, // 5s (prevent connection leaks)
    keepAlive: true,               // TCP keep-alive for connection stability
    keepAliveInitialDelayMillis: 10000,
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

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL is present. Using connection string.');
} else {
  console.warn('⚠️  DATABASE_URL is missing. Falling back to individual parameters (DB_HOST, etc.).');
}

console.log('🐘 Using PostgreSQL database');

module.exports = sequelize;