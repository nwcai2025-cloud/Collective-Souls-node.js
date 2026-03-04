const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserBlock = sequelize.define('UserBlock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  blocker_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  blocked_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'user_blocks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['blocker_id']
    },
    {
      fields: ['blocked_id']
    },
    {
      unique: true,
      fields: ['blocker_id', 'blocked_id']
    }
  ]
});

UserBlock.associate = function(models) {
  UserBlock.belongsTo(models.User, {
    foreignKey: 'blocker_id',
    as: 'blocker'
  });
  UserBlock.belongsTo(models.User, {
    foreignKey: 'blocked_id',
    as: 'blocked'
  });
};

module.exports = UserBlock;