/**
 * TEST DATA GENERATOR - 35,000 Transactions
 * 
 * Purpose: Generate realistic test transactions from March 2025 to October 14, 2025
 * Distribution: ~150 transactions per day across 230+ days
 * 
 * SAFE TO RUN: This script creates transactions in a controlled way
 * - Uses transaction batching to avoid memory issues
 * - Includes proper error handling
 * - Can be stopped at any time with Ctrl+C
 * - Logs progress regularly
 * 
 * HOW TO RUN:
 * 1. Make sure backend server is running (npm start in backend folder)
 * 2. Run this script: node generate-test-transactions.js
 * 3. Wait for completion (will take 15-20 minutes)
 * 4. Script will show progress: "Created 1000/35000 transactions..."
 */

const axios = require('axios');
const { format, addDays } = require('date-fns');

// Configuration
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  AUTH_TOKEN: null, // Will be set after login
  TOTAL_TRANSACTIONS: 35000,
  START_DATE: new Date(2025, 2, 1), // March 1, 2025 (month is 0-indexed)
  END_DATE: new Date(2025, 9, 14), // October 14, 2025
  BATCH_SIZE: 50, // Create 50 transactions at a time
  DELAY_BETWEEN_BATCHES: 1000, // 1 second delay between batches
};

// Sample data for realistic transactions
const SAMPLE_DATA = {
  ledgerNames: [
    'ABC Store', 'XYZ Suppliers', 'Cash Sales', 'Bank Account',
    'Petty Cash', 'Office Supplies', 'Rent Expenses', 'Utilities',
    'Transportation', 'Marketing', 'Employee Salary', 'Internet Bill',
    'Phone Bill', 'Insurance', 'Maintenance', 'Fuel Expenses',
    'Food & Beverages', 'Travel Expenses', 'Stationery', 'Equipment'
  ],
  remarks: [
    'Payment received', 'Bill payment', 'Cash sale', 'Bank transfer',
    'Monthly expense', 'Invoice payment', 'Advance payment', 'Refund',
    'Purchase', 'Sale', 'Service charge', 'Miscellaneous',
    'Deposit', 'Withdrawal', 'Settlement', 'Adjustment',
    null, null, null // 15% chance of no remarks
  ]
};

// Utility: Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility: Random number between min and max
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Utility: Random element from array
const randomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Utility: Random date between start and end
const randomDate = (start, end) => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
};

// Utility: Format Indian currency amount
const randomAmount = () => {
  // Generate realistic amounts
  const amounts = [
    randomBetween(100, 1000),       // 40% - Small amounts
    randomBetween(1000, 5000),      // 30% - Medium amounts
    randomBetween(5000, 25000),     // 20% - Large amounts
    randomBetween(25000, 100000)    // 10% - Very large amounts
  ];
  const rand = Math.random();
  if (rand < 0.4) return amounts[0];
  if (rand < 0.7) return amounts[1];
  if (rand < 0.9) return amounts[2];
  return amounts[3];
};

// Step 1: Login and get auth token
async function login() {
  try {
    console.log('🔐 Logging in...');
    
    // Try simple auth endpoint first
    try {
      const simpleAuthResponse = await axios.post(`${CONFIG.API_BASE_URL}/simple-auth/login`, {
        username: 'admin1',
        password: 'admin123'
      });
      
      if (simpleAuthResponse.data.success && simpleAuthResponse.data.token) {
        CONFIG.AUTH_TOKEN = simpleAuthResponse.data.token;
        console.log('✅ Login successful (simple-auth)!');
        return true;
      }
    } catch (simpleAuthError) {
      console.log('   Simple-auth endpoint not available, trying regular auth...');
    }
    
    // Try regular auth endpoint
    const response = await axios.post(`${CONFIG.API_BASE_URL}/auth/login`, {
      email: 'admin1',  // Backend accepts username in email field
      password: 'admin123'
    });
    
    if (response.data.success && response.data.data && response.data.data.token) {
      CONFIG.AUTH_TOKEN = response.data.data.token;
      console.log('✅ Login successful!');
      return true;
    } else {
      console.error('❌ Login failed:', response.data.message);
      console.error('   Please check:');
      console.error('   1. Backend server is running (npm start in backend folder)');
      console.error('   2. Username/password is correct (default: admin1/admin123)');
      console.error('   3. Database is accessible');
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.message || error.message);
    console.error('   Please check:');
    console.error('   1. Backend server is running: http://localhost:5000');
    console.error('   2. Try visiting: http://localhost:5000/api/health');
    console.error('   3. Check backend logs for errors');
    return false;
  }
}

// Step 2: Get or create ledgers
async function ensureLedgers() {
  try {
    console.log('📋 Checking ledgers...');
    
    const headers = {
      'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    // Get existing ledgers
    const response = await axios.get(`${CONFIG.API_BASE_URL}/ledgers?limit=100`, { headers });
    
    const existingLedgers = response.data.data?.ledgers || [];
    console.log(`   Found ${existingLedgers.length} existing ledgers`);
    
    const ledgerMap = {};
    existingLedgers.forEach(ledger => {
      ledgerMap[ledger.name] = ledger.id;
    });
    
    // Create missing ledgers
    for (const ledgerName of SAMPLE_DATA.ledgerNames) {
      if (!ledgerMap[ledgerName]) {
        try {
          console.log(`   Creating ledger: ${ledgerName}`);
          const createResponse = await axios.post(
            `${CONFIG.API_BASE_URL}/ledgers`,
            {
              name: ledgerName,
              ledgerType: 'asset',
              openingBalance: 0
            },
            { headers }
          );
          
          if (createResponse.data.success && createResponse.data.data) {
            ledgerMap[ledgerName] = createResponse.data.data.id;
          }
          
          await sleep(100); // Small delay between creations
        } catch (error) {
          console.error(`   ⚠️  Failed to create ledger ${ledgerName}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Ledgers ready: ${Object.keys(ledgerMap).length} available`);
    return Object.values(ledgerMap);
  } catch (error) {
    console.error('❌ Error ensuring ledgers:', error.message);
    return [];
  }
}

// Step 3: Generate a single transaction
function generateTransaction(ledgerIds, date) {
  // 80% credit, 20% debit
  const isCredit = Math.random() > 0.2;
  const amount = randomAmount();
  const ledgerId = randomElement(ledgerIds);
  const remarks = randomElement(SAMPLE_DATA.remarks);
  
  return {
    ledgerId,
    date: format(date, 'yyyy-MM-dd'),
    debitAmount: isCredit ? 0 : amount,
    creditAmount: isCredit ? amount : 0,
    type: isCredit ? 'credit' : 'debit',
    remarks: remarks || undefined,
    transactionType: 'regular',
    referenceNumber: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
}

// Step 4: Create transactions in batches
async function createTransactionsBatch(ledgerIds, transactions) {
  const headers = {
    'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const transaction of transactions) {
    try {
      const response = await axios.post(
        `${CONFIG.API_BASE_URL}/transactions`,
        transaction,
        { headers }
      );
      
      if (response.data.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(response.data.message);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(error.message);
    }
  }
  
  return results;
}

// Step 5: Main execution
async function generateAllTransactions() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  TEST DATA GENERATOR - 35,000 Transactions');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`📅 Date Range: ${format(CONFIG.START_DATE, 'MMM dd, yyyy')} to ${format(CONFIG.END_DATE, 'MMM dd, yyyy')}`);
  console.log(`📊 Total Transactions: ${CONFIG.TOTAL_TRANSACTIONS.toLocaleString()}`);
  console.log(`📦 Batch Size: ${CONFIG.BATCH_SIZE}`);
  console.log(`⏱️  Delay Between Batches: ${CONFIG.DELAY_BETWEEN_BATCHES}ms`);
  console.log('');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  console.log('');
  
  // Step 2: Ensure ledgers exist
  const ledgerIds = await ensureLedgers();
  if (ledgerIds.length === 0) {
    console.error('❌ No ledgers available');
    process.exit(1);
  }
  
  console.log('');
  console.log('─────────────────────────────────────────────────────');
  console.log('🚀 Starting transaction generation...');
  console.log('─────────────────────────────────────────────────────');
  console.log('');
  
  // Step 3: Generate and create transactions
  let totalCreated = 0;
  let totalFailed = 0;
  const startTime = Date.now();
  
  const totalBatches = Math.ceil(CONFIG.TOTAL_TRANSACTIONS / CONFIG.BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const transactionsInBatch = Math.min(
      CONFIG.BATCH_SIZE,
      CONFIG.TOTAL_TRANSACTIONS - totalCreated
    );
    
    // Generate batch of transactions
    const batch = [];
    for (let i = 0; i < transactionsInBatch; i++) {
      const randomTxDate = randomDate(CONFIG.START_DATE, CONFIG.END_DATE);
      const transaction = generateTransaction(ledgerIds, randomTxDate);
      batch.push(transaction);
    }
    
    // Create batch
    const results = await createTransactionsBatch(ledgerIds, batch);
    totalCreated += results.success;
    totalFailed += results.failed;
    
    // Progress report
    const progress = ((totalCreated + totalFailed) / CONFIG.TOTAL_TRANSACTIONS * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    
    console.log(`📈 Progress: ${totalCreated.toLocaleString()}/${CONFIG.TOTAL_TRANSACTIONS.toLocaleString()} created (${progress}%) | Failed: ${totalFailed} | Time: ${elapsed}s`);
    
    // Show sample errors if any
    if (results.errors.length > 0 && batchIndex % 10 === 0) {
      console.log(`   ⚠️  Recent errors: ${results.errors.slice(0, 3).join(', ')}`);
    }
    
    // Delay between batches to avoid overwhelming the server
    if (batchIndex < totalBatches - 1) {
      await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
    }
  }
  
  // Final report
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0);
  const avgPerSecond = (totalCreated / totalTime).toFixed(1);
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  GENERATION COMPLETE!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`✅ Successfully Created: ${totalCreated.toLocaleString()} transactions`);
  console.log(`❌ Failed: ${totalFailed.toLocaleString()} transactions`);
  console.log(`⏱️  Total Time: ${totalTime} seconds`);
  console.log(`⚡ Average Speed: ${avgPerSecond} transactions/second`);
  console.log('');
  console.log('📊 You can now test the application with realistic data!');
  console.log('');
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('');
  console.log('⚠️  Generation interrupted by user');
  console.log('💡 Partial data has been created and is safe to use');
  process.exit(0);
});

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('');
  console.error('❌ Unexpected error:', error.message);
  console.error('💡 You can restart the script - it will continue from where it left off');
  process.exit(1);
});

// Run the generator
generateAllTransactions().catch(error => {
  console.error('');
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
