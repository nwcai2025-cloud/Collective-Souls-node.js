const express = require('express');
const { body, param, query } = require('express-validator');
const { Op } = require('sequelize');
const { VideoRoom, User, sequelize } = require('../models');
const { authenticateToken, requirePermission, logAdminAction } = require('../middleware/auth');

const router = express.Router();

// Get all video rooms with admin details
router.get('/videos', authenticateToken, requirePermission('videos', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, privacy } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    // Search filter
    if (search) {
      where[Op.or] = [
        { room_name: { [Op.like]: `%${search}%` } },
        { '$User.username$': { [Op.like]: `%${search}%` } }
      ];
    }

    // Status filter
    if (status === 'active') {
      where.is_active = true;
    } else if (status === 'inactive') {
      where.is_active = false;
    }

    // Privacy filter
    if (privacy === 'public') {
      where.is_private = false;
    } else if (privacy === 'private') {
      where.is_private = true;
    }

    const rooms = await VideoRoom.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'email', 'is_active']
      }],
      distinct: true
    });

    // Add additional computed fields
    const roomsWithStats = rooms.rows.map(room => ({
      ...room.toJSON(),
      isFull: room.current_participants >= room.max_participants,
      occupancyPercentage: Math.round((room.current_participants / room.max_participants) * 100),
      status: room.is_active ? 'Active' : 'Inactive',
      privacy: room.is_private ? 'Private' : 'Public'
    }));

    res.json({
      success: true,
      data: {
        rooms: roomsWithStats,
        total: rooms.count,
        page: parseInt(page),
        totalPages: Math.ceil(rooms.count / limit)
      }
    });
  } catch (error) {
    console.error('Get video rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video rooms'
    });
  }
});

// Get specific video room
router.get('/videos/:id', authenticateToken, requirePermission('videos', 'read'), async (req, res) => {
  try {
    const { id } = req.params;
    const room = await VideoRoom.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'email', 'is_active', 'date_joined']
      }]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Video room not found'
      });
    }

    // Add computed fields
    const roomWithStats = {
      ...room.toJSON(),
      isFull: room.current_participants >= room.max_participants,
      occupancyPercentage: Math.round((room.current_participants / room.max_participants) * 100),
      status: room.is_active ? 'Active' : 'Inactive',
      privacy: room.is_private ? 'Private' : 'Public'
    };

    res.json({
      success: true,
      data: roomWithStats
    });
  } catch (error) {
    console.error('Get video room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video room'
    });
  }
});

// Update video room details
router.put('/videos/:id', authenticateToken, requirePermission('videos', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { room_name, description, max_participants, is_private, is_active } = req.body;

    const room = await VideoRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Video room not found'
      });
    }

    const oldValues = room.toJSON();
    
    // Validate max_participants
    if (max_participants && (max_participants < 2 || max_participants > 50)) {
      return res.status(400).json({
        success: false,
        message: 'Max participants must be between 2 and 50'
      });
    }

    // Ensure current_participants doesn't exceed new max_participants
    const updateData = {};
    if (room_name) updateData.room_name = room_name;
    if (description !== undefined) updateData.description = description;
    if (max_participants) {
      updateData.max_participants = max_participants;
      // Adjust current_participants if it exceeds new max
      if (room.current_participants > max_participants) {
        updateData.current_participants = max_participants;
      }
    }
    if (is_private !== undefined) updateData.is_private = is_private;
    if (is_active !== undefined) updateData.is_active = is_active;

    await room.update(updateData);
    const newValues = room.toJSON();

    // Log the action
    await logAdminAction(req.user.id, 'update', 'video_room', id, oldValues, newValues, req);

    res.json({
      success: true,
      message: 'Video room updated successfully',
      data: {
        ...room.toJSON(),
        isFull: room.current_participants >= room.max_participants,
        occupancyPercentage: Math.round((room.current_participants / room.max_participants) * 100),
        status: room.is_active ? 'Active' : 'Inactive',
        privacy: room.is_private ? 'Private' : 'Public'
      }
    });
  } catch (error) {
    console.error('Update video room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video room'
    });
  }
});

// Moderate video room (change status)
router.patch('/videos/:id/moderate', authenticateToken, requirePermission('videos', 'moderate'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    const validActions = ['activate', 'deactivate', 'lock', 'unlock'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid moderation action'
      });
    }

    const room = await VideoRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Video room not found'
      });
    }

    const oldValues = room.toJSON();
    const updateData = {};

    switch (action) {
      case 'activate':
        updateData.is_active = true;
        break;
      case 'deactivate':
        updateData.is_active = false;
        break;
      case 'lock':
        updateData.is_active = false;
        updateData.moderation_reason = reason || 'Room locked by admin';
        break;
      case 'unlock':
        updateData.is_active = true;
        updateData.moderation_reason = null;
        break;
    }

    await room.update(updateData);
    const newValues = room.toJSON();

    // Log the action
    await logAdminAction(req.user.id, 'moderate', 'video_room', id, oldValues, newValues, req);

    res.json({
      success: true,
      message: `Video room ${action}d successfully`,
      data: {
        ...room.toJSON(),
        isFull: room.current_participants >= room.max_participants,
        occupancyPercentage: Math.round((room.current_participants / room.max_participants) * 100),
        status: room.is_active ? 'Active' : 'Inactive',
        privacy: room.is_private ? 'Private' : 'Public'
      }
    });
  } catch (error) {
    console.error('Moderate video room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate video room'
    });
  }
});

// Delete video room
router.delete('/videos/:id', authenticateToken, requirePermission('videos', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const room = await VideoRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Video room not found'
      });
    }

    // Log the action before deletion
    await logAdminAction(req.user.id, 'delete', 'video_room', id, room.toJSON(), null, req);

    await room.destroy();

    res.json({
      success: true,
      message: 'Video room deleted successfully'
    });
  } catch (error) {
    console.error('Delete video room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video room'
    });
  }
});

// Get video room analytics
router.get('/videos/analytics', authenticateToken, requirePermission('videos', 'read'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const analytics = {
      totalRooms: await VideoRoom.count(),
      activeRooms: await VideoRoom.count({ where: { is_active: true } }),
      privateRooms: await VideoRoom.count({ where: { is_private: true } }),
      publicRooms: await VideoRoom.count({ where: { is_private: false } }),
      totalParticipants: await VideoRoom.sum('current_participants'),
      averageParticipants: await VideoRoom.average('current_participants') || 0,
      roomsCreatedToday: await VideoRoom.count({ where: { created_at: { [Op.gte]: today } } }),
      roomsCreatedThisWeek: await VideoRoom.count({ where: { created_at: { [Op.gte]: lastWeek } } }),
      roomsCreatedThisMonth: await VideoRoom.count({ where: { created_at: { [Op.gte]: lastMonth } } }),
      fullRooms: await VideoRoom.count({ 
        where: {
          [Op.and]: [
            { current_participants: { [Op.gte]: sequelize.literal('max_participants') } },
            { is_active: true }
          ]
        }
      })
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Video room analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video room analytics'
    });
  }
});

module.exports = router;