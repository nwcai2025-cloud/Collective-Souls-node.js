const { sequelize } = require('./config/database');
const { User } = require('./models');

async function simpleTest() {
  try {
    console.log('🔍 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'is_active']
    });
    
    console.log(`📋 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - Active: ${user.is_active}`);
    });
    
    if (users.length === 0) {
      console.log('👤 Creating test user...');
      const testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        age_verified: true
      });
      console.log(`✅ Test user created: ${testUser.username}`);
    }
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

simpleTest();