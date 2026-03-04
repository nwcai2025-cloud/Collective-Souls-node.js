const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserEvent = sequelize.define('UserEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('owner', 'joined'),
    allowNull: false,
    defaultValue: 'joined'
  },
  event_status: {
    type: DataTypes.ENUM('upcoming', 'active', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'upcoming'
  },
  room_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  room_type: {
    type: DataTypes.ENUM('chat', 'video', 'both'),
    allowNull: true
  },
  room_created: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  chat_room_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'chat_rooms',
      key: 'id'
    }
  },
  room_created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_events',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['event_id']
    },
    {
      fields: ['status']
    }
  ]
});

UserEvent.associate = function(models) {
  UserEvent.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE',
    hooks: true
  });
  UserEvent.belongsTo(models.Event, {
    foreignKey: 'event_id',
    as: 'event',
    onDelete: 'CASCADE',
    hooks: true
  });
};

module.exports = UserEvent;