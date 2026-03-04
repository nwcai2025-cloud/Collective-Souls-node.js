const { User, AdminUser, AdminRole } = require('../models');

async function syncAdminUsers() {
  console.log('Syncing admin users...');
  try {
    // 1. Ensure default roles exist
    await AdminRole.seedDefaultRoles();
    const superAdminRole = await AdminRole.findOne({ where: { name: 'super_admin' } });
    const adminRole = await AdminRole.findOne({ where: { name: 'moderator' } });

    // 2. Find all staff/superusers
    const admins = await User.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { is_staff: true },
          { is_superuser: true }
        ]
      }
    });

    console.log(`Found ${admins.length} admin users in main table.`);

    for (const admin of admins) {
      const [adminUser, created] = await AdminUser.findOrCreate({
        where: { user_id: admin.id },
        defaults: {
          user_id: admin.id,
          role_id: admin.is_superuser ? superAdminRole.id : adminRole.id,
          is_active: true
        }
      });
      if (created) console.log(`Created admin_user record for ${admin.username}`);
    }

    console.log('Admin users sync completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error syncing admin users:', error);
    process.exit(1);
  }
}

syncAdminUsers();