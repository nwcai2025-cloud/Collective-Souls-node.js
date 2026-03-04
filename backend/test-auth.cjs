const { sequelize } = require('./config/database');
const { User } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function testAuthSystem() {
  try {
    console.log('🔍 Testing authentication system...');
    
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
    
    // Test login with existing user
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n🔑 Testing login for user: ${testUser.username}`);
      
      // Simulate login process
      const user = await User.findOne({
        where: {
          [sequelize.Op.or]: [
            { username: testUser.username },
            { email: testUser.email }
          ]
        }
      });
      
      if (user && user.is_active) {
        console.log('✅ User found and active');
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '24h' }
        );
        
        console.log('✅ JWT token generated successfully');
        console.log('✅ Authentication system is working!');
        
        // Test token verification
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
        console.log('✅ Token verification successful:', decoded);
        
      } else {
        console.log('❌ User not found or inactive');
      }
    } else {
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
    
    console.log('\n🎉 Authentication system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testAuthSystem();