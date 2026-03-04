const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  author_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    },
    allowNull: false
  },
  parent_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'comments',
      key: 'id'
    },
    allowNull: true
  },
  commentable_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [
        [
          'event',
          'activity',
          'post',
          'video',
          'user_profile'
        ]
      ]
    }
  },
  commentable_id: {
    type: DataTypes.INTEGER,
    allowNull: false
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
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Moderation fields
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'deleted'),
    defaultValue: 'pending'
  },
  moderation_reason: {
    type: DataTypes.TEXT,
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
  tableName: 'comments',
  timestamps: false,
  indexes: [
    {
      fields: ['author_id']
    },
    {
      fields: ['parent_id']
    },
    {
      fields: ['commentable_type']
    },
    {
      fields: ['commentable_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['is_deleted']
    }
  ]
});

Comment.associate = function(models) {
  Comment.belongsTo(models.User, {
    foreignKey: 'author_id',
    as: 'author'
  });
  
  Comment.belongsTo(models.Comment, {
    foreignKey: 'parent_id',
    as: 'parent'
  });
  
  Comment.hasMany(models.Comment, {
    foreignKey: 'parent_id',
    as: 'replies',
    onDelete: 'CASCADE',
    hooks: true
  });
};

module.exports = Comment;