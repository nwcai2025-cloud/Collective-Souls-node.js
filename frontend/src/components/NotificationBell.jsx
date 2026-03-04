import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Users, 
  MessageCircle, 
  AtSign, 
  Calendar,
  Heart,
  MessageSquare,
  Megaphone,
  Sparkles
} from 'lucide-react'

// Get icon based on notification type
const getNotificationIcon = (type) => {
  switch (type) {
    case 'connection_request':
    case 'connection_accepted':
      return Users
    case 'new_message':
      return MessageCircle
    case 'mention':
      return AtSign
    case 'event_reminder':
    case 'event_created':
      return Calendar
    case 'like':
      return Heart
    case 'comment':
      return MessageSquare
    case 'system_announcement':
      return Megaphone
    default:
      return Sparkles
  }
}

// Format relative time
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    // Handle both mouse and touch events for mobile
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Handle notification click - navigate based on type
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    // Navigate based on type
    const { type, data } = notification
    
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        navigate('/dashboard')
        break
      case 'new_message':
        if (data?.dm_id) {
          navigate(`/chat?dm=${data.dm_id}`)
        } else {
          navigate('/chat')
        }
        break
      case 'event_reminder':
      case 'event_created':
        navigate('/events')
        break
      default:
        // Stay on current page
        break
    }

    setIsOpen(false)
  }

  // Handle mark as read with event propagation (works for both click and touch)
  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation()
    e.preventDefault()
    await markAsRead(notificationId)
  }

  // Handle delete with event propagation (works for both click and touch)
  const handleDelete = async (e, notificationId) => {
    e.stopPropagation()
    e.preventDefault()
    await deleteNotification(notificationId)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors text-white"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-purple-800 text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 text-white rounded-t-lg" style={{ backgroundColor: '#6B46C1' }}>
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs hover:underline flex items-center space-x-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  const isUnread = !notification.is_read
                  
                  return (
                    <li
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`relative px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                        isUnread ? 'bg-purple-50' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          isUnread ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          <Icon size={16} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelativeTime(notification.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {isUnread && (
                            <button
                              onClick={(e) => handleMarkAsRead(e, notification.id)}
                              onTouchEnd={(e) => handleMarkAsRead(e, notification.id)}
                              className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-500 hover:text-purple-600 touch-manipulation"
                              title="Mark as read"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            onTouchEnd={(e) => handleDelete(e, notification.id)}
                            className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded text-gray-500 hover:text-red-500 touch-manipulation"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {isUnread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600"></div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  clearAllNotifications()
                  setIsOpen(false)
                }}
                className="w-full text-center text-sm text-gray-600 hover:text-red-500 transition-colors"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell