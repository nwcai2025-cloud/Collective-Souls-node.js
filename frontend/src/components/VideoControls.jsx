import React from 'react';

const VideoControls = ({ 
  isVideoEnabled, 
  isAudioEnabled, 
  onToggleVideo, 
  onToggleAudio, 
  onLeaveCall 
}) => {
  return (
    <div 
      className="desktop-video-controls"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: '15px 20px',
        borderRadius: '30px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div className="control-group">
        <button
          onClick={onToggleVideo}
          className={`control-btn video-btn ${isVideoEnabled ? 'enabled' : 'disabled'}`}
          aria-label={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
        >
          <span className="btn-icon">{isVideoEnabled ? '📹' : '📷'}</span>
          <span className="btn-label">Video</span>
        </button>

        <button
          onClick={onToggleAudio}
          className={`control-btn audio-btn ${isAudioEnabled ? 'enabled' : 'disabled'}`}
          aria-label={isAudioEnabled ? 'Mute audio' : 'Unmute audio'}
        >
          <span className="btn-icon">{isAudioEnabled ? '🎤' : '🔇'}</span>
          <span className="btn-label">Audio</span>
        </button>

        <button
          onClick={onLeaveCall}
          className="control-btn leave-btn"
          aria-label="Leave call"
        >
          <span className="btn-icon">📞</span>
          <span className="btn-label">Leave</span>
        </button>
      </div>
    </div>
  );
};

export default VideoControls;