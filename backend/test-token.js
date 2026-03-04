const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('./models');

// Load environment variables
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

async function testLogin() {
  try {
    console.log('🔍 Testing login for bob@network-connected.com...');
    console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET);
    
    // Find the user
    const user = await User.findOne({
      where: { email: 'bob@network-connected.com' },
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.username);
    console.log('👤 User ID:', user.id);
    console.log('🔒 Is Staff:', user.is_staff);
    console.log('👑 Is Superuser:', user.is_superuser);

    // Generate a JWT token
    const token = jwt.sign(
      { id: user.id, userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🎫 Generated token:', token);
    
    // Test the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified:', decoded);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();
