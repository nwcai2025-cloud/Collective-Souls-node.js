// SQLite Database Configuration for Collective Souls Node.js Platform
const { Sequelize } = require('sequelize');

const path = require('path');

// Database configuration - Supports MySQL/MariaDB and SQLite based on DB_TYPE
const dbType = process.env.DB_TYPE || (process.env.NODE_ENV === 'production' ? 'mysql' : 'sqlite');

const sequelize = dbType === 'mysql' 
  ? new Sequelize(
      process.env.DB_NAME || 'collective_souls',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        define: {
          timestamps: true,
          underscored: false,
          freezeTableName: false
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    )
  : new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || path.join(__dirname, '../database/collective_souls.sqlite'),
      logging: false,
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: false
      }
    });

console.log(`📦 Using database type: ${dbType}`);
if (dbType === 'sqlite') {
    console.log(`💾 SQLite storage: ${process.env.DB_STORAGE || path.join(__dirname, '../database/collective_souls.sqlite')}`);
}

// Test the database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to SQLite database:', error);
  }
}

// Sync database models
async function syncDatabase() {
  try {
    await sequelize.sync({ force: false }); // Set force: true to drop and recreate tables
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};