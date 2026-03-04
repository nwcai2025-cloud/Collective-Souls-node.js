const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Admin Role Model
const AdminRole = sequelize.define('AdminRole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'admin_roles',
  timestamps: false,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Admin User Model
const AdminUser = sequelize.define('AdminUser', {
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
  role_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'admin_roles',
      key: 'id'
    },
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'admin_users',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['role_id']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Admin Audit Log Model
const AdminAuditLog = sequelize.define('AdminAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  admin_user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'admin_users',
      key: 'id'
    },
    allowNull: false
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  resource_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  resource_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  old_values: {
    type: DataTypes.JSON,
    allowNull: true
  },
  new_values: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'admin_audit_logs',
  timestamps: false,
  indexes: [
    {
      fields: ['admin_user_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['resource_type']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Content Report Model
const ContentReport = sequelize.define('ContentReport', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reporter_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    allowNull: false
  },
  reported_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['comment', 'activity', 'video', 'user', 'chat_message', 'post']]
    }
  },
  reported_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'reviewed', 'resolved', 'dismissed']]
    }
  },
  reviewed_by: {
    type: DataTypes.INTEGER,
    references: {
      model: 'admin_users',
      key: 'id'
    },
    allowNull: true
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolution_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'content_reports',
  timestamps: false,
  indexes: [
    {
      fields: ['reporter_id']
    },
    {
      fields: ['reported_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Admin Notification Model
const AdminNotification = sequelize.define('AdminNotification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  admin_user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'admin_users',
      key: 'id'
    },
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
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
    allowNull: true
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
  }
}, {
  tableName: 'admin_notifications',
  timestamps: false,
  indexes: [
    {
      fields: ['admin_user_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Define associations
AdminRole.associate = function(models) {
  AdminRole.hasMany(models.AdminUser, {
    foreignKey: 'role_id',
    as: 'adminUsers'
  });
};

AdminUser.associate = function(models) {
  AdminUser.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  AdminUser.belongsTo(models.AdminRole, {
    foreignKey: 'role_id',
    as: 'role'
  });
  
  AdminUser.hasMany(models.AdminAuditLog, {
    foreignKey: 'admin_user_id',
    as: 'auditLogs',
    onDelete: 'CASCADE',
    hooks: true
  });
  
  AdminUser.hasMany(models.ContentReport, {
    foreignKey: 'reviewed_by',
    as: 'reviewedReports',
    onDelete: 'SET NULL',
    hooks: true
  });
  
  AdminUser.hasMany(models.AdminNotification, {
    foreignKey: 'admin_user_id',
    as: 'notifications',
    onDelete: 'CASCADE',
    hooks: true
  });
};

AdminAuditLog.associate = function(models) {
  AdminAuditLog.belongsTo(models.AdminUser, {
    foreignKey: 'admin_user_id',
    as: 'adminUser'
  });
};

ContentReport.associate = function(models) {
  ContentReport.belongsTo(models.User, {
    foreignKey: 'reporter_id',
    as: 'reporter'
  });
  
  ContentReport.belongsTo(models.AdminUser, {
    foreignKey: 'reviewed_by',
    as: 'reviewer'
  });
};

AdminNotification.associate = function(models) {
  AdminNotification.belongsTo(models.AdminUser, {
    foreignKey: 'admin_user_id',
    as: 'adminUser'
  });
};

// Default admin roles
const defaultRoles = [
  {
    name: 'super_admin',
    description: 'Full system access and configuration',
    permissions: {
      users: ['create', 'read', 'update', 'delete', 'suspend', 'promote'],
      content: ['moderate', 'approve', 'reject', 'delete'],
      chat: ['manage_rooms', 'ban_users', 'view_conversations'],
      videos: ['review', 'approve', 'reject', 'delete'],
      events: ['manage', 'approve', 'delete'],
      admin: ['manage_roles', 'view_logs', 'system_settings'],
      analytics: ['read', 'view_all', 'export_reports'],
      logs: ['read'],
      reports: ['read', 'update']
    }
  },
  {
    name: 'moderator',
    description: 'Content and user management',
    permissions: {
      users: ['read', 'update', 'suspend'],
      content: ['moderate', 'approve', 'reject'],
      chat: ['manage_rooms', 'ban_users'],
      videos: ['review', 'approve', 'reject'],
      events: ['manage'],
      analytics: ['read', 'view_content', 'view_users'],
      logs: ['read'],
      reports: ['read']
    }
  },
  {
    name: 'support_staff',
    description: 'User assistance and basic moderation',
    permissions: {
      users: ['read', 'update'],
      content: ['moderate'],
      chat: ['view_conversations'],
      videos: ['review'],
      analytics: ['view_basic']
    }
  },
  {
    name: 'read_only',
    description: 'Analytics and reporting access only',
    permissions: {
      analytics: ['view_all'],
      users: ['read'],
      content: ['read']
    }
  }
];

// Seed default roles
AdminRole.seedDefaultRoles = async function() {
  for (const roleData of defaultRoles) {
    await AdminRole.findOrCreate({
      where: { name: roleData.name },
      defaults: roleData
    });
  }
};

module.exports = {
  AdminRole,
  AdminUser,
  AdminAuditLog,
  ContentReport,
  AdminNotification
};