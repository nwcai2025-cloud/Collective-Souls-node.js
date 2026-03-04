import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authAPI } from '../services/authService'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  age: number
  bio: string
  spiritual_intention: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  last_login: string
  created_at: string
  updated_at: string
  meditation_streak: number
  community_contributions: number
  events_attended: number
  profile_image: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, first_name?: string, last_name?: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const response = await authAPI.getProfile()
        if (response.data && response.data.success) {
          setUser(response.data.data.user)
        } else {
          setUser(null)
        }
      }
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    const response = await authAPI.login({ username, password })
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token)
      setUser(response.data.data.user)
    } else {
      throw new Error(response.data.message || 'Login failed')
    }
  }

  const register = async (username: string, email: string, password: string, first_name?: string, last_name?: string) => {
    const response = await authAPI.register({ username, email, password, first_name, last_name })
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token)
      setUser(response.data.data.user)
    } else {
      throw new Error(response.data.message || 'Registration failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const updateUser = (userData: Partial<User>) => {
    setUser(prevUser => prevUser ? { ...prevUser, ...userData } : null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}