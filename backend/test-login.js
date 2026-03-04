const { sequelize } = require('./config/database');
const { User } = require('./models');

async function testLogin() {
  try {
    console.log('🔍 Testing login functionality...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Check if users exist
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'is_active', 'is_staff', 'is_superuser']
    });
    
    console.log(`📋 Found ${users.length} users in database:`);
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Active: ${user.is_active}, Staff: ${user.is_staff}, Superuser: ${user.is_superuser}`);
    });
    
    // If no users exist, create a test user
    if (users.length === 0) {
      console.log('👤 Creating test user...');
      const testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        age_verified: true,
        spiritual_intention: 'Testing',
        bio: 'Test user for login verification'
      });
      console.log(`✅ Test user created: ${testUser.username}`);
    }
    
    console.log('✅ Login test completed successfully');
    
  } catch (error) {
    console.error('❌ Login test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testLogin();