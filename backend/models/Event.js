const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  event_type: {
    type: DataTypes.ENUM('meditation', 'yoga', 'workshop', 'gathering', 'other'),
    defaultValue: 'other'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'Online'
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  max_participants: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
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
      model: 'chat_rooms_new',
      key: 'id'
    }
  },
  event_status: {
    type: DataTypes.ENUM('upcoming', 'active', 'completed', 'cancelled'),
    defaultValue: 'upcoming'
  }
}, {
  tableName: 'events',
  timestamps: true
});

Event.associate = function(models) {
  Event.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  Event.belongsToMany(models.User, {
    through: 'event_participants',
    foreignKey: 'event_id',
    otherKey: 'user_id',
    as: 'participants'
  });
  Event.hasMany(models.UserEvent, {
    foreignKey: 'event_id',
    as: 'user_events',
    onDelete: 'CASCADE',
    hooks: true
  });
  
  // Add instance methods for participant management
  Event.prototype.addParticipant = async function(userId) {
    const { UserEvent } = require('./index');
    await UserEvent.create({
      user_id: userId,
      event_id: this.id,
      status: 'joined',
      event_status: this.event_status
    });
  };
  
  Event.prototype.removeParticipant = async function(userId) {
    const { UserEvent } = require('./index');
    await UserEvent.destroy({
      where: {
        user_id: userId,
        event_id: this.id
      }
    });
  };
};

module.exports = Event;