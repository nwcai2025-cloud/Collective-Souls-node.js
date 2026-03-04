import React, { useState, useEffect, useRef } from 'react';
import VideoControls from './VideoControls';
import VideoGrid from './VideoGrid';
import io from 'socket.io-client';

const VideoCallRoom = ({ roomId, userId, userName, token, onLeaveCall }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  
  const localVideoRef = useRef(null);
  const peerConnections = useRef(new Map());
  const socketRef = useRef(null);

  // Initialize WebRTC
  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Check if token is available
        if (!token) {
          throw new Error('Authentication token is required');
        }

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, frameRate: 30 },
          audio: true
        });

        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize Socket.IO connection with authentication
        const socket = io('https://192.168.4.24:3005', {
          transports: ['websocket'],
          secure: true,
          rejectUnauthorized: false, // Allow self-signed certificates for development
          auth: {
            token: token
          }
        });

        socketRef.current = socket;

        // Handle socket events first
        setupSocketEvents(socket);

        // Authenticate with the socket server
        socket.emit('authenticate', token);

        // Wait a moment for authentication to complete, then join video room
        setTimeout(() => {
          socket.emit('join-video-room', { roomId, userId, userName });
        }, 500);

        setIsConnecting(false);

      } catch (err) {
        console.error('WebRTC initialization error:', err);
        if (err.message === 'Authentication token is required') {
          setError('Authentication required. Please log in and try again.');
        } else if (err.name === 'NotAllowedError') {
          setError('Camera and microphone access denied. Please allow access in your browser settings.');
        } else {
          setError('Failed to access camera or microphone. Please check permissions.');
        }
        setIsConnecting(false);
      }
    };

    initializeWebRTC();

    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      peerConnections.current.forEach(pc => pc.close());
    };
  }, [roomId, userId, userName, token]);

  const setupSocketEvents = (socket) => {
    // Handle room joined
    socket.on('room-joined', (data) => {
      console.log('Joined room:', data);
      setParticipants(data.participants || []);
      setIsConnecting(false);
    });

    // Handle new participant
    socket.on('participant-joined', (data) => {
      console.log('Participant joined:', data);
      setParticipants(prev => [...prev, data.participant]);
      createPeerConnection(data.participant.userId, true);
    });

    // Handle participant left
    socket.on('participant-left', (data) => {
      console.log('Participant left:', data);
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      const pc = peerConnections.current.get(data.userId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.userId);
      }
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
    });

    // Handle WebRTC signaling
    socket.on('webrtc-signal', (data) => {
      handleWebRTCSignal(data);
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (error.message && error.message.includes('certificate')) {
        setError('Certificate verification failed. Please check your browser settings.');
      } else if (error.message && error.message.includes('timeout')) {
        setError('Connection timeout. Please check your internet connection.');
      } else {
        setError('Failed to connect to video call. Please check your internet connection.');
      }
      setIsConnecting(false);
    });

    socket.on('error', (data) => {
      console.error('Video call error:', data);
      if (data && data.message) {
        setError(data.message);
      } else {
        setError('An error occurred in the video call');
      }
    });
  };

  const createPeerConnection = async (remoteUserId, isInitiator) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      peerConnections.current.set(remoteUserId, pc);

      // Add local stream
      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Remote stream received:', event.streams[0]);
        setRemoteStreams(prev => new Map(prev.set(remoteUserId, event.streams[0])));
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('webrtc-signal', {
            targetUserId: remoteUserId,
            signal: { type: 'ice-candidate', candidate: event.candidate }
          });
        }
      };

      if (isInitiator) {
        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        if (socketRef.current) {
          socketRef.current.emit('webrtc-signal', {
            targetUserId: remoteUserId,
            signal: { type: 'offer', sdp: offer }
          });
        }
      }

    } catch (err) {
      console.error('Peer connection error:', err);
      setError('Failed to connect to participant');
    }
  };

  const handleWebRTCSignal = async (data) => {
    const { fromUserId, signal } = data;
    const pc = peerConnections.current.get(fromUserId);

    if (!pc) {
      // Create peer connection if doesn't exist
      await createPeerConnection(fromUserId, false);
      return;
    }

    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        if (socketRef.current) {
          socketRef.current.emit('webrtc-signal', {
            targetUserId: fromUserId,
            signal: { type: 'answer', sdp: answer }
          });
        }
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } else if (signal.type === 'ice-candidate') {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      }
    } catch (err) {
      console.error('WebRTC signal handling error:', err);
    }
  };

  const toggleVideo = async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const leaveCall = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-video-room', { roomId, userId });
      socketRef.current.disconnect();
    }
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    
    onLeaveCall();
  };

  return (
    <div className="video-call-room min-h-screen bg-gradient-to-br from-mindful-purple via-serene-blue to-calm-green">
      {/* Spiritual Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>
        <div className="relative container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
              <h1 className="text-2xl font-bold text-white">
                🌟 Collective Souls Video Call
              </h1>
              <span className="text-yellow-300 font-medium">
                Room: {roomId}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-white">
              <div className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
              <span>{isConnecting ? 'Connecting...' : 'Connected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Local Video */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-white font-semibold mb-2">You</h3>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-gray-300">
                  {participants.length + 1} participants
                </span>
                <div className="flex space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    isVideoEnabled ? 'bg-green-500' : 'bg-gray-500'
                  }`}>
                    📹 {isVideoEnabled ? 'ON' : 'OFF'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    isAudioEnabled ? 'bg-green-500' : 'bg-gray-500'
                  }`}>
                    🎤 {isAudioEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Remote Videos */}
          <div className="lg:col-span-3">
            <VideoGrid 
              remoteStreams={remoteStreams}
              participants={participants}
            />
          </div>
        </div>

        {/* Video Controls */}
        <div className="mt-6">
          <VideoControls
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            onToggleVideo={toggleVideo}
            onToggleAudio={toggleAudio}
            onLeaveCall={leaveCall}
          />
        </div>

        {/* Mobile Controls - Touch-optimized floating controls */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full min-w-[60px] min-h-[60px] ${
                isVideoEnabled 
                  ? 'bg-green-500 bg-opacity-20 border border-green-400' 
                  : 'bg-red-500 bg-opacity-20 border border-red-400'
              } touch-manipulation`}
              style={{
                boxShadow: isVideoEnabled 
                  ? '0 0 15px rgba(34, 197, 94, 0.3)' 
                  : '0 0 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              <span className="text-2xl">{isVideoEnabled ? '📹' : '📷'}</span>
            </button>
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full min-w-[60px] min-h-[60px] ${
                isAudioEnabled 
                  ? 'bg-blue-500 bg-opacity-20 border border-blue-400' 
                  : 'bg-red-500 bg-opacity-20 border border-red-400'
              } touch-manipulation`}
              style={{
                boxShadow: isAudioEnabled 
                  ? '0 0 15px rgba(59, 130, 246, 0.3)' 
                  : '0 0 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              <span className="text-2xl">{isAudioEnabled ? '🎤' : '🔇'}</span>
            </button>
            <button
              onClick={leaveCall}
              className="p-4 rounded-full bg-red-500 bg-opacity-20 border border-red-400 min-w-[60px] min-h-[60px] touch-manipulation"
              style={{
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              <span className="text-2xl">📞</span>
            </button>
          </div>
        </div>

        {/* Participants List */}
        <div className="mt-6">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">Participants</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-400 bg-opacity-20 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-yellow-300 text-lg">👤</span>
                </div>
                <p className="text-xs text-gray-300 truncate">{userName}</p>
                <span className="text-xs text-green-400">You</span>
              </div>
              {participants.map(participant => (
                <div key={participant.userId} className="text-center">
                  <div className="w-12 h-12 bg-blue-400 bg-opacity-20 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-blue-300 text-lg">👤</span>
                  </div>
                  <p className="text-xs text-gray-300 truncate">{participant.userName}</p>
                  <span className="text-xs text-green-400">Connected</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallRoom;