import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  Video,
  Users,
  Plus,
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Calendar,
  MessageSquare,
  TrendingUp,
  Star,
  Zap
} from 'lucide-react'
import { videoAPI } from '../utils/api'

const VideoLobby = () => {
  const { user, token } = useAuth()
  const navigate = useNavigate()

  // State for video rooms
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  // State for room creation
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    is_private: false,
    max_participants: 10
  })

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')

  useEffect(() => {
    fetchRooms()
    // Simulate connection status check
    setTimeout(() => setIsConnected(true), 1000)
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔍 Fetching video rooms...')

      const response = await videoAPI.getRooms()
      console.log('📊 Video rooms response:', response)
      setRooms(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      console.error('❌ Error fetching rooms:', err)
      setError('Failed to load video rooms')
      console.error('Error fetching rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    try {
      const newRoomData = {
        roomName: newRoom.name,
        maxParticipants: newRoom.max_participants,
        description: newRoom.description,
        isPrivate: newRoom.is_private
      }

      const response = await videoAPI.createRoom(newRoomData)
      
      if (response.success) {
        // Refresh the room list to ensure the new room appears
        fetchRooms()
        setShowCreateForm(false)
        setNewRoom({
          name: '',
          description: '',
          is_private: false,
          max_participants: 10
        })
      } else {
        setError(response.message || 'Failed to create room')
      }
    } catch (err) {
      setError('Failed to create room. Please check your connection and try again.')
      console.error('Error creating room:', err)
    }
  }

  const handleJoinRoom = (roomId) => {
    navigate(`/video-call/${roomId}`)
  }

  const filteredAndSortedRooms = rooms
    .filter(room => {
      const matchesSearch = (room.room_name && room.room_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (room.description && room.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (room.created_by && room.created_by.toString().includes(searchTerm.toLowerCase()))

      const matchesFilter = filterType === 'all' ||
                           (filterType === 'public' && !room.is_private) ||
                           (filterType === 'private' && room.is_private) ||
                           (filterType === 'mine' && room.created_by === user?.id)

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'participants':
          return b.current_participants - a.current_participants
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'scheduled':
          return new Date(a.scheduled_time || a.created_at) - new Date(b.scheduled_time || b.created_at)
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoomStatus = (room) => {
    const now = new Date()
    const scheduledTime = new Date(room.scheduled_time)

    if (scheduledTime > now) {
      return { type: 'scheduled', label: 'Scheduled', color: 'text-blue-600' }
    } else if (room.current_participants < room.max_participants) {
      return { type: 'open', label: 'Open', color: 'text-green-600' }
    } else {
      return { type: 'full', label: 'Full', color: 'text-red-600' }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-violet-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
                <Video className="w-8 h-8" />
                <span>Video Chat Lobby</span>
              </h1>
              <div className="text-purple-100 mt-1 flex items-center space-x-4">
                <span>Connect with the community through live video</span>
                <div className="flex items-center space-x-2 bg-white/10 rounded-full px-3 py-1">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-300" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-gray-300" />
                  )}
                  <span className={`text-xs font-medium text-purple-100`}>
                    {isConnected ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/10 rounded-full px-4 py-2">
                <span className="text-sm font-medium text-purple-100">
                  {rooms.length} Active Rooms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow border border-purple-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{rooms.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border border-blue-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Public Rooms</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {rooms.filter(r => !r.is_private).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border border-green-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Upcoming Sessions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {rooms.filter(r => new Date(r.scheduled_time) > new Date()).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow border border-yellow-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Your Rooms</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {rooms.filter(r => r.created_by === user?.id).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full lg:max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search rooms, descriptions, or hosts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Rooms</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
                <option value="mine">My Rooms</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="created_at">Newest First</option>
                <option value="participants">Most Participants</option>
                <option value="scheduled">Scheduled Time</option>
                <option value="name">Name (A-Z)</option>
              </select>

              <button
                onClick={fetchRooms}
                className="flex items-center space-x-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Create Room Card */}
          <div className="bg-white rounded-xl shadow border border-purple-200 p-6 hover:shadow-lg transition-all cursor-pointer group"
               onClick={() => setShowCreateForm(true)}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Room</h3>
              <p className="text-gray-600 text-sm">Start your own video session</p>
            </div>
          </div>

          {/* Video Rooms */}
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-300 rounded mb-4"></div>
                <div className="h-3 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))
          ) : rooms.length > 0 ? (
            filteredAndSortedRooms.map((room) => {
              const status = getRoomStatus(room)
              const isFull = room.current_participants >= room.max_participants
              const isScheduled = new Date(room.scheduled_time) > new Date()

              return (
                <div key={room.room_id} className="bg-white rounded-xl shadow border border-gray-200 p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{room.room_name}</h3>
                        {room.is_private && (
                          <Shield className="w-5 h-5 text-yellow-500" title="Private Room" />
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{room.description || 'No description provided'}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Created by User {room.created_by}
                        </span>
                      </div>

                      {/* Room Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{room.current_participants}/{room.max_participants}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatTime(room.scheduled_time)}</span>
                          </span>
                        </div>
                        <span className={`font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Host Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {room.created_by ? room.created_by.toString().charAt(0) : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Created by</p>
                            <p className="text-sm text-gray-600">User ID: {room.created_by || 'Unknown'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleJoinRoom(room.room_id)}
                      disabled={isFull && !isScheduled}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        isFull && !isScheduled
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>{isFull && !isScheduled ? 'Room Full' : 'Join Room'}</span>
                    </button>

                    {room.is_private && (
                      <button className="flex items-center space-x-1 text-gray-400 hover:text-gray-600">
                        <EyeOff className="w-4 h-4" />
                        <span className="text-xs">Private</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
              <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rooms Found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? 'Try adjusting your search terms or filters' : 'Be the first to create a room!'}
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-violet-700 transition-colors"
              >
                Create Your First Room
              </button>
            </div>
          )}
        </div>

        {/* Create Room Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Create Video Room</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="hover:bg-white/10 rounded-full p-1 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateRoom} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Room Name</label>
                  <input
                    type="text"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                    placeholder="e.g., Morning Meditation Circle"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                    placeholder="Describe what this room is for..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    required
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Max Participants</label>
                    <input
                      type="number"
                      value={newRoom.max_participants || ''}
                      onChange={(e) => {
                        const value = e.target.value
                        const numValue = value === '' ? 10 : parseInt(value, 10)
                        setNewRoom({...newRoom, max_participants: isNaN(numValue) ? 10 : numValue})
                      }}
                      min="2"
                      max="50"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Privacy</label>
                    <select
                      value={newRoom.is_private ? 'private' : 'public'}
                      onChange={(e) => setNewRoom({...newRoom, is_private: e.target.value === 'private'})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-lg hover:from-purple-700 hover:to-violet-700 transition-colors"
                  >
                    Create Room
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoLobby