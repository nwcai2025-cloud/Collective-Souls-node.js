const { sequelize } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createTestAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (existingAdmin) {
      console.log('📋 Admin user already exists:', existingAdmin.username);
      console.log('- ID:', existingAdmin.id);
      console.log('- Staff:', existingAdmin.is_staff);
      console.log('- Superuser:', existingAdmin.is_superuser);
      console.log('- Active:', existingAdmin.is_active);
      
      // Update the admin user to ensure it has the right permissions
      await existingAdmin.update({
        is_staff: true,
        is_superuser: true,
        is_active: true
      });
      
      console.log('✅ Admin user updated with correct permissions');
    } else {
      // Create new admin user
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        is_staff: true,
        is_superuser: true,
        is_active: true
      });
      
      console.log('✅ Admin user created:', adminUser.username);
      console.log('- ID:', adminUser.id);
      console.log('- Password: admin123');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

createTestAdmin();