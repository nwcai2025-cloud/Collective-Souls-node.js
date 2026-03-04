// Event Routes for Collective Souls Node.js Platform
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { Event, User } = require('../models');
const { Op } = require('sequelize');
const NotificationService = require('../services/notificationService');

const router = express.Router();

// Get events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (type) where.event_type = type;

    const { count, rows } = await Event.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name', 'profile_image']
        }
      ],
      order: [['start_time', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        events: rows,
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
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      event_type,
      start_time,
      end_time,
      location,
      is_private,
      max_participants
    } = req.body;

    if (!title || !start_time) {
      return res.status(400).json({
        success: false,
        message: 'Title and start time are required'
      });
    }

    const event = await Event.create({
      title,
      description,
      event_type: event_type || 'other',
      start_time,
      end_time,
      location: location || 'Online',
      is_private: is_private || false,
      max_participants: max_participants || 100,
      created_by: req.user.id
    });

    // Create user_events record for the event owner
    const { UserEvent } = require('../models');
    await UserEvent.create({
      user_id: req.user.id,
      event_id: event.id,
      status: 'owner',
      event_status: 'upcoming'
    });

    // Notify all users about the new event
    try {
      await NotificationService.notifyNewEvent({
        id: event.id,
        title: event.title,
        event_type: event.event_type,
        creator_username: req.user.username
      });
    } catch (notifError) {
      console.error('Failed to send new event notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event }
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get event by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name', 'profile_image']
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: { event }
    });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update event
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      event_type,
      start_time,
      end_time,
      location,
      is_private,
      max_participants
    } = req.body;

    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership or admin status
    const isOwner = event.created_by == req.user.id; // Use loose equality for type safety
    const isAdmin = req.user.is_staff || req.user.is_superuser;
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this event'
      });
    }

    await event.update({
      title: title || event.title,
      description: description || event.description,
      event_type: event_type || event.event_type,
      start_time: start_time || event.start_time,
      end_time: end_time || event.end_time,
      location: location || event.location,
      is_private: is_private !== undefined ? is_private : event.is_private,
      max_participants: max_participants || event.max_participants
    });

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: { event }
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership or admin status
    const isOwner = event.created_by == req.user.id; // Use loose equality for type safety
    const isAdmin = req.user.is_staff || req.user.is_superuser;
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this event'
      });
    }

    // Delete associated user_events records first
    const { UserEvent } = require('../models');
    await UserEvent.destroy({
      where: {
        event_id: event.id
      }
    });

    await event.destroy();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Join event
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user already joined this event
    const { UserEvent } = require('../models');
    const existingJoin = await UserEvent.findOne({
      where: {
        user_id: req.user.id,
        event_id: event.id
      }
    });

    if (existingJoin) {
      return res.status(400).json({
        success: false,
        message: 'You have already joined this event'
      });
    }

    // Add user to event participants (this creates the UserEvent record)
    await event.addParticipant(req.user.id);

    res.status(201).json({
      success: true,
      message: 'Successfully joined event'
    });

  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Leave event
router.delete('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Remove user from event participants
    await event.removeParticipant(req.user.id);

    // Remove user_events record
    const { UserEvent } = require('../models');
    await UserEvent.destroy({
      where: {
        user_id: req.user.id,
        event_id: event.id
      }
    });

    res.json({
      success: true,
      message: 'Successfully left event'
    });

  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;