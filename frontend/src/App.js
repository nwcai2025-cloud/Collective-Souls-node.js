import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { io } from 'socket.io-client';

// Import components
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Journal from './pages/Journal';
import ActivityLogger from './components/ActivityLogger';
import VideoRecorder from './components/VideoRecorder';
import VideoTestPage from './components/VideoTestPage';
import VideoCallPage from './components/VideoCallPage';

// Import admin components
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// Import services
import { authService } from './services/authService';
import { socketService } from './services/socketService';

// Import utilities
import { useAuth } from './hooks/useAuth';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mindful-purple"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Admin Protected Route Component
const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mindful-purple"></div>
      </div>
    );
  }

  return user && user.is_admin ? children : <Navigate to="/login" />;
};

function App() {
  const { user, loading } = useAuth();
  const [socket, setSocket] = useState(null);

  console.log('App component rendered', { user, loading });

  useEffect(() => {
    // Initialize socket connection when user is authenticated
    if (user && !socket) {
      const newSocket = socketService.connect(user);
      setSocket(newSocket);

      // Handle socket events
      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      return () => {
        newSocket.disconnect();
      };
    } else if (!user && socket) {
      // Disconnect socket when user logs out
      socket.disconnect();
      setSocket(null);
    }
  }, [user, socket]);

  if (loading) {
    console.log('App is loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mindful-purple mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('App rendering routes', { user });

  return (
    <Router>
      <div className="App">
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
        
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/test" element={<AdminTest />} />
          <Route path="/admin/dashboard" element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={user ? <Dashboard socket={socket} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/chat" element={user ? <Chat socket={socket} /> : <Navigate to="/login" />} />
          <Route path="/journal" element={user ? <Journal /> : <Navigate to="/login" />} />
          
          {/* Video routes */}
          <Route path="/test-video" element={user ? <VideoTestPage /> : <Navigate to="/login" />} />
          <Route path="/video-call/:roomId" element={user ? <VideoCallPage /> : <Navigate to="/login" />} />
          
          {/* Components that can be used anywhere */}
          <Route path="/activity-logger" element={user ? <ActivityLogger /> : <Navigate to="/login" />} />
          <Route path="/video-recorder" element={user ? <VideoRecorder /> : <Navigate to="/login" />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          
          {/* 404 route */}
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;