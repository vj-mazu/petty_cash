/**
 * October 9-14 Test Data Generator
 * Creates 100 transactions per day (70 credit, 30 debit)
 * Perfect for testing pagination and daily limits
 */

const axios = require('axios');
const { format, addDays } = require('date-fns');

const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  AUTH_TOKEN: null,
  START_DATE: new Date(2025, 9, 9), // October 9, 2025
  END_DATE: new Date(2025, 9, 14),   // October 14, 2025
  TRANSACTIONS_PER_DAY: 100,
  CREDIT_COUNT: 70,  // 70% credit
  DEBIT_COUNT: 30    // 30% debit
};

// Sample data
const SAMPLE_DATA = {
  ledgerNames: [
    'Cash Account',
    'Bank Account - SBI',
    'Sales Revenue',
    'Purchase Expense',
    'Salary Expense',
    'Rent Income',
    'Investment Account',
    'Loan Account',
    'Customer Receivables',
    'Supplier Payables'
  ],
  remarks: [
    'Payment received from customer',
    'Office supplies purchase',
    'Salary payment',
    'Bank transfer',
    'Cash withdrawal',
    'Invoice payment',
    'Monthly rent',
    'Utility bill payment',
    'Investment return',
    'Loan repayment',
    'Sales transaction',
    'Purchase order',
    'Service charge',
    'Maintenance cost',
    'Equipment purchase'
  ]
};

// Utility functions
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomAmount = () => {
  // Generate realistic amounts with proper distribution
  const rand = Math.random();
  if (rand < 0.3) return randomBetween(100, 1000);      // 30% - Small
  if (rand < 0.6) return randomBetween(1000, 5000);     // 30% - Medium
  if (rand < 0.85) return randomBetween(5000, 25000);   // 25% - Large
  return randomBetween(25000, 100000);                   // 15% - Very large
};

// Login
async function login() {
  try {
    console.log('🔐 Logging in...');
    
    const response = await axios.post(`${CONFIG.API_BASE_URL}/auth/login`, {
      email: 'admin1',
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
    return false;
  }
}

// Ensure ledgers exist
async function ensureLedgers() {
  try {
    console.log('📋 Setting up ledgers...');
    
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
    
    // Create missing ledgers
    for (const ledgerName of SAMPLE_DATA.ledgerNames) {
      if (!ledgerMap[ledgerName]) {
        try {
          const createResponse = await axios.post(
            `${CONFIG.API_BASE_URL}/ledgers`,
            { name: ledgerName, ledgerType: 'asset' },
            { headers }
          );
          ledgerMap[ledgerName] = createResponse.data.data.ledger.id;
        } catch (err) {
          console.warn(`   Warning: Could not create ledger "${ledgerName}"`);
        }
      }
    }
    
    const ledgerIds = Object.values(ledgerMap);
    console.log(`✅ Ledgers ready: ${ledgerIds.length} available`);
    return ledgerIds;
  } catch (error) {
    console.error('❌ Error ensuring ledgers:', error.message);
    return [];
  }
}

// Generate single transaction
function generateTransaction(ledgerIds, date, isCredit) {
  const amount = randomAmount();
  
  return {
    ledgerId: randomElement(ledgerIds),
    date: format(date, 'yyyy-MM-dd'),
    debitAmount: isCredit ? 0 : amount,
    creditAmount: isCredit ? amount : 0,
    type: isCredit ? 'credit' : 'debit',
    remarks: randomElement(SAMPLE_DATA.remarks),
    transactionType: 'regular',
    referenceNumber: `OCT-TEST-${format(date, 'MMdd')}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
  };
}

// Create transactions for a single day
async function createDayTransactions(ledgerIds, date) {
  const headers = {
    'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  const dateStr = format(date, 'MMM dd, yyyy');
  console.log(`\n📅 ${dateStr}`);
  console.log('   Generating transactions...');
  
  let created = 0;
  let failed = 0;
  
  // Generate 70 credit transactions
  for (let i = 0; i < CONFIG.CREDIT_COUNT; i++) {
    const transaction = generateTransaction(ledgerIds, date, true);
    
    try {
      const response = await axios.post(
        `${CONFIG.API_BASE_URL}/transactions`,
        transaction,
        { headers }
      );
      
      if (response.data.success) {
        created++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
    
    // Progress indicator every 10 transactions
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`\r   Credits: ${i + 1}/${CONFIG.CREDIT_COUNT}...`);
    }
  }
  
  console.log(`\r   Credits: ${CONFIG.CREDIT_COUNT}/${CONFIG.CREDIT_COUNT} ✅`);
  
  // Generate 30 debit transactions
  for (let i = 0; i < CONFIG.DEBIT_COUNT; i++) {
    const transaction = generateTransaction(ledgerIds, date, false);
    
    try {
      const response = await axios.post(
        `${CONFIG.API_BASE_URL}/transactions`,
        transaction,
        { headers }
      );
      
      if (response.data.success) {
        created++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
    
    // Progress indicator every 10 transactions
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`\r   Debits: ${i + 1}/${CONFIG.DEBIT_COUNT}...`);
    }
  }
  
  console.log(`\r   Debits: ${CONFIG.DEBIT_COUNT}/${CONFIG.DEBIT_COUNT} ✅`);
  console.log(`   ✅ Day complete: ${created} created, ${failed} failed`);
  
  return { created, failed };
}

// Main execution
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  OCTOBER 9-14 TEST DATA GENERATOR');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`📅 Date Range: Oct 09 to Oct 14, 2025`);
  console.log(`📊 Total Days: 6 days`);
  console.log(`🔢 Per Day: ${CONFIG.TRANSACTIONS_PER_DAY} transactions`);
  console.log(`   ├─ 💚 Credits: ${CONFIG.CREDIT_COUNT} (70%)`);
  console.log(`   └─ 🔴 Debits: ${CONFIG.DEBIT_COUNT} (30%)`);
  console.log(`📈 Grand Total: ${CONFIG.TRANSACTIONS_PER_DAY * 6} transactions`);
  console.log('');
  
  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Setup ledgers
  const ledgerIds = await ensureLedgers();
  if (ledgerIds.length === 0) {
    console.error('❌ No ledgers available');
    process.exit(1);
  }
  
  console.log('');
  console.log('─────────────────────────────────────────────────────');
  console.log('🚀 Starting transaction generation...');
  console.log('─────────────────────────────────────────────────────');
  
  const startTime = Date.now();
  let totalCreated = 0;
  let totalFailed = 0;
  
  // Generate transactions for each day
  let currentDate = new Date(CONFIG.START_DATE);
  const endDate = new Date(CONFIG.END_DATE);
  
  while (currentDate <= endDate) {
    const result = await createDayTransactions(ledgerIds, currentDate);
    totalCreated += result.created;
    totalFailed += result.failed;
    
    // Move to next day
    currentDate = addDays(currentDate, 1);
    
    // Small delay to avoid overwhelming server
    if (currentDate <= endDate) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const endTime = Date.now();
  const totalSeconds = Math.round((endTime - startTime) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  GENERATION COMPLETE!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`✅ Created: ${totalCreated} transactions`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⏱️  Time: ${minutes}m ${seconds}s`);
  console.log('');
  console.log('📊 Breakdown by Day:');
  console.log('   Oct 09: ~100 transactions (70 credit, 30 debit)');
  console.log('   Oct 10: ~100 transactions (70 credit, 30 debit)');
  console.log('   Oct 11: ~100 transactions (70 credit, 30 debit)');
  console.log('   Oct 12: ~100 transactions (70 credit, 30 debit)');
  console.log('   Oct 13: ~100 transactions (70 credit, 30 debit)');
  console.log('   Oct 14: ~100 transactions (70 credit, 30 debit)');
  console.log('');
  console.log('💡 Test your pagination:');
  console.log('   1. Filter by Oct 13 - should show 100 transactions');
  console.log('   2. Check pagination controls appear');
  console.log('   3. Export to PDF - verify calculations');
  console.log('   4. UI should show 70 credits and 30 debits per day');
  console.log('');
}

main().catch(error => {
  console.error('');
  console.error('❌ Fatal error:', error.message);
  console.error('');
  process.exit(1);
});
