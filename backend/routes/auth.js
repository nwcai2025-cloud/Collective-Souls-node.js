// Authentication Routes for Collective Souls Node.js Platform
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ActivityFeed } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer configuration for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      first_name,
      last_name,
      age_verified,
      spiritual_intention,
      bio
    } = req.body;

    // Validation
    if (!username || !email || !password || !first_name) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, password, and first name are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Age verification validation for adult site
    if (age_verified !== true && age_verified !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'You must confirm you are 18 years or older to register'
      });
    }

    // Community Guidelines acceptance validation
    const accept_guidelines = req.body.accept_guidelines;
    if (accept_guidelines !== true && accept_guidelines !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'You must accept the Community Guidelines to register'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      first_name,
      last_name,
      age_verified: true,
      spiritual_intention,
      bio
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    // Enhanced mobile request handling
    console.log('Login request from:', req.headers['user-agent']);
    console.log('Origin:', req.headers.origin);
    console.log('Content-Type:', req.headers['content-type']);
    
    // Ensure request body is properly parsed
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing or empty'
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Log activity
    try {
      await ActivityFeed.create({
        user_id: user.id,
        activity_type: 'user_joined',
        description: 'Joined the community',
        created_at: new Date()
      });
    } catch (activityError) {
      console.error('Failed to log login activity:', activityError);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Ensure user data is properly serialized
    const userData = user.toJSON();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout user (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// Update user profile
router.put('/profile', authenticateToken, upload.single('profile_image'), async (req, res) => {
  try {
    console.log('🔄 Profile update request received');
    console.log('📋 Request body:', req.body);
    console.log('📁 Request file:', req.file);
    console.log('👤 User object:', req.user);
    console.log('🆔 User ID:', req.user ? req.user.id : 'undefined');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - req.user is undefined'
      });
    }
    
    // Handle both JSON and FormData
    const bodyData = req.body;
    const fileData = req.file;
    
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user fields
    const updateData = {};
    
    // Handle text fields from body
    if (bodyData.first_name !== undefined) updateData.first_name = bodyData.first_name;
    if (bodyData.last_name !== undefined) updateData.last_name = bodyData.last_name;
    if (bodyData.age !== undefined) updateData.age = bodyData.age;
    if (bodyData.spiritual_intention !== undefined) updateData.spiritual_intention = bodyData.spiritual_intention;
    if (bodyData.bio !== undefined) updateData.bio = bodyData.bio;
    if (bodyData.meditation_streak !== undefined) updateData.meditation_streak = bodyData.meditation_streak;
    if (bodyData.community_contributions !== undefined) updateData.community_contributions = bodyData.community_contributions;
    if (bodyData.events_attended !== undefined) updateData.events_attended = bodyData.events_attended;
    
    // Handle file upload
    if (fileData) {
      updateData.profile_image = `/uploads/${fileData.filename}`;
    }

    console.log('Update data:', updateData);

    await user.update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    if (error.message === 'Only image files are allowed!') {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed!'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify email (placeholder for email verification system)
router.post('/verify-email', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // In a real implementation, you would send an email here
    // For now, we'll just return the token
    await user.update({ verification_token: verificationToken });

    res.json({
      success: true,
      message: 'Verification email sent',
      data: {
        verificationToken
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Forgot password (placeholder)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({
      where: { email: email }
    });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If this email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In a real implementation, you would send an email here
    // For now, we'll just return the token
    await user.update({ verification_token: resetToken });

    res.json({
      success: true,
      message: 'If this email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;