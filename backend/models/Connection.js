const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Connection = sequelize.define('Connection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requester_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  receiver_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'blocked'),
    defaultValue: 'pending'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_connections',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['requester_id', 'receiver_id']
    },
    {
      fields: ['requester_id']
    },
    {
      fields: ['receiver_id']
    },
    {
      fields: ['status']
    }
  ]
});

// Set up associations
Connection.associate = function(models) {
  Connection.belongsTo(models.User, { foreignKey: 'requester_id', as: 'from_user' });
  Connection.belongsTo(models.User, { foreignKey: 'receiver_id', as: 'to_user' });
};

module.exports = Connection;
