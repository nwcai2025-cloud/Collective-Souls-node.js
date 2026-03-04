import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { token, user } = useAuth()

  const connectSocket = () => {
    if (socket?.connected) {
      console.log('Socket already connected, skipping...')
      return
    }

    console.log('Connecting to socket server...')
    // For Socket.IO, we need to use the HTTPS port (3005) for WebRTC
    const socketUrl = (import.meta.env.VITE_API_URL || 'http://192.168.4.24:3004').replace(':3004', ':3005').replace('http://', 'https://')
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      secure: true,
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
      setIsConnected(true)
      if (token) {
        newSocket.emit('authenticate', token)
      }
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      if (token) {
        newSocket.emit('authenticate', token)
      }
    })

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error)
    })

    newSocket.on('authenticated', (data) => {
      if (data.success) {
        console.log('Socket authenticated:', data.user.username)
      } else {
        console.error('Socket authentication failed:', data.message)
      }
    })

    newSocket.on('user_status_changed', (data) => {
      console.log('User status changed:', data)
    })

    newSocket.on('new_message', (message) => {
      console.log('New message received:', message)
    })

    newSocket.on('typing', (data) => {
      console.log('User typing:', data)
    })

    setSocket(newSocket)
  }

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }

  const sendMessage = (conversationId, content, messageType = 'text') => {
    if (socket && socket.connected) {
      socket.emit('send_message', {
        conversationId,
        content,
        messageType
      })
    }
  }

  const joinRoom = (roomId) => {
    if (socket && socket.connected) {
      socket.emit('join_room', roomId)
    }
  }

  const leaveRoom = (roomId) => {
    if (socket && socket.connected) {
      socket.emit('leave_room', roomId)
    }
  }

  const startTyping = (conversationId) => {
    if (socket && socket.connected) {
      socket.emit('typing', { conversationId, isTyping: true })
    }
  }

  const stopTyping = (conversationId) => {
    if (socket && socket.connected) {
      socket.emit('typing', { conversationId, isTyping: false })
    }
  }

  // Reconnect when token changes
  useEffect(() => {
    if (token && user) {
      connectSocket()
    } else if (socket) {
      disconnectSocket()
    }
  }, [token, user])

  const value = {
    socket,
    isConnected,
    connect: connectSocket,
    disconnect: disconnectSocket,
    connectSocket,
    disconnectSocket,
    sendMessage,
    joinRoom,
    leaveRoom,
    startTyping,
    stopTyping
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}