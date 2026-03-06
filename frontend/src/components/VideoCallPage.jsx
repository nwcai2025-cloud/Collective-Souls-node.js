import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoCallRoom from './VideoCallRoom';
import { ArrowLeft, Video, Users, Wifi, WifiOff, Shield, AlertCircle } from 'lucide-react';

const VideoCallPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      setError('You must be logged in to join a video call');
      setIsLoading(false);
      return;
    }

    // Parse URL parameters
    const urlParams = new URLSearchParams(location.search);
    const userId = urlParams.get('userId') || user.id;
    const userName = urlParams.get('userName') || user.username;
    const isGroupCall = urlParams.get('group') === 'true';

    console.log('Video Call Parameters:', {
      roomId,
      userId,
      userName,
      isGroupCall,
      user
    });

    // Simulate connection status
    setTimeout(() => setIsConnected(true), 1000);

    setIsLoading(false);
  }, [user, roomId, location]);

  const handleLeaveCall = () => {
    navigate('/video-lobby');
  };

  const handleJoinCall = () => {
    // This will be handled by VideoCallRoom component
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing video call...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-violet-700 transition-all"
            >
              Login to Continue
            </button>
            <button 
              onClick={() => navigate('/video-lobby')}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all"
            >
              Back to Video Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.search);
  const userId = urlParams.get('userId') || user.id;
  const userName = urlParams.get('userName') || user.username;
  const isGroupCall = urlParams.get('group') === 'true';

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLeaveCall}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Lobby</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div className="flex items-center space-x-6">
                  <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <Video className="w-6 h-6" />
                    <span>Video Call Room</span>
                  </h1>
                  <div className="flex items-center space-x-6 text-purple-100 font-medium">
                    <span>Room: {roomId}</span>
                    {isGroupCall ? (
                      <span className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>Group Call</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1">
                        <Shield className="w-4 h-4" />
                        <span>1-on-1 Call</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-300" />
                ) : (
                  <WifiOff className="w-4 h-4 text-gray-300" />
                )}
                <span className={`text-sm font-medium text-purple-100`}>
                  {isConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>
              <div className="text-right text-purple-100">
                <div className="text-sm">User: {userName}</div>
                <div className="text-xs opacity-75">Room ID: {roomId}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Call Room */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <VideoCallRoom 
            roomId={roomId}
            userId={userId}
            userName={userName}
            token={token}
            onLeaveCall={handleLeaveCall}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Video className="w-5 h-5 text-purple-600" />
            <span>Video Call Tips</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Allow camera and microphone access when prompted</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Use headphones to avoid echo and improve audio quality</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Ensure good lighting for better video quality</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>For group calls, only 3-5 users can join per room</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;
