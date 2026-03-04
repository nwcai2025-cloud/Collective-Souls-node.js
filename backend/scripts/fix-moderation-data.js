const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function fixModerationData() {
  console.log('Starting moderation data fix...');
  
  try {
    // 1. Fix Comments table
    console.log('Checking comments table...');
    const commentColumns = await sequelize.query("PRAGMA table_info(comments)", { type: QueryTypes.SELECT });
    if (!commentColumns.some(c => c.name === 'status')) {
      console.log('Adding status column to comments...');
      await sequelize.query("ALTER TABLE comments ADD COLUMN status TEXT DEFAULT 'pending'");
    }
    if (!commentColumns.some(c => c.name === 'moderation_reason')) {
      await sequelize.query("ALTER TABLE comments ADD COLUMN moderation_reason TEXT");
    }
    await sequelize.query("UPDATE comments SET status = 'pending' WHERE status IS NULL OR status = '' OR status = 'approved'");
    console.log('Comments table updated.');

    // 2. Fix Activity Feed
    console.log('Checking activity_feed table...');
    const activityColumns = await sequelize.query("PRAGMA table_info(activity_feed)", { type: QueryTypes.SELECT });
    if (!activityColumns.some(c => c.name === 'status')) {
      console.log('Adding status column to activity_feed...');
      await sequelize.query("ALTER TABLE activity_feed ADD COLUMN status TEXT DEFAULT 'pending'");
    }
    if (!activityColumns.some(c => c.name === 'moderation_reason')) {
      await sequelize.query("ALTER TABLE activity_feed ADD COLUMN moderation_reason TEXT");
    }
    await sequelize.query("UPDATE activity_feed SET status = 'pending' WHERE status IS NULL OR status = '' OR status = 'approved'");
    console.log('Activity feed updated.');

    // 3. Fix Chat Messages
    console.log('Checking chat_messages_new table...');
    const chatColumns = await sequelize.query("PRAGMA table_info(chat_messages_new)", { type: QueryTypes.SELECT });
    if (!chatColumns.some(c => c.name === 'status')) {
      console.log('Adding status column to chat_messages_new...');
      await sequelize.query("ALTER TABLE chat_messages_new ADD COLUMN status TEXT DEFAULT 'pending'");
    }
    if (!chatColumns.some(c => c.name === 'moderation_reason')) {
      await sequelize.query("ALTER TABLE chat_messages_new ADD COLUMN moderation_reason TEXT");
    }
    await sequelize.query("UPDATE chat_messages_new SET status = 'pending' WHERE status IS NULL OR status = '' OR status = 'approved'");
    console.log('Chat messages updated.');

    console.log('Moderation data fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing moderation data:', error);
    process.exit(1);
  }
}

fixModerationData();