import React from 'react';

const VideoGrid = ({ remoteStreams, participants }) => {
  const getGridClass = (count) => {
    if (count === 0) return 'grid-cols-1';
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  const getAspectRatioClass = (count) => {
    if (count <= 2) return 'aspect-video';
    return 'aspect-[4/3]';
  };

  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="text-white font-semibold mb-4">Remote Participants</h3>
      
      {participants.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">👥</div>
          <p>Waiting for participants to join...</p>
        </div>
      ) : (
        <div className={`grid ${getGridClass(participants.length)} gap-4`}>
          {participants.map((participant) => {
            const stream = remoteStreams.get(participant.userId);
            
            return (
              <div key={participant.userId} className="group">
                <div className="relative">
                  {/* Video Container */}
                  <div className={`bg-black rounded-lg overflow-hidden ${getAspectRatioClass(participants.length)}`}>
                    {stream ? (
                      <video
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }} // Mirror effect
                      >
                        <source srcObject={stream} />
                      </video>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📹</div>
                          <p className="text-sm text-gray-400">Connecting...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Participant Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-white text-sm font-medium">
                          {participant.userName}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <span className="text-xs text-gray-300 bg-black bg-opacity-50 px-2 py-1 rounded">
                          📹 Live
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Connection Status */}
                  <div className="absolute top-2 right-2">
                    <div className={`w-3 h-3 rounded-full ${
                      stream ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                    }`}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Optimization */}
      <div className="mt-4 lg:hidden text-center text-xs text-gray-400">
        <p>📱 Swipe to view all participants</p>
        <p className="mt-1">🌟 Optimized for mobile devices</p>
      </div>
    </div>
  );
};

export default VideoGrid;