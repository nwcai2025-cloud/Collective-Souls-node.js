const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { VideoRoom, User } = require('../models');
const FeatureFlagService = require('../services/featureFlagService');

const router = express.Router();

// Middleware to check if video features are enabled
const checkVideoFeaturesEnabled = async (req, res, next) => {
  try {
    const areFeaturesEnabled = await FeatureFlagService.areAnyCommunicationFeaturesEnabled();
    
    if (!areFeaturesEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Video and phone features are currently disabled by the administrator'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error checking feature flags:', error);
    // Allow access on error to prevent lockout
    next();
  }
};

// Apply feature flag check to all video routes
router.use(checkVideoFeaturesEnabled);

// Create a new video room
router.post('/create-room', authenticateToken, async (req, res) => {
  try {
    const { roomName, maxParticipants = 10 } = req.body;
    const userId = req.user.id;

    // Generate unique room ID
    const roomId = generateRoomId();

    // Create video room
    const videoRoom = await VideoRoom.create({
      room_id: roomId,
      room_name: roomName || `Room ${roomId}`,
      created_by: userId,
      max_participants: maxParticipants,
      current_participants: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Video room created successfully',
      data: {
        roomId: videoRoom.room_id,
        roomName: videoRoom.room_name,
        createdBy: videoRoom.created_by,
        maxParticipants: videoRoom.max_participants,
        currentParticipants: videoRoom.current_participants
      }
    });

  } catch (error) {
    console.error('Create video room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create video room',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Join a video room
router.post('/join-room/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Find the video room
    const videoRoom = await VideoRoom.findOne({
      where: { 
        room_id: roomId, 
        is_active: true 
      }
    });

    if (!videoRoom) {
      return res.status(404).json({
        success: false,
        message: 'Video room not found or inactive'
      });
    }

    // Check if room is full
    if (videoRoom.current_participants >= videoRoom.max_participants) {
      return res.status(400).json({
        success: false,
        message: 'Video room is full'
      });
    }

    // Update participant count
    await VideoRoom.update(
      { 
        current_participants: videoRoom.current_participants + 1,
        updated_at: new Date()
      },
      { where: { room_id: roomId } }
    );

    // Get user info
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'profile_image']
    });

    res.json({
      success: true,
      message: 'Successfully joined video room',
      data: {
        roomId: videoRoom.room_id,
        roomName: videoRoom.room_name,
        user: {
          userId: user.id,
          userName: user.username,
          profileImage: user.profile_image
        },
        currentParticipants: videoRoom.current_participants + 1,
        maxParticipants: videoRoom.max_participants
      }
    });

  } catch (error) {
    console.error('Join video room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join video room',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Leave a video room
router.post('/leave-room/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Update participant count
    const videoRoom = await VideoRoom.findOne({
      where: { room_id: roomId }
    });

    if (videoRoom && videoRoom.current_participants > 0) {
      await VideoRoom.update(
        { 
          current_participants: Math.max(0, videoRoom.current_participants - 1),
          updated_at: new Date()
        },
        { where: { room_id: roomId } }
      );
    }

    res.json({
      success: true,
      message: 'Successfully left video room'
    });

  } catch (error) {
    console.error('Leave video room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave video room',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Get room info
router.get('/room/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const videoRoom = await VideoRoom.findOne({
      where: { room_id: roomId }
    });

    if (!videoRoom) {
      return res.status(404).json({
        success: false,
        message: 'Video room not found'
      });
    }

    res.json({
      success: true,
      data: {
        roomId: videoRoom.room_id,
        roomName: videoRoom.room_name,
        createdBy: videoRoom.created_by,
        currentParticipants: videoRoom.current_participants,
        maxParticipants: videoRoom.max_participants,
        isActive: videoRoom.is_active
      }
    });

  } catch (error) {
    console.error('Get room info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room info',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// List active rooms
router.get('/rooms', authenticateToken, async (req, res) => {
  try {
    const videoRooms = await VideoRoom.findAll({
      where: { is_active: true },
      attributes: ['room_id', 'room_name', 'created_by', 'current_participants', 'max_participants', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 20
    });

    res.json({
      success: true,
      data: videoRooms
    });

  } catch (error) {
    console.error('List rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list rooms',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Helper function to generate room ID
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = router;