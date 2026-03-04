const { sequelize } = require('../config/database');

async function clearChatData() {
  try {
    console.log('🚀 Starting to clear all chat and DM data...');

    // Disable foreign key checks for SQLite to allow clearing tables in any order
    await sequelize.query('PRAGMA foreign_keys = OFF');

    const tables = [
      'chat_messages_new',
      'message_reactions_new',
      'room_participants_new',
      'dm_participants_new',
      'chat_rooms_new',
      'direct_messages_new',
      'user_presence_new'
    ];

    for (const table of tables) {
      console.log(`🧹 Clearing table: ${table}...`);
      await sequelize.query(`DELETE FROM ${table}`);
      // Reset auto-increment counters
      await sequelize.query(`DELETE FROM sqlite_sequence WHERE name='${table}'`);
    }

    // Re-enable foreign key checks
    await sequelize.query('PRAGMA foreign_keys = ON');

    console.log('✅ All chat and DM data has been removed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing chat data:', error);
    process.exit(1);
  }
}

clearChatData();