import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  User, 
  Edit, 
  Mail, 
  Calendar, 
  Heart, 
  Activity,
  Upload,
  Save,
  X,
  Camera,
  Plus,
  MessageCircle,
  Users,
  Star,
  Target,
  Clock,
  CheckCircle,
  UserPlus,
  UserMinus,
  Loader2
} from 'lucide-react'
import { userEventService } from '../services/userEventService'
import CalendarView from '../components/CalendarView'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const { username } = useParams()
  const [profileUser, setProfileUser] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    age: '',
    spiritual_intention: '',
    spiritual_bio: '',
    profile_image: null,
    meditation_streak: 0,
    community_contributions: 0,
    events_attended: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [connections, setConnections] = useState([])
  const [userEvents, setUserEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  // Effect to load profile user based on username param
  useEffect(() => {
    const fetchProfileUser = async () => {
      setLoadingProfile(true)
      try {
        // If no username in URL or it's the logged-in user's username, show own profile
        if (!username || (user && username === user.username)) {
          setProfileUser(user)
          setIsOwnProfile(true)
        } else {
          // Fetch the other user's profile
          const response = await fetch(`/api/users/${username}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          if (response.ok) {
            const data = await response.json()
            setProfileUser(data.data?.user || data.user || data)
            setIsOwnProfile(false)
          } else {
            console.error('Failed to fetch user profile')
            // Fallback to own profile
            setProfileUser(user)
            setIsOwnProfile(true)
          }
        }
      } catch (error) {
        console.error('Error fetching profile user:', error)
        setProfileUser(user)
        setIsOwnProfile(true)
      } finally {
        setLoadingProfile(false)
      }
    }

    if (user) {
      fetchProfileUser()
    }
  }, [username, user])

  // Effect for form data and profile data (only for own profile)
  useEffect(() => {
    if (user && isOwnProfile && profileUser) {
      console.log('User data updated:', user) // Debug log
      console.log('Profile image path:', user.profile_image) // Debug profile image path
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        age: user.age || '',
        spiritual_intention: user.spiritual_intention || 'mindfulness_meditation',
        spiritual_bio: user.bio || '',
        profile_image: null,
        meditation_streak: user.meditation_streak || 0,
        community_contributions: user.community_contributions || 0,
        events_attended: user.events_attended || 0
      })
      loadProfileData()
      const interval = setInterval(() => loadProfileData(), 60000) // Refresh every minute
      return () => clearInterval(interval)
    }
  }, [user, isOwnProfile, profileUser])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      // Load connections from real API endpoint
      const connectionsResponse = await fetch('/api/connections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!connectionsResponse.ok) {
        throw new Error('Failed to fetch profile data')
      }

      const connectionsData = await connectionsResponse.json()
      setConnections(connectionsData.connections || [])
      
      // Also load user events
      loadUserEvents()
    } catch (error) {
      console.error('Error loading profile data:', error)
      // Fallback to mock data if API fails
      setConnections([
        { id: 1, username: 'mindful_jane', first_name: 'Jane', last_name: 'Smith', spiritual_intention: 'meditation' },
        { id: 2, username: 'peaceful_john', first_name: 'John', last_name: 'Doe', spiritual_intention: 'yoga' },
        { id: 3, username: 'zen_master', first_name: 'Master', last_name: 'Zen', spiritual_intention: 'mindfulness' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const loadUserEvents = async () => {
    setLoadingEvents(true)
    try {
      const response = await userEventService.getUserEvents()
      setUserEvents(response.data.user_events || [])
    } catch (error) {
      console.error('Failed to load user events:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleJoinEvent = async (eventId) => {
    try {
      await userEventService.joinEvent(eventId)
      loadUserEvents()
    } catch (error) {
      console.error('Failed to join event:', error)
    }
  }

  const handleLeaveEvent = async (eventId) => {
    try {
      await userEventService.leaveEvent(eventId)
      loadUserEvents()
    } catch (error) {
      console.error('Failed to leave event:', error)
    }
  }

  const handleCreateRoom = async (eventId) => {
    try {
      await userEventService.createRoom(eventId)
      loadUserEvents()
    } catch (error) {
      console.error('Failed to create room:', error)
    }
  }

  const handleJoinRoom = (roomUrl) => {
    window.open(roomUrl, '_blank')
  }

  const calculateProgress = () => {
    if (!user) return { percentage: 0, stage: 'Beginning Stage' };
    const streak = user.meditation_streak || 0;
    const contributions = user.community_contributions || 0;
    const events = user.events_attended || 0;
    
    const streakPoints = Math.min(streak * 2, 30);
    const contributionPoints = Math.min(contributions * 5, 40);
    const eventPoints = Math.min(events * 10, 30);
    
    const total = streakPoints + contributionPoints + eventPoints;
    
    let stage = 'Beginning Stage';
    if (total >= 90) stage = 'Enlightened Master';
    else if (total >= 70) stage = 'Advanced Practitioner';
    else if (total >= 40) stage = 'Dedicated Seeker';
    else if (total >= 15) stage = 'Intermediate Explorer';
    
    return { percentage: total, stage };
  };

  const getYearsOnPlatform = () => {
    if (!user) return 'Less than one year';
    const joinDate = new Date(user.date_joined || user.createdAt || user.created_at);
    if (isNaN(joinDate.getTime())) return 'Less than one year';
    
    const now = new Date();
    const diffInMs = now - joinDate;
    const years = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 365.25));
    
    if (years < 1) return 'Less than one year';
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      profile_image: e.target.files[0]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Submitting profile data:', formData)

      const profileData = new FormData()
      profileData.append('first_name', formData.first_name)
      profileData.append('last_name', formData.last_name)
      profileData.append('age', formData.age)
      profileData.append('spiritual_intention', formData.spiritual_intention)
      profileData.append('bio', formData.spiritual_bio)
      profileData.append('meditation_streak', formData.meditation_streak)
      profileData.append('community_contributions', formData.community_contributions)
      profileData.append('events_attended', formData.events_attended)
      if (formData.profile_image) {
        profileData.append('profile_image', formData.profile_image)
      }

      console.log('FormData being sent:', profileData)

      const result = await updateProfile(profileData)
      console.log('Update result:', result)

      if (result.success) {
        setIsEditing(false)
        // User data is already updated in AuthContext via updateProfile
        // No need to reload - React will automatically re-render with new data
      } else {
        setError(result.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setError('An error occurred while updating your profile')
    } finally {
      setLoading(false)
    }
  }

  if (!user || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Use profileUser for display (could be own profile or another user's)
  const displayUser = profileUser || user;

  // Helper to get years on platform for any user
  const getYearsOnPlatformForUser = (userData) => {
    if (!userData) return 'Less than one year';
    const joinDate = new Date(userData.date_joined || userData.createdAt || userData.created_at);
    if (isNaN(joinDate.getTime())) return 'Less than one year';
    
    const now = new Date();
    const diffInMs = now - joinDate;
    const years = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 365.25));
    
    if (years < 1) return 'Less than one year';
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  };

  // Helper to calculate progress for any user
  const calculateProgressForUser = (userData) => {
    if (!userData) return { percentage: 0, stage: 'Beginning Stage' };
    const streak = userData.meditation_streak || 0;
    const contributions = userData.community_contributions || 0;
    const events = userData.events_attended || 0;
    
    const streakPoints = Math.min(streak * 2, 30);
    const contributionPoints = Math.min(contributions * 5, 40);
    const eventPoints = Math.min(events * 10, 30);
    
    const total = streakPoints + contributionPoints + eventPoints;
    
    let stage = 'Beginning Stage';
    if (total >= 90) stage = 'Enlightened Master';
    else if (total >= 70) stage = 'Advanced Practitioner';
    else if (total >= 40) stage = 'Dedicated Seeker';
    else if (total >= 15) stage = 'Intermediate Explorer';
    
    return { percentage: total, stage };
  };

  return (
<div className="min-h-screen bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50" key={displayUser?.id || 'profile'}>
<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50">
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50 min-h-full">
          {/* Profile Header */}
          <div className="lg:col-span-1">
<div className="bg-gray-50 rounded-xl shadow-lg p-6 border-4 border-gray-200 text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {displayUser.profile_image ? (
                  <img
                    src={displayUser.profile_image.startsWith('http') ? displayUser.profile_image : displayUser.profile_image}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src = 'https://via.placeholder.com/96/7C3AED/FFFFFF?text=👤';
                    }}
                  />
                ) : (
                  <span className="text-white text-4xl">👤</span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{displayUser.first_name || displayUser.username}</h2>
              <p className="text-serene-blue mb-4">
                🌱 {displayUser.spiritual_intention || 'Spiritual seeker'} • {getYearsOnPlatformForUser(displayUser)} on platform
              </p>

              {/* Progress Bar */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-600 mb-2">Spiritual Journey Progress</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-calm-green h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${calculateProgressForUser(displayUser).percentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {calculateProgressForUser(displayUser).percentage}% - {calculateProgressForUser(displayUser).stage}
                </p>
              </div>

              {/* Edit Profile button only for own profile */}
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-spiritual-purple hover:bg-spiritual-purple text-gray-800 py-2 px-4 rounded-lg transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/chat?userId=${displayUser.id}`)}
                  className="w-full bg-calm-green hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message {displayUser.username}</span>
                </button>
              )}
            </div>

            {/* Spiritual Stats */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6 border border-gray-200">
              <div className="p-4 bg-gradient-to-r from-teal-600 to-emerald-600">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Spiritual Stats
                </h3>
              </div>
              <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Meditation Streak</p>
                  <p className="text-2xl font-bold text-serene-blue">{displayUser.meditation_streak || 0} days 🔥</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Community Contributions</p>
                  <p className="text-2xl font-bold text-serene-blue">{displayUser.community_contributions || 0} ✨</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Events Attended</p>
                  <p className="text-2xl font-bold text-serene-blue">{displayUser.events_attended || 0} 🎟️</p>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* About Me */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border border-gray-200">
              <div className="p-4 bg-gradient-to-r from-violet-600 to-purple-600">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  About {isOwnProfile ? 'Me' : displayUser.username}
                </h3>
              </div>
              <div className="p-6">

              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2">My Spiritual Path</h4>
                <p className="text-gray-900 leading-relaxed capitalize">
                  {displayUser.spiritual_intention 
                    ? `My path is centered on ${displayUser.spiritual_intention.replace(/_/g, ' ')}.` 
                    : "I am currently exploring my spiritual path and connecting with the community."}
                </p>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2">Beliefs & Practices</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm capitalize">
                    {(displayUser.spiritual_intention || 'mindfulness').replace(/_/g, ' ')}
                  </span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Meditation</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Mindfulness</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-serene-blue mb-2">Current Focus</h4>
                <p className="text-gray-600 leading-relaxed">
                  {displayUser.bio || 'Cultivating mindfulness and inner peace through daily practice and community engagement.'}
                </p>
              </div>
              </div>
            </div>


            {/* Connections */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 border border-gray-200">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  My Connections
                </h3>
                <button
                  onClick={() => navigate('/connections')}
                  className="text-white/80 hover:text-white text-sm font-medium bg-white/10 px-3 py-1 rounded-full transition-colors flex items-center space-x-1"
                >
                  <span>View All</span>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mindful-purple mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading connections...</p>
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No connections yet. Start connecting with other spiritual seekers!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {connections.map((connection) => (
                    <div key={connection.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-center">
                      <div className="w-16 h-16 bg-mindful-purple bg-opacity-10 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-mindful-purple border-opacity-20">
                        <span className="text-mindful-purple text-lg font-bold">
                          {connection.first_name?.charAt(0)}{connection.last_name?.charAt(0)}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-base mb-1">{connection.username}</h4>
                      <p className="text-xs text-gray-500 mb-4 font-medium">Spiritual Seeker</p>
                      <div className="flex flex-col space-y-2">
                        <button 
                          onClick={() => navigate(`/chat?userId=${connection.id}`)}
                          className="w-full bg-calm-green hover:bg-green-600 text-white py-2 px-3 rounded-lg transition-colors text-xs font-bold flex items-center justify-center space-x-2"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Message</span>
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/connections/${connection.id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                  'Content-Type': 'application/json'
                                }
                              })

                              if (response.ok) {
                                setConnections(connections.filter(c => c.id !== connection.id))
                              } else {
                                console.error('Failed to remove connection')
                              }
                            } catch (error) {
                              console.error('Error removing connection:', error)
                            }
                          }}
                          className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 px-3 rounded-lg transition-colors text-xs font-bold flex items-center justify-center space-x-2"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>

            {/* My Events Calendar */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <div className="p-4 bg-gradient-to-r from-amber-600 to-orange-600 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  My Events
                </h3>
                <button
                  onClick={() => loadUserEvents()}
                  disabled={loadingEvents}
                  className="text-white/80 hover:text-white text-sm font-medium bg-white/10 px-3 py-1 rounded-full transition-colors flex items-center space-x-1"
                >
                  {loadingEvents ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  <span>{loadingEvents ? 'Loading...' : 'Refresh'}</span>
                </button>
              </div>
              <div className="p-4 sm:p-6">
              <CalendarView
                userEvents={userEvents}
                onJoinEvent={handleJoinEvent}
                onLeaveEvent={handleLeaveEvent}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
              />
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<div className="bg-gray-50 rounded-lg w-full max-w-md relative max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-4 p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Edit Profile</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Spiritual Intention</label>
                      <select
                        name="spiritual_intention"
                        value={formData.spiritual_intention}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-50"
                      >
                        <option value="mindfulness_meditation">Mindfulness & Meditation</option>
                        <option value="spiritual_growth">Spiritual Growth</option>
                        <option value="energy_healing">Energy Healing</option>
                        <option value="community_connection">Community Connection</option>
                        <option value="self_discovery">Self-Discovery</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Spiritual Bio</label>
                      <textarea
                        name="spiritual_bio"
                        value={formData.spiritual_bio}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-50"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                      <input
                        type="file"
                        name="profile_image"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meditation Streak</label>
                      <input
                        type="number"
                        name="meditation_streak"
                        value={formData.meditation_streak}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Community Contributions</label>
                      <input
                        type="number"
                        name="community_contributions"
                        value={formData.community_contributions}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Events Attended</label>
                      <input
                        type="number"
                        name="events_attended"
                        value={formData.events_attended}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-50"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-spiritual-purple hover:bg-spiritual-purple text-gray-800 py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}</div>
    </div>
  )
}

export default Profile