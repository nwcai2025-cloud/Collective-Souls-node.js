import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = () => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Use the same logic as authService to detect API URL
    const getSocketUrl = () => {
      if (import.meta.env.VITE_API_URL) {
        // For Socket.IO, we need to use the HTTPS port (3005) for WebRTC
        return import.meta.env.VITE_API_URL.replace(':3004', ':3005').replace('http://', 'https://')
      }
      const hostname = window.location.hostname
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `https://${hostname}:3005`
      }
      return 'http://localhost:3004'
    }

    const socketUrl = getSocketUrl()
    console.log('Connecting to socket at:', socketUrl)

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      secure: true,
      auth: {
        token
      }
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Socket connected')
      newSocket.emit('authenticate', token)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Socket disconnected')
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
    })

    setSocket(newSocket)
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [socket])

  const value = {
    socket,
    isConnected,
    connect,
    disconnect,
    connectSocket: connect,
    disconnectSocket: disconnect
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}