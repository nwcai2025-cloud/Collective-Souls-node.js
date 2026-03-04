const { sequelize } = require('../config/database');

async function createConnectionsTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requester_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,

        CONSTRAINT unique_connection UNIQUE (requester_id, receiver_id),
        CONSTRAINT chk_no_self_connection CHECK (requester_id != receiver_id)
      )
    `);

    console.log('✅ user_connections table created successfully');

    // Add some sample data for testing
    const users = await sequelize.query('SELECT id FROM users LIMIT 2');
    if (users[0].length >= 2) {
      await sequelize.query(`
        INSERT OR IGNORE INTO user_connections (requester_id, receiver_id, status)
        VALUES (${users[0][0].id}, ${users[0][1].id}, 'accepted')
      `);
      console.log('✅ Sample connection data added');
    }

  } catch (error) {
    console.error('❌ Error creating connections table:', error);
  } finally {
    await sequelize.close();
  }
}

createConnectionsTable();