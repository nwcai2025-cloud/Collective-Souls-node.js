const { sequelize } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createProperAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Update existing admin user with proper password
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    
    if (adminUser) {
      await adminUser.update({
        password: 'admin123',
        is_staff: true,
        is_superuser: true,
        is_active: true
      });
      
      console.log('✅ Admin user updated successfully:');
      console.log('- ID:', adminUser.id);
      console.log('- Username:', adminUser.username);
      console.log('- Email:', adminUser.email);
      console.log('- Password: admin123');
      console.log('- Staff:', adminUser.is_staff);
      console.log('- Superuser:', adminUser.is_superuser);
      console.log('- Active:', adminUser.is_active);
    } else {
      // Create new admin user with proper password hashing
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
      
      console.log('✅ Admin user created successfully:');
      console.log('- ID:', adminUser.id);
      console.log('- Username:', adminUser.username);
      console.log('- Email:', adminUser.email);
      console.log('- Password: admin123');
      console.log('- Staff:', adminUser.is_staff);
      console.log('- Superuser:', adminUser.is_superuser);
      console.log('- Active:', adminUser.is_active);
    }
    
    // Test login
    const isValid = await bcrypt.compare('admin123', adminUser.password);
    console.log('- Password verification:', isValid ? '✅ Valid' : '❌ Invalid');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

createProperAdmin();