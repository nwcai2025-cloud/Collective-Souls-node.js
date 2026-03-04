import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { fetchStats } from '../services/statsService'
import CommunityWall from '../components/CommunityWall'
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Star,
  Globe,
  Heart,
  X,
  Clock,
  BookOpen,
  Video
} from 'lucide-react'
import { Link } from 'react-router-dom'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsersNow: 0,
    messagesThisHour: 0
  })
  const [loading, setLoading] = useState(true)
  const [connections, setConnections] = useState<any[]>([])
  const [dms, setDms] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'meditation',
    start_time: '',
    location: 'Online'
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [connRes, dmRes, eventRes] = await Promise.all([
          fetch('/api/connections', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch('/api/chat/dms/', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          }),
          fetch('/api/events?limit=5', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
        ]);

        if (connRes.ok) {
          const data = await connRes.json();
          setConnections(data.connections.slice(0, 5));
        }

        if (dmRes.ok) {
          const data = await dmRes.json();
          setDms(data.data.dms.slice(0, 5));
        }

        if (eventRes.ok) {
          const data = await eventRes.json();
          setEvents(data.data.events);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Fetch real-time stats
    const fetchRealtimeStats = async () => {
      try {
        const response = await fetchStats()
        if (response.success) {
          setStats(response.data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRealtimeStats()

    // Subscribe to stats updates via socket
    if (socket) {
      socket.on('stats_update', (newStats: any) => {
        setStats(newStats)
      })
    }

    return () => {
      if (socket) {
        socket.off('stats_update')
      }
    }
  }, [socket])

  // Helper function for formatting relative time
  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'unknown'
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 30) return 'just now'
    if (diffInSeconds < 60) return 'less than a minute ago'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newEvent)
      })

      if (response.ok) {
        const data = await response.json()
        setEvents([data.data.event, ...events].slice(0, 5))
        setShowEventModal(false)
        setNewEvent({
          title: '',
          description: '',
          event_type: 'meditation',
          start_time: '',
          location: 'Online'
        })
      }
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      {loading ? (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-mindful-purple to-serene-blue rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}!</h1>
                <p className="text-white text-opacity-90">
                  Your spiritual journey continues. Here's what's happening in your community.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white bg-opacity-20 rounded-full p-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-mindful-purple to-serene-blue rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}!</h1>
                <p className="text-white text-opacity-90">
                  Your spiritual journey continues. Here's what's happening in your community.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white bg-opacity-20 rounded-full p-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Connections</p>
              <p className="text-2xl font-bold text-mindful-purple">24</p>
            </div>
            <div className="w-12 h-12 bg-mindful-purple bg-opacity-10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-mindful-purple" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unread Messages</p>
              <p className="text-2xl font-bold text-serene-blue">3</p>
            </div>
            <div className="w-12 h-12 bg-serene-blue bg-opacity-10 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-serene-blue" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week's Practices</p>
              <p className="text-2xl font-bold text-calm-green">12</p>
            </div>
            <div className="w-12 h-12 bg-calm-green bg-opacity-10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-calm-green" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Community Events</p>
              <p className="text-2xl font-bold text-yellow-500">5</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Connections and DMs */}
        <div className="space-y-6">
          {/* Connections Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-purple-100">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🤝</span>
                <h2 className="text-xl font-bold text-serene-blue">Connections</h2>
              </div>
              <Link to="/connections" className="text-serene-blue hover:underline text-sm font-medium">Find More</Link>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Connections</h3>
              <div className="space-y-4">
                {connections.length > 0 ? connections.map((conn) => (
                  <div key={conn.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Link to={`/profile/${conn.username}`} className="relative group">
                        <div className="w-10 h-10 bg-mindful-purple rounded-full flex items-center justify-center text-white font-bold group-hover:ring-2 group-hover:ring-mindful-purple transition-all">
                          {conn.username.charAt(0).toUpperCase()}
                        </div>
                        {conn.is_online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                        )}
                      </Link>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Link to={`/profile/${conn.username}`} className="font-medium text-gray-900 hover:text-mindful-purple transition-colors">{conn.username}</Link>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${conn.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {conn.is_online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No connections yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Direct Messages Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-purple-100">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-xl">💬</span>
                <h2 className="text-xl font-bold text-serene-blue">Direct Messages</h2>
              </div>
              <Link to="/chat?action=new_dm" className="bg-mindful-purple text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors">
                + New DM
              </Link>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {dms.length > 0 ? dms.map((dm) => {
                  const otherUser = dm.participants.find((p: any) => p.id !== user?.id);
                  return (
                    <div key={dm.id} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors group">
                      <div className="flex items-center space-x-3">
                        <Link to={`/profile/${otherUser?.username}`} className="relative">
                          <div className="w-10 h-10 bg-mindful-purple rounded-full flex items-center justify-center text-white font-bold hover:ring-2 hover:ring-mindful-purple transition-all">
                            {otherUser?.username.charAt(0).toUpperCase()}
                          </div>
                          {otherUser?.is_online && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                          )}
                        </Link>
                        <Link to={`/chat?dm=${dm.id}`} className="overflow-hidden flex-1">
                          <p className="font-medium text-gray-900 truncate group-hover:text-mindful-purple transition-colors">{otherUser?.username}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {dm.last_message ? `${dm.last_message.sender_username}: ${dm.last_message.content}` : 'No messages yet'}
                          </p>
                        </Link>
                      </div>
                      <div className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                        {dm.last_message ? formatRelativeTime(dm.last_message.created_at) : ''}
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-gray-500 text-center py-4">No messages yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Community Wall */}
        <div className="lg:col-span-2">
          <CommunityWall />
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/journal" className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors">
                <BookOpen className="w-5 h-5 text-mindful-purple" />
                <span className="text-mindful-purple font-medium">📝 Write Journal</span>
              </Link>
              <Link to="/connections" className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-mindful-purple bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <Plus className="w-5 h-5 text-mindful-purple" />
                <span className="text-mindful-purple font-medium">Add Connection</span>
              </Link>
              <Link to="/chat" className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-serene-blue bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <MessageCircle className="w-5 h-5 text-serene-blue" />
                <span className="text-serene-blue font-medium">Send Message</span>
              </Link>
              <Link to="/video-lobby" className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-yellow-500 bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <Video className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-500 font-medium">🎥 Video Chat</span>
              </Link>
              <button 
                onClick={() => setShowEventModal(true)}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-calm-green bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors"
              >
                <Plus className="w-5 h-5 text-calm-green" />
                <span className="text-calm-green font-medium">Add Event</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-yellow-500 bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                <Calendar className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-500 font-medium">Join Event</span>
              </button>
            </div>
          </div>

          {/* Community Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Community Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-mindful-purple" />
                  <span className="text-gray-700">Global Members</span>
                </div>
                <span className="font-semibold">{stats.totalUsers.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Heart className="w-5 h-5 text-calm-green" />
                  <span className="text-gray-700">Active Today</span>
                </div>
                <span className="font-semibold">{stats.activeUsersNow}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-700">Messages This Hour</span>
                </div>
                <span className="font-semibold">{stats.messagesThisHour}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-green-100">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📅</span>
              <h2 className="text-xl font-bold text-calm-green">Upcoming Events</h2>
            </div>
            <Link to="/events" className="text-calm-green hover:underline text-sm font-medium">View All</Link>
          </div>
          <div className="p-6">
            {events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event.id} className="bg-gray-50 rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all text-center">
                    <div className="w-14 h-14 bg-calm-green bg-opacity-10 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-calm-green border-opacity-20">
                      <Calendar className="w-7 h-7 text-calm-green" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{event.title}</h4>
                    <p className="text-xs text-mindful-purple font-bold uppercase tracking-wider mb-3">{event.event_type}</p>
                    <div className="space-y-2 mb-5">
                      <p className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(event.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                      <p className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span>{event.location}</span>
                      </p>
                    </div>
                    <button className="w-full bg-calm-green hover:bg-green-600 text-white py-2.5 px-4 rounded-lg transition-colors text-sm font-bold shadow-sm">
                      Join Event
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming events found.</p>
                <button 
                  onClick={() => setShowEventModal(true)}
                  className="mt-4 text-calm-green font-bold hover:underline"
                >
                  Create the first event!
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-calm-green to-green-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Create New Event</h3>
              <button onClick={() => setShowEventModal(false)} className="hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Event Title</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-calm-green focus:border-transparent outline-none"
                  placeholder="e.g., Morning Meditation"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-calm-green focus:border-transparent outline-none"
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
                <label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
                <input
                  required
                  type="datetime-local"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-calm-green focus:border-transparent outline-none"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({...newEvent, start_time: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-calm-green focus:border-transparent outline-none"
                  placeholder="Online or Physical Location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-calm-green focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Tell us about the event..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-calm-green hover:bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all transform active:scale-95"
              >
                Create Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard