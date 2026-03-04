const { sequelize } = require('../config/database');

async function fixTable() {
  try {
    console.log('🚀 Starting to fix user_connections table...');

    // Disable foreign keys
    await sequelize.query('PRAGMA foreign_keys = OFF');

    // 1. Create a new temporary table with the correct schema
    console.log('📝 Creating temporary table...');
    await sequelize.query(`
      CREATE TABLE user_connections_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requester_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Copy data from the old table to the new one
    console.log('🚚 Copying data...');
    await sequelize.query(`
      INSERT INTO user_connections_new (id, requester_id, receiver_id, status, created_at, updated_at)
      SELECT id, requester_id, receiver_id, status, created_at, updated_at FROM user_connections
    `);

    // 3. Drop the old table
    console.log('🗑️ Dropping old table...');
    await sequelize.query('DROP TABLE user_connections');

    // 4. Rename the new table to the original name
    console.log('🏷️ Renaming new table...');
    await sequelize.query('ALTER TABLE user_connections_new RENAME TO user_connections');

    // 5. Re-create the correct indexes (non-unique for individual columns, unique for the pair)
    console.log('🗂️ Creating indexes...');
    await sequelize.query('CREATE INDEX idx_user_connections_requester_id ON user_connections(requester_id)');
    await sequelize.query('CREATE INDEX idx_user_connections_receiver_id ON user_connections(receiver_id)');
    await sequelize.query('CREATE INDEX idx_user_connections_status ON user_connections(status)');
    await sequelize.query('CREATE UNIQUE INDEX idx_user_connections_pair ON user_connections(requester_id, receiver_id)');

    // Re-enable foreign keys
    await sequelize.query('PRAGMA foreign_keys = ON');

    console.log('✅ user_connections table fixed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing table:', error);
    process.exit(1);
  }
}

fixTable();