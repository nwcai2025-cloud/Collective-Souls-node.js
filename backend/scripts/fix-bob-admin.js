const { sequelize } = require('../config/database');
const { User } = require('../models');
const { AdminRole, AdminUser } = require('../models/Admin');

async function fixBobAdmin() {
  try {
    console.log('🚀 Fixing admin privileges for user "bob"...');

    // Find the user
    const user = await User.findOne({
      where: { username: 'bob' }
    });

    if (!user) {
      console.log('❌ User "bob" not found');
      return;
    }

    // Update User flags
    await user.update({
      is_staff: true,
      is_superuser: true
    });
    console.log('✅ User "bob" flags updated (is_staff=true, is_superuser=true)');

    // Ensure admin roles exist
    await AdminRole.seedDefaultRoles();

    // Check if already in AdminUser table
    let adminUser = await AdminUser.findOne({
      where: { user_id: user.id }
    });

    if (!adminUser) {
      const superAdminRole = await AdminRole.findOne({
        where: { name: 'super_admin' }
      });

      if (superAdminRole) {
        adminUser = await AdminUser.create({
          user_id: user.id,
          role_id: superAdminRole.id,
          is_active: true
        });
        console.log('✅ User "bob" added to AdminUser table');
      }
    } else {
      console.log('ℹ️ User "bob" already exists in AdminUser table');
    }

    console.log('🚀 Done! Bob should now have full admin access.');

  } catch (error) {
    console.error('❌ Error fixing admin privileges:', error);
  } finally {
    await sequelize.close();
  }
}

fixBobAdmin();