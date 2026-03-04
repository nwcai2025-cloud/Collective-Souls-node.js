const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Chat Room Model (Public Rooms)
const ChatRoom = sequelize.define('ChatRoom', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  room_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'general',
    validate: {
      isIn: [['community', 'spiritual', 'meditation', 'healing', 'general', 'support', 'event']]
    }
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  // Room settings
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  max_participants: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  is_community_room: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'chat_rooms_new',
  timestamps: false,
  indexes: [
    {
      fields: ['room_type']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['is_community_room']
    }
  ]
});

// Direct Message Model
const DirectMessage = sequelize.define('DirectMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  // Chat settings
  is_group_chat: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'direct_messages_new',
  timestamps: false,
  indexes: [
    {
      fields: ['is_group_chat']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['created_by']
    }
  ]
});

// Chat Message Model (Unified for Rooms and DMs)
const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Content
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  message_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'text',
    validate: {
      isIn: [['text', 'file', 'image', 'system']]
    }
  },
  file_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  file_size: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Relationships (only one should be set)
  room_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'chat_rooms_new',
      key: 'id'
    },
    allowNull: true
  },
  dm_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'direct_messages_new',
      key: 'id'
    },
    allowNull: true
  },
  // Metadata
  sender_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_edited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  edited_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: 'chat_messages_new',
  timestamps: false,
  indexes: [
    {
      fields: ['room_id']
    },
    {
      fields: ['dm_id']
    },
    {
      fields: ['sender_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['message_type']
    },
    {
      fields: ['room_id', 'created_at']
    },
    {
      fields: ['dm_id', 'created_at']
    }
  ],
  validate: {
    eitherRoomOrDM() {
      if (!this.room_id && !this.dm_id) {
        throw new Error('Either room_id or dm_id must be provided');
      }
      if (this.room_id && this.dm_id) {
        throw new Error('Cannot have both room_id and dm_id');
      }
    }
  }
});

// Room Participant Model
const RoomParticipant = sequelize.define('RoomParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  room_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'chat_rooms_new',
      key: 'id'
    },
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    allowNull: false
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_seen_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_online: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_muted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  mute_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notifications_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'room_participants_new',
  timestamps: false,
  indexes: [
    {
      fields: ['room_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['is_online']
    },
    {
      fields: ['is_admin']
    }
  ],
  uniqueKeys: {
    unique_room_user: {
      fields: ['room_id', 'user_id']
    }
  }
});

// DM Participant Model
const DMParticipant = sequelize.define('DMParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dm_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'direct_messages_new',
      key: 'id'
    },
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    allowNull: false
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  last_seen_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_online: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'dm_participants_new',
  timestamps: false,
  indexes: [
    {
      fields: ['dm_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['is_online']
    }
  ],
  uniqueKeys: {
    unique_dm_user: {
      fields: ['dm_id', 'user_id']
    }
  }
});

// Message Reaction Model
const MessageReaction = sequelize.define('MessageReaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  message_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'chat_messages_new',
      key: 'id'
    },
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    allowNull: false
  },
  emoji: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'message_reactions_new',
  timestamps: false,
  indexes: [
    {
      fields: ['message_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['emoji']
    }
  ],
  uniqueKeys: {
    unique_reaction: {
      fields: ['message_id', 'user_id', 'emoji']
    }
  }
});

// User Presence Model
const UserPresence = sequelize.define('UserPresence', {
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
    allowNull: false,
    unique: true
  },
  is_online: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_seen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  current_room_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'chat_rooms_new',
      key: 'id'
    },
    allowNull: true
  }
}, {
  tableName: 'user_presence_new',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['is_online']
    },
    {
      fields: ['current_room_id']
    }
  ]
});

// Define associations
ChatRoom.associate = function(models) {
  ChatRoom.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  
  ChatRoom.hasMany(ChatMessage, {
    foreignKey: 'room_id',
    as: 'messages',
    onDelete: 'CASCADE',
    hooks: true
  });
  
  ChatRoom.hasMany(RoomParticipant, {
    foreignKey: 'room_id',
    as: 'participants',
    onDelete: 'CASCADE',
    hooks: true
  });
  
  ChatRoom.belongsToMany(models.User, {
    through: RoomParticipant,
    foreignKey: 'room_id',
    otherKey: 'user_id',
    as: 'users'
  });
};

DirectMessage.associate = function(models) {
  DirectMessage.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
  
  DirectMessage.hasMany(ChatMessage, {
    foreignKey: 'dm_id',
    as: 'messages',
    onDelete: 'CASCADE',
    hooks: true
  });
  
  DirectMessage.hasMany(DMParticipant, {
    foreignKey: 'dm_id',
    as: 'participants',
    onDelete: 'CASCADE',
    hooks: true
  });
  
  DirectMessage.belongsToMany(models.User, {
    through: DMParticipant,
    foreignKey: 'dm_id',
    otherKey: 'user_id',
    as: 'users'
  });
};

ChatMessage.associate = function(models) {
  ChatMessage.belongsTo(models.User, {
    foreignKey: 'sender_id',
    as: 'sender'
  });
  
  ChatMessage.belongsTo(ChatRoom, {
    foreignKey: 'room_id',
    as: 'room'
  });
  
  ChatMessage.belongsTo(DirectMessage, {
    foreignKey: 'dm_id',
    as: 'dm'
  });
  
  ChatMessage.hasMany(MessageReaction, {
    foreignKey: 'message_id',
    as: 'reactions',
    onDelete: 'CASCADE',
    hooks: true
  });
};

RoomParticipant.associate = function(models) {
  RoomParticipant.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  RoomParticipant.belongsTo(ChatRoom, {
    foreignKey: 'room_id',
    as: 'room'
  });
};

DMParticipant.associate = function(models) {
  DMParticipant.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  DMParticipant.belongsTo(DirectMessage, {
    foreignKey: 'dm_id',
    as: 'dm'
  });
};

MessageReaction.associate = function(models) {
  MessageReaction.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  MessageReaction.belongsTo(ChatMessage, {
    foreignKey: 'message_id',
    as: 'message'
  });
};

UserPresence.associate = function(models) {
  UserPresence.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  UserPresence.belongsTo(ChatRoom, {
    foreignKey: 'current_room_id',
    as: 'current_room'
  });
};

module.exports = {
  ChatRoom,
  DirectMessage,
  ChatMessage,
  RoomParticipant,
  DMParticipant,
  MessageReaction,
  UserPresence
};
