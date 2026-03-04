const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

async function createFeatureFlagsTable() {
  try {
    console.log('Creating feature_flags table...');

    // Create the feature_flags table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS feature_flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_name VARCHAR(100) NOT NULL UNIQUE,
        is_enabled BOOLEAN DEFAULT 1,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default feature flags
    const defaultFlags = [
      {
        feature_name: 'live_video_streaming',
        is_enabled: 1,
        description: 'Enable/disable all live video streaming functionality'
      },
      {
        feature_name: 'phone_calls',
        is_enabled: 1,
        description: 'Enable/disable phone call functionality'
      },
      {
        feature_name: 'video_calls',
        is_enabled: 1,
        description: 'Enable/disable video call functionality'
      }
    ];

    for (const flag of defaultFlags) {
      await sequelize.query(`
        INSERT OR IGNORE INTO feature_flags (feature_name, is_enabled, description, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, {
        replacements: [flag.feature_name, flag.is_enabled, flag.description]
      });
    }

    console.log('✅ Feature flags table created successfully');
    console.log('✅ Default feature flags inserted');
    
    // Display current flags
    const [results] = await sequelize.query('SELECT * FROM feature_flags');
    console.log('\n📋 Current Feature Flags:');
    results.forEach(flag => {
      console.log(`  - ${flag.feature_name}: ${flag.is_enabled ? 'ENABLED' : 'DISABLED'} - ${flag.description}`);
    });

  } catch (error) {
    console.error('❌ Error creating feature flags table:', error);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  createFeatureFlagsTable();
}

module.exports = { createFeatureFlagsTable };