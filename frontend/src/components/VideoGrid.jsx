import React from 'react';

const VideoGrid = ({ 
  remoteStreams, 
  participants, 
  localStream, 
  isVideoEnabled, 
  isAudioEnabled, 
  activeSpeaker, 
  onActiveSpeakerChange,
  isMobile = false,
  userName = 'User'
}) => {
  const totalParticipants = participants.length + 1; // +1 for local user

  // Get active speaker or first participant
  const getActiveSpeaker = () => {
    if (activeSpeaker) {
      return participants.find(p => p.userId === activeSpeaker);
    }
    return participants[0] || null;
  };

  const activeSpeakerData = getActiveSpeaker();

  return (
    <div 
      className="video-grid-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
      {/* Desktop Layout - Grid System */}
      {!isMobile && (
        <div className="desktop-grid">
          {/* Main Video Area */}
          <div className="main-video-area">
            {totalParticipants === 1 ? (
              // Single participant view
              <div className="single-participant-view">
                <div className="video-placeholder">
                  <div className="placeholder-content">
                    <div className="camera-icon">📹</div>
                    <h3>Video Call Ready</h3>
                    <p>Waiting for participants to join...</p>
                    <div className="status-indicators">
                      <div className={`status-item ${isVideoEnabled ? 'enabled' : 'disabled'}`}>
                        <span>📹</span>
                        <span>Video {isVideoEnabled ? 'ON' : 'OFF'}</span>
                      </div>
                      <div className={`status-item ${isAudioEnabled ? 'enabled' : 'disabled'}`}>
                        <span>🎤</span>
                        <span>Audio {isAudioEnabled ? 'ON' : 'OFF'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Multi-participant grid
              <div className="grid-layout">
                {participants.map((participant) => {
                  const hasStream = remoteStreams.has(participant.userId);
                  const isActive = activeSpeakerData && participant.userId === activeSpeakerData.userId;
                  
                  return (
                    <div
                      key={participant.userId}
                      className={`participant-tile ${isActive ? 'active' : ''}`}
                      onClick={() => onActiveSpeakerChange(participant.userId)}
                    >
                      <div className="video-container">
                        {hasStream ? (
                          <video
                            autoPlay
                            playsInline
                            className="video-stream"
                            style={{ transform: 'scaleX(-1)' }}
                          >
                            <source srcObject={remoteStreams.get(participant.userId)} />
                          </video>
                        ) : (
                          <div className="connecting-overlay">
                            <div className="connecting-icon">🔄</div>
                            <div className="connecting-text">Connecting...</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="participant-info">
                        <div className="participant-name">{participant.userName}</div>
                        <div className="participant-status">
                          <span className={`status-dot ${hasStream ? 'live' : 'connecting'}`}></span>
                          <span>{hasStream ? 'Live' : 'Connecting'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Local Video Sidebar */}
          <div className="local-video-sidebar">
            <div className="local-video-container">
              {localStream ? (
                <video
                  ref={(el) => {
                    if (el) el.srcObject = localStream;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="local-video-stream"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="local-video-placeholder">
                  <div className="placeholder-avatar">{userName?.charAt(0).toUpperCase() || 'U'}</div>
                  <div className="placeholder-label">Your Camera</div>
                </div>
              )}
              
              <div className="local-video-controls">
                <div className="control-status">
                  <span className={`status-indicator ${isVideoEnabled ? 'video-on' : 'video-off'}`}>
                    📹 {isVideoEnabled ? 'ON' : 'OFF'}
                  </span>
                  <span className={`status-indicator ${isAudioEnabled ? 'audio-on' : 'audio-off'}`}>
                    🎤 {isAudioEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Layout - Focus on Active Speaker */}
      {isMobile && (
        <div className="mobile-grid flex flex-col h-full w-full">
          {/* Active Speaker Full Screen */}
          {totalParticipants > 1 && activeSpeakerData && (
            <div className="active-speaker-full">
              <div className="active-speaker-video">
                {remoteStreams.has(activeSpeakerData.userId) ? (
                  <video
                    autoPlay
                    playsInline
                    className="full-screen-video"
                    style={{ transform: 'scaleX(-1)' }}
                  >
                    <source srcObject={remoteStreams.get(activeSpeakerData.userId)} />
                  </video>
                ) : (
                  <div className="connecting-full">
                    <div className="connecting-content">
                      <div className="connecting-icon">🔄</div>
                      <div className="connecting-text">Connecting to {activeSpeakerData.userName}...</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Active Speaker Info Overlay */}
              <div className="active-speaker-overlay">
                <div className="speaker-info">
                  <div className="speaker-name">{activeSpeakerData.userName}</div>
                  <div className="speaker-status">Active Speaker</div>
                </div>
                <div className="connection-status">
                  <div className={`status-dot ${remoteStreams.has(activeSpeakerData.userId) ? 'connected' : 'connecting'}`}></div>
                  <span>{remoteStreams.has(activeSpeakerData.userId) ? 'Connected' : 'Connecting'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Local Video Corner */}
          <div className="local-video-corner">
            {localStream ? (
              <video
                ref={(el) => {
                  if (el) el.srcObject = localStream;
                }}
                autoPlay
                playsInline
                muted
                className="corner-video"
                style={{ transform: 'scaleX(-1)' }}
              />
            ) : (
              <div className="corner-placeholder">
                <div className="placeholder-avatar">{userName?.charAt(0).toUpperCase() || 'U'}</div>
                <div className="placeholder-label">You</div>
              </div>
            )}
            
            <div className="corner-status">
              <span className={`status-indicator ${isVideoEnabled ? 'video-on' : 'video-off'}`}>
                📹
              </span>
              <span className={`status-indicator ${isAudioEnabled ? 'audio-on' : 'audio-off'}`}>
                🎤
              </span>
            </div>
          </div>

          {/* Participant Thumbnails */}
          {participants.length > 0 && (
            <div className="participant-thumbnails">
              {participants.map((participant, index) => {
                const hasStream = remoteStreams.has(participant.userId);
                const isActive = activeSpeakerData && participant.userId === activeSpeakerData.userId;
                
                return (
                  <div
                    key={participant.userId}
                    className={`thumbnail ${isActive ? 'active' : ''}`}
                    style={{ transform: `translateY(${index * 20}px)` }}
                    onClick={() => onActiveSpeakerChange(participant.userId)}
                  >
                    <div className="thumbnail-video">
                      {hasStream ? (
                        <video
                          autoPlay
                          playsInline
                          className="thumbnail-stream"
                          style={{ transform: 'scaleX(-1)' }}
                        >
                          <source srcObject={remoteStreams.get(participant.userId)} />
                        </video>
                      ) : (
                        <div className="thumbnail-placeholder">
                          <div className="placeholder-avatar">{participant.userName.charAt(0).toUpperCase()}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="thumbnail-info">
                      <div className="thumbnail-name">{participant.userName}</div>
                      <div className={`thumbnail-status ${hasStream ? 'live' : 'connecting'}`}>
                        {hasStream ? '📹 Live' : '🔄 Connecting'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Single Participant Mobile View */}
          {totalParticipants === 1 && (
            <div className="mobile-single-view">
              <div className="single-video-placeholder">
                <div className="placeholder-content">
                  <div className="camera-icon">📹</div>
                  <h3>Video Call Ready</h3>
                  <p>Waiting for participants to join...</p>
                  <div className="mobile-status-grid">
                    <div className={`status-card ${isVideoEnabled ? 'enabled' : 'disabled'}`}>
                      <span className="status-icon">📹</span>
                      <span className="status-label">Video</span>
                      <span className="status-value">{isVideoEnabled ? 'ON' : 'OFF'}</span>
                    </div>
                    <div className={`status-card ${isAudioEnabled ? 'enabled' : 'disabled'}`}>
                      <span className="status-icon">🎤</span>
                      <span className="status-label">Audio</span>
                      <span className="status-value">{isAudioEnabled ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
