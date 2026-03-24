/**
 * Generate Test Transactions: July 1 to October 14, 2025
 * 65 transactions per day (50 credit + 15 debit)
 * Perfect for testing calculations and pagination
 */

const axios = require('axios');
const { format, addDays, differenceInDays } = require('date-fns');

// =====================================================
// CONFIGURATION
// =====================================================
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  
  // Date range
  START_DATE: new Date(2025, 6, 1), // July 1, 2025 (month is 0-indexed)
  END_DATE: new Date(2025, 9, 14),   // October 14, 2025
  
  // Transactions per day
  CREDIT_COUNT: 50,
  DEBIT_COUNT: 15,
  
  // Batch configuration
  BATCH_SIZE: 10,  // Reduced to avoid timeout
  DELAY_BETWEEN_BATCHES: 500, // 500ms between batches
  
  // Authentication
  AUTH: {
    email: 'admin1',
    password: 'admin123'
  }
};

// =====================================================
// SAMPLE DATA POOLS
// =====================================================
const CREDIT_DESCRIPTIONS = [
  'Cash deposit', 'Bank transfer received', 'Payment received', 'Sales collection',
  'Customer payment', 'Invoice payment', 'Cash sales', 'Advance received',
  'Refund received', 'Interest income', 'Rental income', 'Service income',
  'Commission received', 'Bonus received', 'Dividend income', 'Royalty received',
  'Loan received', 'Grant received', 'Donation received', 'Gift received',
  'Online payment', 'Card payment', 'Cheque deposit', 'Wire transfer',
  'Mobile payment', 'E-wallet credit', 'Cryptocurrency sale', 'Stock dividend',
  'Partnership capital', 'Investment return', 'Subscription fee', 'License fee',
  'Consulting fee', 'Professional fee', 'Maintenance charge', 'Delivery charge',
  'Installation fee', 'Training income', 'Workshop fee', 'Seminar income',
  'Product sale', 'Goods sold', 'Material sale', 'Equipment sale',
  'Asset sale', 'Property sale', 'Vehicle sale', 'Inventory sale'
];

const DEBIT_DESCRIPTIONS = [
  'Office supplies', 'Electricity bill', 'Water bill', 'Internet bill',
  'Phone bill', 'Rent payment', 'Salary payment', 'Wages paid',
  'Vendor payment', 'Purchase payment', 'Equipment purchase', 'Software license',
  'Maintenance cost', 'Repair expense', 'Fuel expense', 'Transportation',
  'Delivery charges', 'Courier charges', 'Postage', 'Insurance premium',
  'Tax payment', 'Professional fees', 'Consulting fees', 'Legal fees',
  'Audit fees', 'Bank charges', 'Interest paid', 'Loan repayment',
  'Credit card payment', 'Office rent', 'Warehouse rent', 'Vehicle maintenance',
  'Computer repair', 'Printer supplies', 'Stationery', 'Marketing expense',
  'Advertising cost', 'Promotional expense', 'Travel expense', 'Hotel booking',
  'Flight ticket', 'Conference fee', 'Training cost', 'Subscription renewal',
  'Domain renewal', 'Hosting charges', 'Cloud storage', 'Security service'
];

const LEDGER_NAMES = [
  'Petty Cash', 'HDFC Bank', 'ICICI Bank', 'SBI Current Account', 'Axis Bank',
  'Cash Counter', 'Reserve Fund', 'Emergency Fund', 'Operations Account'
];

// =====================================================
// UTILITY FUNCTIONS
// =====================================================
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomAmount(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================
// AUTHENTICATION
// =====================================================
async function authenticate() {
  try {
    console.log('🔐 Authenticating...');
    const response = await axios.post(`${CONFIG.API_BASE_URL}/auth/login`, CONFIG.AUTH);
    
    if (response.data && response.data.data && response.data.data.token) {
      console.log('✅ Authentication successful');
      return response.data.data.token;
    }
    
    throw new Error('Invalid authentication response');
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

// =====================================================
// GET LEDGERS
// =====================================================
async function getLedgers(token) {
  try {
    console.log('📋 Fetching ledgers...');
    const response = await axios.get(`${CONFIG.API_BASE_URL}/ledgers?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data && response.data.data && response.data.data.ledgers) {
      const ledgers = response.data.data.ledgers;
      console.log(`✅ Found ${ledgers.length} ledgers`);
      return ledgers;
    }
    
    throw new Error('Invalid ledgers response');
  } catch (error) {
    console.error('❌ Failed to fetch ledgers:', error.message);
    throw error;
  }
}

// =====================================================
// GENERATE TRANSACTION DATA
// =====================================================
function generateTransaction(date, ledgers, isCredit) {
  const ledger = getRandomElement(ledgers);
  const description = isCredit 
    ? getRandomElement(CREDIT_DESCRIPTIONS)
    : getRandomElement(DEBIT_DESCRIPTIONS);
  
  const amount = isCredit
    ? getRandomAmount(500, 25000)   // Credit: ₹500 to ₹25,000
    : getRandomAmount(100, 15000);  // Debit: ₹100 to ₹15,000
  
  return {
    date: format(date, 'yyyy-MM-dd'),
    description: description,
    reference: `REF${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    creditAmount: isCredit ? parseFloat(amount) : 0,
    debitAmount: isCredit ? 0 : parseFloat(amount),
    ledgerId: ledger.id,
    remarks: `Test transaction for ${format(date, 'MMMM dd, yyyy')}`,
    transactionType: 'regular'  // Add required field
  };
}

// =====================================================
// CREATE TRANSACTIONS IN BATCHES
// =====================================================
async function createTransactionsBatch(transactions, token, batchNumber, totalBatches) {
  try {
    const promises = transactions.map(txn =>
      axios.post(`${CONFIG.API_BASE_URL}/transactions`, txn, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000  // Increased to 60 seconds
      })
    );
    
    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    // Log first error for debugging
    if (failed > 0 && batchNumber === 1) {
      const firstError = results.find(r => r.status === 'rejected');
      if (firstError) {
        console.error('\n❌ FIRST ERROR DETAILS:');
        console.error('Status:', firstError.reason?.response?.status);
        console.error('Message:', firstError.reason?.response?.data?.message || firstError.reason?.message);
        console.error('Data:', JSON.stringify(firstError.reason?.response?.data, null, 2));
      }
    }
    
    console.log(`   Batch ${batchNumber}/${totalBatches}: ✅ ${successful} success, ❌ ${failed} failed`);
    
    return { successful, failed };
  } catch (error) {
    console.error(`   Batch ${batchNumber} error:`, error.message);
    return { successful: 0, failed: transactions.length };
  }
}

// =====================================================
// MAIN FUNCTION
// =====================================================
async function generateTestTransactions() {
  const startTime = Date.now();
  
  console.log('\n════════════════════════════════════════════════════════');
  console.log('📊 TEST TRANSACTION GENERATOR');
  console.log('   July 1, 2025 → October 14, 2025');
  console.log('   50 Credit + 15 Debit per day');
  console.log('════════════════════════════════════════════════════════\n');
  
  try {
    // Step 1: Authenticate
    const token = await authenticate();
    
    // Step 2: Get ledgers
    const ledgers = await getLedgers(token);
    
    if (ledgers.length === 0) {
      throw new Error('No ledgers found. Please create ledgers first.');
    }
    
    // Step 3: Calculate total days and transactions
    const totalDays = differenceInDays(CONFIG.END_DATE, CONFIG.START_DATE) + 1; // +1 to include end date
    const transactionsPerDay = CONFIG.CREDIT_COUNT + CONFIG.DEBIT_COUNT;
    const totalTransactions = totalDays * transactionsPerDay;
    
    console.log(`\n📅 Date Range: ${format(CONFIG.START_DATE, 'MMM dd, yyyy')} to ${format(CONFIG.END_DATE, 'MMM dd, yyyy')}`);
    console.log(`📊 Total Days: ${totalDays}`);
    console.log(`💳 Transactions per Day: ${transactionsPerDay} (${CONFIG.CREDIT_COUNT} credit + ${CONFIG.DEBIT_COUNT} debit)`);
    console.log(`🎯 Total Transactions: ${totalTransactions.toLocaleString()}`);
    console.log(`📦 Batch Size: ${CONFIG.BATCH_SIZE}`);
    console.log(`\n🚀 Starting generation...\n`);
    
    // Step 4: Generate all transactions
    let allTransactions = [];
    let currentDate = new Date(CONFIG.START_DATE);
    
    console.log('📝 Generating transaction data...');
    
    while (currentDate <= CONFIG.END_DATE) {
      // Generate credit transactions
      for (let i = 0; i < CONFIG.CREDIT_COUNT; i++) {
        allTransactions.push(generateTransaction(currentDate, ledgers, true));
      }
      
      // Generate debit transactions
      for (let i = 0; i < CONFIG.DEBIT_COUNT; i++) {
        allTransactions.push(generateTransaction(currentDate, ledgers, false));
      }
      
      currentDate = addDays(currentDate, 1);
    }
    
    console.log(`✅ Generated ${allTransactions.length.toLocaleString()} transaction records\n`);
    
    // Step 5: Create transactions in batches
    console.log('💾 Creating transactions in database...\n');
    
    const batches = [];
    for (let i = 0; i < allTransactions.length; i += CONFIG.BATCH_SIZE) {
      batches.push(allTransactions.slice(i, i + CONFIG.BATCH_SIZE));
    }
    
    let totalSuccessful = 0;
    let totalFailed = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const result = await createTransactionsBatch(batches[i], token, i + 1, batches.length);
      totalSuccessful += result.successful;
      totalFailed += result.failed;
      
      // Progress indicator
      const progress = ((i + 1) / batches.length * 100).toFixed(1);
      console.log(`   Progress: ${progress}% (${totalSuccessful.toLocaleString()} created)`);
      
      // Delay between batches to avoid overloading
      if (i < batches.length - 1) {
        await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
      }
    }
    
    // Step 6: Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n════════════════════════════════════════════════════════');
    console.log('✅ TEST DATA GENERATION COMPLETE!');
    console.log('════════════════════════════════════════════════════════');
    console.log(`📊 Total Transactions: ${totalTransactions.toLocaleString()}`);
    console.log(`✅ Successfully Created: ${totalSuccessful.toLocaleString()}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`⚡ Rate: ${(totalSuccessful / parseFloat(duration)).toFixed(1)} transactions/second`);
    console.log('\n📅 Date Range Breakdown:');
    console.log(`   July 2025: 31 days × ${transactionsPerDay} = ${31 * transactionsPerDay} transactions`);
    console.log(`   August 2025: 31 days × ${transactionsPerDay} = ${31 * transactionsPerDay} transactions`);
    console.log(`   September 2025: 30 days × ${transactionsPerDay} = ${30 * transactionsPerDay} transactions`);
    console.log(`   October 2025: 14 days × ${transactionsPerDay} = ${14 * transactionsPerDay} transactions`);
    console.log('\n🎯 Perfect for testing:');
    console.log('   • Date-based pagination (one date per page)');
    console.log('   • Smart filtered views (show all when filtered)');
    console.log('   • Opening/Closing balance calculations');
    console.log('   • PDF generation with correct balances');
    console.log('   • Month-wise transaction analysis');
    console.log('════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// =====================================================
// RUN THE SCRIPT
// =====================================================
if (require.main === module) {
  generateTestTransactions()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { generateTestTransactions };
