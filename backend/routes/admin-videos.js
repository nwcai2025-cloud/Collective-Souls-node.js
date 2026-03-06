const express = require('express');
const { body, param, query } = require('express-validator');
const { Op } = require('sequelize');
const { VideoRoom, User, sequelize } = require('../models');
const { authenticateToken, requirePermission, logAdminAction } = require('../middleware/auth');

const router = express.Router();

console.log('🔍 Admin videos routes loaded');

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

// Get video room analytics
router.get('/videos/analytics', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Analytics endpoint called');
    console.log('📋 Request headers:', req.headers);
    console.log('🔑 Authorization header:', req.headers['authorization']);
    
    // Test with a static response first to see if the endpoint works
    const staticAnalytics = {
      totalRooms: 11,
      activeRooms: 10,
      privateRooms: 0,
      publicRooms: 11,
      totalParticipants: 11,
      averageParticipants: 1,
      roomsCreatedToday: 0,
      roomsCreatedThisWeek: 0,
      roomsCreatedThisMonth: 11,
      fullRooms: 0
    };

    console.log('✅ Sending response:', staticAnalytics);
    res.json({
      success: true,
      data: staticAnalytics
    });
  } catch (error) {
    console.error('Video room analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video room analytics'
    });
  }
});

// Update video room
router.put('/videos/:roomId', authenticateToken, requirePermission('videos', 'update'), async (req, res) => {
  try {
    const { roomId } = req.params;
    const { room_name, description, max_participants, is_private, is_active } = req.body;

    // Find the room
    const room = await VideoRoom.findOne({
      where: { room_id: roomId }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Video room not found'
      });
    }

    // Update the room
    const updatedRoom = await room.update({
      room_name,
      description,
      max_participants,
      is_private,
      is_active
    });

    // Log the admin action
    await logAdminAction(req.user.id, 'videos', 'update', `Updated video room: ${room.room_name}`, {
      roomId: room.room_id,
      oldData: {
        room_name: room.room_name,
        description: room.description,
        max_participants: room.max_participants,
        is_private: room.is_private,
        is_active: room.is_active
      },
      newData: {
        room_name,
        description,
        max_participants,
        is_private,
        is_active
      }
    }, req);

    res.json({
      success: true,
      message: 'Video room updated successfully',
      data: {
        ...updatedRoom.toJSON(),
        isFull: updatedRoom.current_participants >= updatedRoom.max_participants,
        occupancyPercentage: Math.round((updatedRoom.current_participants / updatedRoom.max_participants) * 100),
        status: updatedRoom.is_active ? 'Active' : 'Inactive',
        privacy: updatedRoom.is_private ? 'Private' : 'Public'
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

// Delete video room
router.delete('/videos/:roomId', authenticateToken, requirePermission('videos', 'delete'), async (req, res) => {
  try {
    const { roomId } = req.params;

    // Find the room
    const room = await VideoRoom.findOne({
      where: { room_id: roomId }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Video room not found'
      });
    }

    // Store room info for logging before deletion
    const roomInfo = {
      room_name: room.room_name,
      room_id: room.room_id,
      creator_id: room.created_by
    };

    // Delete the room
    await room.destroy();

    // Log the admin action
    await logAdminAction(req.user.id, 'videos', 'delete', `Deleted video room: ${room.room_name}`, {
      roomId: room.room_id,
      roomName: room.room_name,
      creatorId: room.created_by
    }, req);

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

module.exports = router;
