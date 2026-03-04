const { sequelize } = require('../config/database');
const User = require('../models/User');

async function clearAllUsers() {
  try {
    console.log('🧹 Clearing all users from database...');

    // Delete all users
    const result = await User.destroy({
      where: {},
      truncate: true
    });

    console.log(`✅ Successfully deleted ${result} users from the database.`);
    console.log('🆕 Database is now clean - you can register new users!');

  } catch (error) {
    console.error('❌ Error clearing users:', error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Run the script
clearAllUsers();