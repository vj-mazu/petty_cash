/**
 * Performance Optimization Script
 * This script optimizes the database and application for better performance
 */

require('dotenv').config();
const { sequelize } = require('./models');

async function optimizeDatabase() {
    try {
        console.log('🚀 Starting database optimization...');
        
        // 1. Analyze all tables for better query planning
        console.log('📊 Analyzing tables for query optimization...');
        await sequelize.query('ANALYZE transactions');
        await sequelize.query('ANALYZE ledgers');
        await sequelize.query('ANALYZE users');
        await sequelize.query('ANALYZE anamath_entries');
        console.log('✅ Table analysis completed');
        
        // 2. Vacuum and reindex for better performance
        console.log('🧹 Performing database maintenance...');
        await sequelize.query('VACUUM ANALYZE');
        console.log('✅ Database vacuum completed');
        
        // 3. Update table statistics
        console.log('📈 Updating table statistics...');
        await sequelize.query('UPDATE pg_stats SET histogram_bounds = NULL WHERE tablename IN (\'transactions\', \'ledgers\', \'users\', \'anamath_entries\')');
        
        // 4. Check for missing indexes
        console.log('🔍 Checking for optimal indexes...');
        const indexCheck = await sequelize.query(`
            SELECT 
                schemaname,
                tablename,
                attname,
                n_distinct,
                correlation
            FROM pg_stats 
            WHERE tablename IN ('transactions', 'ledgers', 'users', 'anamath_entries')
            AND n_distinct > 100
            ORDER BY n_distinct DESC
        `);
        
        if (indexCheck[0].length > 0) {
            console.log('📋 High cardinality columns (consider indexing):');
            indexCheck[0].forEach(row => {
                console.log(`   ${row.tablename}.${row.attname}: ${row.n_distinct} distinct values`);
            });
        }
        
        // 5. Check database size
        console.log('💾 Database size information:');
        const sizeInfo = await sequelize.query(`
            SELECT 
                pg_size_pretty(pg_database_size(current_database())) as database_size,
                (SELECT COUNT(*) FROM transactions) as transaction_count,
                (SELECT COUNT(*) FROM ledgers) as ledger_count,
                (SELECT COUNT(*) FROM users) as user_count
        `);
        
        const stats = sizeInfo[0][0];
        console.log(`   Database size: ${stats.database_size}`);
        console.log(`   Transactions: ${stats.transaction_count}`);
        console.log(`   Ledgers: ${stats.ledger_count}`);
        console.log(`   Users: ${stats.user_count}`);
        
        // 6. Performance recommendations
        console.log('\n💡 Performance Recommendations:');
        
        if (parseInt(stats.transaction_count) > 50000) {
            console.log('   ⚡ Consider partitioning transactions table by date');
            console.log('   ⚡ Implement connection pooling for high load');
        }
        
        if (parseInt(stats.transaction_count) > 10000) {
            console.log('   ⚡ Consider implementing pagination with smaller page sizes');
            console.log('   ⚡ Use database-level aggregation for reports');
        }
        
        console.log('   ⚡ Enable query caching in production');
        console.log('   ⚡ Consider using Redis for session storage');
        console.log('   ⚡ Implement database connection pooling');
        
        console.log('\n✅ Database optimization completed successfully!');
        
    } catch (error) {
        console.error('❌ Database optimization failed:', error);
        throw error;
    }
}

async function checkPerformanceSettings() {
    try {
        console.log('⚙️  Checking PostgreSQL performance settings...');
        
        const settings = await sequelize.query(`
            SELECT name, setting, unit, context 
            FROM pg_settings 
            WHERE name IN (
                'shared_buffers',
                'effective_cache_size',
                'maintenance_work_mem',
                'checkpoint_completion_target',
                'wal_buffers',
                'default_statistics_target',
                'random_page_cost',
                'work_mem'
            )
            ORDER BY name
        `);
        
        console.log('📋 Current PostgreSQL settings:');
        settings[0].forEach(setting => {
            console.log(`   ${setting.name}: ${setting.setting}${setting.unit || ''}`);
        });
        
        console.log('\n💡 Recommended settings for production:');
        console.log('   shared_buffers: 25% of total RAM');
        console.log('   effective_cache_size: 75% of total RAM');
        console.log('   maintenance_work_mem: 256MB or higher');
        console.log('   checkpoint_completion_target: 0.9');
        console.log('   wal_buffers: 16MB');
        console.log('   default_statistics_target: 100');
        console.log('   random_page_cost: 1.1 (for SSD)');
        console.log('   work_mem: 4MB (adjust based on concurrent connections)');
        
    } catch (error) {
        console.error('❌ Failed to check performance settings:', error);
    }
}

async function generatePerformanceReport() {
    try {
        console.log('📊 Generating performance report...');
        
        // Query performance statistics
        const queryStats = await sequelize.query(`
            SELECT 
                query,
                calls,
                total_time,
                mean_time,
                stddev_time,
                rows
            FROM pg_stat_statements 
            WHERE query LIKE '%transactions%' 
            OR query LIKE '%ledgers%'
            ORDER BY total_time DESC 
            LIMIT 10
        `);
        
        if (queryStats[0].length > 0) {
            console.log('🔍 Top 10 time-consuming queries:');
            queryStats[0].forEach((stat, index) => {
                console.log(`   ${index + 1}. Calls: ${stat.calls}, Total: ${Math.round(stat.total_time)}ms, Avg: ${Math.round(stat.mean_time)}ms`);
                console.log(`      Query: ${stat.query.substring(0, 100)}...`);
            });
        } else {
            console.log('ℹ️  Query statistics not available (pg_stat_statements extension may not be enabled)');
        }
        
        // Index usage statistics
        const indexStats = await sequelize.query(`
            SELECT 
                schemaname,
                tablename,
                indexname,
                idx_tup_read,
                idx_tup_fetch
            FROM pg_stat_user_indexes 
            WHERE tablename IN ('transactions', 'ledgers', 'users', 'anamath_entries')
            ORDER BY idx_tup_read DESC
        `);
        
        if (indexStats[0].length > 0) {
            console.log('\n📈 Index usage statistics:');
            indexStats[0].forEach(stat => {
                console.log(`   ${stat.tablename}.${stat.indexname}: ${stat.idx_tup_read} reads, ${stat.idx_tup_fetch} fetches`);
            });
        }
        
    } catch (error) {
        console.error('❌ Failed to generate performance report:', error);
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'optimize';
    
    try {
        switch (command.toLowerCase()) {
            case 'optimize':
                await optimizeDatabase();
                break;
            case 'check':
                await checkPerformanceSettings();
                break;
            case 'report':
                await generatePerformanceReport();
                break;
            case 'all':
                await optimizeDatabase();
                await checkPerformanceSettings();
                await generatePerformanceReport();
                break;
            case 'help':
                console.log('📖 Available commands:');
                console.log('   node performance-optimizer.js optimize  - Optimize database');
                console.log('   node performance-optimizer.js check     - Check performance settings');
                console.log('   node performance-optimizer.js report    - Generate performance report');
                console.log('   node performance-optimizer.js all       - Run all optimizations');
                console.log('   node performance-optimizer.js help      - Show this help');
                break;
            default:
                console.log('❌ Unknown command. Use "help" to see available commands.');
        }
    } catch (error) {
        console.error('❌ Performance optimization failed:', error);
        process.exit(1);
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
}

// Run the script if called directly
if (require.main === module) {
    main();
}

module.exports = {
    optimizeDatabase,
    checkPerformanceSettings,
    generatePerformanceReport
};