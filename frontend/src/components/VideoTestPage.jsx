import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const VideoTestPage = () => {
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [protocolStatus, setProtocolStatus] = useState('Checking...');
  const [cameraStatus, setCameraStatus] = useState('Checking...');
  const [micStatus, setMicStatus] = useState('Checking...');
  const [mobileUrl, setMobileUrl] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();

  useEffect(() => {
    checkConnection();
    
    // Check for auto-start parameters from chat
    const params = new URLSearchParams(location.search);
    const roomId = params.get('roomId');
    const roomName = params.get('roomName');
    const userId = params.get('userId');
    const userName = params.get('userName');
    const type = params.get('type');
    
    console.log('VideoTestPage - Auto-start check:', {
      roomId,
      roomName,
      userId,
      userName,
      type,
      user,
      token,
      location: location.pathname + location.search
    });
    
    if (roomId && roomName && userId && userName && type) {
      console.log('VideoTestPage - Found auto-start parameters, checking authentication...');
      
      // Check if user is authenticated before auto-starting video call
      if (!user) {
        console.log('VideoTestPage - User not authenticated, showing login prompt');
        // User not authenticated - show login prompt
        const shouldLogin = window.confirm('You need to be logged in to start a video call. Would you like to login now?');
        if (shouldLogin) {
          console.log('VideoTestPage - User chose to login, navigating to login page');
          navigate('/login', { state: { from: location.pathname + location.search } });
        }
        return;
      }
      
      console.log('VideoTestPage - User authenticated, starting video call');
      // User is authenticated - auto-start video or phone call
      const fullRoomId = type === 'video' ? `video-${roomId}` : `phone-${roomId}`;
      navigate(`/video-call/${fullRoomId}?userId=${userId}&userName=${encodeURIComponent(userName)}&roomName=${encodeURIComponent(roomName)}&type=${type}`);
    }
  }, [location.search, navigate, user, token]);

  const checkConnection = () => {
    // Update URL for current IP
    const currentUrl = window.location.origin;
    const httpsUrl = currentUrl.replace('http://', 'https://');
    setMobileUrl(httpsUrl);

    // Check connection status
    if (navigator.onLine) {
      setConnectionStatus('✅ Online');
    } else {
      setConnectionStatus('❌ Offline');
    }

    // Check protocol
    if (window.location.protocol === 'https:') {
      setProtocolStatus('✅ HTTPS');
    } else {
      setProtocolStatus('⚠️ HTTP (WebRTC may not work)');
    }
  };

  const testHTTPS = async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      if (response.ok) {
        alert('✅ HTTPS connection successful!\n\nServer is responding properly.');
      } else {
        alert('❌ HTTPS connection failed.\n\nStatus: ' + response.status);
      }
    } catch (error) {
      alert('❌ HTTPS connection error:\n\n' + error.message);
    }
  };

  const testWebRTC = async () => {
    try {
      // Test camera access
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStatus('✅ Available');
      cameraStream.getTracks().forEach(track => track.stop());

      // Test microphone access
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus('✅ Available');
      micStream.getTracks().forEach(track => track.stop());

      // Test WebRTC peer connection
      const pc = new RTCPeerConnection();
      const offer = await pc.createOffer();
      
      alert('✅ WebRTC test successful!\n\n- Camera: Available\n- Microphone: Available\n- WebRTC: Working');
      
    } catch (error) {
      setCameraStatus('❌ Error');
      setMicStatus('❌ Error');
      alert('❌ WebRTC test failed:\n\n' + error.message);
    }
  };

  const openVideoCall = () => {
    // Generate random room ID
    const roomId = Math.random().toString(36).substr(2, 8);
    const userId = 'test-user-' + Math.floor(Math.random() * 1000);
    const userName = 'Test User';
    
    // Navigate to video call page
    navigate(`/video-call/${roomId}?userId=${userId}&userName=${encodeURIComponent(userName)}`);
  };

  const startGroupCall = () => {
    // Generate random group room ID
    const roomId = 'group-' + Math.random().toString(36).substr(2, 8);
    const userId = 'test-user-' + Math.floor(Math.random() * 1000);
    const userName = 'Test User';
    
    // Navigate to video call page
    navigate(`/video-call/${roomId}?userId=${userId}&userName=${encodeURIComponent(userName)}&group=true`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mindful-purple via-serene-blue to-calm-green">
      {/* Spiritual Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>
        <div className="relative container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <h1 className="text-2xl font-bold text-white">
                🌟 Collective Souls Video Test
              </h1>
              <span className="text-yellow-300 font-medium">
                Test Page
              </span>
            </div>
            <div className="flex items-center space-x-2 text-white">
              <div className={`w-2 h-2 rounded-full ${connectionStatus.includes('Online') ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{connectionStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Status Cards */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-white font-semibold text-lg mb-4">System Status</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="text-sm text-gray-300 mb-1">Connection</div>
                  <div className="text-lg font-bold">{connectionStatus}</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="text-sm text-gray-300 mb-1">Protocol</div>
                  <div className="text-lg font-bold">{protocolStatus}</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="text-sm text-gray-300 mb-1">Camera</div>
                  <div className="text-lg font-bold">{cameraStatus}</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="text-sm text-gray-300 mb-1">Microphone</div>
                  <div className="text-lg font-bold">{micStatus}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile URL */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-white font-semibold text-lg mb-4">Mobile Testing</h2>
              <div className="bg-black bg-opacity-50 p-4 rounded-lg font-mono text-sm">
                <strong>Mobile Test URL:</strong><br />
                <span className="text-yellow-300">{mobileUrl}</span>
              </div>
              <div className="mt-4 text-sm text-gray-300">
                1. Open this URL on your phone browser<br />
                2. Accept any certificate warnings<br />
                3. Test WebRTC functionality<br />
                4. Use video call buttons below
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Video Call Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={testHTTPS}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105"
              >
                🔒 Test HTTPS Connection
              </button>
              <button 
                onClick={testWebRTC}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full font-semibold hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-105"
              >
                🎥 Test WebRTC
              </button>
              <button 
                onClick={openVideoCall}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-full font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105"
              >
                🌟 Start 1-on-1 Call
              </button>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={startGroupCall}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
              >
                👥 Start Group Call (3-5 Users)
              </button>
              <a 
                href="/api/video/rooms"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-full font-semibold hover:from-gray-600 hover:to-gray-700 transition-all transform hover:scale-105 text-center"
              >
                📋 View Video Rooms
              </a>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-white font-semibold text-lg mb-4">✨ Available Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <h3 className="text-yellow-300 font-semibold mb-2">1-on-1 Video Calls</h3>
                <p className="text-sm text-gray-300">Private conversations with spiritual theme design and mobile optimization</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <h3 className="text-yellow-300 font-semibold mb-2">Group Video Calls</h3>
                <p className="text-sm text-gray-300">Small group discussions for spiritual circles (3-5 users)</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <h3 className="text-yellow-300 font-semibold mb-2">Mobile Optimized</h3>
                <p className="text-sm text-gray-300">Touch-friendly controls and responsive design for all devices</p>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <h3 className="text-yellow-300 font-semibold mb-2">Spiritual Design</h3>
                <p className="text-sm text-gray-300">Gradient backgrounds and glassmorphism effects matching your theme</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoTestPage;