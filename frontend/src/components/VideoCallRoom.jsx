import React, { useState, useEffect, useRef, useCallback } from 'react';
import VideoControls from './VideoControls';
import VideoGrid from './VideoGrid';
import io from 'socket.io-client';
import '../styles/video-call.css';

const VideoCallRoom = ({ roomId, userId, userName, token, onLeaveCall }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isParticipantsVisible, setIsParticipantsVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const localVideoRef = useRef(null);
  const peerConnections = useRef(new Map());
  const socketRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          rejectUnauthorized: false,
          auth: {
            token: token
          }
        });

        socketRef.current = socket;

        // Handle socket events
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
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [roomId, userId, userName, token]);

  const setupSocketEvents = (socket) => {
    socket.on('room-joined', (data) => {
      console.log('Joined room:', data);
      setParticipants(data.participants || []);
      setIsConnecting(false);
    });

    socket.on('participant-joined', (data) => {
      console.log('Participant joined:', data);
      setParticipants(prev => [...prev, data.participant]);
      createPeerConnection(data.participant.userId, true);
    });

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

    socket.on('webrtc-signal', (data) => {
      handleWebRTCSignal(data);
    });

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

  // Mobile touch interactions
  const handleVideoTap = useCallback(() => {
    if (isMobile) {
      setIsControlsVisible(prev => !prev);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (!isControlsVisible) {
        controlsTimeoutRef.current = setTimeout(() => {
          setIsControlsVisible(false);
        }, 3000);
      }
    }
  }, [isMobile, isControlsVisible]);

  const handleSwipeLeft = useCallback(() => {
    if (!isMobile) return;
    const participantIds = participants.map(p => p.userId);
    if (participantIds.length > 0) {
      const currentIndex = participantIds.indexOf(activeSpeaker);
      const nextIndex = (currentIndex + 1) % participantIds.length;
      setActiveSpeaker(participantIds[nextIndex]);
    }
  }, [participants, activeSpeaker, isMobile]);

  const handleSwipeRight = useCallback(() => {
    if (!isMobile) return;
    const participantIds = participants.map(p => p.userId);
    if (participantIds.length > 0) {
      const currentIndex = participantIds.indexOf(activeSpeaker);
      const prevIndex = (currentIndex - 1 + participantIds.length) % participantIds.length;
      setActiveSpeaker(participantIds[prevIndex]);
    }
  }, [participants, activeSpeaker, isMobile]);

  return (
    <div 
      className={`video-call-room ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}
      style={{
        background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 50%, #22c55e 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        color: 'white'
      }}
    >
      {/* Connection Status Bar */}
      <div className="connection-status-bar">
        <div className="status-content">
          <div className="connection-indicator">
            <div className={`status-dot ${isConnecting ? 'connecting' : 'connected'}`}></div>
            <span>{isConnecting ? 'Connecting...' : 'Connected'}</span>
          </div>
          <div className="room-info">
            <span className="room-id">Room: {roomId}</span>
            <span className="participant-count">{participants.length + 1} participants</span>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div 
        className="video-area"
        onClick={handleVideoTap}
        onTouchStart={() => {
          if (isMobile) {
            setIsControlsVisible(true);
            if (controlsTimeoutRef.current) {
              clearTimeout(controlsTimeoutRef.current);
            }
            controlsTimeoutRef.current = setTimeout(() => {
              setIsControlsVisible(false);
            }, 3000);
          }
        }}
      >
        <VideoGrid 
          remoteStreams={remoteStreams}
          participants={participants}
          localStream={localStream}
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          activeSpeaker={activeSpeaker}
          onActiveSpeakerChange={setActiveSpeaker}
          isMobile={isMobile}
          userName={userName}
        />
      </div>

      {/* Mobile Controls */}
      {isMobile && (
        <div className={`mobile-controls ${isControlsVisible ? 'visible' : 'hidden'}`}>
          <div className="control-buttons">
            <button
              onClick={toggleVideo}
              className={`control-btn video-btn ${isVideoEnabled ? 'enabled' : 'disabled'}`}
              aria-label={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
            >
              <span className="btn-icon">{isVideoEnabled ? '📹' : '📷'}</span>
              <span className="btn-label">Video</span>
            </button>

            <button
              onClick={toggleAudio}
              className={`control-btn audio-btn ${isAudioEnabled ? 'enabled' : 'disabled'}`}
              aria-label={isAudioEnabled ? 'Mute audio' : 'Unmute audio'}
            >
              <span className="btn-icon">{isAudioEnabled ? '🎤' : '🔇'}</span>
              <span className="btn-label">Audio</span>
            </button>

            <button
              onClick={() => setIsParticipantsVisible(!isParticipantsVisible)}
              className="control-btn participants-btn"
              aria-label="Show participants"
            >
              <span className="btn-icon">👥</span>
              <span className="btn-label">People</span>
            </button>

            <button
              onClick={() => setIsSettingsVisible(!isSettingsVisible)}
              className="control-btn settings-btn"
              aria-label="Settings"
            >
              <span className="btn-icon">⚙️</span>
              <span className="btn-label">Settings</span>
            </button>

            <button
              onClick={leaveCall}
              className="control-btn leave-btn"
              aria-label="Leave call"
            >
              <span className="btn-icon">📞</span>
              <span className="btn-label">Leave</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Controls */}
      {!isMobile && (
        <div className="desktop-controls">
          <VideoControls
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            onToggleVideo={toggleVideo}
            onToggleAudio={toggleAudio}
            onLeaveCall={leaveCall}
          />
        </div>
      )}

      {/* Participants Modal */}
      {isParticipantsVisible && (
        <div className="modal-overlay" onClick={() => setIsParticipantsVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Participants</h3>
              <button className="close-btn" onClick={() => setIsParticipantsVisible(false)}>✕</button>
            </div>
            <div className="participants-list">
              {/* Current User */}
              <div className="participant-item current-user">
                <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
                <div className="user-info">
                  <span className="name">{userName}</span>
                  <span className="status">You</span>
                </div>
                <div className="status-indicators">
                  <span className={`indicator ${isVideoEnabled ? 'video-on' : 'video-off'}`}>📹</span>
                  <span className={`indicator ${isAudioEnabled ? 'audio-on' : 'audio-off'}`}>🎤</span>
                </div>
              </div>

              {/* Other Participants */}
              {participants.map(participant => {
                const hasStream = remoteStreams.has(participant.userId);
                return (
                  <div key={participant.userId} className="participant-item">
                    <div className="avatar">{participant.userName.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                      <span className="name">{participant.userName}</span>
                      <span className="status">Connected</span>
                    </div>
                    <div className="status-indicators">
                      <span className={`indicator ${hasStream ? 'live' : 'connecting'}`}>
                        {hasStream ? '📹 Live' : '🔄 Connecting'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsVisible && (
        <div className="modal-overlay" onClick={() => setIsSettingsVisible(false)}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Settings</h3>
              <button className="close-btn" onClick={() => setIsSettingsVisible(false)}>✕</button>
            </div>
            <div className="settings-content">
              <div className="setting-group">
                <label>Video Quality</label>
                <select>
                  <option>Auto</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              
              <div className="setting-group">
                <label>Audio Quality</label>
                <select>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Background Blur</label>
                <button className="toggle-btn">Toggle</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="error-overlay">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h3>Connection Error</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={() => setError(null)} className="btn-secondary">Try Again</button>
              <button onClick={leaveCall} className="btn-primary">Leave Call</button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isConnecting && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Connecting to video call...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCallRoom;