const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityFeed = sequelize.define('ActivityFeed', {
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
  activity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [
        [
          'user_joined',
          'user_updated_profile',
          'user_posted_comment',
          'user_joined_chat',
          'user_left_chat',
          'user_created_event',
          'user_joined_event',
          'user_left_event',
          'user_sent_message',
          'user_liked_content',
          'user_shared_content',
          'user_completed_activity',
          'meditation',
          'mindfulness',
          'energy_healing',
          'yoga',
          'journaling',
          'other'
        ]
      ]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  // Moderation fields
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'deleted'),
    defaultValue: 'pending'
  },
  moderation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'activity_feed',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['activity_type']
    },
    {
      fields: ['created_at']
    }
  ]
});

ActivityFeed.associate = function(models) {
  ActivityFeed.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

module.exports = ActivityFeed;