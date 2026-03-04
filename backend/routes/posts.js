// Posts Routes for Community Wall
const express = require('express');
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const { 
  User, 
  Post, 
  PostLike, 
  Comment, 
  UserBlock, 
  UserMute, 
  ContentReport,
  ChatMessage,
  ActivityFeed
} = require('../models');

const router = express.Router();

// Helper function to get reaction emoji
const getReactionEmoji = (type) => {
  const emojis = {
    heart: '❤️',
    pray: '🙏',
    sparkle: '✨',
    lightbulb: '💡',
    peace: '☮️'
  };
  return emojis[type] || '❤️';
};

// Helper function to get post type emoji
const getPostTypeEmoji = (type) => {
  const emojis = {
    reflection: '💭',
    gratitude: '🙏',
    question: '❓',
    inspiration: '💡',
    announcement: '📢'
  };
  return emojis[type] || '💭';
};

// GET /api/posts - Get all posts (filtered by blocks/mutes)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    // Get users that current user has blocked
    const blockedUsers = await UserBlock.findAll({
      where: { blocker_id: userId },
      attributes: ['blocked_id']
    });
    const blockedIds = blockedUsers.map(b => b.blocked_id);

    // Get users that have blocked the current user
    const blockedByUsers = await UserBlock.findAll({
      where: { blocked_id: userId },
      attributes: ['blocker_id']
    });
    const blockedByIds = blockedByUsers.map(b => b.blocker_id);

    // Get users that current user has muted
    const mutedUsers = await UserMute.findAll({
      where: { muter_id: userId },
      attributes: ['muted_id']
    });
    const mutedIds = mutedUsers.map(m => m.muted_id);

    // Combine all excluded user IDs
    const excludedUserIds = [...new Set([...blockedIds, ...blockedByIds, ...mutedIds])];

    // Build where clause
    const whereClause = {
      is_deleted: false,
      status: { [Op.in]: ['approved', 'pending'] }
    };

    if (excludedUserIds.length > 0) {
      whereClause.user_id = { [Op.notIn]: excludedUserIds };
    }

    const posts = await Post.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'profile_image', 'first_name', 'last_name']
        },
        {
          model: PostLike,
          as: 'likes',
          attributes: ['id', 'user_id', 'reaction_type'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          }]
        },
        {
          model: Comment,
          as: 'comments',
          where: { is_deleted: false },
          required: false,
          attributes: ['id'],
          limit: 1
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    // Format posts with reaction counts
    const formattedPosts = posts.rows.map(post => {
      const postJson = post.toJSON();
      
      // Count reactions by type
      const reactionCounts = {
        heart: 0,
        pray: 0,
        sparkle: 0,
        lightbulb: 0,
        peace: 0
      };
      
      let userReaction = null;
      
      postJson.likes.forEach(like => {
        reactionCounts[like.reaction_type]++;
        if (like.user_id === userId) {
          userReaction = like.reaction_type;
        }
      });

      return {
        ...postJson,
        reaction_counts: reactionCounts,
        user_reaction: userReaction,
        like_count: postJson.likes.length,
        comment_count: postJson.comments ? postJson.comments.length : 0,
        post_type_emoji: getPostTypeEmoji(postJson.post_type)
      };
    });

    res.json({
      success: true,
      data: {
        posts: formattedPosts,
        total: posts.count,
        page: parseInt(page),
        totalPages: Math.ceil(posts.count / limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts'
    });
  }
});

// GET /api/posts/:id - Get single post with comments
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'profile_image', 'first_name', 'last_name']
        },
        {
          model: PostLike,
          as: 'likes',
          attributes: ['id', 'user_id', 'reaction_type'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          }]
        },
        {
          model: Comment,
          as: 'comments',
          where: { is_deleted: false },
          required: false,
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'profile_image']
          }],
          order: [['created_at', 'ASC']]
        }
      ]
    });

    if (!post || post.is_deleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user is blocked or muted
    const blockedUsers = await UserBlock.findAll({
      where: { 
        [Op.or]: [
          { blocker_id: userId, blocked_id: post.user_id },
          { blocked_id: userId, blocker_id: post.user_id }
        ]
      }
    });

    const mutedUsers = await UserMute.findAll({
      where: { muter_id: userId, muted_id: post.user_id }
    });

    if (blockedUsers.length > 0 || mutedUsers.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Post not available'
      });
    }

    const postJson = post.toJSON();
    
    // Count reactions by type
    const reactionCounts = {
      heart: 0,
      pray: 0,
      sparkle: 0,
      lightbulb: 0,
      peace: 0
    };
    
    let userReaction = null;
    
    postJson.likes.forEach(like => {
      reactionCounts[like.reaction_type]++;
      if (like.user_id === userId) {
        userReaction = like.reaction_type;
      }
    });

    const formattedPost = {
      ...postJson,
      reaction_counts: reactionCounts,
      user_reaction: userReaction,
      like_count: postJson.likes.length,
      comment_count: postJson.comments ? postJson.comments.length : 0,
      post_type_emoji: getPostTypeEmoji(postJson.post_type)
    };

    res.json({
      success: true,
      data: formattedPost
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post'
    });
  }
});

// POST /api/posts - Create new post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, post_type = 'reflection' } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Content must be 5000 characters or less'
      });
    }

    const post = await Post.create({
      user_id: userId,
      content: content.trim(),
      post_type,
      status: 'approved'
    });

    // Fetch the post with author info
    const newPost = await Post.findByPk(post.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'profile_image', 'first_name', 'last_name']
      }]
    });

    const postJson = newPost.toJSON();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        ...postJson,
        reaction_counts: { heart: 0, pray: 0, sparkle: 0, lightbulb: 0, peace: 0 },
        user_reaction: null,
        like_count: 0,
        comment_count: 0,
        post_type_emoji: getPostTypeEmoji(postJson.post_type)
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
});

// PUT /api/posts/:id - Edit own post
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, post_type } = req.body;
    const userId = req.user.id;

    const post = await Post.findByPk(id);

    if (!post || post.is_deleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    if (content.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Content must be 5000 characters or less'
      });
    }

    await post.update({
      content: content.trim(),
      post_type: post_type || post.post_type,
      is_edited: true,
      edited_at: new Date()
    });

    const updatedPost = await Post.findByPk(id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'profile_image', 'first_name', 'last_name']
      }]
    });

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post'
    });
  }
});

// DELETE /api/posts/:id - Delete own post (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findByPk(id);

    if (!post || post.is_deleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    await post.update({
      is_deleted: true,
      deleted_at: new Date(),
      status: 'deleted'
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
});

// POST /api/posts/:id/like - Add or update reaction
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction_type = 'heart' } = req.body;
    const userId = req.user.id;

    const post = await Post.findByPk(id);

    if (!post || post.is_deleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already reacted
    const existingLike = await PostLike.findOne({
      where: { post_id: id, user_id: userId }
    });

    if (existingLike) {
      // Update existing reaction
      await existingLike.update({ reaction_type });
    } else {
      // Create new reaction
      await PostLike.create({
        post_id: id,
        user_id: userId,
        reaction_type
      });
    }

    // Get updated reaction counts
    const likes = await PostLike.findAll({
      where: { post_id: id },
      attributes: ['reaction_type', 'user_id']
    });

    const reactionCounts = {
      heart: 0,
      pray: 0,
      sparkle: 0,
      lightbulb: 0,
      peace: 0
    };

    likes.forEach(like => {
      reactionCounts[like.reaction_type]++;
    });

    res.json({
      success: true,
      message: existingLike ? 'Reaction updated' : 'Reaction added',
      data: {
        reaction_counts: reactionCounts,
        user_reaction: reaction_type,
        like_count: likes.length
      }
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to react to post'
    });
  }
});

// DELETE /api/posts/:id/like - Remove reaction
router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const like = await PostLike.findOne({
      where: { post_id: id, user_id: userId }
    });

    if (!like) {
      return res.status(404).json({
        success: false,
        message: 'Reaction not found'
      });
    }

    await like.destroy();

    // Get updated reaction counts
    const likes = await PostLike.findAll({
      where: { post_id: id },
      attributes: ['reaction_type']
    });

    const reactionCounts = {
      heart: 0,
      pray: 0,
      sparkle: 0,
      lightbulb: 0,
      peace: 0
    };

    likes.forEach(like => {
      reactionCounts[like.reaction_type]++;
    });

    res.json({
      success: true,
      message: 'Reaction removed',
      data: {
        reaction_counts: reactionCounts,
        user_reaction: null,
        like_count: likes.length
      }
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove reaction'
    });
  }
});

// GET /api/posts/:id/comments - Get comments for a post
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const comments = await Comment.findAndCountAll({
      where: {
        commentable_type: 'post',
        commentable_id: id,
        is_deleted: false
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'profile_image']
      }],
      order: [['created_at', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        comments: comments.rows,
        total: comments.count,
        page: parseInt(page),
        totalPages: Math.ceil(comments.count / limit)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
});

// POST /api/posts/:id/comments - Add comment to post
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const post = await Post.findByPk(id);

    if (!post || post.is_deleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = await Comment.create({
      content: content.trim(),
      author_id: userId,
      commentable_type: 'post',
      commentable_id: parseInt(id),
      parent_id: parent_id || null,
      status: 'approved'
    });

    const newComment = await Comment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'profile_image']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
});

// POST /api/posts/:id/report - Report a post
router.post('/:id/report', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }

    const post = await Post.findByPk(id);

    if (!post || post.is_deleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if already reported
    const existingReport = await ContentReport.findOne({
      where: {
        reporter_id: userId,
        reported_type: 'post',
        reported_id: id
      }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this post'
      });
    }

    const report = await ContentReport.create({
      reporter_id: userId,
      reported_type: 'post',
      reported_id: id,
      reason,
      description: description || null,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Post reported successfully. An admin will review it.',
      data: report
    });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report post'
    });
  }
});

// POST /api/posts/report - General report endpoint for any content type
router.post('/report', authenticateToken, async (req, res) => {
  try {
    const { content_type, content_id, reason, description } = req.body;
    const userId = req.user.id;

    if (!content_type || !content_id || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Content type, content ID, and reason are required'
      });
    }

    // Validate content type
    const validTypes = ['post', 'comment', 'activity', 'user', 'video', 'chat_message'];
    if (!validTypes.includes(content_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content type'
      });
    }

    // Check if content exists based on type
    let contentExists = false;
    let contentData = null;

    switch (content_type) {
      case 'post':
        contentData = await Post.findByPk(content_id);
        contentExists = contentData && !contentData.is_deleted;
        break;
      case 'comment':
        contentData = await Comment.findByPk(content_id);
        contentExists = contentData && !contentData.is_deleted;
        break;
      case 'activity':
        contentData = await ActivityFeed.findByPk(content_id);
        contentExists = contentData && !contentData.is_deleted;
        break;
      case 'user':
        contentData = await User.findByPk(content_id);
        contentExists = contentData && !contentData.is_deleted;
        break;
      case 'video':
        // For video content, we might need to check a different table
        // For now, just validate that the ID is a number
        contentExists = !isNaN(content_id);
        break;
      case 'chat_message':
        contentData = await ChatMessage.findByPk(content_id);
        contentExists = contentData && !contentData.is_deleted;
        break;
    }

    if (!contentExists) {
      return res.status(404).json({
        success: false,
        message: `${content_type.charAt(0).toUpperCase() + content_type.slice(1)} not found`
      });
    }

    // Check if already reported
    const existingReport = await ContentReport.findOne({
      where: {
        reporter_id: userId,
        reported_type: content_type,
        reported_id: content_id
      }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this content'
      });
    }

    const report = await ContentReport.create({
      reporter_id: userId,
      reported_type: content_type,
      reported_id: content_id,
      reason,
      description: description || null,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Content reported successfully. An admin will review it.',
      data: report
    });
  } catch (error) {
    console.error('Report content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report content'
    });
  }
});

module.exports = router;