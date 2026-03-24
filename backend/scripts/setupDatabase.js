// Database setup script - Creates tables and initial data
const { sequelize, User, Ledger, Transaction, SystemSettings, OpeningBalance, AnamathEntry } = require('../models');
const bcrypt = require('bcryptjs');

const setupDatabase = async () => {
  try {
    console.log('🚀 Starting database setup...');

    // Test database connection
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Create all tables (force: true will drop and recreate)
    console.log('🏗️  Creating database tables...');
    await sequelize.sync({ force: true });
    console.log('✅ All tables created successfully');

    // Create default users with different roles
    console.log('👤 Creating default users...');

    const defaultUsers = [
      {
        username: 'admin1',
        email: 'admin1@cashmanagement.com',
        password: 'admin123',
        role: 'admin1'
      },
      {
        username: 'admin2',
        email: 'admin2@cashmanagement.com',
        password: 'admin123',
        role: 'admin2'
      },
      {
        username: 'admin3',
        email: 'admin3@cashmanagement.com',
        password: 'admin123',
        role: 'admin3'
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

    const adminUser = createdUsers[0]; // Use admin1 as the creator

    // Create default system settings
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

    console.log('📊 No ledgers created - clean database setup');
    console.log('💰 No transactions created - clean database setup');
    console.log('� No tanamath entries created - clean database setup');

    console.log('\n🎉 Clean database setup completed successfully!');
    console.log('\n�r Login Credentials:');
    console.log('   Admin1 - Username: admin1, Password: admin123 (Full Access)');
    console.log('   Admin2 - Username: admin2, Password: admin123 (Full Access)');
    console.log('   Admin3 - Username: admin3, Password: admin123 (Full Access)');
    console.log('   Staff  - Username: staff,  Password: staff123 (Data Entry Only)');
    console.log('\n🌐 You can now start the server and login to the application');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.error('Error details:', error.message);

    if (error.name === 'SequelizeConnectionError') {
      console.log('\n🔧 Connection Error Solutions:');
      console.log('1. Make sure PostgreSQL is running');
      console.log('2. Check database credentials in .env file');
      console.log('3. Ensure database "cash_management" exists');
      console.log('4. Verify PostgreSQL is accessible on localhost:5432');
    }
  } finally {
    await sequelize.close();
    process.exit();
  }
};

// Run the setup
setupDatabase();