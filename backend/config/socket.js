// Socket.IO Configuration for Django-style Chat System
const { authenticateSocket } = require('../middleware/auth');
const { User, ActivityFeed, Comment } = require('../models');
const { ChatRoom, DirectMessage, ChatMessage, RoomParticipant, DMParticipant, MessageReaction, UserPresence } = require('../models/Chat');
const NotificationService = require('../services/notificationService');
const { Op } = require('sequelize');

let ioInstance = null;

function getIO() {
  return ioInstance;
}

// Export notification emitter helper
function emitNotification(userId, notification) {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit('notification', notification);
  }
}

function emitNotificationCount(userId, count) {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit('notification_count', { count });
  }
}

function setupSocketIO(io) {
  ioInstance = io;
  // Function to get and emit stats updates
async function emitStatsUpdate() {
    try {
      // Get real-time stats for frontend - count unique authenticated users
      const sockets = await io.fetchSockets();
      const authenticatedUserIds = new Set();
      sockets.forEach(s => {
        if (s.userId) authenticatedUserIds.add(s.userId);
      });
      const activeUsersNow = authenticatedUserIds.size || (authenticatedUserIds.size === 0 ? 0 : 1); // Ensure at least 0

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

const statsData = {
        activeUsersNow,
        activeUsers: activeUsersNow, // For Dashboard.jsx compatibility
        messagesThisHour,
        communityStats: {
          activeUsers: activeUsersNow,
          messagesToday: messagesThisHour // Approximation for real-time
        }
      };

      // Emit to all connected clients
      io.emit('stats_update', statsData);
      
      console.log('📊 Stats updated and broadcasted:', statsData);
    } catch (error) {
      console.error('Error emitting stats update:', error);
    }
  }

// Start periodic stats updates (every 30 seconds)
  const statsUpdateInterval = setInterval(emitStatsUpdate, 30000);

  // Initial stats update
  emitStatsUpdate();

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    // Handle user authentication
    socket.on('request_stats_update', async () => {
      await emitStatsUpdate();
    });

    socket.on('authenticate', async (token) => {
      try {
        const user = await authenticateSocket(token);
        if (user) {
          socket.userId = user.id;
          socket.join(`user_${user.id}`);
          socket.join('authenticated');
          
          // Update user online status
          await User.update(
            { is_online: true, last_seen: new Date() },
            { where: { id: user.id } }
          );
          
          socket.emit('authenticated', { success: true, user: user });
          io.emit('user_status_changed', { userId: user.id, isOnline: true });
          
          console.log(`✅ User ${user.username} authenticated via socket`);
        } else {
          socket.emit('authenticated', { success: false, message: 'Invalid token' });
          socket.disconnect();
        }
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('authenticated', { success: false, message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Handle chat messages
    socket.on('join_room', async (roomId) => {
      const roomName = `room_${roomId}`;
      socket.join(roomName);
      console.log(`User ${socket.userId} joined room ${roomName}`);
    });

    socket.on('leave_room', async (roomId) => {
      const roomName = `room_${roomId}`;
      socket.leave(roomName);
      console.log(`User ${socket.userId} left room ${roomName}`);
    });

    socket.on('join_dm', (dmId) => {
      const roomName = `dm_${dmId}`;
      socket.join(roomName);
      console.log(`User ${socket.userId} joined DM room ${roomName}`);
    });

    socket.on('leave_dm', (dmId) => {
      const roomName = `dm_${dmId}`;
      socket.leave(roomName);
      console.log(`User ${socket.userId} left DM room ${roomName}`);
    });

    socket.on('send_message', async (data) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { roomId, dmId, content, messageType = 'text' } = data;

        if (!roomId && !dmId) {
          socket.emit('error', { message: 'Either roomId or dmId must be provided' });
          return;
        }

        // Create message in database
        const message = await ChatMessage.create({
          room_id: roomId || null,
          dm_id: dmId || null,
          sender_id: socket.userId,
          content: content,
          message_type: messageType
        });

        // Get sender info
        const sender = await User.findByPk(socket.userId, {
          attributes: ['id', 'username', 'profile_image']
        });

        // Emit message to room
        const messageData = {
          id: message.id,
          room_id: message.room_id,
          dm_id: message.dm_id,
          sender: {
            id: sender.id,
            username: sender.username,
            profile_image: sender.profile_image
          },
          content: message.content,
          message_type: message.message_type,
          created_at: message.created_at,
          reactions: [] // Initialize with empty reactions array
        };

        // Emit to appropriate room
        if (roomId) {
          io.to(`room_${roomId}`).emit('new_message', messageData);
        } else if (dmId) {
          io.to(`dm_${dmId}`).emit('new_message', messageData);
        }
        
        console.log(`Message sent to ${roomId ? 'room ' + roomId : 'DM ' + dmId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data;
      socket.to(`conversation_${conversationId}`).emit('typing', {
        userId: socket.userId,
        conversationId,
        isTyping
      });
    });

    // Handle user presence
    socket.on('user_online', async () => {
      if (socket.userId) {
        try {
          await User.update(
            { is_online: true, last_seen: new Date() },
            { where: { id: socket.userId } }
          );
          
          io.emit('user_status_changed', { 
            userId: socket.userId, 
            isOnline: true 
          });
        } catch (error) {
          console.error('Error updating user status:', error);
        }
      }
    });

    socket.on('user_offline', async () => {
      if (socket.userId) {
        try {
          await User.update(
            { is_online: false, last_seen: new Date() },
            { where: { id: socket.userId } }
          );
          
          io.emit('user_status_changed', { 
            userId: socket.userId, 
            isOnline: false 
          });
        } catch (error) {
          console.error('Error updating user status:', error);
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('🔌 Socket disconnected:', socket.id);
      
      if (socket.userId) {
        try {
          await User.update(
            { is_online: false, last_seen: new Date() },
            { where: { id: socket.userId } }
          );
          
          io.emit('user_status_changed', { 
            userId: socket.userId, 
            isOnline: false 
          });
        } catch (error) {
          console.error('Error updating user status on disconnect:', error);
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Video Room Management
    socket.on('join-video-room', async (data) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated for video room' });
          return;
        }

        const { roomId, userId, userName } = data;
        
        // Join the video room
        const roomName = `video_room_${roomId}`;
        socket.join(roomName);
        
        // Get current participants
        const participants = [];
        const roomSockets = await io.in(roomName).fetchSockets();
        
        for (const roomSocket of roomSockets) {
          if (roomSocket.userId && roomSocket.userId !== socket.userId) {
            const user = await User.findByPk(roomSocket.userId, {
              attributes: ['id', 'username', 'profile_image']
            });
            if (user) {
              participants.push({
                userId: user.id,
                userName: user.username,
                profileImage: user.profile_image
              });
            }
          }
        }

        // Notify existing participants about new joiner
        socket.to(roomName).emit('participant-joined', {
          participant: {
            userId,
            userName,
            profileImage: null
          }
        });

        // Send room joined event to new participant
        socket.emit('room-joined', {
          roomId,
          participants
        });

        console.log(`User ${userName} joined video room ${roomId}`);
      } catch (error) {
        console.error('Error joining video room:', error);
        socket.emit('error', { message: 'Failed to join video room' });
      }
    });

    socket.on('leave-video-room', async (data) => {
      try {
        if (!socket.userId) {
          return;
        }

        const { roomId, userId } = data;
        const roomName = `video_room_${roomId}`;
        
        // Leave the video room
        socket.leave(roomName);
        
        // Notify other participants
        socket.to(roomName).emit('participant-left', {
          userId,
          userName: data.userName
        });

        console.log(`User ${data.userName} left video room ${roomId}`);
      } catch (error) {
        console.error('Error leaving video room:', error);
      }
    });

    // WebRTC Signaling
    socket.on('webrtc-signal', async (data) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated for WebRTC signaling' });
          return;
        }

        const { targetUserId, signal } = data;
        
        // Find the target user's socket
        const targetSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId === targetUserId);

        if (targetSocket) {
          targetSocket.emit('webrtc-signal', {
            fromUserId: socket.userId,
            signal
          });
        } else {
          // Target user not found, send error back
          socket.emit('webrtc-error', {
            message: 'Target user not found',
            targetUserId
          });
        }
      } catch (error) {
        console.error('WebRTC signaling error:', error);
        socket.emit('webrtc-error', { message: 'WebRTC signaling failed' });
      }
    });

    // Video room stats
    socket.on('get-video-room-stats', async () => {
      try {
        // Get all video rooms and their participant counts
        const rooms = {};
        const allSockets = await io.fetchSockets();
        
        allSockets.forEach(s => {
          const roomsArray = Array.from(s.rooms.keys());
          roomsArray.forEach(roomName => {
            if (roomName.startsWith('video_room_')) {
              if (!rooms[roomName]) {
                rooms[roomName] = [];
              }
              if (s.userId) {
                rooms[roomName].push(s.userId);
              }
            }
          });
        });

        const roomStats = Object.keys(rooms).map(roomName => ({
          roomId: roomName.replace('video_room_', ''),
          participantCount: rooms[roomName].length,
          participants: rooms[roomName]
        }));

        socket.emit('video-room-stats', roomStats);
      } catch (error) {
        console.error('Error getting video room stats:', error);
      }
    });
  });

  // Handle middleware errors
  io.engine.on('connection_error', (error) => {
    console.error('Socket connection error:', error);
  });

  // Add HTTPS connection logging
  io.engine.on('connection', (socket) => {
    console.log('Socket connection established');
  });

  console.log('📡 Socket.IO configured successfully');
}

module.exports = { setupSocketIO, getIO, emitNotification, emitNotificationCount };
