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

// Add authentication to API calls
export const videoAPI = {
  async getRooms() {
    console.log('🔍 VideoAPI getRooms called')
    const response = await api.get('/video/rooms')
    console.log('📊 VideoAPI getRooms response:', response.data)
    return response.data
  },

  async createRoom(roomData) {
    console.log('🔍 VideoAPI createRoom called with:', roomData)
    const response = await api.post('/video/create-room', roomData)
    console.log('📊 VideoAPI createRoom response:', response.data)
    return response.data
  },

  async getRoom(roomId) {
    console.log('🔍 VideoAPI getRoom called for room:', roomId)
    const response = await api.get(`/video/room/${roomId}`)
    console.log('📊 VideoAPI getRoom response:', response.data)
    return response.data
  },

  async joinRoom(roomId) {
    console.log('🔍 VideoAPI joinRoom called for room:', roomId)
    const response = await api.post(`/video/join-room/${roomId}`)
    console.log('📊 VideoAPI joinRoom response:', response.data)
    return response.data
  },

  async leaveRoom(roomId) {
    console.log('🔍 VideoAPI leaveRoom called for room:', roomId)
    const response = await api.post(`/video/leave-room/${roomId}`)
    console.log('📊 VideoAPI leaveRoom response:', response.data)
    return response.data
  }
};

export default api;
