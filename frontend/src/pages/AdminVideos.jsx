import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminAPI } from '../services/adminService'
import toast from 'react-hot-toast'
import { 
  Users, 
  Video, 
  Shield, 
  TrendingUp, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Plus,
  Calendar,
  Users2,
  Lock,
  Globe,
  Clock,
  AlertTriangle,
  Check,
  EyeOff,
  RefreshCw,
  BarChart3,
  Activity,
  ChevronRight,
  MoreHorizontal,
  Loader2,
  AlertCircle
} from 'lucide-react'

// TypeScript interfaces converted to JSDoc comments for JavaScript
/**
 * @typedef {Object} VideoRoom
 * @property {number} id
 * @property {string} room_name
 * @property {string} description
 * @property {number} max_participants
 * @property {number} current_participants
 * @property {boolean} is_private
 * @property {boolean} is_active
 * @property {Object} creator
 * @property {number} creator.id
 * @property {string} creator.username
 * @property {string} creator.email
 * @property {boolean} creator.is_active
 * @property {string} created_at
 * @property {string} updated_at
 * @property {boolean} isFull
 * @property {number} occupancyPercentage
 * @property {string} status
 * @property {string} privacy
 */

/**
 * @typedef {Object} VideoAnalytics
 * @property {number} totalRooms
 * @property {number} activeRooms
 * @property {number} privateRooms
 * @property {number} publicRooms
 * @property {number} totalParticipants
 * @property {number} averageParticipants
 * @property {number} roomsCreatedToday
 * @property {number} roomsCreatedThisWeek
 * @property {number} roomsCreatedThisMonth
 * @property {number} fullRooms
 */

const AdminVideos = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [rooms, setRooms] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [privacyFilter, setPrivacyFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRooms, setTotalRooms] = useState(0)
  
  // Modal states
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false)
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  
  // Form states for editing
  const [editData, setEditData] = useState({
    room_name: '',
    description: '',
    max_participants: 10,
    is_private: false,
    is_active: true
  })

  const fetchRooms = useCallback(async (isManualRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminAPI.getVideoRooms({
        page,
        limit: 10,
        search: searchQuery,
        status: filter === 'active' ? 'active' : filter === 'inactive' ? 'inactive' : undefined,
        privacy: privacyFilter === 'private' ? 'private' : privacyFilter === 'public' ? 'public' : undefined
      })
      
      if (response.data && response.data.success) {
        setRooms(response.data.data.rooms)
        setTotalPages(response.data.data.totalPages)
        setTotalRooms(response.data.data.total)
        if (isManualRefresh) toast.success('Video rooms updated')
      }
    } catch (err) {
      console.error('Failed to fetch video rooms:', err)
      setError('Failed to load video rooms. Please try again.')
      if (isManualRefresh) toast.error('Failed to refresh video rooms')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filter, privacyFilter, page])

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true)
      setError(null)
      const response = await adminAPI.getVideoAnalytics()
      
      if (response.data && response.data.success) {
        setAnalytics(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch video analytics:', err)
      setError('Failed to load video analytics')
      toast.error('Failed to fetch analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    fetchAnalytics()
  }, [fetchRooms])

  const handleViewRoom = (room) => {
    setSelectedRoom(room)
    setIsViewModalOpen(true)
  }

  const handleEditRoom = (room) => {
    setSelectedRoom(room)
    setEditData({
      room_name: room.room_name,
      description: room.description || '',
      max_participants: room.max_participants,
      is_private: room.is_private,
      is_active: room.is_active
    })
    setIsEditModalOpen(true)
  }

  const handleModerateRoom = (room) => {
    setSelectedRoom(room)
    setIsModerationModalOpen(true)
  }

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Are you sure you want to delete "${room.room_name}"? This action cannot be undone.`)) return

    try {
      setIsActionLoading(true)
      await adminAPI.deleteVideoRoom(room.room_id)
      toast.success('Video room deleted successfully')
      fetchRooms()
    } catch (err) {
      console.error('Failed to delete video room:', err)
      toast.error('Failed to delete video room')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUpdateRoom = async (e) => {
    e.preventDefault()
    if (!selectedRoom) return

    try {
      setIsActionLoading(true)
      await adminAPI.updateVideoRoom(selectedRoom.room_id, editData)
      toast.success('Video room updated successfully')
      setIsEditModalOpen(false)
      fetchRooms()
    } catch (err) {
      console.error('Failed to update video room:', err)
      toast.error('Failed to update video room')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleModerateAction = async (action, reason) => {
    if (!selectedRoom) return

    try {
      setIsActionLoading(true)
      // For now, we'll use the update function to change room status
      // since we don't have a dedicated moderation endpoint
      const updateData = {
        room_name: selectedRoom.room_name,
        description: selectedRoom.description || '',
        max_participants: selectedRoom.max_participants,
        is_private: selectedRoom.is_private, // Preserve current privacy setting
        is_active: action === 'activate' || action === 'unlock'
      }
      
      await adminAPI.updateVideoRoom(selectedRoom.room_id, updateData)
      toast.success(`Video room ${action}d successfully`)
      setIsModerationModalOpen(false)
      fetchRooms()
    } catch (err) {
      console.error('Failed to moderate video room:', err)
      toast.error('Failed to moderate video room')
    } finally {
      setIsActionLoading(false)
    }
  }

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.creator.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && room.is_active) ||
                         (filter === 'inactive' && !room.is_active)
    const matchesPrivacy = privacyFilter === 'all' || 
                          (privacyFilter === 'private' && room.is_private) ||
                          (privacyFilter === 'public' && !room.is_private)
    return matchesSearch && matchesFilter && matchesPrivacy
  })

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 hover:shadow-md transition-all border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-black text-gray-900">{value}</p>
        </div>
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-${color}-50`}>
          <Icon className={`h-6 w-6 md:h-8 md:w-8 text-${color}-500`} />
        </div>
      </div>
    </div>
  )

  const RoomCard = ({ room }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-black text-gray-900 group-hover:text-purple-700 transition-colors">{room.room_name}</h3>
              <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                room.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {room.status}
              </span>
              <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                room.is_private ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {room.privacy}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{room.description || 'No description provided'}</p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-400 font-bold">
              <div className="flex items-center space-x-1">
                <Users2 className="w-3 h-3" />
                <span>{room.current_participants}/{room.max_participants}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>{room.is_private ? 'Private' : 'Public'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(room.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Occupancy</span>
                <span>{room.occupancyPercentage}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    room.isFull ? 'bg-red-500' : room.occupancyPercentage > 80 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, room.occupancyPercentage)}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => handleViewRoom(room)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleEditRoom(room)}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Edit Room"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleModerateRoom(room)}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
              title="Moderate Room"
            >
              <Shield className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleDeleteRoom(room)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
              title="Delete Room"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
              {room.creator.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{room.creator.username}</p>
              <p className="text-xs text-gray-400">{room.creator.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
              room.creator.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {room.creator.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                <Video className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">Video Room Management</h1>
                <p className="hidden md:block text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Admin Control Center</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 md:p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                title="Back to Dashboard"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 rotate-180" />
              </button>
              <button
                onClick={() => fetchAnalytics()}
                disabled={analyticsLoading}
                className="p-2 md:p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-5 h-5 md:w-6 md:h-6 ${analyticsLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsAnalyticsModalOpen(true)}
                className="flex items-center space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-600 px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold transition-all border border-purple-100"
              >
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-sm">Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-8">
          <StatCard
            title="Total Rooms"
            value={analytics?.totalRooms || 0}
            icon={Video}
            color="blue"
          />
          <StatCard
            title="Active Rooms"
            value={analytics?.activeRooms || 0}
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Full Rooms"
            value={analytics?.fullRooms || 0}
            icon={Users2}
            color="orange"
          />
          <StatCard
            title="Total Participants"
            value={analytics?.totalParticipants || 0}
            icon={Users}
            color="purple"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 p-4 md:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px] md:min-w-[280px]">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                <input
                  type="text"
                  placeholder="Search rooms or creators..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 md:pl-12 pr-4 py-2.5 md:py-3.5 bg-white border border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm w-full transition-all font-bold text-sm md:text-base"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 md:px-5 py-2.5 md:py-3.5 bg-white border border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all font-black uppercase text-[8px] md:text-[10px] tracking-widest text-gray-600"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <select
                value={privacyFilter}
                onChange={(e) => setPrivacyFilter(e.target.value)}
                className="px-3 md:px-5 py-2.5 md:py-3.5 bg-white border border-gray-200 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition-all font-black uppercase text-[8px] md:text-[10px] tracking-widest text-gray-600"
              >
                <option value="all">All Privacy</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs md:text-sm text-gray-400 font-bold">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
                className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-100 rounded-xl transition-all disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <button 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || loading}
                className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-100 rounded-xl transition-all disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => fetchRooms(true)}
                disabled={loading}
                className="p-2.5 bg-white border border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-100 rounded-xl transition-all disabled:opacity-50"
                title="Refresh List"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Video Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <RoomCard key={`room-${room.room_id}`} room={room} />
            ))
          ) : (
            <div className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">No Video Rooms Found</h3>
              <p className="text-gray-400">Try adjusting your search or filters to find video rooms.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-100 rounded-lg transition-all disabled:opacity-50 font-bold"
              >
                First
              </button>
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-100 rounded-lg transition-all disabled:opacity-50 font-bold"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-400 font-bold">{page} / {totalPages}</span>
              <button 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || loading}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-100 rounded-lg transition-all disabled:opacity-50 font-bold"
              >
                Next
              </button>
              <button 
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || loading}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-100 rounded-lg transition-all disabled:opacity-50 font-bold"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </main>

      {/* View Room Modal */}
      {isViewModalOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsViewModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-white/20">
              <div className="bg-white px-8 pt-8 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Video Room Details</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Complete Room Information</p>
                  </div>
                  <button onClick={() => setIsViewModalOpen(false)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-2xl transition-all">
                    <XCircle className="w-8 h-8" />
                  </button>
                </div>
                
                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl">
                        {selectedRoom.room_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-gray-900">{selectedRoom.room_name}</h4>
                        <p className="text-gray-400 font-bold">{selectedRoom.description || 'No description'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Status</p>
                        <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          selectedRoom.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedRoom.status}
                        </span>
                      </div>
                      <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Privacy</p>
                        <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          selectedRoom.is_private ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedRoom.privacy}
                        </span>
                      </div>
                      <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Capacity</p>
                        <p className="text-lg font-black text-gray-900">{selectedRoom.current_participants}/{selectedRoom.max_participants}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Occupancy</p>
                        <p className={`text-lg font-black ${
                          selectedRoom.isFull ? 'text-red-600' : selectedRoom.occupancyPercentage > 80 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {selectedRoom.occupancyPercentage}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Room Creator</h4>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black">
                          {selectedRoom.creator.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{selectedRoom.creator.username}</p>
                          <p className="text-sm text-gray-400">{selectedRoom.creator.email}</p>
                          <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mt-2 ${
                            selectedRoom.creator.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {selectedRoom.creator.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Room Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400 font-bold">Created</span>
                          <span className="text-sm font-black text-gray-900">{new Date(selectedRoom.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400 font-bold">Updated</span>
                          <span className="text-sm font-black text-gray-900">{new Date(selectedRoom.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400 font-bold">Room ID</span>
                          <span className="text-sm font-black text-gray-900">#{selectedRoom.room_id}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Occupancy Progress</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-bold">Current Participants</span>
                        <span className="font-black text-gray-900">{selectedRoom.current_participants}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full transition-all ${
                            selectedRoom.isFull ? 'bg-red-500' : selectedRoom.occupancyPercentage > 80 ? 'bg-orange-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, selectedRoom.occupancyPercentage)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>0 participants</span>
                        <span>{selectedRoom.max_participants} max</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row-reverse gap-4">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full sm:w-auto inline-flex justify-center rounded-2xl px-8 py-3.5 bg-gray-900 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-gray-800 transition-all shadow-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {isEditModalOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsEditModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-white/20">
              <form onSubmit={handleUpdateRoom}>
                <div className="bg-white px-10 pt-10 pb-6">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">Edit Video Room</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 ml-1">Update Room Settings</p>
                    </div>
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-2xl transition-all">
                      <XCircle className="w-8 h-8" />
                    </button>
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">Room Name</label>
                      <input
                        type="text"
                        value={editData.room_name}
                        onChange={(e) => setEditData({...editData, room_name: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none font-bold shadow-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">Description</label>
                      <textarea
                        rows={3}
                        value={editData.description}
                        onChange={(e) => setEditData({...editData, description: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none font-bold shadow-sm resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">Max Participants</label>
                        <input
                          type="number"
                          min="2"
                          max="50"
                          value={editData.max_participants}
                          onChange={(e) => setEditData({...editData, max_participants: parseInt(e.target.value)})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none font-bold shadow-sm"
                          required
                        />
                        <p className="text-[10px] text-gray-400 mt-1 ml-1 font-bold">Must be between 2 and 50</p>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">Room Status</label>
                        <select
                          value={editData.is_active ? 'active' : 'inactive'}
                          onChange={(e) => setEditData({...editData, is_active: e.target.value === 'active'})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none font-bold shadow-sm"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">Privacy Settings</label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center space-x-3 bg-gray-50 border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-all">
                          <input
                            type="radio"
                            name="privacy"
                            value="false"
                            checked={editData.is_private === false}
                            onChange={() => setEditData({...editData, is_private: false})}
                            className="w-4 h-4 text-purple-600"
                          />
                          <div>
                            <div className="font-black text-gray-900">Public Room</div>
                            <div className="text-xs text-gray-400">Anyone can join</div>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 bg-gray-50 border border-gray-200 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-all">
                          <input
                            type="radio"
                            name="privacy"
                            value="true"
                            checked={editData.is_private === true}
                            onChange={() => setEditData({...editData, is_private: true})}
                            className="w-4 h-4 text-purple-600"
                          />
                          <div>
                            <div className="font-black text-gray-900">Private Room</div>
                            <div className="text-xs text-gray-400">Invite only</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-10 py-8 mt-6 flex flex-col sm:flex-row-reverse gap-4">
                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="w-full sm:w-auto inline-flex justify-center rounded-2xl px-12 py-4 bg-[#6B46C1] text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#553C9A] transition-all shadow-2xl shadow-purple-200 disabled:opacity-50"
                  >
                    {isActionLoading ? 'Processing...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="w-full sm:w-auto inline-flex justify-center rounded-2xl px-12 py-4 bg-white text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:bg-gray-100 transition-all border border-gray-200 shadow-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Modal */}
      {isModerationModalOpen && selectedRoom && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsModerationModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/20">
              <div className="bg-white px-10 pt-10 pb-6">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">Moderate Room</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 ml-1">Room: {selectedRoom.room_name}</p>
                  </div>
                  <button type="button" onClick={() => setIsModerationModalOpen(false)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-2xl transition-all">
                    <XCircle className="w-8 h-8" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleModerateAction('activate')}
                      className="p-6 bg-green-50 border border-green-200 rounded-2xl text-left hover:bg-green-100 transition-all"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="font-black text-gray-900">Activate</span>
                      </div>
                      <p className="text-sm text-gray-400">Enable this room for users</p>
                    </button>
                    
                    <button
                      onClick={() => handleModerateAction('deactivate')}
                      className="p-6 bg-red-50 border border-red-200 rounded-2xl text-left hover:bg-red-100 transition-all"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <EyeOff className="w-6 h-6 text-red-600" />
                        <span className="font-black text-gray-900">Deactivate</span>
                      </div>
                      <p className="text-sm text-gray-400">Disable this room</p>
                    </button>
                    
                    <button
                      onClick={() => handleModerateAction('lock', 'Room locked by admin for moderation')}
                      className="p-6 bg-orange-50 border border-orange-200 rounded-2xl text-left hover:bg-orange-100 transition-all"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Ban className="w-6 h-6 text-orange-600" />
                        <span className="font-black text-gray-900">Lock Room</span>
                      </div>
                      <p className="text-sm text-gray-400">Lock and disable this room</p>
                    </button>
                    
                    <button
                      onClick={() => handleModerateAction('unlock')}
                      className="p-6 bg-blue-50 border border-blue-200 rounded-2xl text-left hover:bg-blue-100 transition-all"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Check className="w-6 h-6 text-blue-600" />
                        <span className="font-black text-gray-900">Unlock Room</span>
                      </div>
                      <p className="text-sm text-gray-400">Unlock and enable this room</p>
                    </button>
                  </div>
                  
                  <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-2xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      <span className="font-black text-gray-900">Quick Actions</span>
                    </div>
                    <p className="text-sm text-gray-400">Use these buttons for quick moderation actions. You can also provide a custom reason for locking rooms.</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-10 py-8 flex flex-col sm:flex-row-reverse gap-4">
                <button
                  type="button"
                  onClick={() => setIsModerationModalOpen(false)}
                  className="w-full sm:w-auto inline-flex justify-center rounded-2xl px-12 py-4 bg-gray-900 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-gray-800 transition-all shadow-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {isAnalyticsModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsAnalyticsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-white/20">
              <div className="bg-white px-10 pt-10 pb-6">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">Video Room Analytics</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 ml-1">Performance & Usage Statistics</p>
                  </div>
                  <button type="button" onClick={() => setIsAnalyticsModalOpen(false)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-2xl transition-all">
                    <XCircle className="w-8 h-8" />
                  </button>
                </div>
                
                {analyticsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                  </div>
                ) : analytics ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Rooms</p>
                            <p className="text-2xl font-black text-gray-900">{analytics.totalRooms}</p>
                          </div>
                          <Video className="w-8 h-8 text-blue-500" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Active Rooms</p>
                            <p className="text-2xl font-black text-gray-900">{analytics.activeRooms}</p>
                          </div>
                          <Activity className="w-8 h-8 text-green-500" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Private Rooms</p>
                            <p className="text-2xl font-black text-gray-900">{analytics.privateRooms}</p>
                          </div>
                          <Lock className="w-8 h-8 text-purple-500" />
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Full Rooms</p>
                            <p className="text-2xl font-black text-gray-900">{analytics.fullRooms}</p>
                          </div>
                          <Users2 className="w-8 h-8 text-orange-500" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Participation Metrics</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400 font-bold">Total Participants</span>
                            <span className="text-lg font-black text-gray-900">{analytics.totalParticipants || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400 font-bold">Average Participants</span>
                            <span className="text-lg font-black text-gray-900">{Math.round(analytics.averageParticipants || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400 font-bold">Public Rooms</span>
                            <span className="text-lg font-black text-gray-900">{analytics.publicRooms}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Creation Statistics</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400 font-bold">Created Today</span>
                            <span className="text-lg font-black text-gray-900">{analytics.roomsCreatedToday}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400 font-bold">Created This Week</span>
                            <span className="text-lg font-black text-gray-900">{analytics.roomsCreatedThisWeek}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400 font-bold">Created This Month</span>
                            <span className="text-lg font-black text-gray-900">{analytics.roomsCreatedThisMonth}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                      <div className="flex items-center space-x-3 mb-4">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                        <h4 className="text-sm font-black text-purple-600 uppercase tracking-widest">Room Health</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Active Rate</p>
                          <p className="text-lg font-black text-green-600">
                            {analytics.totalRooms > 0 ? Math.round((analytics.activeRooms / analytics.totalRooms) * 100) : 0}%
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Private Rate</p>
                          <p className="text-lg font-black text-purple-600">
                            {analytics.totalRooms > 0 ? Math.round((analytics.privateRooms / analytics.totalRooms) * 100) : 0}%
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-xl text-center border border-gray-100">
                          <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Full Rate</p>
                          <p className="text-lg font-black text-orange-600">
                            {analytics.totalRooms > 0 ? Math.round((analytics.fullRooms / analytics.totalRooms) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400">No analytics data available</p>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-10 py-8 flex flex-col sm:flex-row-reverse gap-4">
                <button
                  type="button"
                  onClick={() => setIsAnalyticsModalOpen(false)}
                  className="w-full sm:w-auto inline-flex justify-center rounded-2xl px-12 py-4 bg-gray-900 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-gray-800 transition-all shadow-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminVideos