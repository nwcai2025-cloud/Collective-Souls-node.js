const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostLike = sequelize.define('PostLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reaction_type: {
    type: DataTypes.ENUM('heart', 'pray', 'sparkle', 'lightbulb', 'peace'),
    defaultValue: 'heart',
    allowNull: false
  }
}, {
  tableName: 'post_likes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['post_id']
    },
    {
      fields: ['user_id']
    },
    {
      unique: true,
      fields: ['post_id', 'user_id']
    }
  ]
});

PostLike.associate = function(models) {
  PostLike.belongsTo(models.Post, {
    foreignKey: 'post_id',
    as: 'post'
  });
  PostLike.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

module.exports = PostLike;