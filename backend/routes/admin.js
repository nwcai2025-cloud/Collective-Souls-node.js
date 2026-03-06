const express = require('express');
const os = require('os');
const { body, param, query } = require('express-validator');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Import models
const { 
  User, 
  ActivityFeed, 
  Comment, 
  Event,
  AdminRole, 
  AdminUser, 
  AdminAuditLog, 
  ContentReport, 
  AdminNotification,
  ChatMessage,
  DirectMessage,
  ChatRoom,
  RoomParticipant,
  DMParticipant,
  MessageReaction,
  UserPresence
} = require('../models');

// Import middleware
const { authenticateToken, requirePermission, logAdminAction, createAdminNotification, broadcastAdminNotification } = require('../middleware/auth');

const router = express.Router();

// Admin Authentication Routes

// Admin login - Unified authentication
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('🔍 Admin login attempt:', { username, password: '***' });

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email: username }
        ]
      }
    });

    console.log('🔍 User found:', !!user);
    if (!user) {
      console.log('❌ User not found for username:', username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('🔍 User details:', {
      id: user.id,
      username: user.username,
      is_active: user.is_active,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser
    });

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ Account is deactivated for user:', user.username);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if user has admin privileges
    if (!user.is_staff && !user.is_superuser) {
      console.log('❌ Admin access required for user:', user.username);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔍 Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', user.username);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_staff: user.is_staff,
          is_superuser: user.is_superuser,
          is_admin: true
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin logout
router.post('/logout', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Admin logout successful'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin Dashboard Routes

// Get dashboard stats
router.get('/dashboard', authenticateToken, requirePermission('dashboard', 'read'), async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.count(),
      totalAdmins: await User.count({ where: { is_staff: true, is_active: true } }),
      pendingReports: await ContentReport.count({ where: { status: 'pending' } }),
      totalComments: await Comment.count(),
      recentUsers: await User.findAll({
        order: [['date_joined', 'DESC']],
        limit: 5,
        attributes: ['id', 'username', 'email', 'date_joined']
      }),
      recentReports: await ContentReport.findAll({
        include: [{
          model: User,
          as: 'reporter',
          attributes: ['id', 'username']
        }],
        order: [['created_at', 'DESC']],
        limit: 5,
        attributes: ['id', 'reported_type', 'reported_id', 'reason', 'status', 'created_at']
      })
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
});

// User Management Routes

// Get all users
router.get('/users', authenticateToken, requirePermission('users', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    // Search filter
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } }
      ];
    }

    // Status filter
    if (status === 'active') {
      where.is_active = true;
    } else if (status === 'inactive') {
      where.is_active = false;
    }

    // Role filter
    if (role === 'admin') {
      where[Op.or] = [
        { is_staff: true },
        { is_superuser: true }
      ];
    }

    const users = await User.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['date_joined', 'DESC']],
      include: [{
        model: AdminUser,
        as: 'adminUser',
        include: [{
          model: AdminRole,
          as: 'role'
        }]
      }],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        total: users.count,
        page: parseInt(page),
        totalPages: Math.ceil(users.count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get specific user
router.get('/users/:id', authenticateToken, requirePermission('users', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      include: [{
        model: AdminUser,
        as: 'adminUser',
        include: [{
          model: AdminRole,
          as: 'role'
        }]
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Update user
router.put('/users/:id', authenticateToken, requirePermission('users', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldValues = user.toJSON();
    await user.update(userData);
    const newValues = user.toJSON();

    // Log the action
    await logAdminAction(req.user.id, 'update', 'user', id, oldValues, newValues, req);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Suspend user
router.delete('/users/:id', authenticateToken, requirePermission('users', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldValues = user.toJSON();
    await user.update({ is_active: false });
    const newValues = user.toJSON();

    // Log the action
    await logAdminAction(req.user.id, 'suspend', 'user', id, oldValues, newValues, req);

    res.json({
      success: true,
      message: 'User suspended successfully'
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user'
    });
  }
});

// Permanent delete user
router.delete('/users/:id/permanent', authenticateToken, requirePermission('users', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log the action before deletion
    await logAdminAction(req.user.id, 'delete_permanent', 'user', id, user.toJSON(), null, req);

    await user.destroy();

    res.json({
      success: true,
      message: 'User permanently deleted'
    });
  } catch (error) {
    console.error('Permanent delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user permanently'
    });
  }
});

// Promote user to admin
router.post('/users/:id/promote', authenticateToken, requirePermission('users', 'promote'), async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const role = await AdminRole.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if user is already an admin
    const existingAdmin = await AdminUser.findOne({ where: { user_id: id } });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'User is already an admin'
      });
    }

    // Create admin user record
    const adminUser = await AdminUser.create({
      user_id: id,
      role_id: roleId,
      is_active: true
    });

    // Log the action
    await logAdminAction(req.user.id, 'promote', 'user', id, null, { role: role.name }, req);

    res.json({
      success: true,
      message: 'User promoted to admin successfully',
      data: adminUser
    });
  } catch (error) {
    console.error('Promote user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to promote user'
    });
  }
});

// Content Moderation Routes

// Get comments for moderation
router.get('/content/comments', authenticateToken, requirePermission('content', 'moderate'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const comments = await Comment.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email']
      }]
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

// Moderate comment (Update status and/or content)
router.put('/content/comments/:id', authenticateToken, requirePermission('content', 'moderate'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, content } = req.body;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const oldValues = comment.toJSON();
    const updateData = {};
    if (status) updateData.status = status;
    if (reason) updateData.moderation_reason = reason;
    if (content !== undefined) {
      updateData.content = content;
      updateData.is_edited = true;
      updateData.edited_at = new Date();
    }
    
    await comment.update(updateData);
    const newValues = comment.toJSON();

    // Log the action
    await logAdminAction(req.user.id, 'moderate', 'comment', id, oldValues, newValues, req);

    res.json({
      success: true,
      message: 'Comment moderated successfully',
      data: comment
    });
  } catch (error) {
    console.error('Moderate comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate comment'
    });
  }
});

// Delete comment
router.delete('/content/comments/:id', authenticateToken, requirePermission('content', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    await comment.destroy();

    // Log the action
    await logAdminAction(req.user.id, 'delete', 'comment', id, comment.toJSON(), null, req);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment'
    });
  }
});

// Get activities for moderation
router.get('/content/activities', authenticateToken, requirePermission('content', 'moderate'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const activities = await ActivityFeed.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }]
    });

    res.json({
      success: true,
      data: {
        activities: activities.rows,
        total: activities.count,
        page: parseInt(page),
        totalPages: Math.ceil(activities.count / limit)
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities'
    });
  }
});

// Moderate activity (Update status and/or description)
router.put('/content/activities/:id', authenticateToken, requirePermission('content', 'moderate'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, description } = req.body;

    const activity = await ActivityFeed.findByPk(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    const oldValues = activity.toJSON();
    const updateData = {};
    if (status) updateData.status = status;
    if (reason) updateData.moderation_reason = reason;
    if (description !== undefined) updateData.description = description;
    
    await activity.update(updateData);
    const newValues = activity.toJSON();

    // Log the action
    await logAdminAction(req.user.id, 'moderate', 'activity', id, oldValues, newValues, req);

    res.json({
      success: true,
      message: 'Activity moderated successfully',
      data: activity
    });
  } catch (error) {
    console.error('Moderate activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate activity'
    });
  }
});

// Get events for moderation
router.get('/content/events', authenticateToken, requirePermission('content', 'moderate'), async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (type && type !== 'all') {
      where.event_type = type;
    }

    const events = await Event.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'email']
      }]
    });

    res.json({
      success: true,
      data: {
        events: events.rows,
        total: events.count,
        page: parseInt(page),
        totalPages: Math.ceil(events.count / limit)
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
});

// Delete event
router.delete('/content/events/:id', authenticateToken, requirePermission('content', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Log the action before deletion
    await logAdminAction(req.user.id, 'delete', 'event', id, event.toJSON(), null, req);

    await event.destroy();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
});

// Get DMs for moderation
router.get('/content/dms', authenticateToken, requirePermission('content', 'moderate'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const dms = await DirectMessage.findAndCountAll({
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'users',
          attributes: ['id', 'username'],
          through: { attributes: [] }
        }
      ],
      distinct: true
    });

    res.json({
      success: true,
      data: {
        dms: dms.rows,
        total: dms.count,
        page: parseInt(page),
        totalPages: Math.ceil(dms.count / limit)
      }
    });
  } catch (error) {
    console.error('Get DMs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch DMs'
    });
  }
});

// Delete DM (Admin)
router.delete('/content/dms/:id', authenticateToken, requirePermission('content', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;
    const dm = await DirectMessage.findByPk(id);
    if (!dm) {
      return res.status(404).json({ success: false, message: 'DM not found' });
    }
    await logAdminAction(req.user.id, 'delete', 'direct_message', id, dm.toJSON(), null, req);
    await dm.destroy();
    res.json({ success: true, message: 'DM deleted successfully' });
  } catch (error) {
    console.error('Delete DM error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete DM'
    });
  }
});

// Chat Message Moderation Routes
router.get('/content/chat-messages', authenticateToken, requirePermission('content', 'moderate'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    let messages;
    if (type === 'room') {
      messages = await ChatMessage.findAndCountAll({
        where: { ...where, room_id: { [Op.ne]: null } },
        offset,
        limit: limitNum,
        order: [['created_at', 'DESC']],
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username'] },
          { model: ChatRoom, as: 'room', attributes: ['id', 'name'] }
        ],
        distinct: true
      });
    } else if (type === 'dm') {
      messages = await ChatMessage.findAndCountAll({
        where: { ...where, dm_id: { [Op.ne]: null } },
        offset,
        limit: limitNum,
        order: [['created_at', 'DESC']],
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username'] },
          { model: DirectMessage, as: 'dm', attributes: ['id', 'name'] }
        ],
        distinct: true
      });
    } else {
      messages = await ChatMessage.findAndCountAll({
        where,
        offset,
        limit: limitNum,
        order: [['created_at', 'DESC']],
        include: [
          { model: User, as: 'sender', attributes: ['id', 'username'] },
          { model: ChatRoom, as: 'room', attributes: ['id', 'name'] },
          { model: DirectMessage, as: 'dm', attributes: ['id', 'name'] }
        ],
        distinct: true
      });
    }

    res.json({
      success: true,
      data: {
        messages: messages.rows,
        total: messages.count,
        page: parseInt(page),
        totalPages: Math.ceil(messages.count / limitNum),
      }
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat messages'
    });
  }
});

// Moderate chat message (Update status and/or content)
router.put('/content/chat-messages/:id', authenticateToken, requirePermission('content', 'moderate'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, moderation_reason, content } = req.body;

    const message = await ChatMessage.findByPk(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const oldValues = message.toJSON();
    const updateData = {};
    if (status) updateData.status = status;
    if (moderation_reason) updateData.moderation_reason = moderation_reason;
    if (content !== undefined) {
      updateData.content = content;
      updateData.is_edited = true;
      updateData.edited_at = new Date();
    }
    
    await message.update(updateData);
    const newValues = message.toJSON();

    // Log the action
    await logAdminAction(req.user.id, 'moderate', 'chat_message', id, oldValues, newValues, req);

    res.json({
      success: true,
      message: 'Message moderated successfully',
      data: message
    });
  } catch (error) {
    console.error('Moderate chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate message'
    });
  }
});

// Delete chat message
router.delete('/content/chat-messages/:id', authenticateToken, requirePermission('content', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const message = await ChatMessage.findByPk(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Log the action before deletion
    await logAdminAction(req.user.id, 'delete', 'chat_message', id, message.toJSON(), null, req);

    await message.destroy();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

// Content Reports Routes

// GET /admin/reports - Get all reports with pagination and filtering
router.get('/reports', authenticateToken, requirePermission('reports', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (type && type !== 'all') {
      where.reported_type = type;
    }

    const reports = await ContentReport.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'reporter',
        attributes: ['id', 'username', 'email']
      }]
    });

    res.json({
      success: true,
      data: {
        reports: reports.rows,
        total: reports.count,
        page: parseInt(page),
        totalPages: Math.ceil(reports.count / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports'
    });
  }
});

// GET /admin/reports/:id - Get detailed report with associated content
router.get('/reports/:id', authenticateToken, requirePermission('reports', 'read'), async (req, res) => {
  try {
    const { id } = req.params;

    const report = await ContentReport.findByPk(id, {
      include: [{
        model: User,
        as: 'reporter',
        attributes: ['id', 'username', 'email']
      }, {
        model: AdminUser,
        as: 'reviewer',
        include: [{
          model: User,
          as: 'user',
          attributes: ['username']
        }]
      }]
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Get the reported content based on type
    let reportedContent = null;

    switch (report.reported_type) {
      case 'comment':
        reportedContent = await Comment.findByPk(report.reported_id, {
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'username']
          }]
        });
        break;
      case 'activity':
        reportedContent = await ActivityFeed.findByPk(report.reported_id, {
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username']
          }]
        });
        break;
      case 'user':
        reportedContent = await User.findByPk(report.reported_id, {
          attributes: ['id', 'username', 'email', 'first_name', 'last_name']
        });
        break;
      case 'video':
        // For video content, we might need to check a different table
        // For now, just return the ID
        reportedContent = {
          id: report.reported_id,
          type: 'video',
          message: 'Video content details would be fetched from video rooms table'
        };
        break;
      case 'chat_message':
        reportedContent = await ChatMessage.findByPk(report.reported_id, {
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'username']
          }]
        });
        break;
      default:
        reportedContent = {
          id: report.reported_id,
          type: report.reported_type,
          message: 'Content type not supported for detailed view'
        };
    }

    res.json({
      success: true,
      data: {
        ...report.toJSON(),
        reported_content: reportedContent
      }
    });
  } catch (error) {
    console.error('Get report details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch report details'
    });
  }
});

// PUT /admin/reports/:id - Review and update report status
router.put('/reports/:id', authenticateToken, requirePermission('reports', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    if (!status || !['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, reviewed, resolved, dismissed'
      });
    }

    const report = await ContentReport.findByPk(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const oldValues = report.toJSON();
    
    // Update report
    await report.update({
      status,
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      resolution_notes: resolution_notes || null
    });

    const newValues = report.toJSON();

    // Log the action
    await logAdminAction(req.user.id, 'review', 'content_report', id, oldValues, newValues, req);

    // Create notification for the reporter if the report was resolved or dismissed
    if (status === 'resolved' || status === 'dismissed') {
      await createAdminNotification(
        report.reporter_id,
        'report_resolved',
        `Your report about ${report.reported_type} has been ${status}`,
        `/admin/reports/${id}`
      );
    }

    res.json({
      success: true,
      message: `Report ${status} successfully`,
      data: report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report'
    });
  }
});

// Analytics Routes
router.get('/analytics/users', authenticateToken, requirePermission('analytics', 'read'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const data = {
      newUsersToday: await User.count({ where: { date_joined: { [Op.gte]: today } } }),
      newUsersThisWeek: await User.count({ where: { date_joined: { [Op.gte]: lastWeek } } }),
      newUsersThisMonth: await User.count({ where: { date_joined: { [Op.gte]: lastMonth } } })
    };

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user analytics' });
  }
});

router.get('/analytics/content', authenticateToken, requirePermission('analytics', 'read'), async (req, res) => {
  try {
    const data = {
      totalComments: await Comment.count(),
      totalActivities: await ActivityFeed.count(),
      moderatedComments: await Comment.count({ where: { status: { [Op.ne]: 'pending' } } }),
      moderatedActivities: await ActivityFeed.count({ where: { status: { [Op.ne]: 'pending' } } }),
      resolvedReports: await ContentReport.count({ where: { status: 'resolved' } })
    };

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch content analytics' });
  }
});

router.get('/analytics/platform', authenticateToken, requirePermission('analytics', 'read'), async (req, res) => {
  try {
    const data = {
      totalUsers: (await User.count()) || 0,
      totalAdmins: (await User.count({ where: { is_staff: true } })) || 0
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch platform analytics' });
  }
});

// System Logs Routes
router.get('/logs/audit', authenticateToken, requirePermission('logs', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const logs = await AdminAuditLog.findAndCountAll({
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
      include: [{
        model: AdminUser,
        as: 'adminUser',
        include: [{ 
          model: User, 
          as: 'user', 
          attributes: ['username'],
          required: false
        }]
      }]
    });

    res.json({
      success: true,
      data: {
        logs: logs.rows,
        total: logs.count,
        page: parseInt(page),
        totalPages: Math.ceil(logs.count / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
});

router.get('/logs/system', authenticateToken, requirePermission('logs', 'read'), async (req, res) => {
  try {
    const systemInfo = {
      platform: os.platform(),
      nodeVersion: process.version,
      cpus: os.cpus().length,
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      uptime: os.uptime()
    };

    res.json({ success: true, data: { systemInfo } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch system logs' });
  }
});

// Admin Notifications Routes
router.get('/notifications', authenticateToken, requirePermission('notifications', 'read'), async (req, res) => {
  try {
    const notifications = await AdminNotification.findAll({
      where: { admin_user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

module.exports = router;