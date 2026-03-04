const { sequelize } = require('./config/database');
const UserEvent = require('./models/UserEvent');
const Event = require('./models/Event');
const User = require('./models/User');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    
    // Add missing columns to events table
    console.log('Adding missing columns to events table...');
    
    try {
      await sequelize.query('ALTER TABLE events ADD COLUMN room_type TEXT');
      console.log('Added room_type column');
    } catch (e) {
      console.log('room_type column may already exist:', e.message);
    }
    
    try {
      await sequelize.query('ALTER TABLE events ADD COLUMN room_created BOOLEAN DEFAULT 0');
      console.log('Added room_created column');
    } catch (e) {
      console.log('room_created column may already exist:', e.message);
    }
    
    try {
      await sequelize.query("ALTER TABLE events ADD COLUMN event_status TEXT DEFAULT 'upcoming'");
      console.log('Added event_status column');
    } catch (e) {
      console.log('event_status column may already exist:', e.message);
    }
    
    // Verify the schema
    const [eventsSchema] = await sequelize.query("PRAGMA table_info(events)");
    console.log('\nUpdated events table schema:', eventsSchema.map(c => c.name).join(', '));
    
    // Try to query events directly
    console.log('\nTrying to query events...');
    const events = await Event.findAll({ limit: 1 });
    console.log('Events query successful, count:', events.length);
    
    // Try to query user_events directly
    console.log('\nTrying to query user_events...');
    const userEvents = await UserEvent.findAll({ limit: 1 });
    console.log('UserEvents query successful, count:', userEvents.length);
    
    console.log('\nDatabase schema fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

test();
