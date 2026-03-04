/**
 * Database migration script to update chat schema
 * This script will:
 * 1. Create new tables for the Django-style chat system
 * 2. Handle existing chat tables carefully
 * 3. Create default community rooms
 */

const { sequelize } = require('../config/database');
const { ChatRoom, DirectMessage, ChatMessage, RoomParticipant, DMParticipant, MessageReaction, UserPresence } = require('../models/Chat');
const User = require('../models/User');

async function updateChatSchema() {
  try {
    console.log('🚀 Starting chat schema migration...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create new tables (skip dropping old ones to avoid foreign key issues)
    await ChatRoom.sync();
    console.log('✅ ChatRoom table created');
    
    await DirectMessage.sync();
    console.log('✅ DirectMessage table created');
    
    await ChatMessage.sync();
    console.log('✅ ChatMessage table created');
    
    await RoomParticipant.sync();
    console.log('✅ RoomParticipant table created');
    
    await DMParticipant.sync();
    console.log('✅ DMParticipant table created');
    
    await MessageReaction.sync();
    console.log('✅ MessageReaction table created');
    
    await UserPresence.sync();
    console.log('✅ UserPresence table created');

    // Create default community rooms
    const communityRooms = [
      {
        name: 'Community Main Room',
        description: 'Welcome to the main community chat! Share your thoughts and connect with others.',
        room_type: 'community',
        is_community_room: true,
        is_active: true
      },
      {
        name: 'Spiritual Discussion',
        description: 'Discuss spiritual topics, share insights, and explore consciousness together.',
        room_type: 'spiritual',
        is_community_room: true,
        is_active: true
      },
      {
        name: 'Meditation & Mindfulness',
        description: 'Share meditation experiences, techniques, and mindfulness practices.',
        room_type: 'meditation',
        is_community_room: true,
        is_active: true
      },
      {
        name: 'Energy Healing',
        description: 'Discuss energy healing practices, Reiki, chakras, and healing modalities.',
        room_type: 'healing',
        is_community_room: true,
        is_active: true
      },
      {
        name: 'General Discussion',
        description: 'Casual conversations and general topics.',
        room_type: 'general',
        is_community_room: true,
        is_active: true
      },
      {
        name: 'Support & Guidance',
        description: 'A safe space for support, guidance, and sharing challenges.',
        room_type: 'support',
        is_community_room: true,
        is_active: true
      }
    ];

    // Get admin user for creating rooms
    const adminUser = await User.findOne({
      where: { username: 'admin' }
    });

    if (adminUser) {
      for (const roomData of communityRooms) {
        try {
          const [room, created] = await ChatRoom.findOrCreate({
            where: { name: roomData.name },
            defaults: {
              ...roomData,
              created_by: adminUser.id
            }
          });

          if (created) {
            console.log(`✅ Created room: ${room.name}`);
            
            // Add admin as participant
            await RoomParticipant.create({
              room_id: room.id,
              user_id: adminUser.id,
              is_admin: true,
              is_online: true
            });
            console.log(`✅ Added admin to room: ${room.name}`);
          } else {
            console.log(`ℹ️  Room already exists: ${room.name}`);
          }
        } catch (error) {
          console.error(`❌ Error creating room ${roomData.name}:`, error.message);
        }
      }
    } else {
      console.log('⚠️  No admin user found, skipping default room creation');
    }

    console.log('🎉 Chat schema migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Created new chat tables');
    console.log('- ✅ Added Django-style chat models');
    console.log('- ✅ Created default community rooms');
    console.log('- ✅ Ready for new chat functionality');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  updateChatSchema();
}

module.exports = { updateChatSchema };