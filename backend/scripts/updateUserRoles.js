const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function updateUserRoles() {
  try {
    console.log('🔄 Updating user roles...');

    // Create or update admin1 user
    const admin1Password = await bcrypt.hash('Admin123!', 12);
    await User.upsert({
      username: 'admin1',
      email: 'admin1@petticash.com',
      password: admin1Password,
      role: 'admin1',
      isActive: true
    });

    // Create or update admin2 user
    const admin2Password = await bcrypt.hash('Admin123!', 12);
    await User.upsert({
      username: 'admin2',
      email: 'admin2@petticash.com',
      password: admin2Password,
      role: 'admin2',
      isActive: true
    });

    // Create or update admin3 user
    const admin3Password = await bcrypt.hash('Admin123!', 12);
    await User.upsert({
      username: 'admin3',
      email: 'admin3@petticash.com',
      password: admin3Password,
      role: 'admin3',
      isActive: true
    });

    // Create or update staff user
    const staffPassword = await bcrypt.hash('Staff123!', 12);
    await User.upsert({
      username: 'staff',
      email: 'staff@petticash.com',
      password: staffPassword,
      role: 'staff',
      isActive: true
    });

    // Update existing admin users to admin1
    await User.update(
      { role: 'admin1' },
      { 
        where: { 
          role: 'admin'
        }
      }
    );

    console.log('✅ User roles updated successfully!');
    console.log('📋 Available users:');
    console.log('   - admin1@petticash.com / Admin123! (Admin Level 1 - Highest)');
    console.log('   - admin2@petticash.com / Admin123! (Admin Level 2)');
    console.log('   - admin3@petticash.com / Admin123! (Admin Level 3)');
    console.log('   - staff@petticash.com / Staff123! (Staff - Data Entry Only)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user roles:', error);
    process.exit(1);
  }
}

updateUserRoles();