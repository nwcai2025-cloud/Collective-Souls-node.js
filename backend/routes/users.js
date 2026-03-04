// User Routes for Collective Souls Node.js Platform
const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const { UserBlock, UserMute, ContentReport } = require('../models');

const router = express.Router();

// Get all users (with pagination and search)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    const where = {};
    
    // Add search filter
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } }
      ];
    }

    // Add status filter
    if (status === 'active') {
      where.is_active = true;
    } else if (status === 'inactive') {
      where.is_active = false;
    }

    const users = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: limitNum,
      offset,
      order: [[sortBy === 'created_at' ? 'date_joined' : sortBy, sortOrder]],
      distinct: true
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(users.count / limitNum),
          totalUsers: users.count,
          hasNextPage: offset + limitNum < users.count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user by ID or username
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by ID first (if it's a number)
    let user;
    if (!isNaN(parseInt(id))) {
      user = await User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
    }

    // If not found by ID, try to find by username
    if (!user) {
      user = await User.findOne({
        where: { username: id },
        attributes: { exclude: ['password'] }
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      first_name,
      last_name,
      age,
      spiritual_intention,
      bio,
      is_active
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (age !== undefined) updateData.age = age;
    if (spiritual_intention !== undefined) updateData.spiritual_intention = spiritual_intention;
    if (bio !== undefined) updateData.bio = bio;
    if (is_active !== undefined) updateData.is_active = is_active;

    await user.update(updateData);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user (admin only - soft delete by deactivating)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by deactivating
    await user.update({ is_active: false });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's activities
router.get('/:id/activities', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // This would require Activity model which we haven't created yet
    // For now, return empty array
    res.json({
      success: true,
      data: {
        activities: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalActivities: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });

  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's comments
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // This would require Comment model which we haven't created yet
    // For now, return empty array
    res.json({
      success: true,
      data: {
        comments: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalComments: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });

  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's connections
router.get('/:id/connections', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // This would require Connection model which we haven't created yet
    // For now, return empty array
    res.json({
      success: true,
      data: {
        connections: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalConnections: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });

  } catch (error) {
    console.error('Get user connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== USER MODERATION ROUTES ====================

// POST /api/users/:id/block - Block a user
router.post('/:id/block', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Can't block yourself
    if (parseInt(id) === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself'
      });
    }

    // Check if user exists
    const userToBlock = await User.findByPk(id);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already blocked
    const existingBlock = await UserBlock.findOne({
      where: { blocker_id: userId, blocked_id: id }
    });

    if (existingBlock) {
      return res.status(400).json({
        success: false,
        message: 'User is already blocked'
      });
    }

    // Create block
    await UserBlock.create({
      blocker_id: userId,
      blocked_id: parseInt(id)
    });

    // Also remove any connection between users (if exists)
    // This would be handled by the Connection model if it exists

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block user'
    });
  }
});

// DELETE /api/users/:id/block - Unblock a user
router.delete('/:id/block', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const block = await UserBlock.findOne({
      where: { blocker_id: userId, blocked_id: id }
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    await block.destroy();

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock user'
    });
  }
});

// POST /api/users/:id/mute - Mute a user
router.post('/:id/mute', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Can't mute yourself
    if (parseInt(id) === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot mute yourself'
      });
    }

    // Check if user exists
    const userToMute = await User.findByPk(id);
    if (!userToMute) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already muted
    const existingMute = await UserMute.findOne({
      where: { muter_id: userId, muted_id: id }
    });

    if (existingMute) {
      return res.status(400).json({
        success: false,
        message: 'User is already muted'
      });
    }

    // Create mute
    await UserMute.create({
      muter_id: userId,
      muted_id: parseInt(id)
    });

    res.json({
      success: true,
      message: 'User muted successfully'
    });
  } catch (error) {
    console.error('Mute user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mute user'
    });
  }
});

// DELETE /api/users/:id/mute - Unmute a user
router.delete('/:id/mute', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const mute = await UserMute.findOne({
      where: { muter_id: userId, muted_id: id }
    });

    if (!mute) {
      return res.status(404).json({
        success: false,
        message: 'Mute not found'
      });
    }

    await mute.destroy();

    res.json({
      success: true,
      message: 'User unmuted successfully'
    });
  } catch (error) {
    console.error('Unmute user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unmute user'
    });
  }
});

// GET /api/users/blocked - Get my blocked users
router.get('/blocked/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const blocks = await UserBlock.findAll({
      where: { blocker_id: userId },
      include: [{
        model: User,
        as: 'blocked',
        attributes: ['id', 'username', 'profile_image', 'first_name', 'last_name']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        blocked: blocks.map(b => b.blocked)
      }
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blocked users'
    });
  }
});

// GET /api/users/muted - Get my muted users
router.get('/muted/list', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const mutes = await UserMute.findAll({
      where: { muter_id: userId },
      include: [{
        model: User,
        as: 'muted',
        attributes: ['id', 'username', 'profile_image', 'first_name', 'last_name']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        muted: mutes.map(m => m.muted)
      }
    });
  } catch (error) {
    console.error('Get muted users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch muted users'
    });
  }
});

// POST /api/users/:id/report - Report a user
router.post('/:id/report', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const userId = req.user.id;

    // Can't report yourself
    if (parseInt(id) === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }

    // Check if user exists
    const userToReport = await User.findByPk(id);
    if (!userToReport) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already reported
    const existingReport = await ContentReport.findOne({
      where: {
        reporter_id: userId,
        reported_type: 'user',
        reported_id: id
      }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this user'
      });
    }

    const report = await ContentReport.create({
      reporter_id: userId,
      reported_type: 'user',
      reported_id: parseInt(id),
      reason,
      description: description || null,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'User reported successfully. An admin will review it.',
      data: report
    });
  } catch (error) {
    console.error('Report user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report user'
    });
  }
});

// GET /api/users/:id/moderation-status - Check if I've blocked/muted/reported a user
router.get('/:id/moderation-status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [blocked, muted, reported] = await Promise.all([
      UserBlock.findOne({ where: { blocker_id: userId, blocked_id: id } }),
      UserMute.findOne({ where: { muter_id: userId, muted_id: id } }),
      ContentReport.findOne({ where: { reporter_id: userId, reported_type: 'user', reported_id: id } })
    ]);

    res.json({
      success: true,
      data: {
        isBlocked: !!blocked,
        isMuted: !!muted,
        isReported: !!reported
      }
    });
  } catch (error) {
    console.error('Get moderation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch moderation status'
    });
  }
});

module.exports = router;
