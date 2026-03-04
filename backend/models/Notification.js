const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// User Notification Model - Site-wide notifications for all users
const UserNotification = sequelize.define('UserNotification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['connection_request', 'connection_accepted', 'new_message', 'mention', 'event_reminder', 'system_announcement', 'like', 'comment', 'event_created', 'new_event']]
    }
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: () => {
      // Auto-expire after 24 hours
      const date = new Date();
      date.setHours(date.getHours() + 24);
      return date;
    }
  }
}, {
  tableName: 'user_notifications',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['type']
    }
  ]
});

// Define associations
UserNotification.associate = function(models) {
  UserNotification.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

// Class method to clean up expired notifications
UserNotification.cleanupExpired = async function() {
  try {
    const result = await this.destroy({
      where: {
        expires_at: {
          [require('sequelize').Op.lt]: new Date()
        }
      }
    });
    console.log(`🧹 Cleaned up ${result} expired notifications`);
    return result;
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    return 0;
  }
};

// Instance method to mark as read
UserNotification.prototype.markAsRead = async function() {
  this.is_read = true;
  this.read_at = new Date();
  await this.save();
  return this;
};

module.exports = UserNotification;