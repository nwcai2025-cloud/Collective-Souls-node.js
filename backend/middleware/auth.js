const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Authentication Middleware - Unified for both regular users and admins
const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔍 Authentication middleware called');
    console.log('📋 Request headers:', req.headers);
    console.log('🔑 Authorization header:', req.headers['authorization']);
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🎫 Token extracted:', token ? 'Present' : 'Missing');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT token
    console.log('🔐 Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded successfully:', decoded);
    
    // Get user from database - support both 'id' and 'userId'
    const userId = decoded.id || decoded.userId;
    console.log('👤 Fetching user from database for ID:', userId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload'
      });
    }

    // Enhanced user query to include admin role data for admin users
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [{
        model: require('../models').AdminUser,
        as: 'adminUser',
        include: [{
          model: require('../models').AdminRole,
          as: 'role'
        }]
      }]
    });

    if (!user) {
      console.log('❌ User not found for ID:', userId);
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    console.log('✅ User found:', user.username);

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ User account deactivated:', user.username);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add admin role info to request for admin users
    if (user.is_staff || user.is_superuser) {
      req.adminUser = user.adminUser || {
        id: user.id,
        user_id: user.id,
        is_active: user.is_active
      };

      req.adminRole = user.adminUser?.role || {
        name: user.is_superuser ? 'super_admin' : 'admin',
        permissions: {
          users: ['read', 'update', 'delete', 'promote'],
          content: ['moderate', 'delete'],
          analytics: ['read', 'view_all', 'view_users', 'view_content'],
          logs: ['read'],
          reports: ['read', 'update'],
          admin: ['view_logs', 'manage_roles', 'system_settings'],
          videos: ['read', 'update', 'moderate', 'delete']
        }
      };
    }

    // Add user to request object
    console.log('✅ Authentication successful for user:', user.username);
    req.user = user;
    next();
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional authentication (for public endpoints that can use auth if available)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id || decoded.userId;
        const user = await User.findByPk(userId, {
          attributes: { exclude: ['password'] }
        });

        if (user && user.is_active) {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but continue without authentication
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

// Admin role check middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.is_staff && !req.user.is_superuser) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};


// Permission check middleware for admin actions - Unified system
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Superuser has all permissions
    if (req.user.is_superuser) {
      return next();
    }

    // Staff users need specific permissions
    if (!req.user.is_staff) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Insufficient permissions'
      });
    }

    // Check specific permissions if admin role data is available
    if (req.adminRole && req.adminRole.permissions) {
      const permissions = req.adminRole.permissions || {};
      const resourcePermissions = permissions[resource] || [];

      if (!resourcePermissions.includes(action)) {
        return res.status(403).json({
          success: false,
          message: `Access denied - Missing ${resource}:${action} permission`
        });
      }
    }

    next();
  };
};

// Check if user owns resource or is admin
const checkOwnershipOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Allow if user owns the resource or is admin
    if (req.user.id === resourceUserId || req.user.is_staff || req.user.is_superuser) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  };
};

// Socket authentication function
const authenticateSocket = async (token) => {
  try {
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.is_active) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Socket authentication error:', error);
    return null;
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requirePermission,
  checkOwnershipOrAdmin,
  authenticateSocket
};
