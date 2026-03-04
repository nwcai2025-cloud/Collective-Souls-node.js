import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL + '/api' || 'http://localhost:3004/api'

const api = axios.create({
  baseURL: API_BASE_URL,
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
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => 
    api.get('/admin/users', { params }),
  getUser: (id: number) => api.get(`/admin/users/${id}`),
  updateUser: (id: number, userData: any) => api.put(`/admin/users/${id}`, userData),
  suspendUser: (id: number) => api.delete(`/admin/users/${id}`),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}/permanent`),
  promoteUser: (id: number, roleId: number) => api.post(`/admin/users/${id}/promote`, { roleId }),
  
  // Content moderation
  getComments: (params?: { page?: number; limit?: number; status?: string }) => 
    api.get('/admin/content/comments', { params }),
  moderateComment: (id: number, data: { status?: string; reason?: string; content?: string }) => 
    api.put(`/admin/content/comments/${id}`, data),
  deleteComment: (id: number) => api.delete(`/admin/content/comments/${id}`),
  
  getActivities: (params?: { page?: number; limit?: number; status?: string }) => 
    api.get('/admin/content/activities', { params }),
  moderateActivity: (id: number, data: { status?: string; reason?: string; description?: string }) => 
    api.put(`/admin/content/activities/${id}`, data),

  getEvents: (params?: { page?: number; limit?: number; type?: string }) =>
    api.get('/admin/content/events', { params }),
  deleteEvent: (id: number) => api.delete(`/admin/content/events/${id}`),

  getAdminDMs: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/content/dms', { params }),
  deleteAdminDM: (id: number) => api.delete(`/admin/content/dms/${id}`),

  getChatMessages: (params?: { page?: number; limit?: number; status?: string; type?: string }) =>
    api.get('/admin/content/chat-messages', { params }),
  moderateChatMessage: (id: number, data: { status?: string; moderation_reason?: string; content?: string }) =>
    api.put(`/admin/content/chat-messages/${id}`, data),
  deleteChatMessage: (id: number) => api.delete(`/admin/content/chat-messages/${id}`),
  
  // Content reports
  getReports: (params?: { page?: number; limit?: number; status?: string }) => 
    api.get('/admin/reports', { params }),
  getReport: (id: number) => api.get(`/admin/reports/${id}`),
  reviewReport: (id: number, data: { status: string; resolution_notes?: string }) => 
    api.put(`/admin/reports/${id}`, data),
  
  // Analytics
  getUserAnalytics: () => api.get('/admin/analytics/users'),
  getContentAnalytics: () => api.get('/admin/analytics/content'),
  getPlatformAnalytics: () => api.get('/admin/analytics/platform'),
  
  // Admin notifications
  getNotifications: () => api.get('/admin/notifications'),
  markNotificationAsRead: (id: number) => api.put(`/admin/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.put('/admin/notifications/read-all'),
  
  // System logs
  getAuditLogs: (params?: { page?: number; limit?: number; action?: string; resourceType?: string }) => 
    api.get('/admin/logs/audit', { params }),
  getSystemLogs: () => api.get('/admin/logs/system'),

  // Video Room Management
  getVideoRooms: (params?: { page?: number; limit?: number; search?: string; status?: string; privacy?: string }) => 
    api.get('/admin/videos', { params }),
  getVideoRoom: (id: number) => api.get(`/admin/videos/${id}`),
  updateVideoRoom: (id: number, data: any) => api.put(`/admin/videos/${id}`, data),
  moderateVideoRoom: (id: number, action: string, reason?: string) => 
    api.patch(`/admin/videos/${id}/moderate`, { action, reason }),
  deleteVideoRoom: (id: number) => api.delete(`/admin/videos/${id}`),
  getVideoAnalytics: () => api.get('/admin/videos/analytics'),
}
