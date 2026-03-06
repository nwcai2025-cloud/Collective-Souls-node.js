import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const adminAPI = {
  // Dashboard stats
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  // User management
  getUsers: (params) => 
    api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  suspendUser: (id) => api.delete(`/admin/users/${id}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}/permanent`),
  promoteUser: (id, roleId) => api.post(`/admin/users/${id}/promote`, { roleId }),
  
  // Content moderation
  getComments: (params) => 
    api.get('/admin/content/comments', { params }),
  moderateComment: (id, data) => 
    api.put(`/admin/content/comments/${id}`, data),
  deleteComment: (id) => api.delete(`/admin/content/comments/${id}`),
  
  getActivities: (params) => 
    api.get('/admin/content/activities', { params }),
  moderateActivity: (id, data) => 
    api.put(`/admin/content/activities/${id}`, data),

  getEvents: (params) =>
    api.get('/admin/content/events', { params }),
  deleteEvent: (id) => api.delete(`/admin/content/events/${id}`),

  getAdminDMs: (params) =>
    api.get('/admin/content/dms', { params }),
  deleteAdminDM: (id) => api.delete(`/admin/content/dms/${id}`),

  getChatMessages: (params) =>
    api.get('/admin/content/chat-messages', { params }),
  moderateChatMessage: (id, data) =>
    api.put(`/admin/content/chat-messages/${id}`, data),
  deleteChatMessage: (id) => api.delete(`/admin/content/chat-messages/${id}`),
  
  // Content reports
  getReports: (params) => 
    api.get('/admin/reports', { params }),
  getReport: (id) => api.get(`/admin/reports/${id}`),
  reviewReport: (id, data) => 
    api.put(`/admin/reports/${id}`, data),
  
  // Analytics
  getUserAnalytics: () => api.get('/admin/analytics/users'),
  getContentAnalytics: () => api.get('/admin/analytics/content'),
  getPlatformAnalytics: () => api.get('/admin/analytics/platform'),
  
  // Admin notifications
  getNotifications: () => api.get('/admin/notifications'),
  markNotificationAsRead: (id) => api.put(`/admin/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.put('/admin/notifications/read-all'),
  
  // System logs
  getAuditLogs: (params) => 
    api.get('/admin/logs/audit', { params }),
  getSystemLogs: () => api.get('/admin/logs/system'),

  // Video Room Management
  getVideoRooms: (params) => 
    api.get('/admin/videos', { params }),
  getVideoRoom: (id) => api.get(`/admin/videos/${id}`),
  updateVideoRoom: (id, data) => api.put(`/admin/videos/${id}`, data),
  moderateVideoRoom: (id, action, reason) => 
    api.patch(`/admin/videos/${id}/moderate`, { action, reason }),
  deleteVideoRoom: (id) => api.delete(`/admin/videos/${id}`),
  getVideoAnalytics: () => api.get('/admin/videos/analytics'),
}