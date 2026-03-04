const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '/.env' });
const User = require('./models/User');
const { sequelize } = require('./config/database');

async function generateAdminToken() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Find admin user
    const adminUser = await User.findOne({
      where: {
        is_staff: true,
        is_active: true
      },
      attributes: { exclude: ['password'] }
    });

    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }

    console.log('✅ Admin user found:', adminUser.username);

    // Generate token
    const token = jwt.sign(
      { 
        id: adminUser.id,
        userId: adminUser.id,
        username: adminUser.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Admin token generated:');
    console.log(token);
    
  } catch (error) {
    console.error('❌ Error generating token:', error);
  } finally {
    await sequelize.close();
  }
}

generateAdminToken();