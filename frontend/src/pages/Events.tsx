import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  Globe, 
  Plus, 
  Search, 
  X,
  Loader,
  CheckCircle,
  Edit2,
  Trash2,
  RefreshCw,
  Users,
  Video,
  MessageCircle
} from 'lucide-react';
import { userEventService } from '../services/userEventService';
import { UserEvent } from '../types';
import CalendarView from '../components/CalendarView';

interface Event {
  id: number;
  title: string;
  description: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  location: string;
  is_private: boolean;
  max_participants: number;
  created_by: number;
  creator?: {
    username: string;
    first_name?: string;
    last_name?: string;
  };
}

const Events: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [userEvents, setUserEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'calendar'>('browse');
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'meditation',
    start_time: '',
    location: 'Online'
  });

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchUserEvents();
    }
  }, [filterType, user]);

  const fetchEvents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const typeParam = filterType !== 'all' ? `&type=${filterType}` : '';
      const token = localStorage.getItem('token');
      
      if (!token || token === 'null' || token === 'undefined') {
        setError('Please log in to view events');
        return;
      }
      
      const response = await fetch(`/api/events?limit=50${typeParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.data.events);
      } else {
        setError('Failed to load events');
      }
    } catch (err) {
      setError('An error occurred while fetching events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserEvents = async () => {
    try {
      const response = await userEventService.getUserEvents();
      if (response.success) {
        setUserEvents(response.data.user_events);
      }
    } catch (err) {
      console.error('Error fetching user events:', err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
      const method = editingEvent ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newEvent)
      });

      if (response.ok) {
        fetchEvents();
        setShowModal(false);
        setEditingEvent(null);
        setNewEvent({
          title: '',
          description: '',
          event_type: 'meditation',
          start_time: '',
          location: 'Online'
        });
      }
    } catch (err) {
      console.error('Error saving event:', err);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      start_time: new Date(event.start_time).toISOString().slice(0, 16),
      location: event.location
    });
    setShowModal(true);
  };

  const handleJoinEvent = async (eventId: number) => {
    console.log('handleJoinEvent called with eventId:', eventId);
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token, 'Token value:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token || token === 'null' || token === 'undefined') {
        alert('Please log in to join events');
        return;
      }
      
      console.log('Making POST request to /api/events/' + eventId + '/join');
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Join response:', data);
        // Update the local events state to show joined status
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === eventId 
              ? { ...event, joined: true }
              : event
          )
        );
        // Refresh user events
        fetchUserEvents();
        alert('Successfully joined the event! Check your profile to see it in your calendar.');
      } else {
        const errorData = await response.json();
        console.error('Failed to join event:', errorData);
        alert(errorData.message || 'Failed to join event');
      }
    } catch (err) {
      console.error('Error joining event:', err);
      alert('An error occurred while joining the event: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleLeaveEvent = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Update the local events state to show not joined status
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === eventId 
              ? { ...event, joined: false }
              : event
          )
        );
        // Refresh user events
        fetchUserEvents();
      }
    } catch (err) {
      console.error('Error leaving event:', err);
    }
  };

  const handleCreateRoom = async (eventId: number) => {
    try {
      const response = await userEventService.createRoom(eventId, 'both');
      if (response.success && response.data.chat_room_id) {
        // Refresh user events to show room created
        fetchUserEvents();
        // Show success message and navigate to chat
        alert('Chat room created successfully! Click OK to join the room.');
        navigate(`/chat?roomId=${response.data.chat_room_id}`);
      }
    } catch (err) {
      console.error('Error creating room:', err);
      alert(err instanceof Error ? err.message : 'Failed to create room');
    }
  };

  const handleJoinRoom = (roomId: number) => {
    navigate(`/chat?roomId=${roomId}`);
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Gradient Banner like Dashboard */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-mindful-purple to-serene-blue rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
                  <span>📅</span> Spiritual Events
                </h1>
                <p className="text-white text-opacity-90 text-sm sm:text-base">
                  Discover and join mindful gatherings with your spiritual community
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button 
                  onClick={() => fetchEvents(true)}
                  disabled={refreshing}
                  className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-bold transition-all flex items-center justify-center disabled:opacity-50"
                  title="Refresh events"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={() => setShowModal(true)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  <span className="sm:hidden">Create</span>
                  <span className="hidden sm:inline">Create Event</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search - Match Dashboard card styling */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-purple-100 mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search events..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-mindful-purple focus:ring-2 focus:ring-mindful-purple focus:ring-opacity-20 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2 -mb-2 sm:flex-wrap sm:pb-0 sm:mb-0 sm:overflow-visible">
              {['all', 'meditation', 'yoga', 'workshop', 'gathering'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2.5 sm:py-2 rounded-lg text-sm font-bold capitalize transition-all whitespace-nowrap ${
                    filterType === type 
                      ? 'bg-mindful-purple text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid - Mobile Optimized */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-10 h-10 text-mindful-purple animate-spin mb-4" />
            <p className="text-gray-600 font-bold">Loading spiritual gatherings...</p>
          </div>
        ) : refreshing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border-2 border-gray-100 opacity-70">
                <div className="h-2 bg-mindful-purple animate-pulse"></div>
                <div className="p-4 sm:p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 bg-mindful-purple rounded-full flex items-center justify-center text-white font-bold">
                      {event.creator?.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="bg-red-600 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full uppercase tracking-wider border border-red-700 shadow-sm">
                      {event.event_type}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    {event.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2 sm:mb-3 font-medium">
                    by @{event.creator?.username}
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4 sm:mb-6 font-medium">
                    {event.description || 'No description provided.'}
                  </p>
                  <div className="mt-auto space-y-2 mb-4 sm:mb-8">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-mindful-purple flex-shrink-0" />
                      <span className="font-bold truncate">
                        {new Date(event.start_time).toLocaleString([], { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-mindful-purple flex-shrink-0" />
                      <span className="font-bold truncate">{event.location}</span>
                    </div>
                  </div>
                  <button className="w-full bg-spiritual-purple hover:bg-purple-600 text-white py-2.5 sm:py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 transform active:scale-95 capitalize text-sm sm:text-base">
                    Join {event.event_type}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border-2 border-gray-100 hover:shadow-xl hover:border-mindful-purple transition-all group flex flex-col">
                <div className="h-2 bg-mindful-purple"></div>
                <div className="p-4 sm:p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <Link to={`/profile/${event.creator?.username}`} className="relative group/avatar">
                      <div className="w-10 sm:w-12 h-10 sm:h-12 bg-mindful-purple rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm group-hover/avatar:ring-2 group-hover/avatar:ring-mindful-purple transition-all overflow-hidden">
                        {event.creator?.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 sm:w-3.5 h-3 sm:h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                    </Link>
                    <div className="flex gap-1 sm:gap-2">
                      {(user?.id == event.created_by || user?.is_staff || user?.is_superuser) && (
                        <>
                          <button 
                            onClick={() => openEditModal(event)}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Edit Event"
                          >
                            <Edit2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                          </button>
                        </>
                      )}
                      <span className="bg-red-600 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full uppercase tracking-wider border border-red-700 shadow-sm flex items-center">
                        {event.event_type}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 group-hover:text-serene-blue transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2 sm:mb-3 font-medium">
                    Hosted by <Link to={`/profile/${event.creator?.username}`} className="text-mindful-purple hover:underline">@{event.creator?.username}</Link>
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-2 sm:line-clamp-3 mb-4 sm:mb-6 font-medium">
                    {event.description || 'No description provided for this mindful gathering.'}
                  </p>
                  <div className="mt-auto space-y-2 sm:space-y-3 mb-4 sm:mb-8">
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-mindful-purple flex-shrink-0" />
                      <span className="font-bold truncate">
                        {new Date(event.start_time).toLocaleString([], { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-mindful-purple flex-shrink-0" />
                      <span className="font-bold truncate">{event.location}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleJoinEvent(event.id)}
                    className="w-full bg-spiritual-purple hover:bg-purple-600 text-white py-2.5 sm:py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 transform active:scale-95 capitalize text-sm sm:text-base"
                  >
                    Join {event.event_type}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-20 text-center border border-dashed border-gray-300">
            <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-8">Be the first to schedule a spiritual gathering!</p>
            <button 
              onClick={() => setShowModal(true)}
              className="text-mindful-purple font-bold hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Create New Event
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Event Modal - Mobile Optimized */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-gray-50 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[80vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border-4 border-gray-200 flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-mindful-purple to-indigo-600 p-4 sm:p-8 text-white flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
                <p className="text-white text-opacity-80 text-xs sm:text-sm font-medium">
                  {editingEvent ? 'Update your spiritual gathering' : 'Schedule a new spiritual gathering'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingEvent(null);
                  setNewEvent({
                    title: '',
                    description: '',
                    event_type: 'meditation',
                    start_time: '',
                    location: 'Online'
                  });
                }} 
                className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Form - Scrollable */}
            <form onSubmit={handleCreateEvent} className="p-4 sm:p-8 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Event Title</label>
                  <input
                    required
                    type="text"
                    inputMode="text"
                    className="w-full px-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-mindful-purple outline-none transition-all font-medium text-base"
                    placeholder="e.g., Sunset Meditation"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                    <select
                      className="w-full px-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-mindful-purple outline-none transition-all font-medium text-base"
                      value={newEvent.event_type}
                      onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value})}
                    >
                      <option value="meditation">Meditation</option>
                      <option value="yoga">Yoga</option>
                      <option value="workshop">Workshop</option>
                      <option value="gathering">Gathering</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Time</label>
                    <input
                      required
                      type="datetime-local"
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-mindful-purple outline-none transition-all font-medium text-base"
                      value={newEvent.start_time}
                      onChange={(e) => setNewEvent({...newEvent, start_time: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    inputMode="text"
                    className="w-full px-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-mindful-purple outline-none transition-all font-medium text-base"
                    placeholder="Online or Physical Address"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    className="w-full px-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-mindful-purple outline-none transition-all font-medium text-base"
                    rows={3}
                    inputMode="text"
                    placeholder="What should participants expect?"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  ></textarea>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-spiritual-purple hover:bg-purple-600 text-white py-4 sm:py-5 rounded-2xl font-bold shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-base"
              >
                <CheckCircle className="w-5 h-5" />
                {editingEvent ? 'Update Event' : 'Publish Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;