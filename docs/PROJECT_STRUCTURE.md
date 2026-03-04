# Project Structure Documentation

## 📁 Complete Project Organization

This document provides a comprehensive overview of the Collective Souls Node.js project structure, including file organization, dependencies, and architectural patterns.

## 🏗️ Overall Architecture

```
collective-souls-nodejs/
├── 📁 backend/                    # Node.js Express Server
│   ├── 📁 config/                # Database and environment config
│   ├── 📁 controllers/           # API route handlers
│   ├── 📁 middleware/            # Authentication and validation
│   ├── 📁 models/                # Database models (Sequelize)
│   ├── 📁 routes/                # API route definitions
│   ├── 📁 services/              # Business logic
│   ├── 📁 utils/                 # Helper functions
│   ├── 📁 uploads/               # File upload handling
│   └── 📄 server.js              # Main server file
│
├── 📁 frontend/                  # React Application
│   ├── 📁 public/                # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/        # React components
│   │   ├── 📁 pages/             # Page components
│   │   ├── 📁 services/          # API calls
│   │   ├── 📁 hooks/             # Custom hooks
│   │   ├── 📁 utils/             # Frontend utilities
│   │   └── 📄 App.js             # Main app component
│   └── 📄 package.json           # Frontend dependencies
│
├── 📁 video-processing/          # Video upload and processing
│   ├── 📁 uploads/               # Temporary upload storage
│   ├── 📁 processed/             # Processed video files
│   ├── 📁 thumbnails/            # Generated thumbnails
│   └── 📄 processor.js           # Video processing logic
│
├── 📁 database/                  # Database setup and migrations
│   ├── 📄 schema.sql             # MySQL database schema
│   ├── 📄 migrations/            # Database migration scripts
│   └── 📄 seeds/                 # Sample data
│
├── 📁 deployment/                # Production deployment configs
│   ├── 📄 nginx.conf             # Nginx reverse proxy config
│   ├── 📄 pm2.config.js          # PM2 process management
│   ├── 📄 docker-compose.yml     # Docker setup
│   └── 📄 ubuntu-setup.sh        # Ubuntu VPS setup script
│
├── 📁 docs/                      # Documentation
│   ├── 📄 API_SPEC.md            # API documentation
│   ├── 📄 MIGRATION_GUIDE.md     # Migration instructions
│   ├── 📄 DEPLOYMENT_GUIDE.md    # Deployment instructions
│   └── 📄 VIDEO_FEATURES.md      # Video feature specifications
│
├── 📁 tests/                     # Test files
│   ├── 📁 backend/               # Backend tests
│   └── 📁 frontend/              # Frontend tests
│
└── 📄 README.md                  # Project documentation
```

## 🎯 Backend Structure

### **Core Backend Files**

#### **`backend/server.js`** - Main Server Entry Point
- Express.js application setup
- Middleware configuration
- Route mounting
- Socket.io integration
- Error handling
- Server startup logic

#### **`backend/config/database.js`** - Database Configuration
- MySQL connection setup
- Sequelize ORM configuration
- Connection pooling
- Database synchronization
- Environment-specific configurations

#### **`backend/.env.example`** - Environment Variables Template
- Database connection settings
- JWT authentication configuration
- File upload settings
- Email configuration
- Security settings

### **Backend Models (`backend/models/`)**

#### **`User.js`** - User Model
```javascript
// Core user fields
- id, username, email, password
- first_name, last_name, age
- spiritual_intention, bio
- profile_image, is_active
- is_online, last_seen
- timestamps (created_at, updated_at)

// Relationships
- Activities (hasMany)
- Comments (hasMany)
- Chat messages (hasMany)
- Connections (hasMany)
- Events (hasMany)
```

#### **`Connection.js`** - Connection Model
```javascript
// Connection fields
- id, requester_id, receiver_id
- status (pending, accepted, rejected, blocked)
- timestamps (created_at, updated_at)

// Relationships
- from_user (belongsTo User)
- to_user (belongsTo User)
```

#### **`Chat.js`** - Chat System Models
```javascript
// Conversation Model
- id, name, description
- conversation_type, is_private
- max_participants, created_by
- timestamps

// Message Model
- id, conversation_id, sender_id
- content, message_type
- file_url, file_type, file_size
- is_edited, is_deleted
- timestamps

// Participant Model
- id, conversation_id, user_id
- joined_at, left_at
- is_admin, is_muted
- timestamps
```

#### **`Admin.js`** - Admin System Models
```javascript
// AdminRole Model
- id, name, description
- permissions (JSON)
- is_active, timestamps

// AdminUser Model
- id, user_id, role_id
- is_active, last_login
- login_attempts, locked_until
- timestamps

// AdminAuditLog Model
- id, admin_user_id, action
- resource_type, resource_id
- old_values, new_values
- ip_address, user_agent
- timestamps

// ContentReport Model
- id, reporter_id, reported_type
- reported_id, reason, description
- status, reviewed_by, reviewed_at
- resolution_notes, timestamps

// AdminNotification Model
- id, admin_user_id, type
- title, message, data
- is_read, read_at
- timestamps
```

### **Backend Controllers (`backend/controllers/`)**

#### **Authentication Controller**
- User registration and login
- Password hashing and validation
- JWT token generation and verification
- Profile management
- Email verification

#### **Chat Controller**
- Conversation management
- Message handling
- File upload processing
- Real-time communication
- User presence tracking

#### **Content Controller**
- Activity logging
- Comment management
- Content moderation
- User connections
- Event management

#### **Admin Controller**
- User management
- Content moderation
- Report handling
- Analytics and monitoring
- System administration

### **Backend Middleware (`backend/middleware/`)**

#### **`auth.js`** - Authentication Middleware
- JWT token verification
- User authentication
- Session management
- Permission checking

#### **`adminAuth.js`** - Admin Authentication Middleware
- Admin role verification
- Permission-based access control
- Audit logging
- Admin session management

#### **`validation.js`** - Input Validation Middleware
- Request body validation
- Parameter sanitization
- File upload validation
- Rate limiting

#### **`errorHandler.js`** - Error Handling Middleware
- Global error handling
- Custom error responses
- Logging integration
- Error status codes

### **Backend Routes (`backend/routes/`)**

#### **`auth.js`** - Authentication Routes
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/profile
PUT /api/auth/profile
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

#### **`users.js`** - User Management Routes
```
GET /api/users
GET /api/users/:id
PUT /api/users/:id
DELETE /api/users/:id
GET /api/users/:id/activities
GET /api/users/:id/comments
GET /api/users/:id/connections
```

#### **`chat.js`** - Chat System Routes
```
GET /api/chat/conversations
POST /api/chat/conversations
GET /api/chat/conversations/:id
PUT /api/chat/conversations/:id
DELETE /api/chat/conversations/:id
GET /api/chat/conversations/:id/messages
POST /api/chat/conversations/:id/messages
GET /api/chat/conversations/:id/participants
POST /api/chat/conversations/:id/participants
DELETE /api/chat/conversations/:id/participants/:userId
```

#### **`content.js`** - Content Management Routes
```
GET /api/activities
POST /api/activities
GET /api/activities/:id
PUT /api/activities/:id
DELETE /api/activities/:id
GET /api/comments/activity/:id
POST /api/comments/activity/:id
PUT /api/comments/:id
DELETE /api/comments/:id
GET /api/connections
POST /api/connections
PUT /api/connections/:id
DELETE /api/connections/:id
```

#### **`videos.js`** - Video Management Routes
```
POST /api/videos/upload
GET /api/videos
GET /api/videos/:id
PUT /api/videos/:id
DELETE /api/videos/:id
POST /api/videos/:id/like
POST /api/videos/:id/comment
GET /api/videos/:id/comments
```

#### **`admin.js`** - Admin Panel Routes
```
POST /api/admin/login
GET /api/admin/dashboard
GET /api/admin/users
GET /api/admin/users/:id
PUT /api/admin/users/:id
DELETE /api/admin/users/:id
GET /api/admin/content/comments
PUT /api/admin/content/comments/:id
GET /api/admin/reports
PUT /api/admin/reports/:id
GET /api/admin/notifications
PUT /api/admin/notifications/:id/read
GET /api/admin/analytics/users
GET /api/admin/analytics/content
```

### **Backend Services (`backend/services/`)**

#### **`authService.js`** - Authentication Services
- User registration logic
- Login validation
- Password reset functionality
- Email verification
- Token management

#### **`userService.js`** - User Management Services
- User profile updates
- User search and filtering
- User statistics
- Privacy settings
- Account management

#### **`chatService.js`** - Chat System Services
- Conversation creation
- Message processing
- File upload handling
- Real-time notifications
- User presence management

#### **`contentService.js`** - Content Management Services
- Activity logging
- Comment moderation
- Content approval workflows
- User engagement tracking
- Content analytics

#### **`videoService.js`** - Video Processing Services
- Video upload processing
- Format conversion
- Thumbnail generation
- Quality optimization
- Storage management

#### **`adminService.js`** - Admin Services
- User management
- Content moderation
- Report handling
- System monitoring
- Audit logging

### **Backend Utilities (`backend/utils/`)**

#### **`helpers.js`** - General Helper Functions
- Date formatting
- String utilities
- Array manipulation
- Object utilities
- Validation helpers

#### **`validators.js`** - Input Validation Functions
- Email validation
- Password strength checking
- File type validation
- Content filtering
- Security checks

#### **`formatters.js`** - Data Formatting Functions
- API response formatting
- Date/time formatting
- File size formatting
- User data formatting
- Error message formatting

#### **`constants.js`** - Application Constants
- File upload limits
- Validation rules
- Status codes
- Error messages
- Configuration values

## 🎨 Frontend Structure

### **Core Frontend Files**

#### **`frontend/src/App.js`** - Main Application Component
- Router configuration
- Authentication context
- Socket.io connection
- Global state management
- Error boundaries

#### **`frontend/package.json`** - Frontend Dependencies
- React and React Router
- UI libraries (Tailwind CSS, Lucide React)
- State management (React Hook Form)
- API communication (Axios)
- Development tools

#### **`frontend/tailwind.config.js`** - Tailwind CSS Configuration
- Custom color palette
- Typography settings
- Spacing and sizing
- Animation configurations
- Responsive design settings

### **Frontend Components (`frontend/src/components/`)**

#### **Authentication Components**
- `LoginForm.jsx` - User login form
- `RegisterForm.jsx` - User registration form
- `ProfileForm.jsx` - Profile editing form
- `AuthWrapper.jsx` - Authentication wrapper

#### **Chat Components**
- `ChatRoom.jsx` - Main chat interface
- `MessageList.jsx` - Message display component
- `MessageInput.jsx` - Message input component
- `ConversationList.jsx` - Conversation list
- `UserPresence.jsx` - Online user indicators

#### **Content Components**
- `ActivityLogger.jsx` - Activity logging interface
- `CommentSection.jsx` - Comment display and input
- `CommentForm.jsx` - Comment creation form
- `ContentCard.jsx` - Content display card
- `ModerationPanel.jsx` - Content moderation interface

#### **Video Components**
- `VideoPlayer.jsx` - Video playback component
- `VideoUploader.jsx` - Video upload interface
- `VideoRecorder.jsx` - WebRTC video recording
- `VideoThumbnail.jsx` - Video thumbnail display
- `VideoList.jsx` - Video listing component

#### **Admin Components**
- `AdminDashboard.jsx` - Admin dashboard interface
- `UserManagement.jsx` - User management interface
- `ContentModeration.jsx` - Content moderation interface
- `ReportManagement.jsx` - Report handling interface
- `AnalyticsPanel.jsx` - Analytics display interface

#### **Navigation Components**
- `Header.jsx` - Main application header
- `Sidebar.jsx` - Navigation sidebar
- `Footer.jsx` - Application footer
- `Navigation.jsx` - Main navigation component
- `Breadcrumbs.jsx` - Breadcrumb navigation

#### **UI Components**
- `Button.jsx` - Custom button component
- `Input.jsx` - Custom input component
- `Modal.jsx` - Modal dialog component
- `Toast.jsx` - Toast notification component
- `LoadingSpinner.jsx` - Loading indicator
- `ErrorBoundary.jsx` - Error boundary component

### **Frontend Pages (`frontend/src/pages/`)**

#### **Public Pages**
- `Home.jsx` - Landing page
- `Login.jsx` - Login page
- `Register.jsx` - Registration page
- `ForgotPassword.jsx` - Password reset page
- `CommunityGuidelines.jsx` - Community guidelines page

#### **Authenticated Pages**
- `Dashboard.jsx` - Main user dashboard
- `Profile.jsx` - User profile page
- `Chat.jsx` - Chat interface page
- `Activities.jsx` - Activity tracking page
- `Videos.jsx` - Video gallery page
- `Events.jsx` - Events page
- `Connections.jsx` - User connections page

#### **Admin Pages**
- `AdminLogin.jsx` - Admin login page
- `AdminDashboard.jsx` - Admin dashboard
- `UserManagement.jsx` - User management page
- `ContentModeration.jsx` - Content moderation page
- `Reports.jsx` - Report management page
- `Analytics.jsx` - Analytics page
- `SystemLogs.jsx` - System monitoring page

### **Frontend Services (`frontend/src/services/`)**

#### **`authService.js`** - Authentication API Service
- Login/logout API calls
- Token management
- Profile API calls
- Password reset requests
- Email verification

#### **`userService.js`** - User Management API Service
- User listing and search
- Profile updates
- User statistics
- Connection management
- Privacy settings

#### **`chatService.js`** - Chat System API Service
- Conversation management
- Message sending/receiving
- File upload
- User presence
- Real-time notifications

#### **`contentService.js`** - Content Management API Service
- Activity logging
- Comment management
- Content moderation
- User engagement
- Content analytics

#### **`videoService.js`** - Video Management API Service
- Video upload
- Video playback
- Video processing
- Thumbnail generation
- Video analytics

#### **`adminService.js`** - Admin Panel API Service
- Admin authentication
- User management
- Content moderation
- Report handling
- System monitoring

### **Frontend Hooks (`frontend/src/hooks/`)**

#### **`useAuth.js`** - Authentication Hook
- Authentication state management
- Login/logout functionality
- Token validation
- User profile management
- Authentication persistence

#### **`useSocket.js`** - Socket.io Hook
- WebSocket connection management
- Real-time event handling
- Connection status tracking
- Event subscription/unsubscription
- Error handling

#### **`useApi.js`** - API Hook
- HTTP request management
- Loading states
- Error handling
- Request caching
- Retry logic

#### **`useForm.js`** - Form Management Hook
- Form state management
- Validation handling
- Submission logic
- Error display
- Reset functionality

#### **`useVideoRecorder.js`** - Video Recording Hook
- WebRTC stream management
- Recording controls
- Media constraints
- Error handling
- File processing

### **Frontend Utilities (`frontend/src/utils/`)**

#### **`api.js`** - API Configuration
- Base URL configuration
- Default headers
- Request/response interceptors
- Error handling
- Authentication setup

#### **`formatters.js`** - Data Formatting
- Date/time formatting
- Number formatting
- String utilities
- File size formatting
- URL utilities

#### **`validators.js`** - Form Validation
- Input validation rules
- Custom validation functions
- Error message generation
- Validation schemas
- Real-time validation

#### **`constants.js`** - Application Constants
- API endpoints
- Route paths
- Configuration values
- Error messages
- UI constants

## 🗄️ Database Structure

### **Core Database Tables**

#### **Users Table**
```sql
users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(150) UNIQUE NOT NULL,
  email VARCHAR(254) UNIQUE NOT NULL,
  password VARCHAR(128) NOT NULL,
  first_name VARCHAR(150),
  last_name VARCHAR(150),
  age INT CHECK (age >= 18 AND age <= 120),
  spiritual_intention ENUM(...),
  bio TEXT,
  profile_image VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen DATETIME,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### **Chat Tables**
```sql
chat_conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  conversation_type ENUM('room', 'direct'),
  is_private BOOLEAN DEFAULT FALSE,
  max_participants INT DEFAULT 100,
  created_by INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME,
  updated_at DATETIME
)

chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  message_type ENUM('text', 'image', 'file', 'system'),
  file_url VARCHAR(500),
  file_type VARCHAR(50),
  file_size INT,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at DATETIME
)

chat_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at DATETIME,
  left_at DATETIME,
  is_admin BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  mute_until DATETIME
)
```

#### **Content Tables**
```sql
activity_feed (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  activity_type ENUM(...),
  duration_minutes INT NOT NULL,
  activity_date DATE NOT NULL,
  notes TEXT,
  created_at DATETIME
)

comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  activity_id INT NOT NULL,
  author_id INT NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT,
  parent_comment_id INT,
  like_count INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at DATETIME,
  updated_at DATETIME
)

user_connections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  requester_id INT NOT NULL,
  receiver_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'blocked'),
  created_at DATETIME,
  updated_at DATETIME
)
```

#### **Admin Tables**
```sql
admin_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSON NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME,
  updated_at DATETIME
)

admin_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  login_attempts INT DEFAULT 0,
  locked_until DATETIME,
  created_at DATETIME,
  updated_at DATETIME
)

admin_audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME
)

content_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reporter_id INT NOT NULL,
  reported_type ENUM('comment', 'activity', 'video', 'user', 'chat_message'),
  reported_id INT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
  reviewed_by INT,
  reviewed_at DATETIME,
  resolution_notes TEXT,
  created_at DATETIME
)
```

## 🚀 Deployment Structure

### **Production Configuration Files**

#### **`deployment/nginx.conf`** - Nginx Reverse Proxy
- SSL/TLS configuration
- Static file serving
- API proxy configuration
- Security headers
- Rate limiting
- Gzip compression

#### **`deployment/pm2.config.js`** - PM2 Process Management
- Application clustering
- Environment variables
- Log management
- Restart policies
- Health checks

#### **`deployment/ubuntu-setup.sh`** - Ubuntu VPS Setup
- System updates
- Package installation
- Service configuration
- Security setup
- Application deployment
- Monitoring setup

#### **`deployment/docker-compose.yml`** - Docker Configuration
- Multi-container setup
- Service dependencies
- Volume mounting
- Network configuration
- Environment variables

### **Environment Configuration**

#### **Development Environment**
- Local database connection
- Debug mode enabled
- Hot reloading
- Development tools
- Mock data

#### **Production Environment**
- Production database
- Optimized builds
- Security hardening
- Performance tuning
- Monitoring and logging

## 📊 File Statistics

### **Total Files Created: 22**

#### **Backend Files (11)**
- 1 main server file
- 1 database configuration
- 1 environment template
- 2 middleware files
- 3 model files
- 4 route files

#### **Frontend Files (6)**
- 1 main app file
- 1 package configuration
- 1 CSS configuration
- 3 page components

#### **Database Files (1)**
- 1 comprehensive schema file

#### **Deployment Files (2)**
- 1 Ubuntu setup script
- 1 Nginx configuration

#### **Documentation Files (2)**
- 1 complete migration summary
- 1 API documentation

## 🔧 Technology Stack

### **Backend Technologies**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for MySQL
- **Socket.io** - Real-time communication
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **multer** - File upload handling
- **FFmpeg** - Video processing

### **Frontend Technologies**
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling framework
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **WebRTC** - Video recording
- **Lucide React** - Icon library
- **React Hook Form** - Form management

### **Database Technologies**
- **MySQL 8.0+** - Primary database
- **Redis** - Caching and session storage
- **Sequelize ORM** - Database abstraction

### **Deployment Technologies**
- **Nginx** - Reverse proxy and web server
- **PM2** - Process management
- **Ubuntu 24.04** - Production OS
- **Let's Encrypt** - SSL certificates
- **Docker** - Containerization (optional)

## 📈 Performance Optimizations

### **Backend Optimizations**
- Database connection pooling
- Query optimization and indexing
- Caching with Redis
- File upload streaming
- API response compression
- Rate limiting and throttling

### **Frontend Optimizations**
- Code splitting and lazy loading
- Image and video optimization
- Bundle size reduction
- Caching strategies
- Performance monitoring
- Mobile responsiveness

### **Database Optimizations**
- Proper indexing strategy
- Query optimization
- Connection pooling
- Data normalization
- Storage optimization
- Backup strategies

---

**"Comprehensive project structure documentation for maintainable and scalable development."** 📁🚀