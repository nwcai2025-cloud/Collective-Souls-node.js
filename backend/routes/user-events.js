const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { UserEvent, Event, User } = require('../models');
const { ChatRoom, RoomParticipant, ChatMessage } = require('../models/Chat');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const router = express.Router();

// Get user's calendar events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const offset = (page - 1) * limit;

    const where = { user_id: req.user.id };
    if (status) where.event_status = status;
    if (type) where.status = type;

    const { count, rows } = await UserEvent.findAndCountAll({
      where,
      include: [
        {
          model: Event,
          as: 'event',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'first_name', 'last_name', 'profile_image']
            }
          ]
        }
      ],
      order: [[{ model: Event, as: 'event' }, 'start_time', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        user_events: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalEvents: count,
          hasNextPage: page * limit < count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get upcoming events for user
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const userEvents = await UserEvent.findAll({
      where: {
        user_id: req.user.id,
        event_status: {
          [Op.in]: ['upcoming', 'active']
        }
      },
      include: [
        {
          model: Event,
          as: 'event',
          where: {
            start_time: {
              [Op.gte]: new Date()
            }
          },
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'first_name', 'last_name', 'profile_image']
            }
          ]
        }
      ],
      order: [[{ model: Event, as: 'event' }, 'start_time', 'ASC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: { user_events: userEvents }
    });

  } catch (error) {
    console.error('Get upcoming user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get past events for user
router.get('/past', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await UserEvent.findAndCountAll({
      where: {
        user_id: req.user.id,
        event_status: {
          [Op.in]: ['completed', 'cancelled']
        }
      },
      include: [
        {
          model: Event,
          as: 'event',
          where: {
            end_time: {
              [Op.lt]: new Date()
            }
          },
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'first_name', 'last_name', 'profile_image']
            }
          ]
        }
      ],
      order: [[{ model: Event, as: 'event' }, 'start_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        user_events: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalEvents: count,
          hasNextPage: page * limit < count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get past user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get events user owns
router.get('/owners', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await UserEvent.findAndCountAll({
      where: {
        user_id: req.user.id,
        status: 'owner'
      },
      include: [
        {
          model: Event,
          as: 'event',
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'first_name', 'last_name', 'profile_image']
            }
          ]
        }
      ],
      order: [[{ model: Event, as: 'event' }, 'start_time', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        user_events: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalEvents: count,
          hasNextPage: page * limit < count,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get owner user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get events eligible for room creation (within 6 hours)
router.get('/room-eligible', authenticateToken, async (req, res) => {
  try {
    const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const now = new Date();

    const userEvents = await UserEvent.findAll({
      where: {
        user_id: req.user.id,
        status: 'owner',
        room_created: false
      },
      include: [
        {
          model: Event,
          as: 'event',
          where: {
            start_time: {
              [Op.between]: [now, sixHoursFromNow]
            },
            room_created: false
          },
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username', 'first_name', 'last_name', 'profile_image']
            }
          ]
        }
      ],
      order: [[{ model: Event, as: 'event' }, 'start_time', 'ASC']]
    });

    res.json({
      success: true,
      data: { user_events: userEvents }
    });

  } catch (error) {
    console.error('Get room eligible user events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create room for event - Creates a real chat room
router.post('/:eventId/create-room', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log('Create room request for event:', eventId, 'by user:', req.user.id);
    
    const { room_type = 'both' } = req.body;

    // Check if user owns the event
    const userEvent = await UserEvent.findOne({
      where: {
        user_id: req.user.id,
        event_id: eventId,
        status: 'owner'
      },
      include: [
        {
          model: Event,
          as: 'event'
        }
      ]
    });

    if (!userEvent) {
      console.log('User not authorized - no owner record found');
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create a room for this event'
      });
    }

    const event = userEvent.event;
    console.log('Event found:', event.id, event.title);
    
    // Check if event is within 6 hours
    const now = new Date();
    const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const startTime = new Date(event.start_time);
    
    console.log('Time check - now:', now, 'start:', startTime, '6h from now:', sixHoursFromNow);
    
    if (startTime < now || startTime > sixHoursFromNow) {
      console.log('Time validation failed');
      return res.status(400).json({
        success: false,
        message: 'Room can only be created within 6 hours of event start time'
      });
    }

    // Check if room already exists for this event in database
    let chatRoom = null;
    
    // First check if event already has a chat_room_id
    if (event.chat_room_id) {
      chatRoom = await ChatRoom.findByPk(event.chat_room_id);
      if (chatRoom) {
        console.log('Found existing room for event:', chatRoom.id);
        
        // Return existing room
        return res.json({
          success: true,
          message: 'Room already exists for this event',
          data: {
            chat_room_id: chatRoom.id,
            chat_room: {
              id: chatRoom.id,
              name: chatRoom.name,
              description: chatRoom.description,
              room_type: chatRoom.room_type
            },
            event: event
          }
        });
      }
    }
    
    // Check if a room with this name already exists
    const roomName = `📅 ${event.title} (Event #${event.id})`;
    chatRoom = await ChatRoom.findOne({ where: { name: roomName } });
    
    if (chatRoom) {
      console.log('Room with this name already exists:', chatRoom.id);
      
      // Link event to existing room and return it (disable FK checks)
      await sequelize.query('PRAGMA foreign_keys = OFF');
      await sequelize.query(
        `UPDATE events SET chat_room_id = ?, room_created = 1, event_status = 'active', "updatedAt" = ? WHERE id = ?`,
        {
          replacements: [chatRoom.id, new Date(), event.id],
          type: sequelize.QueryTypes.UPDATE
        }
      );
      await sequelize.query('PRAGMA foreign_keys = ON');
      
      return res.json({
        success: true,
        message: 'Room already exists for this event',
        data: {
          chat_room_id: chatRoom.id,
          chat_room: {
            id: chatRoom.id,
            name: chatRoom.name,
            description: chatRoom.description,
            room_type: chatRoom.room_type
          },
          event: event
        }
      });
    }

    // Create a real ChatRoom for this event
    console.log('Creating ChatRoom...');
    console.log('Room name:', roomName);
    
    chatRoom = await ChatRoom.create({
      name: roomName,
      description: event.description || `Chat room for event: ${event.title}`,
      room_type: 'event',
      is_private: false,
      max_participants: event.max_participants || 100,
      created_by: req.user.id,
      is_active: true
    });
    console.log('ChatRoom created:', chatRoom.id);

    // Add creator as participant with admin rights
    console.log('Adding creator as participant...');
    await RoomParticipant.create({
      room_id: chatRoom.id,
      user_id: req.user.id,
      is_admin: true,
      is_online: true
    });

    // Send system message about room creation
    console.log('Creating system message...');
    await ChatMessage.create({
      room_id: chatRoom.id,
      sender_id: req.user.id,
      content: `🎉 Event chat room created for "${event.title}"! The event starts at ${new Date(event.start_time).toLocaleString()}.`,
      message_type: 'system'
    });

    // Update event with room information (disable FK checks to bypass constraint)
    console.log('Updating event...');
    await sequelize.query('PRAGMA foreign_keys = OFF');
    await sequelize.query(
      `UPDATE events SET chat_room_id = ?, room_created = 1, event_status = 'active', "updatedAt" = ? WHERE id = ?`,
      {
        replacements: [chatRoom.id, new Date(), event.id],
        type: sequelize.QueryTypes.UPDATE
      }
    );
    await sequelize.query('PRAGMA foreign_keys = ON');

    // Update user event with room information
    await userEvent.update({
      chat_room_id: chatRoom.id,
      room_created: true,
      room_created_at: new Date()
    });

    // Update all participants' user_events records and add them to the chat room
    const participants = await UserEvent.findAll({
      where: {
        event_id: eventId,
        status: 'joined'
      }
    });
    console.log('Found', participants.length, 'participants to add');

    for (const participant of participants) {
      // Update user event
      await participant.update({
        chat_room_id: chatRoom.id,
        room_created: true,
        room_created_at: new Date()
      });

      // Add to chat room
      await RoomParticipant.findOrCreate({
        where: { room_id: chatRoom.id, user_id: participant.user_id },
        defaults: {
          room_id: chatRoom.id,
          user_id: participant.user_id,
          is_admin: false,
          is_online: true
        }
      });
    }

    console.log('Room creation complete, returning response');
    res.json({
      success: true,
      message: 'Chat room created successfully!',
      data: {
        chat_room_id: chatRoom.id,
        chat_room: {
          id: chatRoom.id,
          name: chatRoom.name,
          description: chatRoom.description,
          room_type: chatRoom.room_type
        },
        event: event
      }
    });

  } catch (error) {
    console.error('Create room error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
});

// Get room details for event
router.get('/:eventId/room', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user is part of the event
    const userEvent = await UserEvent.findOne({
      where: {
        user_id: req.user.id,
        event_id: eventId
      },
      include: [
        {
          model: Event,
          as: 'event'
        }
      ]
    });

    if (!userEvent) {
      return res.status(404).json({
        success: false,
        message: 'You are not part of this event'
      });
    }

    if (!userEvent.room_created || !userEvent.room_url) {
      return res.status(404).json({
        success: false,
        message: 'No room available for this event'
      });
    }

    res.json({
      success: true,
      data: {
        room_url: userEvent.room_url,
        room_type: userEvent.room_type,
        room_created_at: userEvent.room_created_at,
        event: userEvent.event
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

// Update room status
router.put('/:eventId/room', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { room_url, room_type, room_created } = req.body;

    // Check if user owns the event
    const userEvent = await UserEvent.findOne({
      where: {
        user_id: req.user.id,
        event_id: eventId,
        status: 'owner'
      }
    });

    if (!userEvent) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update room for this event'
      });
    }

    // Update event room information
    await userEvent.event.update({
      room_url: room_url || userEvent.event.room_url,
      room_type: room_type || userEvent.event.room_type,
      room_created: room_created !== undefined ? room_created : userEvent.event.room_created
    });

    // Update user event room information
    await userEvent.update({
      room_url: room_url || userEvent.room_url,
      room_type: room_type || userEvent.room_type,
      room_created: room_created !== undefined ? room_created : userEvent.room_created,
      room_created_at: room_created ? new Date() : userEvent.room_created_at
    });

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: {
        room_url: userEvent.event.room_url,
        room_type: userEvent.event.room_type,
        room_created: userEvent.event.room_created
      }
    });

  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete room
router.delete('/:eventId/room', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user owns the event
    const userEvent = await UserEvent.findOne({
      where: {
        user_id: req.user.id,
        event_id: eventId,
        status: 'owner'
      }
    });

    if (!userEvent) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete room for this event'
      });
    }

    // Update event to remove room
    await userEvent.event.update({
      room_url: null,
      room_type: null,
      room_created: false,
      event_status: 'upcoming'
    });

    // Update user event to remove room
    await userEvent.update({
      room_url: null,
      room_type: null,
      room_created: false,
      room_created_at: null
    });

    // Update all participants' user_events records
    await UserEvent.update(
      {
        room_url: null,
        room_type: null,
        room_created: false,
        room_created_at: null
      },
      {
        where: {
          event_id: eventId,
          status: 'joined'
        }
      }
    );

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

module.exports = router;