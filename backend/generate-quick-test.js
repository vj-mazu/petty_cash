/**
 * QUICK TEST - 1,000 Transactions
 * 
 * Purpose: Quick test with 1,000 transactions (runs in ~2 minutes)
 * Use this first to verify everything works before running the full 35,000
 * 
 * HOW TO RUN:
 * 1. Make sure backend server is running
 * 2. Run: node generate-quick-test.js
 * 3. Takes about 2 minutes
 */

const axios = require('axios');
const { format, addDays } = require('date-fns');

// Configuration - SMALLER TEST
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  AUTH_TOKEN: null,
  TOTAL_TRANSACTIONS: 1000, // Only 1,000 for quick test
  START_DATE: new Date(2025, 8, 1), // September 1, 2025
  END_DATE: new Date(2025, 9, 14), // October 14, 2025
  BATCH_SIZE: 50,
  DELAY_BETWEEN_BATCHES: 500, // Faster - 0.5 second delay
};

// Sample data
const SAMPLE_DATA = {
  ledgerNames: [
    'Test Store A', 'Test Store B', 'Test Bank', 'Test Cash',
    'Test Supplier', 'Test Customer', 'Test Expenses', 'Test Income'
  ],
  remarks: [
    'Test payment', 'Test sale', 'Test purchase', 'Test expense',
    'Test deposit', 'Test withdrawal', null, null
  ]
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (array) => array[Math.floor(Math.random() * array.length)];
const randomDate = (start, end) => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
};
const randomAmount = () => {
  const amounts = [
    randomBetween(100, 1000),
    randomBetween(1000, 5000),
    randomBetween(5000, 25000),
    randomBetween(25000, 50000)
  ];
  return randomElement(amounts);
};

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
      console.log('   Trying regular auth...');
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
    }
    return false;
  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.message || error.message);
    console.error('   Check: Backend running? http://localhost:5000/api/health');
    return false;
  }
}

async function ensureLedgers() {
  try {
    console.log('📋 Setting up test ledgers...');
    
    const headers = {
      'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    const response = await axios.get(`${CONFIG.API_BASE_URL}/ledgers?limit=100`, { headers });
    const existingLedgers = response.data.data?.ledgers || [];
    
    const ledgerMap = {};
    existingLedgers.forEach(ledger => {
      ledgerMap[ledger.name] = ledger.id;
    });
    
    for (const ledgerName of SAMPLE_DATA.ledgerNames) {
      if (!ledgerMap[ledgerName]) {
        const createResponse = await axios.post(
          `${CONFIG.API_BASE_URL}/ledgers`,
          {
            name: ledgerName,
            ledgerType: 'asset',
            openingBalance: 0
          },
          { headers }
        );
        
        if (createResponse.data.success) {
          ledgerMap[ledgerName] = createResponse.data.data.id;
        }
        await sleep(100);
      }
    }
    
    console.log(`✅ Ledgers ready: ${Object.keys(ledgerMap).length} available`);
    return Object.values(ledgerMap);
  } catch (error) {
    console.error('❌ Error ensuring ledgers:', error.message);
    return [];
  }
}

function generateTransaction(ledgerIds, date) {
  // 80% credit, 20% debit
  const isCredit = Math.random() > 0.2;
  const amount = randomAmount();
  
  return {
    ledgerId: randomElement(ledgerIds),
    date: format(date, 'yyyy-MM-dd'),
    debitAmount: isCredit ? 0 : amount,
    creditAmount: isCredit ? amount : 0,
    type: isCredit ? 'credit' : 'debit',
    remarks: randomElement(SAMPLE_DATA.remarks),
    transactionType: 'regular',
    referenceNumber: `QUICKTEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
}

async function createTransactionsBatch(ledgerIds, transactions) {
  const headers = {
    'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  const results = { success: 0, failed: 0, errors: [] };
  
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
        if (results.errors.length < 3) {
          results.errors.push(response.data.message || 'Unknown error');
        }
      }
    } catch (error) {
      results.failed++;
      if (results.errors.length < 3) {
        results.errors.push(error.response?.data?.message || error.message);
      }
    }
  }
  
  return results;
}

async function generateAllTransactions() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  QUICK TEST - 1,000 Transactions');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`📅 Date Range: ${format(CONFIG.START_DATE, 'MMM dd, yyyy')} to ${format(CONFIG.END_DATE, 'MMM dd, yyyy')}`);
  console.log(`📊 Total: ${CONFIG.TOTAL_TRANSACTIONS.toLocaleString()} (quick test)`);
  console.log(`⏱️  Expected Time: ~2 minutes`);
  console.log('');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  const ledgerIds = await ensureLedgers();
  if (ledgerIds.length === 0) {
    console.error('❌ No ledgers available');
    process.exit(1);
  }
  
  console.log('');
  console.log('🚀 Starting quick test generation...');
  console.log('');
  
  let totalCreated = 0;
  let totalFailed = 0;
  const startTime = Date.now();
  
  const totalBatches = Math.ceil(CONFIG.TOTAL_TRANSACTIONS / CONFIG.BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const transactionsInBatch = Math.min(
      CONFIG.BATCH_SIZE,
      CONFIG.TOTAL_TRANSACTIONS - totalCreated
    );
    
    const batch = [];
    for (let i = 0; i < transactionsInBatch; i++) {
      const randomTxDate = randomDate(CONFIG.START_DATE, CONFIG.END_DATE);
      const transaction = generateTransaction(ledgerIds, randomTxDate);
      batch.push(transaction);
    }
    
    const results = await createTransactionsBatch(ledgerIds, batch);
    totalCreated += results.success;
    totalFailed += results.failed;
    
    // Log first batch errors
    if (batchIndex === 0 && results.errors.length > 0) {
      console.log('⚠️  Sample errors:');
      results.errors.forEach(err => console.log(`   - ${err}`));
    }
    
    const progress = ((totalCreated + totalFailed) / CONFIG.TOTAL_TRANSACTIONS * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    
    console.log(`📈 ${totalCreated}/${CONFIG.TOTAL_TRANSACTIONS} (${progress}%) | Time: ${elapsed}s`);
    
    if (batchIndex < totalBatches - 1) {
      await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
    }
  }
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0);
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  QUICK TEST COMPLETE!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`✅ Created: ${totalCreated.toLocaleString()} transactions`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⏱️  Time: ${totalTime} seconds`);
  console.log('');
  console.log('💡 Everything working? Run the full 35,000 test:');
  console.log('   node generate-test-transactions.js');
  console.log('');
}

process.on('SIGINT', () => {
  console.log('\n⚠️  Test interrupted');
  process.exit(0);
});

generateAllTransactions().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
