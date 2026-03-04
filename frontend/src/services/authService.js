import axios from 'axios'

// Enhanced API URL detection for mobile compatibility
const getApiBaseUrl = () => {
  // Try environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Auto-detect IP address for mobile access
  const hostname = window.location.hostname
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // We're on a network IP, use the same IP for API
    // Use HTTP instead of HTTPS to avoid SSL certificate issues
    return `http://${hostname}:3004`
  }
  
  // Default to localhost for local development
  return 'http://localhost:3004'
}

const API_BASE_URL = getApiBaseUrl()

// Create axios instance with mobile-optimized config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json'
  },
  timeout: 15000, // 15 second timeout for mobile reliability
  withCredentials: true, // Enable cookies for mobile
  validateStatus: function (status) {
    return status < 500; // Resolve only if the status code is less than 500
  }
})

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Handle response errors with mobile-specific handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error)
    
    if (error.response?.status === 401) {
      // Token expired or invalid, remove it
      clearStoredToken()
      // Don't redirect immediately on mobile, let component handle it
      return Promise.reject({ ...error, logoutRequired: true })
    }
    
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      // Network error - common on mobile
      return Promise.reject({ 
        ...error, 
        message: 'Network error. Please check your connection and try again.',
        isNetworkError: true 
      })
    }
    
    return Promise.reject(error)
  }
)

// Enhanced token storage for mobile devices
function getStoredToken() {
  try {
    // Try localStorage first
    let token = localStorage.getItem('token')
    
    if (!token) {
      // Fallback to sessionStorage for mobile browsers with storage issues
      token = sessionStorage.getItem('token')
    }
    
    if (!token) {
      // Fallback to cookie storage
      token = getCookie('token')
    }
    
    return token
  } catch (e) {
    console.warn('Token storage access error:', e)
    return null
  }
}

function setStoredToken(token) {
  try {
    localStorage.setItem('token', token)
    sessionStorage.setItem('token', token)
    // Also set cookie for fallback
    document.cookie = `token=${token}; path=/; max-age=86400`
  } catch (e) {
    console.warn('Token storage set error:', e)
    // Try alternative storage methods
    try {
      sessionStorage.setItem('token', token)
      document.cookie = `token=${token}; path=/; max-age=86400`
    } catch (e2) {
      console.error('All token storage methods failed:', e2)
    }
  }
}

function clearStoredToken() {
  try {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  } catch (e) {
    console.warn('Token clear error:', e)
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}


// Authentication API endpoints
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth-new/register', userData)
    return response.data
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth-new/login', credentials)
      
      // Store token using enhanced mobile storage
      if (response.data?.data?.token) {
        setStoredToken(response.data.data.token)
      }
      
      return response.data
    } catch (error) {
      console.error('Login API error:', error)
      throw error
    }
  },

  // Admin login
  adminLogin: async (credentials) => {
    try {
      const response = await api.post('/admin/login', credentials)
      
      // Store token using enhanced mobile storage
      if (response.data?.data?.token) {
        setStoredToken(response.data.data.token)
      }
      
      return response.data
    } catch (error) {
      console.error('Admin login API error:', error)
      throw error
    }
  },

  // Logout user (client-side only)
  logout: async () => {
    // In this implementation, logout is handled client-side by removing the token
    clearStoredToken()
    return { success: true }
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth-new/profile')
    return response.data
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth-new/profile', profileData, {
      headers: {
        'Content-Type': profileData instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    })
    return response.data
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/auth-new/change-password', passwordData)
    return response.data
  },

  // Verify email
  verifyEmail: async (verificationData) => {
    const response = await api.post('/auth-new/verify-email', verificationData)
    return response.data
  },

  // Forgot password
  forgotPassword: async (emailData) => {
    const response = await api.post('/auth-new/forgot-password', emailData)
    return response.data
  },
}

// User API endpoints
export const userAPI = {
  // Get all users
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params })
    return response.data
  },

  // Get user by ID
  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`)
    return response.data
  },

  // Update user (admin)
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData)
    return response.data
  },

  // Delete user (admin - soft delete)
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`)
    return response.data
  },

  // Get user activities
  getUserActivities: async (userId, params = {}) => {
    const response = await api.get(`/users/${userId}/activities`, { params })
    return response.data
  },

  // Get user comments
  getUserComments: async (userId, params = {}) => {
    const response = await api.get(`/users/${userId}/comments`, { params })
    return response.data
  },

  // Get user connections
  getUserConnections: async (userId, params = {}) => {
    const response = await api.get(`/users/${userId}/connections`, { params })
    return response.data
  },
}

// Chat API endpoints
export const chatAPI = {
  // Get user's conversations
  getConversations: async (params = {}) => {
    const response = await api.get('/chat/conversations', { params })
    return response.data
  },

  // Get conversation by ID
  getConversation: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}`)
    return response.data
  },

  // Create new conversation
  createConversation: async (conversationData) => {
    const response = await api.post('/chat/conversations', conversationData)
    return response.data
  },

  // Update conversation
  updateConversation: async (conversationId, conversationData) => {
    const response = await api.put(`/chat/conversations/${conversationId}`, conversationData)
    return response.data
  },

  // Delete conversation
  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/chat/conversations/${conversationId}`)
    return response.data
  },

  // Get messages from conversation
  getMessages: async (conversationId, params = {}) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, { params })
    return response.data
  },

  // Send message to conversation
  sendMessage: async (conversationId, messageData) => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, messageData)
    return response.data
  },

  // Get conversation participants
  getParticipants: async (conversationId, params = {}) => {
    const response = await api.get(`/chat/conversations/${conversationId}/participants`, { params })
    return response.data
  },

  // Add participant to conversation
  addParticipant: async (conversationId, participantData) => {
    const response = await api.post(`/chat/conversations/${conversationId}/participants`, participantData)
    return response.data
  },

  // Remove participant from conversation
  removeParticipant: async (conversationId, userId) => {
    const response = await api.delete(`/chat/conversations/${conversationId}/participants/${userId}`)
    return response.data
  },
}

// Activities API endpoints (placeholder)
export const activityAPI = {
  // Get user's activities
  getActivities: async (params = {}) => {
    const response = await api.get('/activities', { params })
    return response.data
  },

  // Create new activity
  createActivity: async (activityData) => {
    const response = await api.post('/activities', activityData)
    return response.data
  },

  // Get activity by ID
  getActivity: async (activityId) => {
    const response = await api.get(`/activities/${activityId}`)
    return response.data
  },

  // Update activity
  updateActivity: async (activityId, activityData) => {
    const response = await api.put(`/activities/${activityId}`, activityData)
    return response.data
  },

  // Delete activity
  deleteActivity: async (activityId) => {
    const response = await api.delete(`/activities/${activityId}`)
    return response.data
  },
}

// Comments API endpoints (placeholder)
export const commentAPI = {
  // Get comments
  getComments: async (params = {}) => {
    const response = await api.get('/comments', { params })
    return response.data
  },

  // Create new comment
  createComment: async (commentData) => {
    const response = await api.post('/comments', commentData)
    return response.data
  },

  // Get comment by ID
  getComment: async (commentId) => {
    const response = await api.get(`/comments/${commentId}`)
    return response.data
  },

  // Update comment
  updateComment: async (commentId, commentData) => {
    const response = await api.put(`/comments/${commentId}`, commentData)
    return response.data
  },

  // Delete comment
  deleteComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}`)
    return response.data
  },
}

// Connections API endpoints (placeholder)
export const connectionAPI = {
  // Get user's connections
  getConnections: async (params = {}) => {
    const response = await api.get('/connections', { params })
    return response.data
  },

  // Send connection request
  sendConnectionRequest: async (connectionData) => {
    const response = await api.post('/connections', connectionData)
    return response.data
  },

  // Get connection by ID
  getConnection: async (connectionId) => {
    const response = await api.get(`/connections/${connectionId}`)
    return response.data
  },

  // Update connection status
  updateConnection: async (connectionId, connectionData) => {
    const response = await api.put(`/connections/${connectionId}`, connectionData)
    return response.data
  },

  // Delete connection
  deleteConnection: async (connectionId) => {
    const response = await api.delete(`/connections/${connectionId}`)
    return response.data
  },
}

// Events API endpoints (placeholder)
export const eventAPI = {
  // Get events
  getEvents: async (params = {}) => {
    const response = await api.get('/events', { params })
    return response.data
  },

  // Create new event
  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData)
    return response.data
  },

  // Get event by ID
  getEvent: async (eventId) => {
    const response = await api.get(`/events/${eventId}`)
    return response.data
  },

  // Update event
  updateEvent: async (eventId, eventData) => {
    const response = await api.put(`/events/${eventId}`, eventData)
    return response.data
  },

  // Delete event
  deleteEvent: async (eventId) => {
    const response = await api.delete(`/events/${eventId}`)
    return response.data
  },

  // Join event
  joinEvent: async (eventId) => {
    const response = await api.post(`/events/${eventId}/join`)
    return response.data
  },

  // Leave event
  leaveEvent: async (eventId) => {
    const response = await api.delete(`/events/${eventId}/join`)
    return response.data
  },
}

export default api