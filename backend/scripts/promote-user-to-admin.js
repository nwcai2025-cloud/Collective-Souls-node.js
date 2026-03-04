const { sequelize } = require('../config/database');
const { User } = require('../models');
const { AdminRole, AdminUser } = require('../models/Admin');

async function promoteUserToAdmin(username) {
  try {
    console.log(`🚀 Promoting user "${username}" to admin...`);

    // Find the user
    const user = await User.findOne({
      where: { username: username }
    });

    if (!user) {
      console.log(`❌ User "${username}" not found`);
      return;
    }

    // Check if already admin
    const existingAdmin = await AdminUser.findOne({
      where: { user_id: user.id }
    });

    if (existingAdmin) {
      console.log(`✅ User "${username}" is already an admin`);
      return;
    }

    // Get the super_admin role
    const superAdminRole = await AdminRole.findOne({
      where: { name: 'super_admin' }
    });

    if (!superAdminRole) {
      console.log('❌ Super admin role not found');
      return;
    }

    // Create admin user record
    const adminUser = await AdminUser.create({
      user_id: user.id,
      role_id: superAdminRole.id,
      is_active: true
    });

    console.log(`✅ User "${username}" promoted to admin successfully!`);
    console.log('Admin User ID:', adminUser.id);
    console.log('Role:', superAdminRole.name);

  } catch (error) {
    console.error('❌ Error promoting user to admin:', error);
  } finally {
    await sequelize.close();
  }
}

// Get username from command line argument or use default
const username = process.argv[2] || 'bob';

if (require.main === module) {
  promoteUserToAdmin(username);
}

module.exports = { promoteUserToAdmin };