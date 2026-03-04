const { User } = require('./models');
const { sequelize } = require('./config/database');

async function fixPassword() {
  try {
    console.log('🔍 Finding user bob...');
    const user = await User.findOne({ where: { username: 'bob' } });
    
    if (!user) {
      console.log('❌ User bob not found');
      return;
    }
    
    console.log('✅ Found user bob (ID: ' + user.id + ')');
    
    // Setting the password directly and calling save() will trigger the beforeUpdate hook
    user.password = 'Legend@2021';
    await user.save();
    
    console.log('✅ Password for bob updated to "Legend@2021" successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixPassword();
