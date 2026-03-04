import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { 
  User, 
  Mail, 
  Calendar, 
  Edit, 
  Plus, 
  Users, 
  Heart, 
  Star,
  TrendingUp,
  Globe,
  MessageCircle,
  Shield,
  CheckCircle,
  XCircle,
  Video,
  Clock,
  Loader2
} from 'lucide-react'
import { userEventService } from '../services/userEventService'
import { profileService } from '../services/profileService'
import { UserEvent } from '../types'
import CalendarView from '../components/CalendarView'

interface UserProfile {
  id: number
  username: string
  email: string
  is_admin: boolean
  profile: {
    firstName: string
    lastName: string
    bio: string
    interests: string[]
    practices: string[]
    goals: string[]
  seeking: string[]
  lastActive: string
  connections: number
  totalPractices: number
  communityContributions: number
  isOnline: boolean
}
}

const Profile: React.FC = () => {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const { socket } = useSocket()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userEvents, setUserEvents] = useState<UserEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('Profile useEffect triggered:', { username, currentUserUsername: currentUser?.username })
        
        // Check if viewing own profile
        const isOwn = currentUser && (username === currentUser.username || !username);
        console.log('Is own profile:', isOwn);
        
        if (isOwn) {
          console.log('Loading own profile')
          setIsOwnProfile(true)
          // Load current user's profile from API
          const response = await profileService.getCurrentUserProfile()
          if (response.data.success) {
            const userData = response.data.data.user
            setProfile({
              id: userData.id,
              username: userData.username,
              email: userData.email,
              is_admin: userData.is_staff || userData.is_superuser || false,
              profile: {
                firstName: userData.first_name || userData.username,
                lastName: userData.last_name || '',
                bio: userData.bio || 'No bio provided',
                interests: [], // Not available in current User model
                practices: [], // Not available in current User model
                goals: [], // Not available in current User model
                seeking: [], // Not available in current User model
                lastActive: userData.last_seen ? new Date(userData.last_seen).toLocaleString() : 'Unknown',
                connections: userData.connections || 0, // Not available in current User model
                totalPractices: userData.meditation_streak || 0, // Using meditation_streak as total practices
                communityContributions: userData.community_contributions || 0,
                isOnline: userData.is_online || false
              }
            })
            // Load user events for own profile (force load since state hasn't updated yet)
            loadUserEvents(true)
          } else {
            throw new Error('Failed to load profile')
          }
        } else if (username) {
          console.log('Loading other user profile:', username)
          // Load other user's profile from API
          setIsOwnProfile(false)
          const response = await profileService.getProfile(username)
          if (response.data.success) {
            const userData = response.data.data.user
            setProfile({
              id: userData.id,
              username: userData.username,
              email: userData.email,
              is_admin: userData.is_staff || userData.is_superuser || false,
              profile: {
                firstName: userData.first_name || userData.username,
                lastName: userData.last_name || '',
                bio: userData.bio || 'No bio provided',
                interests: [], // Not available in current User model
                practices: [], // Not available in current User model
                goals: [], // Not available in current User model
                seeking: [], // Not available in current User model
                lastActive: userData.last_seen ? new Date(userData.last_seen).toLocaleString() : 'Unknown',
                connections: userData.connections || 0, // Not available in current User model
                totalPractices: userData.meditation_streak || 0, // Using meditation_streak as total practices
                communityContributions: userData.community_contributions || 0,
                isOnline: userData.is_online || false
              }
            })
          } else {
            throw new Error('Failed to load profile')
          }
        } else {
          console.log('No user and no username - redirecting to dashboard')
          // No user and no username - redirect to dashboard or show error
          navigate('/dashboard')
        }
      } catch (err) {
        console.error('Error in Profile useEffect:', err)
        setError(err instanceof Error ? err.message : 'An error occurred loading the profile')
      }
    }

    loadProfile()
  }, [username, currentUser, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Profile</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-mindful-purple text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  const handleEditProfile = () => {
    setIsEditing(true)
  }

  const handleSaveProfile = () => {
    setIsEditing(false)
    // TODO: Save profile to backend
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // TODO: Reset profile changes
  }

  const handleConnect = () => {
    // TODO: Send connection request
    console.log('Sending connection request...')
  }

  const handleDisconnect = () => {
    // TODO: Remove connection
    console.log('Removing connection...')
  }

  // Calendar event handlers
  const loadUserEvents = async (forceLoad = false) => {
    // Only load if it's own profile or force loading
    if (!forceLoad && !isOwnProfile) {
      console.log('Skipping loadUserEvents - not own profile');
      return;
    }
    
    console.log('Loading user events...');
    setLoadingEvents(true);
    try {
      const response = await userEventService.getUserEvents();
      console.log('User events response:', response);
      setUserEvents(response.data.user_events);
    } catch (error) {
      console.error('Failed to load user events:', error);
      // If authentication error, redirect to login
      if (error instanceof Error && error.message.includes('No authentication token found')) {
        setError('Please log in to view your events');
      }
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleJoinEvent = async (eventId: number) => {
    try {
      await userEventService.joinEvent(eventId);
      console.log('Successfully joined event:', eventId);
      // After successful join, reload events
      await loadUserEvents();
    } catch (error) {
      console.error('Failed to join event:', error);
    }
  };

  const handleLeaveEvent = async (eventId: number) => {
    try {
      await userEventService.leaveEvent(eventId);
      console.log('Successfully left event:', eventId);
      // After successful leave, reload events
      await loadUserEvents();
    } catch (error) {
      console.error('Failed to leave event:', error);
    }
  };

  const handleCreateRoom = async (eventId: number) => {
    try {
      const response = await userEventService.createRoom(eventId);
      console.log('Room created:', response);
      // After successful room creation, reload events
      await loadUserEvents();
      // Show success and navigate to chat
      if (response.success && response.data.chat_room_id) {
        alert('Chat room created successfully! Click OK to join the room.');
        navigate(`/chat?roomId=${response.data.chat_room_id}`);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      alert(error instanceof Error ? error.message : 'Failed to create room');
    }
  };

  const handleJoinRoom = (roomId: number) => {
    // Navigate to chat room
    navigate(`/chat?roomId=${roomId}`);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mindful-purple"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-mindful-purple rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {(profile.profile.firstName || profile.username).charAt(0).toUpperCase()}
                </div>
                <div className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white ${profile.profile.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.profile.firstName || profile.username} {profile.profile.lastName}
                  </h1>
                  {currentUser?.is_staff && (
                    <button 
                      onClick={() => navigate(`/admin/users/${profile.id}`)}
                      className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Moderate User"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-gray-600">@{profile.username}</p>
                {profile.is_admin && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    <Shield className="w-4 h-4 mr-1" />
                    Admin
                  </span>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Last active: {profile.profile.lastActive}
                  </span>
                  <span className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {profile.email}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              {!isOwnProfile ? (
                <>
                  <button
                    onClick={handleConnect}
                    className="flex items-center space-x-2 bg-mindful-purple text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Connect</span>
                  </button>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={isEditing ? handleSaveProfile : handleEditProfile}
                  className="flex items-center space-x-2 bg-spiritual-purple text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>{isEditing ? 'Save' : 'Edit Profile'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              {isEditing ? (
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mindful-purple"
                  rows={4}
                  defaultValue={profile.profile.bio}
                />
              ) : (
                <p className="text-gray-700">{profile.profile.bio}</p>
              )}
            </div>

            {/* Interests */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {profile.profile.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-mindful-purple bg-opacity-10 text-mindful-purple"
                  >
                    {interest}
                  </span>
                ))}
                {isEditing && (
                  <button className="inline-flex items-center px-3 py-1 border-2 border-dashed border-gray-300 text-gray-500 rounded-full text-sm font-medium hover:border-mindful-purple hover:text-mindful-purple transition-colors">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Interest
                  </button>
                )}
              </div>
            </div>

            {/* Spiritual Practices */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Spiritual Practices</h2>
              <div className="space-y-3">
                {profile.profile.practices.map((practice, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-calm-green" />
                      <span className="font-medium">{practice}</span>
                    </div>
                    <span className="text-sm text-gray-500">Active</span>
                  </div>
                ))}
                {isEditing && (
                  <button className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-mindful-purple hover:text-mindful-purple transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Add Practice</span>
                  </button>
                )}
              </div>
            </div>

            {/* Goals */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Goals</h2>
              <div className="space-y-2">
                {profile.profile.goals.map((goal, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>{goal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Events Calendar */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-mindful-purple" />
                  Your Events {isOwnProfile ? '(Own Profile)' : '(Not Own Profile)'}
                </h2>
                <button
                  onClick={() => loadUserEvents(true)}
                  disabled={loadingEvents}
                  className="flex items-center space-x-2 text-sm text-mindful-purple hover:text-purple-700 transition-colors"
                >
                  {loadingEvents ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  <span>{loadingEvents ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
              <CalendarView
                userEvents={userEvents}
                onJoinEvent={handleJoinEvent}
                onLeaveEvent={handleLeaveEvent}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-mindful-purple" />
                    <span className="text-gray-700">Connections</span>
                  </div>
                  <span className="font-semibold">{profile.profile.connections}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-calm-green" />
                    <span className="text-gray-700">Total Practices</span>
                  </div>
                  <span className="font-semibold">{profile.profile.totalPractices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-gray-700">Community Contributions</span>
                  </div>
                  <span className="font-semibold">{profile.profile.communityContributions}</span>
                </div>
              </div>
            </div>

            {/* Seeking */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Seeking</h2>
              <div className="space-y-2">
                {profile.profile.seeking.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-serene-blue" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {!isOwnProfile && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-mindful-purple bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                    <MessageCircle className="w-5 h-5 text-mindful-purple" />
                    <span className="text-mindful-purple font-medium">Send Message</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-calm-green bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors">
                    <Plus className="w-5 h-5 text-calm-green" />
                    <span className="text-calm-green font-medium">Add to Group</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile