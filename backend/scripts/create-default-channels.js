const { sequelize } = require('../config/database');
const { ChatConversation, User } = require('../models');
const { Op } = require('sequelize');

async function createDefaultChannels() {
  try {
    console.log('🚀 Creating default chat channels...');

    // Check if default channels already exist
    const existingChannels = await ChatConversation.findAll({
      where: {
        name: {
          [Op.in]: [
            'Community Main Room',
            'Spiritual Discussion',
            'Meditation & Mindfulness',
            'Energy Healing',
            'General Discussion',
            'Support & Guidance'
          ]
        }
      }
    });

    if (existingChannels.length > 0) {
      console.log('⚠️  Default channels already exist. Skipping creation.');
      return;
    }

    // Find a default admin user (user with ID 1 or first user)
    let adminUser = await User.findByPk(1);
    if (!adminUser) {
      // If no user exists, create a default admin user
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@collectivesouls.com',
        password: 'defaultpassword123', // This should be changed
        age: 25,
        spiritual_intention: 'spiritual_growth',
        is_staff: true,
        is_superuser: true
      });
      console.log('👤 Created default admin user');
    }

    // Define default channels
    const defaultChannels = [
      {
        name: 'Community Main Room',
        description: 'Welcome to the main community space! Share your spiritual journey, ask questions, and connect with fellow seekers.',
        conversation_type: 'room',
        is_private: false,
        max_participants: 1000,
        created_by: adminUser.id,
        is_active: true
      },
      {
        name: 'Spiritual Discussion',
        description: 'Deep conversations about spirituality, philosophy, and consciousness. Explore different paths and perspectives.',
        conversation_type: 'room',
        is_private: false,
        max_participants: 500,
        created_by: adminUser.id,
        is_active: true
      },
      {
        name: 'Meditation & Mindfulness',
        description: 'Share meditation experiences, mindfulness practices, and techniques for cultivating inner peace.',
        conversation_type: 'room',
        is_private: false,
        max_participants: 300,
        created_by: adminUser.id,
        is_active: true
      },
      {
        name: 'Energy Healing',
        description: 'Discuss energy work, healing practices, Reiki, chakras, and other energy-based modalities.',
        conversation_type: 'room',
        is_private: false,
        max_participants: 200,
        created_by: adminUser.id,
        is_active: true
      },
      {
        name: 'General Discussion',
        description: 'Casual conversations about life, wellness, and anything that comes up in your spiritual journey.',
        conversation_type: 'room',
        is_private: false,
        max_participants: 400,
        created_by: adminUser.id,
        is_active: true
      },
      {
        name: 'Support & Guidance',
        description: 'A safe space to share challenges, seek guidance, and offer support to fellow community members.',
        conversation_type: 'room',
        is_private: false,
        max_participants: 250,
        created_by: adminUser.id,
        is_active: true
      }
    ];

    // Create the channels
    for (const channelData of defaultChannels) {
      const channel = await ChatConversation.create(channelData);
      console.log(`✅ Created channel: ${channel.name}`);
    }

    console.log('🎉 All default channels created successfully!');
    console.log('💡 Tip: Users can now join these channels from the chat interface.');

  } catch (error) {
    console.error('❌ Error creating default channels:', error);
    process.exit(1);
  }
}

// Run the script
createDefaultChannels();