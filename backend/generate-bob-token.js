const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/.env' });
const User = require('./models/User');
const { sequelize } = require('./config/database');

async function generateBobToken() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Find bob user specifically
    const bobUser = await User.findOne({
      where: {
        username: 'bob'
      },
      attributes: { exclude: ['password'] }
    });

    if (!bobUser) {
      console.log('❌ Bob user not found');
      return;
    }

    console.log('✅ Bob user found:', bobUser.username);
    console.log('User details:', {
      id: bobUser.id,
      username: bobUser.username,
      email: bobUser.email,
      is_staff: bobUser.is_staff,
      is_superuser: bobUser.is_superuser,
      is_active: bobUser.is_active
    });

    // Generate token
    const token = jwt.sign(
      { 
        id: bobUser.id,
        userId: bobUser.id,
        username: bobUser.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Bob admin token generated:');
    console.log(token);
    
  } catch (error) {
    console.error('❌ Error generating token:', error);
  } finally {
    await sequelize.close();
  }
}

generateBobToken();