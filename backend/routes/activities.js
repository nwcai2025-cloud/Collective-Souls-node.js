// Activity Routes for Collective Souls Node.js Platform
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { User, ActivityFeed } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Get user's activities
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Placeholder response
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
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get recent activities for community dashboard
router.get('/community', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Fetching recent community activities');

    const limit = req.query.all === 'true' ? undefined : 5;
    const activities = await ActivityFeed.findAll({
      where: {
        status: {
          [Op.notIn]: ['rejected', 'deleted']
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['username', 'profile_image']
      }],
      order: [['created_at', 'DESC']],
      limit: limit
    });

    console.log('✅ Found community activities:', activities.length);

    res.json({
      success: true,
      data: activities.map(activity => {
        const username = activity.user ? activity.user.username : 'Unknown';
        let typeDisplay = activity.activity_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        let title = `${username} completed ${typeDisplay}`;
        let description = activity.description;

        if (activity.activity_type === 'user_joined') {
          title = `${username} is now online`;
          description = 'Joined the community';
        } else if (['meditation', 'mindfulness', 'yoga', 'journaling', 'energy_healing'].includes(activity.activity_type)) {
          const duration = activity.metadata?.duration ? ` for ${activity.metadata.duration}m` : '';
          title = `${username} practiced ${typeDisplay}${duration}`;
        }

        return {
          id: activity.id,
          type: activity.activity_type,
          title: title,
          description: description,
          time: activity.created_at,
          user: {
            name: username,
            avatar: username.charAt(0).toUpperCase()
          }
        };
      })
    });
  } catch (error) {
    console.error('Community activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community activities'
    });
  }
});

// Get recent activities for profile page
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Fetching recent activities for user:', req.user.id);

    const limit = req.query.all === 'true' ? undefined : 5;
    const activities = await ActivityFeed.findAll({
      where: { 
        user_id: req.user.id,
        status: {
          [Op.notIn]: ['rejected', 'deleted']
        }
      },
      order: [['created_at', 'DESC']],
      limit: limit
    });

      console.log('✅ Found recent activities:', activities.length);

      res.json({
        success: true,
        activities: activities.map(activity => {
          const username = req.user.username;
          let typeDisplay = activity.activity_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          
          let title = `Completed ${typeDisplay}`;

          if (activity.activity_type === 'user_joined') {
            title = `Joined the community`;
          } else if (['meditation', 'mindfulness', 'yoga', 'journaling', 'energy_healing'].includes(activity.activity_type)) {
            const duration = activity.metadata?.duration ? ` for ${activity.metadata.duration}m` : '';
            title = `Practiced ${typeDisplay}${duration}`;
          }

          return {
            id: activity.id,
            user: username,
            title: title,
            category: activity.activity_type,
            duration_minutes: activity.metadata?.duration || 0,
            notes: activity.description || '',
            created_at: activity.created_at
          };
        })
      });

  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities'
    });
  }
});

// Create new activity
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Logging activity. Body:', req.body);
    const activity_type = req.body.activity_type || req.body.category;
    const duration = req.body.duration || req.body.duration_minutes;
    const description = req.body.description || req.body.notes;
    const date = req.body.date;

    if (!activity_type) {
      console.log('❌ Missing activity_type');
      return res.status(400).json({
        success: false,
        message: 'Activity type is required'
      });
    }

    const { ActivityFeed } = require('../models');

    // If date is today, use current time to ensure it's at the top of the feed
    let createdAt = new Date();
    if (date) {
      const todayStr = new Date().toISOString().split('T')[0];
      // If the provided date is not today, use the provided date at midnight
      if (date !== todayStr) {
        createdAt = new Date(date);
      }
      // If it IS today, we keep createdAt as new Date() (current time)
    }

    console.log('💾 Creating ActivityFeed record...');
    const activity = await ActivityFeed.create({
      user_id: req.user.id,
      activity_type,
      description: description || `Completed ${activity_type} session`,
      metadata: {
        duration: parseInt(duration) || 0,
        date: date || new Date()
      },
      created_at: createdAt
    });

    // Update user stats if needed (e.g., meditation_streak)
    if (activity_type === 'meditation') {
      console.log('🔥 Incrementing meditation streak...');
      await req.user.increment('meditation_streak');
    }

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      data: activity
    });

  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log activity'
    });
  }
});

// Get activity by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Placeholder response
    res.json({
      success: true,
      data: {
        activity: {
          id: parseInt(id),
          title: 'Sample Activity',
          description: 'This is a sample spiritual activity',
          activity_type: 'meditation',
          duration: 30,
          date: new Date(),
          user_id: req.user.id,
          created_at: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update activity
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, activity_type, duration, date } = req.body;

    // Placeholder response
    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: {
        activity: {
          id: parseInt(id),
          title: title || 'Sample Activity',
          description: description || 'This is a sample spiritual activity',
          activity_type: activity_type || 'meditation',
          duration: duration || 30,
          date: date || new Date(),
          user_id: req.user.id,
          updated_at: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete activity
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Placeholder response
    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });

  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;