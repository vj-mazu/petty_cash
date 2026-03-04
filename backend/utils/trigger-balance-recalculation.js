/**
 * Utility script to manually trigger balance recalculation
 * Useful for testing and debugging balance continuity issues
 */

const balanceRecalculationService = require('../services/balanceRecalculationService');
const dailyBalanceService = require('../services/dailyBalanceService');
const { format } = require('date-fns');

async function triggerBalanceRecalculation(fromDate) {
  try {
    console.log(`🚀 Manually triggering balance recalculation from date: ${fromDate}`);
    
    // Use today's date as end date
    const endDate = format(new Date(), 'yyyy-MM-dd');
    
    console.log(`📅 Recalculating balances from ${fromDate} to ${endDate}`);
    
    // Trigger the recalculation
    const result = await balanceRecalculationService.recalculateFromDate(fromDate);
    
    console.log('✅ Balance recalculation service completed:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Message: ${result.message}`);
    console.log(`   Dates recalculated: ${result.recalculatedDates.length}`);
    console.log(`   Has continuity issues: ${result.hasContinuityIssues}`);
    
    // Also trigger daily balance continuity recalculation
    console.log('\n🔄 Triggering daily balance continuity recalculation...');
    await dailyBalanceService.recalculateBalancesFromDate(fromDate);
    console.log('✅ Daily balance continuity recalculation completed');
    
    console.log('\n🎉 Manual balance recalculation completed successfully!');
    
    return result;
  } catch (error) {
    console.error('❌ Manual balance recalculation failed:', error);
    throw error;
  }
}

// If run directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node trigger-balance-recalculation.js <YYYY-MM-DD>');
    console.log('Example: node trigger-balance-recalculation.js 2025-09-17');
    process.exit(1);
  }
  
  const fromDate = args[0];
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(fromDate)) {
    console.error('Invalid date format. Please use YYYY-MM-DD format.');
    process.exit(1);
  }
  
  triggerBalanceRecalculation(fromDate)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to trigger balance recalculation:', error);
      process.exit(1);
    });
}

module.exports = triggerBalanceRecalculation;