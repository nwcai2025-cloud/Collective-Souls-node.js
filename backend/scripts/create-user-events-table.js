const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, '../database/collective_souls.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
});

// SQL to create user_events table
const createUserEventsTable = `
CREATE TABLE IF NOT EXISTS user_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'joined', -- 'owner' or 'joined'
  event_status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed', 'cancelled'
  room_url TEXT,
  room_type TEXT, -- 'chat', 'video', 'both'
  room_created BOOLEAN DEFAULT FALSE,
  room_created_at DATETIME,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE(user_id, event_id)
);
`;

// SQL to enhance events table
const enhanceEventsTable = `
ALTER TABLE events ADD COLUMN room_url TEXT;
ALTER TABLE events ADD COLUMN room_type TEXT;
ALTER TABLE events ADD COLUMN room_created BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN event_status TEXT DEFAULT 'upcoming';
`;

// SQL to enhance event_participants table
const enhanceEventParticipantsTable = `
ALTER TABLE event_participants ADD COLUMN joined_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE event_participants ADD COLUMN status TEXT DEFAULT 'participant';
`;

// Function to run migrations
function runMigrations() {
  console.log('Starting database migrations...');
  
  // Create user_events table
  db.run(createUserEventsTable, (err) => {
    if (err) {
      console.error('Error creating user_events table:', err.message);
      return;
    }
    console.log('✓ Created user_events table');
    
    // Enhance events table
    db.run(enhanceEventsTable, (err) => {
      if (err) {
        console.error('Error enhancing events table:', err.message);
        return;
      }
      console.log('✓ Enhanced events table with room fields');
      
      // Enhance event_participants table
      db.run(enhanceEventParticipantsTable, (err) => {
        if (err) {
          console.error('Error enhancing event_participants table:', err.message);
          return;
        }
        console.log('✓ Enhanced event_participants table');
        
        // Create indexes for better performance
        const createIndexes = `
          CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_events_event_id ON user_events(event_id);
          CREATE INDEX IF NOT EXISTS idx_user_events_status ON user_events(status);
          CREATE INDEX IF NOT EXISTS idx_events_room_created ON events(room_created);
          CREATE INDEX IF NOT EXISTS idx_events_event_status ON events(event_status);
        `;
        
        db.run(createIndexes, (err) => {
          if (err) {
            console.error('Error creating indexes:', err.message);
            return;
          }
          console.log('✓ Created database indexes');
          console.log('Database migration completed successfully!');
          db.close();
        });
      });
    });
  });
}

// Run the migrations
runMigrations();