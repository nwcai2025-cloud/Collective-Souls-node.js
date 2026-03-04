const express = require('express');
const { Op } = require('sequelize');
const { User, ChatMessage, ActivityFeed, Comment } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { getIO } = require('../config/socket');

const router = express.Router();

// Get community stats for dashboard (public endpoint)
router.get('/community', async (req, res) => {
  try {
    // Get total active users
    const totalUsers = await User.count({ 
      where: { is_active: true } 
    });

    // Get currently online users - count unique authenticated users
    const io = getIO();
    let activeUsers = 0;
    if (io) {
      const sockets = await io.fetchSockets();
      const authenticatedUserIds = new Set();
      sockets.forEach(s => {
        if (s.userId) authenticatedUserIds.add(s.userId);
      });
      activeUsers = authenticatedUserIds.size;
    }

    // Get messages from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messagesToday = await ChatMessage.count({
      where: {
        is_deleted: false,
        created_at: {
          [Op.gte]: today
        }
      }
    });

    // Get recent activities (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentActivitiesCount = await ActivityFeed.count({
      where: {
        created_at: {
          [Op.gte]: yesterday
        }
      }
    });

    // Get total comments
    const totalComments = await Comment.count({
      where: {
        is_deleted: false
      }
    });

    // Get total activities
    const totalActivities = await ActivityFeed.count();

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        messagesToday,
        recentActivitiesCount,
        totalComments,
        totalActivities
      }
    });

  } catch (error) {
    console.error('Community stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user stats for dashboard (requires authentication)
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's activity stats
    const userActivities = await ActivityFeed.count({
      where: { user_id: userId }
    });

    // Get user's comments
    const userComments = await Comment.count({
      where: { author_id: userId, is_deleted: false }
    });

    // Get user's connections
    const Connection = require('../models/Connection');
    const userConnections = await Connection.count({
      where: {
        [Op.or]: [
          { requester_id: userId, status: 'accepted' },
          { receiver_id: userId, status: 'accepted' }
        ]
      }
    });

    // Get user's messages
    const userMessages = await ChatMessage.count({
      where: { sender_id: userId, is_deleted: false }
    });

    res.json({
      success: true,
      data: {
        userActivities,
        userComments,
        userConnections,
        userMessages
      }
    });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get real-time stats (for live updates)
router.get('/realtime', async (req, res) => {
  try {
    // Get total users for "Global Members"
    const totalUsers = await User.count({ where: { is_active: true } });

    // Get active users - count unique authenticated users
    const io = getIO();
    let activeUsersNow = 0;
    if (io) {
      const sockets = await io.fetchSockets();
      const authenticatedUserIds = new Set();
      sockets.forEach(s => {
        if (s.userId) authenticatedUserIds.add(s.userId);
      });
      activeUsersNow = authenticatedUserIds.size;
    }

    // Get messages in last hour
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);
    const messagesThisHour = await ChatMessage.count({
      where: {
        is_deleted: false,
        created_at: {
          [Op.gte]: lastHour
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsersNow,
        messagesThisHour,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Real-time stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;