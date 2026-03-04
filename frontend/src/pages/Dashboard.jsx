import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  MessageSquare,
  Calendar,
  Plus,
  TrendingUp,
  Activity,
  Clock,
  Star,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
  Zap,
  BookOpen,
  Video
} from 'lucide-react'
import { fetchCommunityActivities, logActivity } from '../services/activityService'
import CommunityWall from '../components/CommunityWall'

const Dashboard = () => {
  const { user, loading } = useAuth()
  const { socket, isConnected } = useSocket()
  const navigate = useNavigate()
  const [communityStats, setCommunityStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    messagesToday: 0,
    recentActivitiesCount: 0,
    totalComments: 0,
    totalActivities: 0
  })
  const [userStats, setUserStats] = useState({
    userActivities: 0,
    userComments: 0,
    userConnections: 0,
    userMessages: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(null)
  const [activities, setActivities] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activityFormData, setActivityFormData] = useState({
    activity_type: '',
    duration: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      fetchStats()
      const interval = setInterval(() => fetchStats(), 60000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    if (socket) {
      const handleStatsUpdate = (data) => {
        console.log('Stats update received:', data)
        if (data.communityStats) {
          setCommunityStats(prev => ({ ...prev, ...data.communityStats }))
        }
        if (data.userStats) {
          setUserStats(prev => ({ ...prev, ...data.userStats }))
        }
      }

      socket.on('stats_update', handleStatsUpdate)
      return () => {
        socket.off('stats_update', handleStatsUpdate)
      }
    }
  }, [socket])

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);

      // Use relative URLs for consistency with activity service
      const communityResponse = await fetch('/api/stats/community');
      if (communityResponse.ok) {
        const communityData = await communityResponse.json();
        if (communityData.success) {
          setCommunityStats(communityData.data);
        }
      }

      try {
        const activitiesData = await fetchCommunityActivities(false);
        if (activitiesData.success) {
          setActivities(activitiesData.data);
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
      }

      const userResponse = await fetch('/api/stats/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        if (userData.success) {
          setUserStats(userData.data);
        }
      }

    } catch (error) {
      console.error('Error fetching stats:', error)
      setStatsError('Failed to load community stats')
    } finally {
      setStatsLoading(false)
    }
  }

  const refreshStats = () => {
    fetchStats()
  }

  const handleActivitySubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const result = await logActivity({
        activity_type: activityFormData.activity_type,
        duration: parseInt(activityFormData.duration),
        date: activityFormData.date,
        description: activityFormData.description
      })

      if (result.success) {
        setIsModalOpen(false)
        setActivityFormData({
          activity_type: '',
          duration: '',
          date: new Date().toISOString().split('T')[0],
          description: ''
        })
        refreshStats()
      }
    } catch (error) {
      console.error('Error logging activity:', error)
      alert('Failed to log activity. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Spiritual Journal',
      description: 'Private spiritual journal',
      icon: BookOpen,
      gradient: 'from-emerald-600 to-teal-700',
      action: () => navigate('/journal')
    },
    {
      title: 'Join Chat',
      description: 'Connect with the community',
      icon: MessageSquare,
      gradient: 'from-blue-600 to-cyan-700',
      action: () => navigate('/chat')
    },
    {
      title: 'Video Chat Lobby',
      description: 'Join video calls with community',
      icon: Activity,
      gradient: 'from-indigo-600 to-blue-700',
      action: () => navigate('/video-lobby')
    },
    {
      title: 'View Events',
      description: 'See upcoming gatherings',
      icon: Calendar,
      gradient: 'from-amber-600 to-orange-700',
      action: () => navigate('/events')
    },
    {
      title: 'Find Connections',
      description: 'Meet like-minded seekers',
      icon: Users,
      gradient: 'from-violet-600 to-purple-700',
      action: () => navigate('/connections')
    }
  ]

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'unknown';
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 30) return 'just now';
    if (diffInSeconds < 60) return 'less than a minute ago';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type) => {
    if (type.includes('connection') || type.includes('joined') || type.includes('profile')) return Users;
    if (type.includes('message') || type.includes('comment')) return MessageSquare;
    if (type.includes('event')) return Calendar;
    if (type.includes('activity') || type.includes('practice')) return TrendingUp;
    return Activity;
  };

  const getActivityColor = (type) => {
    if (type.includes('connection') || type.includes('joined') || type.includes('profile')) return 'text-blue-600';
    if (type.includes('message') || type.includes('comment')) return 'text-blue-600';
    if (type.includes('event')) return 'text-green-600';
    if (type.includes('activity') || type.includes('practice')) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-violet-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, {user?.first_name || user?.username}! 🌟
              </h1>
              <div className="text-purple-100 mt-1">
                Your spiritual journey continues here
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/10 rounded-full px-4 py-2">
                <span className="text-sm font-medium text-purple-100">
                  Member since {new Date(user?.created_at || Date.now()).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions - First Card */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-purple-600 to-violet-600">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-200" />
                <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className={`group p-4 rounded-lg bg-gradient-to-br ${action.gradient} hover:shadow-md transition-all duration-300`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-white">
                          {action.title}
                        </h3>
                        <p className="text-purple-100 text-sm">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity - Positioned directly below Quick Actions on all screens */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-rose-600 to-pink-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-rose-200" />
                  <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {activities.length > 0 ? (
                  activities.slice(0, 5).map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                        <div className={`w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">
                            {activity.title}
                          </h3>
                          <div className="text-sm text-gray-500">
                            {formatRelativeTime(activity.time)}
                          </div>
                          {activity.description && (
                            <p className="text-sm text-gray-400 mt-1 italic">
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No recent activity to show.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Community Wall - With Border */}
        <div className="mb-8 bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <CommunityWall />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-200" />
                    <h2 className="text-lg font-semibold text-white">Community Stats</h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 bg-white/10 rounded-full px-3 py-1">
                      {isConnected ? (
                        <Wifi className="w-4 h-4 text-green-300" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-gray-300" />
                      )}
                      <span className={`text-xs font-medium text-blue-100`}>
                        {isConnected ? 'Live' : 'Offline'}
                      </span>
                    </div>
                    <button
                      onClick={refreshStats}
                      disabled={statsLoading}
                      className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 text-blue-100 ${statsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {statsError && (
                <div className="px-4 py-2 bg-red-50 border-b border-red-100">
                  <div className="text-red-600 text-sm">{statsError}</div>
                </div>
              )}

              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Total Members</p>
                        <div className="text-2xl font-bold text-gray-800 mt-1">
                          {statsLoading ? (
                            <div className="animate-pulse bg-purple-200 h-7 w-14 rounded"></div>
                          ) : (
                            (communityStats.totalUsers || 0).toLocaleString()
                          )}
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Active Now</p>
                        <div className="text-2xl font-bold text-gray-800 mt-1">
                          {statsLoading ? (
                            <div className="animate-pulse bg-blue-200 h-7 w-10 rounded"></div>
                          ) : (
                            communityStats.activeUsers
                          )}
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-600 font-medium">Messages Today</p>
                        <div className="text-2xl font-bold text-gray-800 mt-1">
                          {statsLoading ? (
                            <div className="animate-pulse bg-amber-200 h-7 w-16 rounded"></div>
                          ) : (
                            (communityStats.messagesToday || 0).toLocaleString()
                          )}
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-amber-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Your Journey */}
          <div>
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden h-full">
              <div className="p-4 bg-gradient-to-r from-teal-600 to-emerald-600">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-teal-200" />
                  <h2 className="text-lg font-semibold text-white">Your Journey</h2>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-yellow-600 font-medium">Activities Logged</p>
                      <div className="text-xl font-bold text-gray-800">
                        {statsLoading ? (
                          <div className="animate-pulse bg-yellow-200 h-6 w-8 rounded"></div>
                        ) : (
                          userStats.userActivities
                        )}
                      </div>
                    </div>
                    <TrendingUp className="w-7 h-7 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-600 font-medium">Comments Made</p>
                      <div className="text-xl font-bold text-gray-800">
                        {statsLoading ? (
                          <div className="animate-pulse bg-green-200 h-6 w-8 rounded"></div>
                        ) : (
                          userStats.userComments
                        )}
                      </div>
                    </div>
                    <MessageSquare className="w-7 h-7 text-green-500" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-600 font-medium">Connections</p>
                      <div className="text-xl font-bold text-gray-800">
                        {statsLoading ? (
                          <div className="animate-pulse bg-purple-200 h-6 w-8 rounded"></div>
                        ) : (
                          userStats.userConnections
                        )}
                      </div>
                    </div>
                    <Users className="w-7 h-7 text-purple-500" />
                  </div>
                </div>

                <div className="mt-2 p-3 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Keep Growing! 🌱</h3>
                      <p className="text-sm text-purple-100">You're doing great!</p>
                    </div>
                    <Star className="w-7 h-7 text-yellow-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spiritual Activity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-4 text-white flex justify-between items-center">
              <h3 className="text-lg font-semibold">Log Spiritual Activity</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="hover:bg-white/10 rounded-full p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActivitySubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
                <select 
                  value={activityFormData.activity_type}
                  onChange={(e) => setActivityFormData({...activityFormData, activity_type: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" 
                  required
                >
                  <option value="">Select activity type</option>
                  <option value="meditation">Meditation</option>
                  <option value="mindfulness">Mindfulness</option>
                  <option value="energy_healing">Energy Healing</option>
                  <option value="yoga">Yoga</option>
                  <option value="journaling">Journaling</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input 
                  type="number" 
                  value={activityFormData.duration}
                  onChange={(e) => setActivityFormData({...activityFormData, duration: e.target.value})}
                  min="1" 
                  max="300" 
                  placeholder="Enter duration in minutes" 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  value={activityFormData.date}
                  onChange={(e) => setActivityFormData({...activityFormData, date: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea 
                  value={activityFormData.description}
                  onChange={(e) => setActivityFormData({...activityFormData, description: e.target.value})}
                  rows="3" 
                  placeholder="Describe your experience, insights, or feelings" 
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Logging...' : 'Log Activity'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button for Spiritual Activity */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 z-40 transform hover:scale-105 active:scale-95"
      >
        <span className="text-2xl">✨</span>
      </button>
    </div>
  )
}

export default Dashboard