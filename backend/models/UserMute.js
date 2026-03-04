const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserMute = sequelize.define('UserMute', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  muter_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  muted_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'user_mutes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['muter_id']
    },
    {
      fields: ['muted_id']
    },
    {
      unique: true,
      fields: ['muter_id', 'muted_id']
    }
  ]
});

UserMute.associate = function(models) {
  UserMute.belongsTo(models.User, {
    foreignKey: 'muter_id',
    as: 'muter'
  });
  UserMute.belongsTo(models.User, {
    foreignKey: 'muted_id',
    as: 'muted'
  });
};

module.exports = UserMute;