// Connection Routes for Collective Souls Node.js Platform
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const NotificationService = require('../services/notificationService');

const router = express.Router();

// Placeholder routes for user connections
// These would require Connection model which we haven't created yet

// Get user's connections
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    // Import Connection model
    const Connection = require('../models/Connection');
    const User = require('../models/User');

    // Build query conditions
    const whereClause = {
      status: status || 'accepted'
    };

    // Find connections where user is either requester or receiver
    const connections = await Connection.findAll({
      where: {
        [Op.or]: [
          { requester_id: req.user.id },
          { receiver_id: req.user.id }
        ],
        ...whereClause
      },
      include: [
        { model: User, as: 'from_user' },
        { model: User, as: 'to_user' }
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Count total connections for pagination
    const totalConnections = await Connection.count({
      where: {
        [Op.or]: [
          { requester_id: req.user.id },
          { receiver_id: req.user.id }
        ],
        ...whereClause
      }
    });

      // Format the response to match frontend expectations
      const formattedConnections = connections.map(conn => {
        // Determine the other user (not the current user)
        const otherUser = conn.requester_id === req.user.id ? conn.to_user : conn.from_user;

        return {
          id: conn.id,
          userId: otherUser.id,
          requester_id: conn.requester_id,
          receiver_id: conn.receiver_id,
          username: otherUser.username,
          first_name: otherUser.first_name,
          last_name: otherUser.last_name,
          spiritual_intention: otherUser.spiritual_intention,
          profile_image: otherUser.profile_image,
          is_online: otherUser.is_online,
          status: conn.status,
          created_at: conn.created_at
        };
      });

      res.json({
        success: true,
        connections: formattedConnections,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalConnections / parseInt(limit)),
          totalConnections: totalConnections,
          hasNextPage: parseInt(page) * parseInt(limit) < totalConnections,
          hasPrevPage: parseInt(page) > 1
        }
      });

  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections'
    });
  }
});

// Send connection request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Import Connection model
    const Connection = require('../models/Connection');

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      where: {
        [Op.or]: [
          {
            requester_id: req.user.id,
            receiver_id: userId
          },
          {
            requester_id: userId,
            receiver_id: req.user.id
          }
        ]
      }
    });

    if (existingConnection) {
      return res.status(400).json({
        success: false,
        message: 'Connection already exists'
      });
    }

    // Create new connection request
    const connection = await Connection.create({
      requester_id: req.user.id,
      receiver_id: userId,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });

    // Send notification to the receiver
    try {
      await NotificationService.notifyConnectionRequest(userId, {
        id: req.user.id,
        username: req.user.username
      });
    } catch (notifError) {
      console.error('Failed to send connection request notification:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully',
      connection: {
        id: connection.id,
        requester_id: connection.requester_id,
        receiver_id: connection.receiver_id,
        status: connection.status,
        created_at: connection.created_at
      }
    });

  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all users for connection suggestions
router.get('/users/suggestions', authenticateToken, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;

    // Import models
    const Connection = require('../models/Connection');
    const User = require('../models/User');

    // 1. Get all user IDs that have any connection with the current user
    const existingConnections = await Connection.findAll({
      where: {
        [Op.or]: [
          { requester_id: req.user.id },
          { receiver_id: req.user.id }
        ]
      },
      attributes: ['requester_id', 'receiver_id']
    });

    const excludedUserIds = [req.user.id];
    existingConnections.forEach(conn => {
      excludedUserIds.push(conn.requester_id);
      excludedUserIds.push(conn.receiver_id);
    });

    // Build query conditions for User search
    const whereClause = {
      id: { [Op.notIn]: excludedUserIds }
    };

    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } }
      ];
    }

    // 2. Find users not in the excluded list
    const { count: totalUsers, rows: availableUsers } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Format the response
    const formattedUsers = availableUsers.map(user => ({
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      spiritual_intention: user.spiritual_intention,
      profile_image: user.profile_image,
      bio: user.bio
    }));

    res.json({
      success: true,
      users: formattedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers: totalUsers,
        hasNextPage: parseInt(page) * parseInt(limit) < totalUsers,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get connection suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connection suggestions'
    });
  }
});

// Get connection by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Import Connection model
    const Connection = require('../models/Connection');
    const User = require('../models/User');

    // Find the connection with user details
    const connection = await Connection.findOne({
      where: { id: id },
      include: [
        { model: User, as: 'from_user' },
        { model: User, as: 'to_user' }
      ]
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }

    res.json({
      success: true,
      connection: {
        id: connection.id,
        requester: {
          id: connection.from_user.id,
          username: connection.from_user.username,
          first_name: connection.from_user.first_name,
          last_name: connection.from_user.last_name
        },
        receiver: {
          id: connection.to_user.id,
          username: connection.to_user.username,
          first_name: connection.to_user.first_name,
          last_name: connection.to_user.last_name
        },
        status: connection.status,
        created_at: connection.created_at,
        updated_at: connection.updated_at
      }
    });

  } catch (error) {
    console.error('Get connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update connection status (accept/decline)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    // Map 'declined' to 'rejected' if that's what the model expects
    if (status === 'declined') {
      status = 'rejected';
    }

    if (!status || !['pending', 'accepted', 'rejected', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Import Connection model
    const Connection = require('../models/Connection');

    // Find the connection
    const connection = await Connection.findOne({
      where: {
        id: id,
        receiver_id: req.user.id, // Only the receiver can update the status
        status: 'pending'
      }
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found or you do not have permission to update it'
      });
    }

    // Update the connection status
    connection.status = status;
    connection.updated_at = new Date();
    await connection.save();

    // Send notification to the requester if connection is accepted
    if (status === 'accepted') {
      try {
        await NotificationService.notifyConnectionAccepted(connection.requester_id, {
          id: req.user.id,
          username: req.user.username
        });
      } catch (notifError) {
        console.error('Failed to send connection accepted notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    res.json({
      success: true,
      message: 'Connection status updated successfully',
      connection: {
        id: connection.id,
        requester_id: connection.requester_id,
        receiver_id: connection.receiver_id,
        status: connection.status,
        updated_at: connection.updated_at
      }
    });

  } catch (error) {
    console.error('Update connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete connection
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Import Connection model
    const Connection = require('../models/Connection');

    // Find and delete the connection
    const deletedCount = await Connection.destroy({
      where: {
        id: id,
        [Op.or]: [
          { requester_id: req.user.id },
          { receiver_id: req.user.id }
        ]
      }
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found or you do not have permission to delete it'
      });
    }

    res.json({
      success: true,
      message: 'Connection deleted successfully'
    });

  } catch (error) {
    console.error('Delete connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;