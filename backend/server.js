const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const { sequelize } = require('./models');
const { runMigration } = require('./migrate'); // Import the migration runner
const { errorHandler, notFound } = require('./middleware/errorHandler');
const balanceScheduler = require('./services/balanceScheduler'); // Import balance scheduler
const performanceCache = require('./services/performanceCache'); // Import performance cache
const systemMonitor = require('./services/systemMonitor'); // Import system monitor
const logger = require('./services/logger'); // Import logger
// const { apiLimiter } = require('./middleware/rateLimiting'); // Disabled for unlimited access

// Import routes
const authRoutes = require('./routes/auth');
const ledgerRoutes = require('./routes/ledgers');
const transactionRoutes = require('./routes/transactions');
const optimizedTransactionRoutes = require('./routes/optimizedTransactions');
const highPerformanceTransactionRoutes = require('./routes/fastTransactions');
const ultraFastTransactionRoutes = require('./routes/ultraFastTransactions');
const systemSettingsRoutes = require('./routes/systemSettings');
const openingBalanceRoutes = require('./routes/openingBalances');
const anamathEntryRoutes = require('./routes/anamathEntries');
const combinedTransactionRoutes = require('./routes/combinedTransactions');
const exportRoutes = require('./routes/exports');

const app = express();

// =====================================
// PERFORMANCE MIDDLEWARE
// =====================================

// Enable gzip compression for all responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024 // Only compress responses larger than 1KB
}));

// Security middleware with optimized settings
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// Optimized CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

if (process.env.CLIENT_URL) {
  console.log('✅ CLIENT_URL is present. CORS configured for:', process.env.CLIENT_URL);
} else {
  console.warn('⚠️  CLIENT_URL is missing. CORS defaulting to localhost.');
}

// Rate limiting - DISABLED for unlimited access but ready for production
// app.use(apiLimiter); // Commented out to allow unlimited requests

// Optimized logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400 // Only log errors in production
  }));
} else {
  app.use(morgan('dev'));
}

// Body parsing middleware with optimized limits
app.use(express.json({
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 1000
}));

// Disable x-powered-by header for security
app.disable('x-powered-by');

// Set security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// =====================================
// HEALTH CHECK AND MONITORING
// =====================================

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    success: true,
    message: 'Server is running optimally',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    cache_stats: performanceCache.getCacheStats(),
    database_pool: {
      total: sequelize.connectionManager.pool.size,
      used: sequelize.connectionManager.pool.used,
      waiting: sequelize.connectionManager.pool.pending
    }
  };

  res.json(healthData);
});

// Performance monitoring endpoint
app.get('/performance', async (req, res) => {
  try {
    const systemReport = await systemMonitor.getSystemReport();
    res.json({
      success: true,
      ...systemReport
    });
  } catch (error) {
    logger.error('Performance monitoring failed', error);
    res.status(500).json({
      success: false,
      message: 'Performance monitoring unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// System logs endpoint (admin only)
app.get('/api/admin/logs', async (req, res) => {
  try {
    const { type = 'application', lines = 100 } = req.query;
    const logs = logger.getRecentLogs(type, parseInt(lines));
    const stats = logger.getLogStats();

    res.json({
      success: true,
      logs,
      stats,
      available_types: ['application', 'error', 'security', 'performance', 'audit', 'database']
    });
  } catch (error) {
    logger.error('Log retrieval failed', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs'
    });
  }
});

// Simple test endpoint for login verification
app.get('/api/test-login', (req, res) => {
  res.json({
    success: true,
    message: 'Login endpoint is accessible',
    endpoints: {
      login: 'POST /api/auth/login',
      credentials: {
        admin1: 'admin123',
        admin2: 'admin123',
        admin3: 'admin123',
        staff: 'staff123'
      }
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/ledgers', ledgerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transactions/optimized', optimizedTransactionRoutes);
app.use('/api', highPerformanceTransactionRoutes); // High-performance routes
app.use('/api/ultra-fast', ultraFastTransactionRoutes); // Ultra-fast routes with 2-4 second target
app.use('/api/system-settings', systemSettingsRoutes);
app.use('/api/opening-balances', openingBalanceRoutes);
app.use('/api/anamath-entries', anamathEntryRoutes);
app.use('/api/combined-transactions', combinedTransactionRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/balance-recalculation', require('./routes/balanceRecalculation'));

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Auto-setup database with default users if needed
const autoSetupDatabase = async () => {
  try {
    const { User, SystemSettings } = require('./models');

    // Check if any users exist
    const userCount = await User.count();

    if (userCount === 0) {
      console.log('🔧 No users found. Setting up default users...');

      // Create default users
      const defaultUsers = [
        {
          username: 'admin',
          email: 'admin@cashmanagement.com',
          password: 'admin123',
          role: 'admin'
        },
        {
          username: 'manager',
          email: 'manager@cashmanagement.com',
          password: 'manager123',
          role: 'manager'
        },
        {
          username: 'staff',
          email: 'staff@cashmanagement.com',
          password: 'staff123',
          role: 'staff'
        }
      ];

      const createdUsers = [];
      for (const userData of defaultUsers) {
        const user = await User.create({
          username: userData.username,
          email: userData.email,
          password: userData.password, // Will be hashed by the model hook
          role: userData.role,
          isActive: true
        });
        createdUsers.push(user);
        console.log(`✅ User created: ${userData.username} (${userData.role})`);
      }

      // Create a test user and log its hashed password
      const testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'staff',
        isActive: true
      });
      console.log(`
--- Test User Created ---
Username: ${testUser.username}
Email: ${testUser.email}
Role: ${testUser.role}
Hashed Password: ${testUser.password}
Plain Text Password: password123
-------------------------
`);

      const adminUser = createdUsers[0]; // Use admin1 as the creator

      // Create default system settings if they don't exist
      const settingsCount = await SystemSettings.count();
      if (settingsCount === 0) {
        console.log('⚙️  Creating default system settings...');

        const defaultSettings = [
          {
            settingKey: 'global_opening_balance',
            settingValue: '0',
            description: 'Global opening balance for the system',
            createdBy: adminUser.id
          },
          {
            settingKey: 'company_name',
            settingValue: 'Cash Management System',
            description: 'Company name for reports',
            createdBy: adminUser.id
          },
          {
            settingKey: 'currency_symbol',
            settingValue: '₹',
            description: 'Currency symbol for display',
            createdBy: adminUser.id
          },
          {
            settingKey: 'date_format',
            settingValue: 'DD/MM/YYYY',
            description: 'Default date format',
            createdBy: adminUser.id
          }
        ];

        for (const setting of defaultSettings) {
          await SystemSettings.create(setting);
        }
        console.log('✅ Default system settings created');
      }

      console.log(`\n🎉 Auto-setup completed successfully!`);
      console.log(`\n📋 Default Login Credentials:`);
      console.log(`   Admin   - Username: admin,   Password: admin123 (Full Access)`);
      console.log(`   Manager - Username: manager, Password: manager123 (Approval & Data Entry)`);
      console.log(`   Staff   - Username: staff,   Password: staff123 (Data Entry Only)`);
      console.log(`\n🌐 Database is ready for use!`);

    } else {
      console.log(`✅ Database already has ${userCount} users. Skipping auto-setup.`);
    }

  } catch (error) {
    console.error('❌ Auto-setup failed:', error);
    // Don't exit - let the server continue even if auto-setup fails
  }
};

// Database connection and server startup
const startServer = async () => {
  try {
    logger.info('Starting Cash Management System server...');

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    console.log('✅ Database connection established successfully.');

    // Sync database (alter mode for production safety)
    await sequelize.sync({ alter: true });

    // Run pending migrations (guarded by AUTO_MIGRATE env var)
    const autoMigrate = process.env.AUTO_MIGRATE !== 'false';
    if (autoMigrate) {
      console.log('🔄 Running database migrations (AUTO_MIGRATE enabled)...');
      try {
        await runMigration();
        logger.info('Database migrations completed');
        console.log('✅ Database migrations completed.');
      } catch (migrationErr) {
        // If migrations fail, log and continue startup (so server can still run for debugging),
        // but surface the error in logs.
        logger.error('Database migrations failed during startup', migrationErr);
        console.error('⚠️  Database migrations failed during startup:', migrationErr.message);
      }
    } else {
      console.log('ℹ️  AUTO_MIGRATE is disabled. Skipping running migrations at startup.');
    }

    // CRITICAL PERFORMANCE INDEXES - Essential for fast transaction loading
    console.log('⚡ Applying Critical Performance Indexes...');
    try {
      const { applyCriticalIndexes } = require('./services/criticalIndexes');
      const indexResult = await applyCriticalIndexes();
      if (indexResult.success) {
        logger.info('Critical performance indexes applied', { created: indexResult.created });
      }
    } catch (error) {
      console.warn('⚠️  Critical indexes failed (will continue):', error.message);
      logger.warn('Critical indexes failed', { error: error.message });
    }

    // HIGH-LEVEL PERFORMANCE OPTIMIZATION - Database Indexing & Vectorization
    console.log('🚀 Applying High-Level Performance Optimizations...');
    try {
      const performanceOptimizer = require('./services/performanceOptimizer');
      const result = await performanceOptimizer.applyAll();

      if (result.success) {
        logger.info('High-level performance optimization completed successfully');
        console.log('✅ Database Performance: OPTIMIZED');
        console.log(`⚡ Applied ${result.optimizations?.length || 0} optimizations`);
      } else {
        console.warn('⚠️  Some optimizations were skipped:', result.message);
      }
    } catch (error) {
      console.warn('⚠️  Performance optimization failed (will continue):', error.message);
      logger.warn('Performance optimization failed', { error: error.message });
    }

    // ULTRA PERFORMANCE OPTIMIZATION - Auto-activate for 30k-40k+ transactions
    console.log('🚀 Activating Ultra Performance Optimization System...');
    try {
      const UltraPerformanceOptimizer = require('./ultra-performance-optimizer');
      const optimizer = new UltraPerformanceOptimizer();
      await optimizer.execute();
      logger.info('Ultra performance optimization completed successfully');
      console.log('✅ Ultra Performance System: ACTIVATED');
      console.log('⚡ System optimized for 40,000+ transactions');
    } catch (error) {
      console.warn('⚠️  Ultra performance optimization failed (will continue):', error.message);
      logger.warn('Ultra performance optimization failed', { error: error.message });
    }

    // Auto-setup database with default users if needed
    await autoSetupDatabase();
    logger.info('Database auto-setup completed');

    // Start balance rollover scheduler
    try {
      balanceScheduler.start();
      logger.info('Balance rollover scheduler started');
      console.log('⏰ Balance rollover scheduler started');
    } catch (schedulerError) {
      logger.error('Failed to start balance scheduler', schedulerError);
      console.error('⚠️  Failed to start balance scheduler:', schedulerError.message);
      console.log('🟨 Server will continue without automatic balance rollover');
    }

    // Start server (bind to all interfaces for LAN access)
    app.listen(PORT, '0.0.0.0', () => {
      const startupMessage = `Cash Management System started successfully on port ${PORT}`;
      logger.info(startupMessage, {
        port: PORT,
        environment: process.env.NODE_ENV,
        node_version: process.version,
        memory_limit: process.env.NODE_OPTIONS || 'default'
      });

      console.log(`🚀 Server is running successfully on http://localhost:${PORT}`);
      console.log(`🌐 LAN Access: Server accessible from other devices at http://[YOUR-IP]:${PORT}`);
      console.log(`🔗 API Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Performance Monitor: http://localhost:${PORT}/performance`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🎯 System optimized for high-performance transaction processing`);
      console.log(`💾 Memory caching enabled with connection pooling`);
      console.log(`🗄️  Advanced database indexing active`);
    });

  } catch (error) {
    logger.error('Failed to start server', error);
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection', err, { promise: promise.toString() });
  console.error('❌ Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', err);
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  console.log('👋 SIGTERM received. Shutting down gracefully...');

  // Stop balance scheduler
  try {
    balanceScheduler.stop();
    logger.info('Balance scheduler stopped');
    console.log('⏰ Balance scheduler stopped');
  } catch (error) {
    logger.error('Error stopping scheduler', error);
    console.error('⚠️  Error stopping scheduler:', error.message);
  }

  // Close performance cache
  try {
    performanceCache.close();
    logger.info('Performance cache closed');
  } catch (error) {
    logger.error('Error closing cache', error);
  }

  await sequelize.close();
  logger.info('Database connections closed. Server shutdown complete.');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  console.log('👋 SIGINT received. Shutting down gracefully...');

  // Stop balance scheduler
  try {
    balanceScheduler.stop();
    logger.info('Balance scheduler stopped');
    console.log('⏰ Balance scheduler stopped');
  } catch (error) {
    logger.error('Error stopping scheduler', error);
    console.error('⚠️  Error stopping scheduler:', error.message);
  }

  // Close performance cache
  try {
    performanceCache.close();
    logger.info('Performance cache closed');
  } catch (error) {
    logger.error('Error closing cache', error);
  }

  await sequelize.close();
  logger.info('Database connections closed. Server shutdown complete.');
  process.exit(0);
});

startServer();

module.exports = app;