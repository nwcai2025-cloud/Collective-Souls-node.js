import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useSocket } from './SocketContext'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Helper to get API URL
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  const hostname = window.location.hostname
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3004`
  }
  return 'http://localhost:3004'
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { socket, isConnected } = useSocket()
  const { user } = useAuth()

  const fetchNotifications = useCallback(async (page = 1) => {
    if (!user) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      
      const response = await fetch(`${apiUrl}/api/notifications?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNotifications(data.data)
          setUnreadCount(data.pagination.unreadCount)
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      
      const response = await fetch(`${apiUrl}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      
      const response = await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      
      const response = await fetch(`${apiUrl}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const deletedNotification = notifications.find(n => n.id === notificationId)
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [notifications])

  const clearAllNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const apiUrl = getApiUrl()
      
      const response = await fetch(`${apiUrl}/api/notifications/clear-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error)
    }
  }, [])

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user, fetchNotifications])

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !isConnected || !user) return

    const handleNotification = (notification) => {
      console.log('🔔 Received notification:', notification)
      setNotifications(prev => [notification, ...prev])
      if (!notification.is_read) {
        setUnreadCount(prev => prev + 1)
      }
    }

    const handleNotificationCount = (data) => {
      console.log('🔔 Notification count update:', data.count)
      setUnreadCount(data.count)
    }

    const handleNotificationsCleared = () => {
      console.log('🔔 Notifications cleared on another device')
      setNotifications([])
      setUnreadCount(0)
    }

    socket.on('notification', handleNotification)
    socket.on('notification_count', handleNotificationCount)
    socket.on('notifications_cleared', handleNotificationsCleared)

    return () => {
      socket.off('notification', handleNotification)
      socket.off('notification_count', handleNotificationCount)
      socket.off('notifications_cleared', handleNotificationsCleared)
    }
  }, [socket, isConnected, user])

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}