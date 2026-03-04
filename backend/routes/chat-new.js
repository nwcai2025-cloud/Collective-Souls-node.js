/**
 * New Chat Routes for Django-style chat system
 * API endpoints matching Django chat app structure
 */

const express = require('express');
const { ChatRoom, DirectMessage, ChatMessage, RoomParticipant, DMParticipant, MessageReaction, UserPresence } = require('../models/Chat');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const { getIO } = require('../config/socket');
const NotificationService = require('../services/notificationService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50000000 }, // 50MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// ===============================
// ROOM MANAGEMENT
// ===============================

// GET /api/chat/rooms/ - List all public chat rooms
router.get('/rooms/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Return all active rooms (public rooms are accessible to all)
    const rooms = await ChatRoom.findAndCountAll({
      where: { is_active: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      }],
      limit: limitNum,
      offset,
      order: [['updated_at', 'DESC']],
      distinct: true
    });

    // Add participant counts
    const roomData = await Promise.all(
      rooms.rows.map(async (room) => {
        const participantCount = await RoomParticipant.count({
          where: { room_id: room.id }
        });

        return {
          ...room.toJSON(),
          participant_count: participantCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        rooms: roomData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(rooms.count / limitNum),
          totalRooms: rooms.count,
          hasNextPage: offset + limitNum < rooms.count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/chat/rooms/ - Create new chat room
router.post('/rooms/', async (req, res) => {
  try {
    const {
      name,
      description,
      room_type = 'general',
      is_private = false,
      max_participants = 100
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Room name is required'
      });
    }

    const room = await ChatRoom.create({
      name,
      description,
      room_type,
      is_private,
      max_participants,
      created_by: req.user.id
    });

    // Add creator as participant
    await RoomParticipant.create({
      room_id: room.id,
      user_id: req.user.id,
      is_admin: true,
      is_online: true
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: { 
        room: {
          ...room.toJSON(),
          participant_count: 1,
          is_participant: true
        }
      }
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/chat/rooms/:id/ - Get room details
router.get('/rooms/:id/', async (req, res) => {
  try {
    const { id } = req.params;

    const room = await ChatRoom.findByPk(id, {
      where: { is_active: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'first_name', 'last_name']
      }]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is participant
    const isParticipant = await RoomParticipant.findOne({
      where: { room_id: id, user_id: req.user.id }
    });

    const participantCount = await RoomParticipant.count({
      where: { room_id: id }
    });

    res.json({
      success: true,
      data: {
        room: {
          ...room.toJSON(),
          participant_count: participantCount,
          is_participant: !!isParticipant
        }
      }
    });

  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/chat/rooms/:room_id/join/ - Join a room
router.post('/rooms/:room_id/join/', async (req, res) => {
  try {
    const { room_id } = req.params;
    const user = req.user;

    const room = await ChatRoom.findByPk(room_id, { where: { is_active: true } });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Add user to room participants
    const [participant, created] = await RoomParticipant.findOrCreate({
      where: { room_id, user_id: user.id },
      defaults: {
        room_id,
        user_id: user.id,
        is_online: true
      }
    });

    if (created) {
      // Send system message about user joining
      await ChatMessage.create({
        room_id: room.id,
        sender_id: user.id,
        content: `${user.username} joined the room`,
        message_type: 'system'
      });
    } else {
      // Update existing participant
      await participant.update({ is_online: true });
    }

    res.json({
      success: true,
      joined: created,
      room: {
        id: room.id,
        name: room.name,
        description: room.description
      }
    });

  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/chat/rooms/:room_id/leave/ - Leave a room
router.post('/rooms/:room_id/leave/', async (req, res) => {
  try {
    const { room_id } = req.params;
    const user = req.user;

    const room = await ChatRoom.findByPk(room_id, { where: { is_active: true } });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Remove user from room participants
    const participant = await RoomParticipant.findOne({
      where: { room_id, user_id: user.id }
    });

    if (participant) {
      await participant.destroy();

      // Send system message about user leaving
      await ChatMessage.create({
        room_id: room.id,
        sender_id: user.id,
        content: `${user.username} left the room`,
        message_type: 'system'
      });

      return res.json({
        success: true,
        message: 'Successfully left the room'
      });
    } else {
      return res.json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/chat/rooms/:id/ - Delete a room (owner only)
router.delete('/rooms/:id/', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const room = await ChatRoom.findByPk(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is the room owner OR an admin
    const isAdmin = req.user.is_staff || req.user.is_superuser;
    if (room.created_by !== req.user.id && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the room owner or admin can delete this room'
      });
    }

    // Delete all messages in the room
    await ChatMessage.destroy({ where: { room_id: id } });
    
    // Delete all participants
    await RoomParticipant.destroy({ where: { room_id: id } });
    
    // Delete the room
    await room.destroy();

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });

  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===============================
// DIRECT MESSAGE MANAGEMENT
// ===============================

// GET /api/chat/dms/ - List user's DM conversations
router.get('/dms/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Find DMs where the user is a participant
    const dms = await DirectMessage.findAndCountAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        },
        {
          model: DMParticipant,
          as: 'participants',
          where: { user_id: req.user.id },
          required: true,
          attributes: []
        }
      ],
      where: { is_active: true },
      limit: limitNum,
      offset,
      order: [['updated_at', 'DESC']],
      distinct: true
    });

    // Add participant counts and last messages
    const dmData = await Promise.all(
      dms.rows.map(async (dm) => {
        const participants = await DMParticipant.findAll({
          where: { dm_id: dm.id },
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'profile_image']
          }]
        });

        const lastMessage = await ChatMessage.findOne({
          where: { dm_id: dm.id },
          order: [['created_at', 'DESC']],
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'username']
          }]
        });

        return {
          ...dm.toJSON(),
          participants: participants.map(p => p.user),
          participant_count: participants.length,
          last_message: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            sender_id: lastMessage.sender_id,
            sender_username: lastMessage.sender.username,
            created_at: lastMessage.created_at
          } : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        dms: dmData,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(dms.count / limitNum),
          totalDMs: dms.count,
          hasNextPage: offset + limitNum < dms.count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get DMs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/chat/dms/start/ - Start a new DM
router.post('/dms/start/', async (req, res) => {
  try {
    const { recipient_id, initial_message } = req.body;

    if (!recipient_id) {
      return res.status(400).json({
        success: false,
        message: 'recipient_id is required'
      });
    }

    const sender = req.user;
    const recipient = await User.findByPk(recipient_id);

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    if (sender.id === recipient.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start DM with yourself'
      });
    }

    // Check if DM already exists between these users
    const existingDMs = await DirectMessage.findAll({
      include: [{
        model: DMParticipant,
        where: { user_id: sender.id },
        as: 'participants'
      }, {
        model: DMParticipant,
        where: { user_id: recipient.id },
        as: 'participants'
      }],
      where: { is_group_chat: false, is_active: true }
    });

    for (const dm of existingDMs) {
      const participantCount = await DMParticipant.count({
        where: { dm_id: dm.id }
      });
      
      if (participantCount === 2) {
        return res.json({
          success: true,
          dm: {
            id: dm.id,
            name: dm.name,
            is_group_chat: dm.is_group_chat,
            status: dm.status,
            created_by: dm.created_by,
            participants: [sender, recipient]
          },
          existing: true
        });
      }
    }

    // Create new DM
    const dm = await DirectMessage.create({
      created_by: sender.id,
      is_group_chat: false
    });

    // Add participants
    await DMParticipant.create({ dm_id: dm.id, user_id: sender.id });
    await DMParticipant.create({ dm_id: dm.id, user_id: recipient.id });

    // Create initial message if provided
    if (initial_message && initial_message.trim()) {
      await ChatMessage.create({
        dm_id: dm.id,
        sender_id: sender.id,
        content: initial_message.trim(),
        message_type: 'text'
      });
    }

    // Send notification to the recipient about the new DM
    try {
      await NotificationService.notifyNewMessage(recipient_id, {
        id: sender.id,
        username: sender.username
      }, { dmId: dm.id });
    } catch (notifError) {
      console.error('Failed to send DM notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      dm: {
        id: dm.id,
        name: dm.name,
        is_group_chat: dm.is_group_chat,
        status: dm.status,
        created_by: dm.created_by,
        participants: [sender, recipient]
      },
      new: true
    });

  } catch (error) {
    console.error('Start DM error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/chat/dms/:id/respond/ - Accept or decline a DM request
router.post('/dms/:id/respond/', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accepted' or 'declined'

    console.log(`📩 DM Response: ID=${id}, Action=${action}, User=${req.user.id}`);

    if (!['accepted', 'declined'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const dm = await DirectMessage.findByPk(id);
    if (!dm) {
      return res.status(404).json({ success: false, message: 'DM not found' });
    }

    console.log(`🔍 DM Found: CreatedBy=${dm.created_by}, Status=${dm.status}`);

    // Check if user is a participant
    const participant = await DMParticipant.findOne({
      where: { dm_id: id, user_id: req.user.id }
    });

    if (!participant) {
      console.log(`❌ User ${req.user.id} is not a participant of DM ${id}`);
      return res.status(403).json({ success: false, message: 'Not a participant of this DM' });
    }

    // Only the receiver (not the creator) can accept/decline
    if (dm.created_by === req.user.id) {
      console.log(`❌ Creator ${req.user.id} tried to respond to their own request`);
      return res.status(403).json({ success: false, message: 'Creators cannot respond to their own requests' });
    }

    await dm.update({ status: action });
    console.log(`✅ DM ${id} status updated to ${action}`);

    res.json({ success: true, message: `DM request ${action}` });
  } catch (error) {
    console.error('Respond to DM error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/chat/dms/:id/ - Delete a DM conversation
router.delete('/dms/:id/', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const dm = await DirectMessage.findByPk(id);

    if (!dm) {
      return res.status(404).json({ success: false, message: 'DM not found' });
    }

    // Check if user is the creator or an admin
    if (dm.created_by !== req.user.id && !req.user.is_staff && !req.user.is_superuser) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this DM' });
    }

    await dm.destroy();

    res.json({ success: true, message: 'DM deleted successfully' });
  } catch (error) {
    console.error('Delete DM error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/chat/dms/:id/ - Get DM details
router.get('/dms/:id/', async (req, res) => {
  try {
    const { id } = req.params;

    const dm = await DirectMessage.findByPk(id, {
      where: { is_active: true },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username']
      }]
    });

    if (!dm) {
      return res.status(404).json({
        success: false,
        message: 'DM not found'
      });
    }

    // Check if user is participant
    const isParticipant = await DMParticipant.findOne({
      where: { dm_id: id, user_id: req.user.id }
    });

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const participants = await DMParticipant.findAll({
      where: { dm_id: id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'profile_image']
      }]
    });

    res.json({
      success: true,
      data: {
        dm: {
          ...dm.toJSON(),
          participants: participants.map(p => p.user)
        }
      }
    });

  } catch (error) {
    console.error('Get DM error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===============================
// MESSAGE MANAGEMENT
// ===============================

// GET /api/chat/rooms/:room_id/messages/ - Get room messages
router.get('/rooms/:room_id/messages/', async (req, res) => {
  try {
    const { room_id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Check if user is participant
    const participant = await RoomParticipant.findOne({
      where: { room_id, user_id: req.user.id }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Not a room participant'
      });
    }

    const { Op } = require('sequelize');
    const messages = await ChatMessage.findAndCountAll({
      where: { 
        room_id,
        status: { [Op.notIn]: ['rejected', 'deleted'] }
      },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'profile_image']
      }, {
        model: MessageReaction,
        as: 'reactions',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }]
      }],
      limit: limitNum,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true
    });

    res.json({
      success: true,
      data: {
        messages: messages.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(messages.count / limitNum),
          totalMessages: messages.count,
          hasNextPage: offset + limitNum < messages.count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get room messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/chat/dms/:dm_id/messages/ - Get DM messages
router.get('/dms/:dm_id/messages/', async (req, res) => {
  try {
    const { dm_id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Check if user is participant
    const participant = await DMParticipant.findOne({
      where: { dm_id, user_id: req.user.id }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Not a DM participant'
      });
    }

    const { Op } = require('sequelize');
    const messages = await ChatMessage.findAndCountAll({
      where: { 
        dm_id,
        status: { [Op.notIn]: ['rejected', 'deleted'] }
      },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'profile_image']
      }, {
        model: MessageReaction,
        as: 'reactions',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }]
      }],
      limit: limitNum,
      offset,
      order: [['created_at', 'DESC']],
      distinct: true
    });

    res.json({
      success: true,
      data: {
        messages: messages.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(messages.count / limitNum),
          totalMessages: messages.count,
          hasNextPage: offset + limitNum < messages.count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get DM messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/chat/messages/send/ - Send message
router.post('/messages/send/', upload.single('file'), async (req, res) => {
  try {
    const { content, message_type = 'text', room_id, dm_id } = req.body;
    const file = req.file;

    // Validate input
    if (!content && !file && message_type === 'text') {
      return res.status(400).json({
        success: false,
        message: 'Message content or file is required'
      });
    }

    if (!room_id && !dm_id) {
      return res.status(400).json({
        success: false,
        message: 'Either room_id or dm_id must be provided'
      });
    }

    if (room_id && dm_id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send to both room and DM'
      });
    }

    const user = req.user;
    let message;

    if (room_id) {
      console.log(`🔍 Checking participation for room ${room_id}, user ${user.id}`);
      // Check if user is participant
      const participant = await RoomParticipant.findOne({
        where: { room_id, user_id: user.id }
      });

      if (!participant) {
        console.log(`❌ User ${user.id} is not a participant of room ${room_id}`);
        return res.status(403).json({
          success: false,
          message: 'Access denied - Not a room participant'
        });
      }

      message = await ChatMessage.create({
        room_id,
        sender_id: user.id,
        content: content || '',
        message_type: file ? 'file' : message_type,
        file_url: file ? `/uploads/${file.filename}` : null,
        file_name: file ? file.originalname : null,
        file_size: file ? file.size : 0
      });
    } else {
      // Check if user is participant
      const participant = await DMParticipant.findOne({
        where: { dm_id, user_id: user.id }
      });

      if (!participant) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Not a DM participant'
        });
      }

      message = await ChatMessage.create({
        dm_id,
        sender_id: user.id,
        content: content || '',
        message_type: file ? 'file' : message_type,
        file_url: file ? `/uploads/${file.filename}` : null,
        file_name: file ? file.originalname : null,
        file_size: file ? file.size : 0
      });
    }

    // Get sender info
    const sender = await User.findByPk(user.id, {
      attributes: ['id', 'username', 'profile_image']
    });

    const messageData = {
      id: message.id,
      room_id: message.room_id,
      dm_id: message.dm_id,
      content: message.content,
      message_type: message.message_type,
      file_url: message.file_url,
      file_name: message.file_name,
      file_size: message.file_size,
      sender: {
        id: sender.id,
        username: sender.username,
        profile_image: sender.profile_image
      },
      created_at: message.created_at,
      reactions: [] // Initialize with empty reactions array
    };

    // Emit socket event for real-time update
    const io = getIO();
    if (io) {
      if (room_id) {
        console.log(`📢 Broadcasting to room_${room_id}`);
        io.to(`room_${room_id}`).emit('new_message', messageData);
      } else if (dm_id) {
        console.log(`📢 Broadcasting to dm_${dm_id}`);
        io.to(`dm_${dm_id}`).emit('new_message', messageData);
      }
    }

    res.status(201).json({
      success: true,
      message: messageData
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/chat/messages/:message_id/react/ - Add/remove reaction
router.post('/messages/:message_id/react/', async (req, res) => {
  try {
    const { message_id } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const user = req.user;
    const message = await ChatMessage.findByPk(message_id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user has access to the message
    let hasAccess = false;
    if (message.room_id) {
      const participant = await RoomParticipant.findOne({
        where: { room_id: message.room_id, user_id: user.id }
      });
      hasAccess = !!participant;
    } else if (message.dm_id) {
      const participant = await DMParticipant.findOne({
        where: { dm_id: message.dm_id, user_id: user.id }
      });
      hasAccess = !!participant;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Toggle reaction
    const [reaction, created] = await MessageReaction.findOrCreate({
      where: { message_id, user_id: user.id, emoji },
      defaults: { message_id, user_id: user.id, emoji }
    });

    if (!created) {
      // Remove existing reaction
      await reaction.destroy();
      return res.json({
        success: true,
        action: 'removed',
        reaction: { id: reaction.id, emoji }
      });
    }

    // Return new reaction
    res.status(201).json({
      success: true,
      action: 'added',
      reaction: {
        id: reaction.id,
        message_id: reaction.message_id,
        user_id: reaction.user_id,
        emoji: reaction.emoji,
        created_at: reaction.created_at
      }
    });

  } catch (error) {
    console.error('Message reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ===============================
// PRESENCE MANAGEMENT
// ===============================

// GET /api/chat/presence/online/ - Get online users
router.get('/presence/online/', async (req, res) => {
  try {
    const onlineUsers = await UserPresence.findAll({
      where: { is_online: true },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'profile_image']
      }, {
        model: ChatRoom,
        as: 'current_room',
        attributes: ['id', 'name']
      }]
    });

    const usersData = onlineUsers.map(presence => ({
      id: presence.user.id,
      username: presence.user.username,
      profile_image: presence.user.profile_image,
      last_seen: presence.last_seen,
      current_room: presence.current_room ? {
        id: presence.current_room.id,
        name: presence.current_room.name
      } : null
    }));

    res.json({
      success: true,
      online_users: usersData,
      count: usersData.length
    });

  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/chat/presence/ - Get user presence
router.get('/presence/', async (req, res) => {
  try {
    const presence = await UserPresence.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: ChatRoom,
        as: 'current_room',
        attributes: ['id', 'name']
      }]
    });

    if (!presence) {
      return res.json({
        success: true,
        data: {
          user_id: req.user.id,
          is_online: false,
          last_seen: new Date(),
          current_room: null
        }
      });
    }

    res.json({
      success: true,
      data: presence
    });

  } catch (error) {
    console.error('Get presence error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/chat/presence/ - Update user presence
router.post('/presence/', async (req, res) => {
  try {
    const { is_online = true, current_room_id } = req.body;
    const user = req.user;

    const [presence, created] = await UserPresence.findOrCreate({
      where: { user_id: user.id },
      defaults: {
        user_id: user.id,
        is_online,
        current_room_id
      }
    });

    if (!created) {
      await presence.update({
        is_online,
        last_seen: new Date(),
        current_room_id
      });
    }

    res.json({
      success: true,
      data: {
        user_id: presence.user_id,
        is_online: presence.is_online,
        last_seen: presence.last_seen,
        current_room_id: presence.current_room_id
      }
    });

  } catch (error) {
    console.error('Update presence error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;