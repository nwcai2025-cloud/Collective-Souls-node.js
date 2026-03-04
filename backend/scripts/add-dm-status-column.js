const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function updateSchema() {
  try {
    console.log('🚀 Starting database schema update...');

    // Check if the column already exists
    const tableInfo = await sequelize.query("PRAGMA table_info(direct_messages_new)", {
      type: QueryTypes.SELECT
    });

    const hasStatusColumn = tableInfo.some(column => column.name === 'status');

    if (!hasStatusColumn) {
      console.log('📝 Adding "status" column to "direct_messages_new" table...');
      await sequelize.query("ALTER TABLE direct_messages_new ADD COLUMN status TEXT DEFAULT 'pending'");
      console.log('✅ Column "status" added successfully.');
    } else {
      console.log('ℹ️ Column "status" already exists in "direct_messages_new" table.');
    }

    console.log('✨ Database schema update completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating database schema:', error);
    process.exit(1);
  }
}

updateSchema();