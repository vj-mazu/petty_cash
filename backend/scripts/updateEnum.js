require('dotenv').config();
const sequelize = require('../config/database');

async function updateEnum() {
  try {
    console.log('🔄 Updating user role enum...');
    
    // Add new values to the enum type
    await sequelize.query("ALTER TYPE enum_users_role ADD VALUE 'admin1'");
    await sequelize.query("ALTER TYPE enum_users_role ADD VALUE 'admin2'");
    await sequelize.query("ALTER TYPE enum_users_role ADD VALUE 'admin3'");
    await sequelize.query("ALTER TYPE enum_users_role ADD VALUE 'staff'");
    
    console.log('✅ Role enum updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateEnum();