const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 5000]
    }
  },
  post_type: {
    type: DataTypes.ENUM('reflection', 'gratitude', 'question', 'inspiration', 'announcement'),
    defaultValue: 'reflection',
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
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'deleted'),
    defaultValue: 'approved'
  },
  moderation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['post_type']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['status']
    },
    {
      fields: ['is_deleted']
    }
  ]
});

Post.associate = function(models) {
  Post.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'author'
  });
  Post.hasMany(models.PostLike, {
    foreignKey: 'post_id',
    as: 'likes',
    onDelete: 'CASCADE',
    hooks: true
  });
  Post.hasMany(models.Comment, {
    foreignKey: 'commentable_id',
    as: 'comments',
    scope: {
      commentable_type: 'post'
    },
    onDelete: 'CASCADE',
    hooks: true
  });
};

module.exports = Post;