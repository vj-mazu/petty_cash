/**
 * Delete Test Transactions Script
 * Safely removes test transactions created by the test data generators
 */

const axios = require('axios');

const CONFIG = {
  API_BASE_URL: 'http://localhost:5000/api',
  AUTH_TOKEN: null
};

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

async function deleteTestTransactions() {
  try {
    const headers = {
      'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    console.log('🔍 Fetching all transactions...');
    
    // Get all transactions (using a large limit)
    const response = await axios.get(
      `${CONFIG.API_BASE_URL}/transactions?limit=50000&page=1`,
      { headers }
    );
    
    const transactions = response.data.data?.transactions || [];
    
    if (transactions.length === 0) {
      console.log('✅ No transactions found to delete');
      return;
    }
    
    console.log(`📊 Found ${transactions.length} transactions`);
    
    // Filter test transactions (those with TEST or QUICKTEST reference numbers)
    const testTransactions = transactions.filter(tx => 
      tx.referenceNumber && 
      (tx.referenceNumber.startsWith('TEST-') || 
       tx.referenceNumber.startsWith('QUICKTEST-'))
    );
    
    if (testTransactions.length === 0) {
      console.log('✅ No test transactions found');
      console.log(`   (Total transactions in system: ${transactions.length})`);
      return;
    }
    
    console.log(`🗑️  Found ${testTransactions.length} test transactions to delete`);
    console.log(`   (Keeping ${transactions.length - testTransactions.length} non-test transactions)`);
    console.log('');
    
    // Confirm deletion
    console.log('⚠️  Are you sure you want to delete these test transactions?');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('');
    console.log('🚀 Starting deletion...');
    
    let deleted = 0;
    let failed = 0;
    
    for (let i = 0; i < testTransactions.length; i++) {
      const tx = testTransactions[i];
      
      try {
        await axios.delete(
          `${CONFIG.API_BASE_URL}/transactions/${tx.id}`,
          { headers }
        );
        deleted++;
        
        if ((i + 1) % 100 === 0) {
          console.log(`   Progress: ${i + 1}/${testTransactions.length} (${deleted} deleted, ${failed} failed)`);
        }
      } catch (error) {
        failed++;
      }
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  DELETION COMPLETE');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Deleted: ${deleted} test transactions`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Remaining: ${transactions.length - deleted} total transactions`);
    
  } catch (error) {
    console.error('❌ Error during deletion:', error.message);
    if (error.response) {
      console.error('   Server response:', error.response.data);
    }
  }
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  DELETE TEST TRANSACTIONS');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  await deleteTestTransactions();
}

main();
