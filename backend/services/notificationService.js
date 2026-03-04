const UserNotification = require('../models/Notification');
const { getIO } = require('../config/socket');

/**
 * Notification Service
 * Handles creation and delivery of site-wide notifications
 */
class NotificationService {
  /**
   * Create a new notification and emit it in real-time
   * @param {number} userId - The user to notify
   * @param {string} type - Notification type (connection_request, connection_accepted, new_message, etc.)
   * @param {string} title - Short title
   * @param {string} message - Full message
   * @param {object} data - Additional data (e.g., sender info, related entity IDs)
   * @returns {Promise<UserNotification>}
   */
  static async createNotification(userId, type, title, message, data = {}) {
    try {
      // Create notification in database
      const notification = await UserNotification.create({
        user_id: userId,
        type,
        title,
        message,
        data
      });

      // Emit real-time notification via Socket.IO
      const io = getIO();
      if (io) {
        io.to(`user_${userId}`).emit('notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          is_read: notification.is_read,
          created_at: notification.created_at
        });

        // Also emit unread count update
        const unreadCount = await this.getUnreadCount(userId);
        io.to(`user_${userId}`).emit('notification_count', { count: unreadCount });
      }

      console.log(`🔔 Notification created for user ${userId}: ${title}`);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple users
   * @param {number[]} userIds - Array of user IDs to notify
   * @param {string} type - Notification type
   * @param {string} title - Short title
   * @param {string} message - Full message
   * @param {object} data - Additional data
   */
  static async createNotificationForUsers(userIds, type, title, message, data = {}) {
    const results = [];
    for (const userId of userIds) {
      try {
        const notification = await this.createNotification(userId, type, title, message, data);
        results.push(notification);
      } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error);
      }
    }
    return results;
  }

  /**
   * Get unread notification count for a user
   * @param {number} userId 
   * @returns {Promise<number>}
   */
  static async getUnreadCount(userId) {
    try {
      const count = await UserNotification.count({
        where: {
          user_id: userId,
          is_read: false,
          expires_at: {
            [require('sequelize').Op.gt]: new Date()
          }
        }
      });
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Get notifications for a user (paginated)
   * @param {number} userId 
   * @param {number} page 
   * @param {number} limit 
   * @returns {Promise<{notifications: UserNotification[], total: number, unreadCount: number}>}
   */
  static async getNotifications(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const now = new Date();

      const { count: total, rows: notifications } = await UserNotification.findAndCountAll({
        where: {
          user_id: userId,
          expires_at: {
            [require('sequelize').Op.gt]: now
          }
        },
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      const unreadCount = await this.getUnreadCount(userId);

      return {
        notifications,
        total,
        unreadCount,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param {number} notificationId 
   * @param {number} userId - For authorization check
   * @returns {Promise<UserNotification>}
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await UserNotification.findOne({
        where: {
          id: notificationId,
          user_id: userId
        }
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();

      // Emit updated unread count
      const io = getIO();
      if (io) {
        const unreadCount = await this.getUnreadCount(userId);
        io.to(`user_${userId}`).emit('notification_count', { count: unreadCount });
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {number} userId 
   * @returns {Promise<number>} - Number of notifications updated
   */
  static async markAllAsRead(userId) {
    try {
      const result = await UserNotification.update(
        {
          is_read: true,
          read_at: new Date()
        },
        {
          where: {
            user_id: userId,
            is_read: false
          }
        }
      );

      // Emit updated unread count (should be 0)
      const io = getIO();
      if (io) {
        io.to(`user_${userId}`).emit('notification_count', { count: 0 });
      }

      return result[0];
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {number} notificationId 
   * @param {number} userId - For authorization check
   * @returns {Promise<boolean>}
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const result = await UserNotification.destroy({
        where: {
          id: notificationId,
          user_id: userId
        }
      });

      if (result === 0) {
        throw new Error('Notification not found');
      }

      // Emit updated unread count
      const io = getIO();
      if (io) {
        const unreadCount = await this.getUnreadCount(userId);
        io.to(`user_${userId}`).emit('notification_count', { count: unreadCount });
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Clean up expired notifications (should be called periodically)
   * @returns {Promise<number>} - Number of deleted notifications
   */
  static async cleanupExpired() {
    return await UserNotification.cleanupExpired();
  }

  // Convenience methods for common notification types

  /**
   * Notify user of a new connection request
   * @param {number} receiverId 
   * @param {object} sender - Sender info {id, username}
   */
  static async notifyConnectionRequest(receiverId, sender) {
    return await this.createNotification(
      receiverId,
      'connection_request',
      'New Connection Request',
      `${sender.username} wants to connect with you`,
      { sender_id: sender.id, sender_username: sender.username }
    );
  }

  /**
   * Notify user their connection was accepted
   * @param {number} requesterId 
   * @param {object} accepter - Accepter info {id, username}
   */
  static async notifyConnectionAccepted(requesterId, accepter) {
    return await this.createNotification(
      requesterId,
      'connection_accepted',
      'Connection Accepted',
      `${accepter.username} accepted your connection request`,
      { accepter_id: accepter.id, accepter_username: accepter.username }
    );
  }

  /**
   * Notify user of a new direct message
   * @param {number} receiverId 
   * @param {object} sender - Sender info
   * @param {object} messageData - Message info
   */
  static async notifyNewMessage(receiverId, sender, messageData) {
    return await this.createNotification(
      receiverId,
      'new_message',
      'New Message',
      `${sender.username} sent you a message`,
      { sender_id: sender.id, sender_username: sender.username, dm_id: messageData.dmId }
    );
  }

  /**
   * Notify user they were mentioned
   * @param {number} userId 
   * @param {object} mentioner - Who mentioned them
   * @param {object} context - Where they were mentioned
   */
  static async notifyMention(userId, mentioner, context) {
    return await this.createNotification(
      userId,
      'mention',
      'You were mentioned',
      `${mentioner.username} mentioned you in ${context.location}`,
      { mentioner_id: mentioner.id, mentioner_username: mentioner.username, ...context }
    );
  }

  /**
   * Notify user about an event reminder
   * @param {number} userId 
   * @param {object} event - Event info
   */
  static async notifyEventReminder(userId, event) {
    return await this.createNotification(
      userId,
      'event_reminder',
      'Event Reminder',
      `${event.title} is starting soon`,
      { event_id: event.id, event_title: event.title, event_start: event.startTime }
    );
  }

  /**
   * Notify all users of a new event
   * @param {object} event - Event info {id, title, event_type, creator_username}
   */
  static async notifyNewEvent(event) {
    const { User } = require('../models');
    try {
      const users = await User.findAll({
        where: { is_active: true },
        attributes: ['id']
      });

      const userIds = users.map(u => u.id);
      return await this.createNotificationForUsers(
        userIds, 
        'new_event',
        'New Event Created',
        `${event.creator_username} created "${event.title}" - ${event.event_type}`,
        { 
          event_id: event.id, 
          event_title: event.title, 
          event_type: event.event_type,
          creator_username: event.creator_username
        }
      );
    } catch (error) {
      console.error('Error notifying new event:', error);
      throw error;
    }
  }

  /**
   * Broadcast system announcement to all users
   * @param {string} title 
   * @param {string} message 
   * @param {object} data 
   */
  static async broadcastSystemAnnouncement(title, message, data = {}) {
    const { User } = require('../models');
    try {
      const users = await User.findAll({
        where: { is_active: true },
        attributes: ['id']
      });

      const userIds = users.map(u => u.id);
      return await this.createNotificationForUsers(userIds, 'system_announcement', title, message, data);
    } catch (error) {
      console.error('Error broadcasting announcement:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;