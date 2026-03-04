import React from 'react';

const VideoControls = ({ 
  isVideoEnabled, 
  isAudioEnabled, 
  onToggleVideo, 
  onToggleAudio, 
  onLeaveCall 
}) => {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-center space-x-4">
        {/* Video Toggle */}
        <button
          onClick={onToggleVideo}
          className={`p-4 rounded-full transition-all duration-300 transform hover:scale-110 ${
            isVideoEnabled 
              ? 'bg-green-500 bg-opacity-20 border border-green-400 hover:bg-green-500 hover:bg-opacity-40' 
              : 'bg-red-500 bg-opacity-20 border border-red-400 hover:bg-red-500 hover:bg-opacity-40'
          }`}
          style={{
            boxShadow: isVideoEnabled 
              ? '0 0 15px rgba(34, 197, 94, 0.3)' 
              : '0 0 15px rgba(239, 68, 68, 0.3)'
          }}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">
              {isVideoEnabled ? '📹' : '📷'}
            </div>
            <div className="text-xs text-gray-300 font-medium">
              Video {isVideoEnabled ? 'ON' : 'OFF'}
            </div>
          </div>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className={`p-4 rounded-full transition-all duration-300 transform hover:scale-110 ${
            isAudioEnabled 
              ? 'bg-blue-500 bg-opacity-20 border border-blue-400 hover:bg-blue-500 hover:bg-opacity-40' 
              : 'bg-red-500 bg-opacity-20 border border-red-400 hover:bg-red-500 hover:bg-opacity-40'
          }`}
          style={{
            boxShadow: isAudioEnabled 
              ? '0 0 15px rgba(59, 130, 246, 0.3)' 
              : '0 0 15px rgba(239, 68, 68, 0.3)'
          }}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">
              {isAudioEnabled ? '🎤' : '🔇'}
            </div>
            <div className="text-xs text-gray-300 font-medium">
              Audio {isAudioEnabled ? 'ON' : 'OFF'}
            </div>
          </div>
        </button>

        {/* Leave Call */}
        <button
          onClick={onLeaveCall}
          className="p-4 rounded-full bg-red-500 bg-opacity-20 border border-red-400 hover:bg-red-500 hover:bg-opacity-40 transition-all duration-300 transform hover:scale-110"
          style={{
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)'
          }}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">📞</div>
            <div className="text-xs text-gray-300 font-medium">End Call</div>
          </div>
        </button>
      </div>

      {/* Mobile-friendly touch indicators */}
      <div className="mt-4 text-center text-xs text-gray-400">
        <div className="flex justify-center space-x-4 text-xs">
          <span>👆 Tap to toggle</span>
          <span>📱 Touch-friendly</span>
          <span>🌟 Spiritual design</span>
        </div>
      </div>
    </div>
  );
};

export default VideoControls;