import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, Video, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import { UserEvent } from '../types';

interface CalendarViewProps {
  userEvents: UserEvent[];
  onJoinEvent?: (eventId: number) => void;
  onLeaveEvent?: (eventId: number) => void;
  onCreateRoom?: (eventId: number) => Promise<void>;
  onJoinRoom?: (roomId: number) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  userEvents,
  onJoinEvent,
  onLeaveEvent,
  onCreateRoom,
  onJoinRoom
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoomTypeIcon = (roomType: string) => {
    switch (roomType) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'chat': return <MessageCircle className="w-4 h-4" />;
      case 'both': return <Video className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isEventEligibleForRoom = (event: UserEvent) => {
    // Debug logging to help troubleshoot why button isn't showing
    console.log('Checking room eligibility:', {
      status: event.status,
      room_created: event.room_created,
      startTime: event.event.start_time,
      now: new Date().toISOString()
    });
    
    if (event.status !== 'owner') {
      console.log('Not eligible: not owner');
      return false;
    }
    
    if (event.room_created) {
      console.log('Not eligible: room already created');
      return false;
    }
    
    const now = new Date();
    const startTime = new Date(event.event.start_time);
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    
    const isEligible = startTime >= now && startTime <= sixHoursFromNow;
    console.log('Time eligibility check:', {
      startTime: startTime.toISOString(),
      sixHoursFromNow: sixHoursFromNow.toISOString(),
      isEligible
    });
    
    return isEligible;
  };

  const isEventActive = (event: UserEvent) => {
    const now = new Date();
    const startTime = new Date(event.event.start_time);
    const endTime = event.event.end_time ? new Date(event.event.end_time) : null;
    
    return startTime <= now && (!endTime || endTime >= now);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-mindful-purple" />
          Events Calendar
        </h3>
        <p className="text-sm text-gray-600 mt-1">Your spiritual gatherings and connections</p>
      </div>
      
      <div className="p-4 sm:p-6">
        {userEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-base">No events yet</p>
            <p className="text-gray-400 text-sm">Join events to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userEvents.map((userEvent) => (
              <div key={userEvent.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3">
                      <h4 className="font-semibold text-gray-900 text-base sm:text-sm flex-1">
                        {userEvent.event.title}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(userEvent.event_status)}`}>
                          {userEvent.event_status}
                        </span>
                        {userEvent.status === 'owner' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            Owner
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{userEvent.event.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(userEvent.event.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{userEvent.event.location}</span>
                      </div>
                    </div>

                    {userEvent.room_created && (userEvent.chat_room_id || userEvent.event?.chat_room_id) && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
                        <span className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                          {getRoomTypeIcon(userEvent.room_type || 'chat')}
                          Room Available
                        </span>
                        <button
                          onClick={() => {
                            const roomId = userEvent.chat_room_id || userEvent.event?.chat_room_id;
                            if (roomId) onJoinRoom?.(roomId);
                          }}
                          className="text-sm text-mindful-purple hover:text-purple-700 font-medium bg-transparent border-0 cursor-pointer"
                        >
                          Join Room
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 min-w-[140px]">
                    {userEvent.status === 'owner' && isEventEligibleForRoom(userEvent) && (
                      <button
                        onClick={() => onCreateRoom?.(userEvent.event.id)}
                        className="w-full px-4 py-2 bg-mindful-purple text-white text-sm rounded-lg hover:bg-purple-600 transition-colors font-medium"
                      >
                        Create Room
                      </button>
                    )}

                    {userEvent.status === 'joined' && (
                      <button
                        onClick={() => onLeaveEvent?.(userEvent.event.id)}
                        className="w-full px-4 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Leave Event
                      </button>
                    )}

                    {userEvent.status === 'owner' && userEvent.room_created && (userEvent.chat_room_id || userEvent.event?.chat_room_id) && (
                      <button
                        onClick={() => {
                          const roomId = userEvent.chat_room_id || userEvent.event?.chat_room_id;
                          if (roomId) onJoinRoom?.(roomId);
                        }}
                        className="w-full px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Active Room
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;