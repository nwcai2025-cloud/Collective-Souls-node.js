import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider, useSocket } from './context/SocketContext'
import { NotificationProvider } from './context/NotificationContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Connections from './pages/Connections'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import Events from './pages/Events'
import Journal from './pages/Journal'
import CommunityGuidelines from './pages/CommunityGuidelines'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminTest from './pages/AdminTest'
import AdminVideos from './pages/AdminVideos'
import VideoLobby from './pages/VideoLobby'
import VideoCallPage from './components/VideoCallPage'


// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mindful-purple"></div>
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" />
}

// Admin Protected Route Component
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mindful-purple"></div>
      </div>
    )
  }

  // Allow direct access for users with admin privileges
  if (user && (user.is_staff || user.is_superuser)) {
    return <>{children}</>
  }

  // For non-admin users, redirect to admin login
  return <Navigate to="/admin" />
}

function AppContent() {
  const { user } = useAuth()
  const { socket, connect, disconnect } = useSocket()
  const [isDarkTheme, setIsDarkTheme] = useState(false)

  useEffect(() => {
    if (user) {
      connect()
    } else {
      disconnect()
    }
  }, [user])

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkTheme(true)
      document.body.classList.add('dark-theme')
    }

    // Global refresh system - poll for updates every 30 seconds
    const refreshInterval = setInterval(() => {
      if (user && socket) {
        console.log('Global refresh: polling for updates...')
        socket.emit('request_stats_update')
      }
    }, 30000)

    return () => clearInterval(refreshInterval)
  }, [user, socket])

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme)
    if (!isDarkTheme) {
      document.body.classList.add('dark-theme')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark-theme')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/test" element={<AdminTest />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/connections" element={
          <ProtectedRoute>
            <Layout>
              <Connections />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile/:username" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/chat" element={
          <ProtectedRoute>
            <Layout>
              <Chat />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/events" element={
          <ProtectedRoute>
            <Layout>
              <Events />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/journal" element={
          <ProtectedRoute>
            <Layout>
              <Journal />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/guidelines" element={
          <Layout>
            <CommunityGuidelines />
          </Layout>
        } />
        
        <Route path="/admin/dashboard" element={
          <AdminProtectedRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <AdminProtectedRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <AdminProtectedRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/moderation" element={
          <AdminProtectedRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <AdminProtectedRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/logs" element={
          <AdminProtectedRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </AdminProtectedRoute>
        } />
        <Route path="/admin/videos" element={
          <AdminProtectedRoute>
            <Layout>
              <AdminVideos />
            </Layout>
          </AdminProtectedRoute>
        } />
        
        <Route path="/video-lobby" element={
          <ProtectedRoute>
            <Layout>
              <VideoLobby />
            </Layout>
          </ProtectedRoute>
        } />
        
        
        <Route path="/video-call/:roomId" element={
          <ProtectedRoute>
            <Layout>
              <VideoCallPage />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}

export default App