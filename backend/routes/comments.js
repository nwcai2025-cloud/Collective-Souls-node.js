// Comment Routes for Collective Souls Node.js Platform
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { Comment, User } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Get comments for a post/activity
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, commentable_type, commentable_id } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      status: { [Op.notIn]: ['rejected', 'deleted'] }
    };
    if (commentable_type) where.commentable_type = commentable_type;
    if (commentable_id) where.commentable_id = commentable_id;

    const { count, rows } = await Comment.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'profile_image']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        comments: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalComments: count,
          hasNextPage: offset + rows.length < count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new comment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, commentable_type, commentable_id, parent_id } = req.body;

    if (!content || !commentable_type || !commentable_id) {
      return res.status(400).json({
        success: false,
        message: 'Content, type, and ID are required'
      });
    }

    const comment = await Comment.create({
      content,
      commentable_type,
      commentable_id,
      parent_id,
      author_id: req.user.id,
      status: 'pending'
    });

    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'profile_image']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: { comment: commentWithAuthor }
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get comment by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Placeholder response
    res.json({
      success: true,
      data: {
        comment: {
          id: parseInt(id),
          content: 'This is a sample comment',
          post_id: 1,
          parent_id: null,
          user_id: req.user.id,
          username: req.user.username,
          created_at: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update comment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Placeholder response
    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment: {
          id: parseInt(id),
          content: content || 'This is a sample comment',
          post_id: 1,
          parent_id: null,
          user_id: req.user.id,
          username: req.user.username,
          updated_at: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete comment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Placeholder response
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;