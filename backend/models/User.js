const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 150],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(128),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'First name is required'
      },
      len: {
        args: [1, 150],
        msg: 'First name must be between 1 and 150 characters'
      }
    }
  },
  last_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 18,
      max: 120
    }
  },
  spiritual_intention: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      len: [2, 50]
    }
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    }
  },
  profile_image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_staff: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_superuser: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  date_joined: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_online: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_seen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_token: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  meditation_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  community_contributions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  events_attended: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    }
  },
  indexes: [
    {
      fields: ['username']
    },
    {
      fields: ['email']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Instance methods
User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// Class methods
User.findByUsername = function(username) {
  return this.findOne({ where: { username } });
};

User.findByEmail = function(email) {
  return this.findOne({ where: { email } });
};

User.getActiveUsers = function() {
  return this.findAll({
    where: { is_active: true },
    attributes: { exclude: ['password'] }
  });
};

// Associations
User.associate = function(models) {
  User.hasMany(models.Connection, {
    foreignKey: 'requester_id',
    as: 'sent_connections',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasMany(models.Connection, {
    foreignKey: 'receiver_id',
    as: 'received_connections',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasMany(models.ActivityFeed, {
    foreignKey: 'user_id',
    as: 'activities',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasMany(models.Comment, {
    foreignKey: 'author_id',
    as: 'comments',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasMany(models.Event, {
    foreignKey: 'created_by',
    as: 'created_events',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasOne(models.AdminUser, {
    foreignKey: 'user_id',
    as: 'adminUser',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasMany(models.ChatMessage, {
    foreignKey: 'sender_id',
    as: 'messages',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasMany(models.RoomParticipant, {
    foreignKey: 'user_id',
    as: 'room_participations',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasMany(models.DMParticipant, {
    foreignKey: 'user_id',
    as: 'dm_participations',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasMany(models.MessageReaction, {
    foreignKey: 'user_id',
    as: 'reactions',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasOne(models.UserPresence, {
    foreignKey: 'user_id',
    as: 'presence',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasMany(models.ContentReport, {
    foreignKey: 'reporter_id',
    as: 'reports',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasMany(models.ChatRoom, {
    foreignKey: 'created_by',
    as: 'created_rooms',
    onDelete: 'SET NULL',
    hooks: true
  });
  User.hasMany(models.DirectMessage, {
    foreignKey: 'created_by',
    as: 'created_dms',
    onDelete: 'CASCADE',
    hooks: true
  });
  User.hasMany(models.UserEvent, {
    foreignKey: 'user_id',
    as: 'user_events',
    onDelete: 'CASCADE',
    hooks: true
  });
};

module.exports = User;
