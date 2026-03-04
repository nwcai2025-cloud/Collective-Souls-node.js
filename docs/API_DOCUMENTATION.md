# API Documentation

## 📋 Overview

This document provides comprehensive API documentation for the Collective Souls Node.js platform, including authentication, user management, chat system, content management, and admin panel endpoints.

## 🔐 Authentication

### **User Authentication**

#### **POST /api/auth/register**
Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-150 chars, required)",
  "email": "string (valid email, required)",
  "password": "string (min 8 chars, required)",
  "first_name": "string (optional)",
  "last_name": "string (optional)",
  "age": "integer (18-120, optional)",
  "spiritual_intention": "enum (optional)",
  "bio": "string (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "age": "integer",
      "spiritual_intention": "string",
      "bio": "string",
      "profile_image": "string",
      "is_active": "boolean",
      "is_online": "boolean",
      "last_seen": "datetime",
      "created_at": "datetime"
    },
    "token": "string"
  }
}
```

#### **POST /api/auth/login**
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "age": "integer",
      "spiritual_intention": "string",
      "bio": "string",
      "profile_image": "string",
      "is_active": "boolean",
      "is_online": "boolean",
      "last_seen": "datetime"
    },
    "token": "string"
  }
}
```

#### **POST /api/auth/logout**
Logout user and invalidate token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### **GET /api/auth/profile**
Get current user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "age": "integer",
      "spiritual_intention": "string",
      "bio": "string",
      "profile_image": "string",
      "is_active": "boolean",
      "is_online": "boolean",
      "last_seen": "datetime",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  }
}
```

#### **PUT /api/auth/profile**
Update user profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "first_name": "string (optional)",
  "last_name": "string (optional)",
  "age": "integer (18-120, optional)",
  "spiritual_intention": "enum (optional)",
  "bio": "string (optional)",
  "profile_image": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": "updated user object"
  }
}
```

## 👥 User Management

### **GET /api/users**
Get list of users (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 20, max: 100)
- `search`: string (search in username, email, first_name, last_name)
- `status`: string ('active' or 'inactive')
- `sortBy`: string (default: 'created_at')
- `sortOrder`: string ('ASC' or 'DESC', default: 'DESC')

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "integer",
        "username": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string",
        "age": "integer",
        "spiritual_intention": "string",
        "bio": "string",
        "profile_image": "string",
        "is_active": "boolean",
        "is_online": "boolean",
        "last_seen": "datetime",
        "created_at": "datetime"
      }
    ],
    "pagination": {
      "currentPage": "integer",
      "totalPages": "integer",
      "totalUsers": "integer",
      "hasNextPage": "boolean",
      "hasPrevPage": "boolean"
    }
  }
}
```

### **GET /api/users/:id**
Get specific user details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "age": "integer",
      "spiritual_intention": "string",
      "bio": "string",
      "profile_image": "string",
      "is_active": "boolean",
      "is_online": "boolean",
      "last_seen": "datetime",
      "created_at": "datetime",
      "updated_at": "datetime",
      "activities": [
        // Recent activities
      ],
      "comments": [
        // Recent comments
      ]
    }
  }
}
```

## 💬 Chat System

### **GET /api/chat/conversations**
Get user's chat conversations.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "integer",
        "name": "string",
        "description": "string",
        "conversation_type": "string",
        "is_private": "boolean",
        "max_participants": "integer",
        "created_by": "integer",
        "is_active": "boolean",
        "created_at": "datetime",
        "updated_at": "datetime",
        "participants_count": "integer",
        "last_message": {
          "id": "integer",
          "content": "string",
          "sender_id": "integer",
          "sender_username": "string",
          "created_at": "datetime"
        }
      }
    ]
  }
}
```

### **POST /api/chat/conversations**
Create new chat conversation.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "conversation_type": "string (room or direct, default: room)",
  "is_private": "boolean (default: false)",
  "max_participants": "integer (default: 100)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "conversation": "conversation object"
  }
}
```

### **GET /api/chat/conversations/:id/messages**
Get messages from a conversation.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 50, max: 200)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "integer",
        "conversation_id": "integer",
        "sender_id": "integer",
        "sender_username": "string",
        "content": "string",
        "message_type": "string",
        "file_url": "string",
        "file_type": "string",
        "file_size": "integer",
        "is_edited": "boolean",
        "edited_at": "datetime",
        "is_deleted": "boolean",
        "deleted_at": "datetime",
        "created_at": "datetime"
      }
    ],
    "pagination": {
      "currentPage": "integer",
      "totalPages": "integer",
      "totalMessages": "integer"
    }
  }
}
```

### **POST /api/chat/conversations/:id/messages**
Send message to conversation.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "content": "string (required if no file)",
  "message_type": "string (text, image, file, default: text)"
}
```

**File Upload:**
- `file`: multipart file (optional)

**Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": "message object"
  }
}
```

## 🤝 User Connections

### **GET /api/connections**
Get user's connections.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 20)
- `status`: string ('pending', 'accepted', 'rejected', 'blocked', optional)

**Response (200):**
```json
{
  "success": true,
  "connections": [
    {
      "id": "integer",
      "username": "string",
      "first_name": "string",
      "last_name": "string",
      "spiritual_intention": "string",
      "status": "string",
      "created_at": "datetime"
    }
  ],
  "pagination": {
    "currentPage": "integer",
    "totalPages": "integer",
    "totalConnections": "integer",
    "hasNextPage": "boolean",
    "hasPrevPage": "boolean"
  }
}
```

### **POST /api/connections**
Send connection request.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "integer (required)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Connection request sent successfully",
  "connection": {
    "id": "integer",
    "requester_id": "integer",
    "receiver_id": "integer",
    "status": "string",
    "created_at": "datetime"
  }
}
```

### **GET /api/connections/users/suggestions**
Get connection suggestions.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `search`: string (optional, search in username, first_name, last_name)
- `page`: integer (default: 1)
- `limit`: integer (default: 20)

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": "integer",
      "username": "string",
      "first_name": "string",
      "last_name": "string",
      "spiritual_intention": "string",
      "profile_image": "string",
      "bio": "string"
    }
  ],
  "pagination": {
    "currentPage": "integer",
    "totalPages": "integer",
    "totalUsers": "integer",
    "hasNextPage": "boolean",
    "hasPrevPage": "boolean"
  }
}
```

### **GET /api/connections/:id**
Get specific connection.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "connection": {
    "id": "integer",
    "requester": {
      "id": "integer",
      "username": "string",
      "first_name": "string",
      "last_name": "string"
    },
    "receiver": {
      "id": "integer",
      "username": "string",
      "first_name": "string",
      "last_name": "string"
    },
    "status": "string",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
}
```

### **PUT /api/connections/:id**
Update connection status.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "string (pending, accepted, declined, blocked, required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Connection status updated successfully",
  "connection": {
    "id": "integer",
    "requester_id": "integer",
    "receiver_id": "integer",
    "status": "string",
    "updated_at": "datetime"
  }
}
```

### **DELETE /api/connections/:id**
Delete connection.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Connection deleted successfully"
}
```

## 📝 Content Management

### **GET /api/activities**
Get spiritual activities.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 20)
- `user_id`: integer (optional, filter by user)
- `activity_type`: string (optional, filter by type)
- `date_from`: string (YYYY-MM-DD, optional)
- `date_to`: string (YYYY-MM-DD, optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "integer",
        "user_id": "integer",
        "user_username": "string",
        "activity_type": "string",
        "duration_minutes": "integer",
        "activity_date": "date",
        "notes": "string",
        "created_at": "datetime"
      }
    ],
    "pagination": {
      "currentPage": "integer",
      "totalPages": "integer",
      "totalActivities": "integer"
    }
  }
}
```

### **POST /api/activities**
Create new spiritual activity.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "activity_type": "string (required)",
  "duration_minutes": "integer (required, 1-1440)",
  "activity_date": "string (YYYY-MM-DD, required)",
  "notes": "string (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Activity logged successfully",
  "data": {
    "activity": "activity object"
  }
}
```

### **GET /api/comments/activity/:id**
Get comments for an activity.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 20)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "integer",
        "activity_id": "integer",
        "author_id": "integer",
        "author_username": "string",
        "content": "string",
        "content_html": "string",
        "parent_comment_id": "integer",
        "like_count": "integer",
        "is_deleted": "boolean",
        "created_at": "datetime",
        "updated_at": "datetime"
      }
    ],
    "pagination": {
      "currentPage": "integer",
      "totalPages": "integer",
      "totalComments": "integer"
    }
  }
}
```

### **POST /api/comments/activity/:id**
Create comment on activity.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "string (required)",
  "parent_comment_id": "integer (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "comment": "comment object"
  }
}
```

## 🎥 Video Management

### **POST /api/videos/upload**
Upload video file.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "video_file": "file (required, max 500MB)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "video": {
      "id": "integer",
      "user_id": "integer",
      "title": "string",
      "description": "string",
      "video_file": "string",
      "thumbnail": "string",
      "duration": "integer",
      "quality_versions": "json",
      "view_count": "integer",
      "is_live": "boolean",
      "stream_key": "string",
      "viewers_count": "integer",
      "created_at": "datetime"
    }
  }
}
```

### **GET /api/videos**
Get user's videos.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 20)
- `status`: string ('pending', 'approved', 'rejected', optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "integer",
        "user_id": "integer",
        "title": "string",
        "description": "string",
        "video_file": "string",
        "thumbnail": "string",
        "duration": "integer",
        "quality_versions": "json",
        "view_count": "integer",
        "is_live": "boolean",
        "stream_key": "string",
        "viewers_count": "integer",
        "created_at": "datetime"
      }
    ],
    "pagination": {
      "currentPage": "integer",
      "totalPages": "integer",
      "totalVideos": "integer"
    }
  }
}
```

## 🛡️ Admin Panel API

### **Admin Authentication**

#### **POST /api/admin/login**
Admin login.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "string",
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "role": "string",
      "permissions": "object"
    }
  }
}
```

### **Admin Dashboard**

#### **GET /api/admin/dashboard**
Get admin dashboard statistics.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": "integer",
    "totalAdmins": "integer",
    "pendingReports": "integer",
    "totalComments": "integer",
    "totalActivities": "integer",
    "totalVideos": "integer",
    "recentUsers": [
      {
        "id": "integer",
        "username": "string",
        "email": "string",
        "created_at": "datetime"
      }
    ],
    "recentReports": [
      {
        "id": "integer",
        "reported_type": "string",
        "reported_id": "integer",
        "reason": "string",
        "status": "string",
        "reporter": {
          "username": "string"
        }
      }
    ]
  }
}
```

### **User Management**

#### **GET /api/admin/users**
Get all users (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: integer (default: 1)
- `limit`: integer (default: 20)
- `search`: string
- `status`: string ('active', 'inactive')
- `sortBy`: string
- `sortOrder`: string

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "integer",
        "username": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string",
        "age": "integer",
        "spiritual_intention": "string",
        "bio": "string",
        "is_active": "boolean",
        "is_online": "boolean",
        "last_seen": "datetime",
        "created_at": "datetime"
      }
    ],
    "pagination": {
      "currentPage": "integer",
      "totalPages": "integer",
      "totalUsers": "integer"
    }
  }
}
```

#### **PUT /api/admin/users/:id**
Update user (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "username": "string (optional)",
  "email": "string (optional)",
  "is_active": "boolean (optional)",
  "spiritual_intention": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": "updated user object"
  }
}
```

#### **DELETE /api/admin/users/:id**
Suspend user (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "User suspended successfully"
}
```

### **Content Moderation**

#### **GET /api/admin/content/comments**
Get comments for moderation.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "integer",
      "activity_id": "integer",
      "author_id": "integer",
      "author_username": "string",
      "content": "string",
      "activity_title": "string",
      "created_at": "datetime",
      "is_deleted": "boolean"
    }
  ]
}
```

#### **PUT /api/admin/content/comments/:id**
Moderate comment.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "is_deleted": "boolean",
  "content": "string (optional, for editing)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Comment moderated successfully",
  "data": {
    "comment": "updated comment object"
  }
}
```

### **Content Reports**

#### **GET /api/admin/reports**
Get all content reports.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "integer",
      "reporter_id": "integer",
      "reported_type": "string",
      "reported_id": "integer",
      "reason": "string",
      "description": "string",
      "status": "string",
      "reviewed_by": "integer",
      "reviewed_at": "datetime",
      "resolution_notes": "string",
      "created_at": "datetime",
      "reporter": {
        "username": "string",
        "email": "string"
      },
      "reviewer": {
        "user": {
          "username": "string"
        }
      }
    }
  ]
}
```

#### **PUT /api/admin/reports/:id**
Review content report.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "status": "string (pending, reviewed, resolved, dismissed)",
  "resolution_notes": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Report reviewed successfully",
  "data": {
    "report": "updated report object"
  }
}
```

## 🔧 Error Responses

### **Common Error Formats**

#### **400 Bad Request**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "field_name",
      "message": "error message"
    }
  ]
}
```

#### **401 Unauthorized**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### **403 Forbidden**
```json
{
  "success": false,
  "message": "Access denied - Insufficient permissions"
}
```

#### **404 Not Found**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

#### **500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## 📊 Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 login attempts per 15 minutes per IP
- **File Uploads**: 10 uploads per hour per user

## 🔒 Security Notes

- All API endpoints require HTTPS in production
- JWT tokens should be stored securely on client-side
- Admin endpoints require elevated permissions
- Input validation is performed on all endpoints
- Sensitive operations are logged for audit purposes

---

**"Comprehensive API documentation for seamless integration and development."** 📚🚀