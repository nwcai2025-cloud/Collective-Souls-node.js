import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/authService'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Enhanced token retrieval for mobile
  useEffect(() => {
    const getStoredToken = () => {
      try {
        let token = localStorage.getItem('token')
        if (!token) token = sessionStorage.getItem('token')
        if (!token) {
          // Check cookies
          const value = `; ${document.cookie}`
          const parts = value.split(`; token=`)
          if (parts.length === 2) token = parts.pop().split(';').shift()
        }
        return token
      } catch (e) {
        console.warn('Token retrieval error:', e)
        return null
      }
    }

    const checkAuth = async () => {
      const storedToken = getStoredToken()
      if (storedToken) {
        setToken(storedToken)
        try {
          const response = await authAPI.getProfile()
          setUser(response.data.user)
        } catch (error) {
          console.error('Auth check failed:', error)
          logout()
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username, password) => {
    try {
      setLoading(true)
      const response = await authAPI.login({ username, password })
      console.log('Login response:', response);
      
      // Handle the response structure properly
      // Backend returns: { success: true, message: '...', data: { user: {...}, token: '...' } }
      if (!response.success) {
        throw new Error(response.message || 'Login failed')
      }

      const userData = response.data?.user
      const newToken = response.data?.token

      if (!userData || !newToken) {
        throw new Error('Invalid response format from server')
      }

      setUser(userData)
      setToken(newToken)
      // Token is already stored in authAPI.login()

      return { success: true, user: userData }
    } catch (error) {
      console.error('Login error:', error)
      let errorMessage = 'Login failed'
      
      // If backend returned an error message, use it
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.isNetworkError) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }

  const adminLogin = async (username, password) => {
    try {
      setLoading(true)
      const response = await authAPI.adminLogin({ username, password })
      
      // Handle the response structure properly
      // Backend returns: { success: true, message: '...', data: { user: {...}, token: '...' } }
      const userData = response.data?.data?.user
      const newToken = response.data?.data?.token

      if (!userData || !newToken) {
        throw new Error('Invalid response format from server')
      }

      setUser(userData)
      setToken(newToken)
      // Token is already stored in authAPI.adminLogin()

      return { success: true, user: userData }
    } catch (error) {
      console.error('Admin login error:', error)
      let errorMessage = 'Admin login failed'
      
      if (error.isNetworkError) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = () => {
    return user && (user.is_staff || user.is_superuser)
  }

  const isSuperAdmin = () => {
    return user && user.is_superuser
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await authAPI.register(userData)
      const { user: newUser, token: newToken } = response.data

      setUser(newUser)
      setToken(newToken)
      // Token is already stored in authAPI.login()

      return { success: true, user: newUser }
    } catch (error) {
      console.error('Registration error:', error)
      let errorMessage = 'Registration failed'
      
      if (error.isNetworkError) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return {
        success: false,
        message: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    try {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    } catch (e) {
      console.warn('Logout cleanup error:', e)
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      console.log('Backend response:', response.data) // Debug log
      console.log('Profile image in response:', response.data.user?.profile_image) // Debug profile image
      setUser(response.data.user)
      return { success: true, user: response.data.user }
    } catch (error) {
      console.error('Profile update error:', error)
      let errorMessage = 'Update failed'

      if (error.isNetworkError) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      return {
        success: false,
        message: errorMessage
      }
    }
  }

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData)
      return { success: true, message: 'Password changed successfully' }
    } catch (error) {
      console.error('Password change error:', error)
      let errorMessage = 'Password change failed'
      
      if (error.isNetworkError) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return { 
        success: false, 
        message: errorMessage
      }
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    adminLogin,
    isAdmin,
    isSuperAdmin,
    register,
    logout,
    updateProfile,
    changePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Export the useAuth hook separately to avoid HMR issues
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
