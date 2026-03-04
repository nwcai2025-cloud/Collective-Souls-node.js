const { sequelize } = require('../config/database');

async function createContentReportsTable() {
  try {
    console.log('Creating Content Reports table...');

    // Check if table already exists
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='content_reports'");
    
    if (results.length > 0) {
      console.log('Content Reports table already exists');
      return;
    }

    // Create the table
    await sequelize.query(`
      CREATE TABLE content_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_id INTEGER NOT NULL,
        reported_type TEXT NOT NULL CHECK(reported_type IN ('comment', 'activity', 'video', 'user', 'chat_message')),
        reported_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
        reviewed_by INTEGER,
        reviewed_at DATETIME,
        resolution_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES admin_users(id) ON DELETE SET NULL
      );
    `);

    console.log('✅ Content Reports table created successfully');

    // Test the table
    const [testResults] = await sequelize.query("PRAGMA table_info(content_reports)");
    console.log('Table structure:');
    testResults.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull === 1 ? 'NOT NULL' : ''}`);
    });

  } catch (error) {
    console.error('❌ Error creating Content Reports table:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
createContentReportsTable();
