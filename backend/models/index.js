const User = require('./User');
const ActivityFeed = require('./ActivityFeed');
const Comment = require('./Comment');
const { ChatRoom, DirectMessage, ChatMessage, RoomParticipant, DMParticipant, MessageReaction, UserPresence } = require('./Chat');
const Connection = require('./Connection');
const Event = require('./Event');
const UserEvent = require('./UserEvent');
const { AdminRole, AdminUser, AdminAuditLog, ContentReport, AdminNotification } = require('./Admin');
const Post = require('./Post');
const PostLike = require('./PostLike');
const UserBlock = require('./UserBlock');
const UserMute = require('./UserMute');
const Journal = require('./Journal');
const VideoRoom = require('./VideoRoom');
const FeatureFlag = require('./FeatureFlag');
const Donation = require('./Donation');

// Create models object for associations
const models = {
  User,
  ActivityFeed,
  Comment,
  ChatRoom,
  DirectMessage,
  ChatMessage,
  RoomParticipant,
  DMParticipant,
  MessageReaction,
  UserPresence,
  Connection,
  Event,
  UserEvent,
  AdminRole,
  AdminUser,
  AdminAuditLog,
  ContentReport,
  AdminNotification,
  Post,
  PostLike,
  UserBlock,
  UserMute,
  Journal,
  VideoRoom,
  FeatureFlag,
  Donation
};

// Set up model associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = {
  User,
  ActivityFeed,
  Comment,
  ChatRoom,
  DirectMessage,
  ChatMessage,
  RoomParticipant,
  DMParticipant,
  MessageReaction,
  UserPresence,
  Connection,
  Event,
  UserEvent,
  AdminRole,
  AdminUser,
  AdminAuditLog,
  ContentReport,
  AdminNotification,
  Post,
  PostLike,
  UserBlock,
  UserMute,
  Journal,
  VideoRoom,
  FeatureFlag,
  Donation
};
