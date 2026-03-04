/**
 * Script to add chat_room_id column to events and user_events tables
 */

const { sequelize } = require('../config/database');

async function addChatRoomIdColumn() {
  try {
    console.log('Adding chat_room_id column to events table...');
    
    // Check if column already exists
    const [eventsColumns] = await sequelize.query(`
      PRAGMA table_info(events)
    `);
    
    const eventsHasChatRoomId = eventsColumns.some(col => col.name === 'chat_room_id');
    
    if (!eventsHasChatRoomId) {
      await sequelize.query(`
        ALTER TABLE events ADD COLUMN chat_room_id INTEGER REFERENCES chat_rooms(id)
      `);
      console.log('✅ Added chat_room_id to events table');
    } else {
      console.log('⏭️ chat_room_id already exists in events table');
    }

    console.log('Adding chat_room_id column to user_events table...');
    
    // Check if column already exists
    const [userEventsColumns] = await sequelize.query(`
      PRAGMA table_info(user_events)
    `);
    
    const userEventsHasChatRoomId = userEventsColumns.some(col => col.name === 'chat_room_id');
    
    if (!userEventsHasChatRoomId) {
      await sequelize.query(`
        ALTER TABLE user_events ADD COLUMN chat_room_id INTEGER REFERENCES chat_rooms(id)
      `);
      console.log('✅ Added chat_room_id to user_events table');
    } else {
      console.log('⏭️ chat_room_id already exists in user_events table');
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addChatRoomIdColumn();