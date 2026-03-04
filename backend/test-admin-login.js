const { sequelize } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function testAdminLogin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    const { username, password } = { username: 'admin', password: 'admin123' };

    // Find user by username or email
    const user = await User.findOne({
      where: {
        username: username
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('📋 User found:');
    console.log('- ID:', user.id);
    console.log('- Username:', user.username);
    console.log('- Email:', user.email);
    console.log('- Staff:', user.is_staff);
    console.log('- Superuser:', user.is_superuser);
    console.log('- Active:', user.is_active);
    console.log('- Password hash:', user.password);

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ Account is deactivated');
      return;
    }

    // Check if user has admin privileges
    if (!user.is_staff && !user.is_superuser) {
      console.log('❌ Admin access required');
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('- Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid credentials');
      return;
    }

    console.log('✅ Admin login successful');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

testAdminLogin();