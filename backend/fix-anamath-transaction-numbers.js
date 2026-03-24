const sequelize = require('./config/database');
const { AnamathEntry } = require('./models');

async function fixAnamathTransactionNumbers() {
  try {
    console.log('🔍 Checking anamath entries transaction numbers...');
    
    // Find all anamath entries without transaction numbers
    const entriesWithoutNumbers = await AnamathEntry.findAll({
      where: {
        transactionNumber: null
      },
      order: [['createdAt', 'ASC']]
    });
    
    console.log(`Found ${entriesWithoutNumbers.length} anamath entries without transaction numbers`);
    
    if (entriesWithoutNumbers.length === 0) {
      console.log('✅ All anamath entries already have transaction numbers');
      return;
    }
    
    // Find the highest existing transaction number
    const maxResult = await AnamathEntry.findOne({
      attributes: [[sequelize.fn('MAX', sequelize.col('transaction_number')), 'maxNumber']],
      raw: true
    });
    
    let nextNumber = (maxResult?.maxNumber || 0) + 1;
    console.log(`Starting transaction numbers from: ${nextNumber}`);
    
    // Update each entry with sequential transaction numbers
    for (const entry of entriesWithoutNumbers) {
      await entry.update({ transactionNumber: nextNumber });
      console.log(`✅ Updated anamath entry ${entry.id.substring(0, 8)}... with transaction number ${nextNumber} (A${String(nextNumber).padStart(3, '0')})`);
      nextNumber++;
    }
    
    console.log('🎉 Successfully fixed all anamath transaction numbers!');
    
  } catch (error) {
    console.error('❌ Error fixing anamath transaction numbers:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the fix
fixAnamathTransactionNumbers();