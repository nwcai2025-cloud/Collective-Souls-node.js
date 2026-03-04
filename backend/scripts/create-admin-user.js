const { sequelize } = require('../config/database');
const { User } = require('../models');
const { AdminRole, AdminUser } = require('../models/Admin');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    console.log('🚀 Creating default admin user...');

    // First, ensure admin roles exist
    await AdminRole.seedDefaultRoles();
    console.log('✅ Admin roles seeded');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      return;
    }

    // Create default admin user
    const adminPassword = 'admin123'; // Change this in production!
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@collectivesouls.com',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      age: 30,
      bio: 'System Administrator',
      spiritual_intention: 'Managing the platform',
      is_active: true,
      is_admin: true
    });

    console.log('✅ Admin user created:', adminUser.username);

    // Get the super_admin role
    const superAdminRole = await AdminRole.findOne({
      where: { name: 'super_admin' }
    });

    if (superAdminRole) {
      // Create admin user record
      await AdminUser.create({
        user_id: adminUser.id,
        role_id: superAdminRole.id,
        is_active: true
      });

      console.log('✅ Admin user assigned to super_admin role');
    }

    console.log('\n📋 Admin credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the default password in production!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };