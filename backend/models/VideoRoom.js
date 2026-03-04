const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const VideoRoom = sequelize.define('VideoRoom', {
  room_id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  room_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  max_participants: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    allowNull: false,
    validate: {
      min: 2,
      max: 50
    }
  },
  current_participants: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'video_rooms',
  timestamps: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci'
});

// Add associations
VideoRoom.associate = function(models) {
  VideoRoom.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

module.exports = VideoRoom;