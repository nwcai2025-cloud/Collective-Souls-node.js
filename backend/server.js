
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const https = require('https');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config({ path: __dirname + '/.env' });

console.log('🔍 JWT_SECRET from environment:', process.env.JWT_SECRET ? 'Found' : 'Not found');
console.log('🔍 JWT_SECRET value:', process.env.JWT_SECRET);

// Import configurations
const { sequelize, testConnection } = require('./config/database');
const { setupSocketIO } = require('./config/socket');

// Import routes
const authRoutes = require('./routes/auth');
const authNewRoutes = require('./routes/auth-new');
const userRoutes = require('./routes/users');
const chatNewRoutes = require('./routes/chat-new');
const activityRoutes = require('./routes/activities');
const commentRoutes = require('./routes/comments');
const connectionRoutes = require('./routes/connections');
const eventRoutes = require('./routes/events');
const userEventRoutes = require('./routes/user-events');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');
const adminFeaturesRoutes = require('./routes/admin-features');
const adminVideosRoutes = require('./routes/admin-videos');
const postRoutes = require('./routes/posts');
const notificationRoutes = require('./routes/notifications');
const journalRoutes = require('./routes/journals');
const videoRoutes = require('./routes/video');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

// CORS configuration - Enhanced for mobile devices
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://192.168.4.24:5173",
  "http://192.168.4.24:5174",
  "http://192.168.4.24:8000",
  "http://192.168.4.24:8080", // Your correct frontend URL
  "https://192.168.4.24:8080", // HTTPS version of your frontend URL
  "http://localhost:8000",
  "http://localhost:8080",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3004",
  "http://192.168.4.24:3000",
  "http://192.168.4.24:3001",
  "http://192.168.4.24:3004",
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "https://yourdomain.com",
  "https://www.yourdomain.com"
];

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if the origin is in the allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }

      // Allow mobile app origins with different schemes
      if (origin.startsWith('capacitor://') || 
          origin.startsWith('ionic://') || 
          origin.startsWith('http://localhost') ||
          origin.startsWith('http://192.168.') ||
          origin.startsWith('https://')) {
        return callback(null, true);
      }

      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'User-Agent',
      'X-Device-Type',
      'X-Connection-Type'
    ]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:"],
      frameSrc: ["'none'"]
    }
  }
}));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, etc.)
    if (!origin) return callback(null, true);

    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Allow mobile app origins with different schemes
    if (origin.startsWith('capacitor://') || 
        origin.startsWith('ionic://') || 
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('https://')) {
      return callback(null, true);
    }

    const msg = 'The CORS policy for this site does not allow access from the specified origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Forwarded-For',
    'X-Real-IP',
    'User-Agent',
    'X-Device-Type',
    'X-Connection-Type'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
}));

// Compression middleware
app.use(compression());

// Rate limiting - TEMPORARILY DISABLED for mobile testing
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
//   message: {
//     success: false,
//     message: 'Too many requests from this IP, please try again later.'
//   },
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

// app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Collective Souls API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth-new', authNewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', authenticateToken, chatNewRoutes);
app.use('/api/activities', authenticateToken, activityRoutes);
app.use('/api/comments', authenticateToken, commentRoutes);
app.use('/api/connections', authenticateToken, connectionRoutes);
app.use('/api/events', authenticateToken, eventRoutes);
app.use('/api/user-events', authenticateToken, userEventRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminFeaturesRoutes);
app.use('/api/admin', adminVideosRoutes);
app.use('/api/posts', authenticateToken, postRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/journals', authenticateToken, journalRoutes);
app.use('/api/video', authenticateToken, videoRoutes);

// Socket.IO setup
setupSocketIO(io);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Don't send error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  });
});

// Database synchronization and server startup
async function startServer() {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models - use a safer approach to avoid foreign key issues
    await sequelize.sync(); // Use default sync without alter to avoid issues
    console.log('✅ Database synchronized successfully');
    
    // Start HTTP server
    const port = process.env.PORT || 3004;
    server.listen(port, () => {
      console.log(`🚀 HTTP Server running on port ${port}`);
      console.log(`📡 Socket.IO enabled`);
      console.log(`🌍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8000'}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Start HTTPS server for WebRTC
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, 'ip-key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'ip-cert.pem'))
    };
    
    const httpsPort = process.env.HTTPS_PORT || 3005;
    const httpsServer = https.createServer(httpsOptions, app);
    const httpsIo = new Server(httpsServer, {
      cors: {
        origin: function (origin, callback) {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);

          // Check if the origin is in the allowed list
          if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
          }

          // Allow mobile app origins with different schemes
          if (origin.startsWith('capacitor://') || 
              origin.startsWith('ionic://') || 
              origin.startsWith('http://localhost') ||
              origin.startsWith('http://192.168.') ||
              origin.startsWith('https://')) {
            return callback(null, true);
          }

          const msg = 'The CORS policy for this site does not allow access from the specified origin.';
          return callback(new Error(msg), false);
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
        allowedHeaders: [
          'Content-Type', 
          'Authorization', 
          'X-Requested-With',
          'User-Agent',
          'X-Device-Type',
          'X-Connection-Type'
        ]
      }
    });
    
    // Setup Socket.IO for HTTPS server
    setupSocketIO(httpsIo);
    
    httpsServer.listen(httpsPort, () => {
      console.log(`🔒 HTTPS Server running on port ${httpsPort}`);
      console.log(`🌐 WebRTC enabled at https://192.168.4.24:${httpsPort}`);
      console.log(`📡 HTTPS Socket.IO enabled`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start the server
startServer();

module.exports = { app, server, io };