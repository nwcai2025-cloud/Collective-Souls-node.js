import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { adminAPI } from '../services/adminService'
import toast from 'react-hot-toast'
import { 
  Users, 
  MessageCircle, 
  Shield, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Search, 
  Filter,
  Eye,
  Ban,
  UserPlus,
  MessageSquare,
  Edit,
  BarChart3,
  Globe,
  Loader2,
  RotateCw,
  Video,
  Activity,
  Bell,
  LogOut,
  Settings,
  ArrowLeft,
  Lock,
  UserCheck,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import AdminReportsList from '../components/AdminReportsList'
import AdminFeatureControls from '../components/AdminFeatureControls'

interface User {
  id: number
  username: string
  email: string
  lastActive: string
  isActive: boolean
  isAdmin: boolean
  joinDate: string
  first_name?: string
  last_name?: string
  bio?: string
  spiritual_intention?: string
  meditation_streak?: number
  community_contributions?: number
  events_attended?: number
}

interface Report {
  id: number
  type: 'spam' | 'harassment' | 'inappropriate' | 'other'
  reportedBy: string
  reportedUser: string
  content: string
  status: 'pending' | 'reviewed' | 'resolved'
  timestamp: string
}

interface AuditLog {
  id: number
  action: string
  resource_type: string
  resource_id: number
  created_at: string
  adminUser?: {
    user?: {
      username: string
    }
  }
}

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  // Determine active view from URL
  const getActiveViewFromPath = () => {
    const path = location.pathname.split('/').pop()
    if (path && ['users', 'reports', 'moderation', 'analytics', 'videos', 'logs'].includes(path)) {
      return path
    }
    return 'overview'
  }

  const activeView = getActiveViewFromPath()
  const [users, setUsers] = useState<User[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Moderation states
  const [comments, setComments] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [events_list, setEventsList] = useState<any[]>([])
  const [dms_list, setDMsList] = useState<any[]>([])
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [moderationTab, setModerationTab] = useState<'comments' | 'activities' | 'events' | 'dms' | 'chat'>('comments')
  const [moderationFilter, setModerationFilter] = useState('pending')
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEditContentModalOpen, setIsEditContentModalOpen] = useState(false)
  const [editingContent, setEditingContent] = useState<{ id: number, type: 'comment' | 'activity' | 'chat', text: string }>({ id: 0, type: 'comment', text: '' })
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const fetchUsers = useCallback(async (isManualRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminAPI.getUsers({
        search: searchQuery,
        role: filter === 'admin' ? 'admin' : undefined,
        status: ['active', 'inactive'].includes(filter) ? filter : undefined
      })
      if (response.data && response.data.success && response.data.data && response.data.data.users) {
        const transformedUsers = response.data.data.users.map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          lastActive: user.last_login || 'Never',
          isActive: user.is_active,
          isAdmin: user.is_staff || user.is_superuser,
          joinDate: user.createdAt || user.created_at || user.date_joined,
          first_name: user.first_name,
          last_name: user.last_name,
          bio: user.bio,
          spiritual_intention: user.spiritual_intention,
          meditation_streak: user.meditation_streak,
          community_contributions: user.community_contributions,
          events_attended: user.events_attended
        }))
        setUsers(transformedUsers)
        if (isManualRefresh) toast.success('User list updated')
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err)
      setError('Failed to load users. Please try again.')
      if (isManualRefresh) toast.error('Failed to refresh users')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filter])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminAPI.getReports()
      if (response.data && response.data.success && response.data.data && response.data.data.reports) {
        const transformedReports = response.data.data.reports.map((report: any) => ({
          id: report.id,
          type: (report.reason || 'other').toLowerCase() as 'spam' | 'harassment' | 'inappropriate' | 'other',
          reportedBy: report.reporter?.username || 'Unknown',
          reportedUser: 'Unknown',
          content: report.description || report.reason || 'No content',
          status: (report.status || 'pending').toLowerCase() as 'pending' | 'reviewed' | 'resolved',
          timestamp: report.created_at || report.createdAt
        }))
        setReports(transformedReports)
      }
    } catch (err: any) {
      console.error('Failed to fetch reports:', err)
      setError('Failed to load reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats()
      if (response.data && response.data.success) {
        setStats(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const response = await adminAPI.getAuditLogs()
      if (response.data && response.data.success) {
        setAuditLogs(response.data.data.logs || [])
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
      setAuditLogs([])
    }
  }

  const fetchSystemLogs = async () => {
    try {
      const response = await adminAPI.getSystemLogs()
      if (response.data && response.data.success) {
        setSystemInfo(response.data.data.systemInfo)
      }
    } catch (err) {
      console.error('Failed to fetch system logs:', err)
    }
  }

  const fetchLogsData = async () => {
    setLoading(true)
    setError(null)
    await Promise.all([
      fetchAuditLogs(),
      fetchSystemLogs()
    ])
    setLoading(false)
  }

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const [userRes, contentRes, platformRes] = await Promise.all([
        adminAPI.getUserAnalytics().catch(e => ({ data: { data: null } })),
        adminAPI.getContentAnalytics().catch(e => ({ data: { data: null } })),
        adminAPI.getPlatformAnalytics().catch(e => ({ data: { data: null } }))
      ])
      
      const users = userRes.data.data || { newUsersToday: 0, newUsersThisWeek: 0, newUsersThisMonth: 0 }
      const content = contentRes.data.data || { totalComments: 0, totalActivities: 0, moderatedComments: 0, moderatedActivities: 0, resolvedReports: 0 }
      const platform = platformRes.data.data || { totalUsers: 0, totalAdmins: 0 }

      setAnalyticsData({
        users,
        content,
        platform
      })
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const fetchModerationData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = {}
      if (moderationFilter !== 'all') {
        params.status = moderationFilter
      }
      
      if (moderationTab === 'comments') {
        const res = await adminAPI.getComments(params)
        if (res.data?.success) setComments(res.data.data.comments)
      } else if (moderationTab === 'activities') {
        const res = await adminAPI.getActivities(params)
        if (res.data?.success) setActivities(res.data.data.activities)
      } else if (moderationTab === 'events') {
        const res = await adminAPI.getEvents(params)
        if (res.data?.success) setEventsList(res.data.data.events)
      } else if (moderationTab === 'dms') {
        const res = await adminAPI.getAdminDMs(params)
        if (res.data?.success) setDMsList(res.data.data.dms)
      } else if (moderationTab === 'chat') {
        const res = await adminAPI.getChatMessages(params)
        if (res.data?.success) setChatMessages(res.data.data.messages)
      }
    } catch (err) {
      console.error('Failed to fetch moderation data:', err)
      setError('Failed to load moderation data')
    } finally {
      setLoading(false)
    }
  }

  const handleModerateComment = async (id: number, status: string, content?: string) => {
    try {
      setIsActionLoading(true)
      await adminAPI.moderateComment(id, { status, content })
      toast.success(`Comment ${status} successfully`)
      fetchModerationData()
    } catch (err) {
      toast.error('Failed to moderate comment')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteComment = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    try {
      setIsActionLoading(true)
      await adminAPI.deleteComment(id)
      toast.success('Comment deleted successfully')
      fetchModerationData()
    } catch (err) {
      toast.error('Failed to delete comment')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleModerateActivity = async (id: number, status: string, description?: string) => {
    try {
      setIsActionLoading(true)
      await adminAPI.moderateActivity(id, { status, description })
      toast.success(`Activity ${status} successfully`)
      fetchModerationData()
    } catch (err) {
      toast.error('Failed to moderate activity')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleModerateChatMessage = async (id: number, status: string, content?: string) => {
    try {
      setIsActionLoading(true)
      await adminAPI.moderateChatMessage(id, { status, content })
      toast.success(`Message ${status} successfully`)
      fetchModerationData()
    } catch (err) {
      toast.error('Failed to moderate message')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    try {
      setIsActionLoading(true)
      await adminAPI.deleteEvent(id)
      toast.success('Event deleted successfully')
      fetchModerationData()
    } catch (err) {
      toast.error('Failed to delete event')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteAdminDM = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this DM conversation?')) return
    try {
      setIsActionLoading(true)
      await adminAPI.deleteAdminDM(id)
      toast.success('DM deleted successfully')
      fetchModerationData()
    } catch (err) {
      toast.error('Failed to delete DM')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteChatMessage = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return
    try {
      setIsActionLoading(true)
      await adminAPI.deleteChatMessage(id)
      toast.success('Message deleted successfully')
      fetchModerationData()
    } catch (err) {
      toast.error('Failed to delete message')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSaveEditedContent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsActionLoading(true)
      if (editingContent.type === 'comment') {
        await adminAPI.moderateComment(editingContent.id, { content: editingContent.text })
      } else if (editingContent.type === 'activity') {
        await adminAPI.moderateActivity(editingContent.id, { description: editingContent.text })
      } else if (editingContent.type === 'chat') {
        await adminAPI.moderateChatMessage(editingContent.id, { content: editingContent.text })
      }
      toast.success('Content updated successfully')
      setIsEditContentModalOpen(false)
      fetchModerationData()
    } catch (err) {
      toast.error('Failed to update content')
    } finally {
      setIsActionLoading(false)
    }
  }

  useEffect(() => {
    if (activeView === 'users') {
      const timer = setTimeout(() => {
        fetchUsers()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [activeView, fetchUsers])

  useEffect(() => {
    fetchStats()
    if (activeView === 'reports') {
      fetchReports()
    } else if (activeView === 'logs') {
      fetchLogsData()
    } else if (activeView === 'analytics') {
      fetchAnalytics()
    } else if (activeView === 'moderation') {
      fetchModerationData()
    }
  }, [activeView, moderationTab, moderationFilter])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/admin')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleViewUser = async (userId: number) => {
    try {
      setIsActionLoading(true)
      const response = await adminAPI.getUser(userId)
      if (response.data && response.data.success) {
        const userData = response.data.data
        setSelectedUser({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          lastActive: userData.last_login || 'Never',
          isActive: userData.is_active,
          isAdmin: userData.is_staff || userData.is_superuser,
          joinDate: userData.createdAt || userData.created_at || userData.date_joined,
          first_name: userData.first_name,
          last_name: userData.last_name,
          bio: userData.bio,
          spiritual_intention: userData.spiritual_intention,
          meditation_streak: userData.meditation_streak,
          community_contributions: userData.community_contributions,
          events_attended: userData.events_attended
        })
        setIsViewModalOpen(true)
      }
    } catch (err) {
      console.error('Failed to fetch user details:', err)
      toast.error('Failed to load user details')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSuspendUser = async (userId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'suspend' : 'reactivate'
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      setIsActionLoading(true)
      if (currentStatus) {
        await adminAPI.suspendUser(userId)
        toast.success('User suspended successfully')
      } else {
        await adminAPI.updateUser(userId, { is_active: true })
        toast.success('User reactivated successfully')
      }
      fetchUsers()
    } catch (err) {
      console.error('Failed to update user status:', err)
      toast.error('Failed to update user status')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY DELETE this user? This action cannot be undone.')) return

    try {
      setIsActionLoading(true)
      await adminAPI.deleteUser(userId)
      toast.success('User permanently deleted')
      setIsViewModalOpen(false)
      fetchUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
      toast.error('Failed to delete user')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handlePromoteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to promote this user to Admin?')) return

    try {
      setIsActionLoading(true)
      await adminAPI.promoteUser(userId, 1)
      toast.success('User promoted to admin')
      setIsViewModalOpen(false)
      fetchUsers()
    } catch (err) {
      console.error('Failed to promote user:', err)
      toast.error('Failed to promote user')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      setIsActionLoading(true)
      const updateData: any = {
        username: selectedUser.username,
        email: selectedUser.email,
        first_name: selectedUser.first_name,
        last_name: selectedUser.last_name,
        spiritual_intention: selectedUser.spiritual_intention,
        bio: selectedUser.bio
      }

      if (newPassword) {
        updateData.password = newPassword
      }

      await adminAPI.updateUser(selectedUser.id, updateData)
      toast.success('User updated successfully')
      setIsEditModalOpen(false)
      setNewPassword('')
      fetchUsers()
    } catch (err) {
      console.error('Failed to update user:', err)
      toast.error('Failed to update user')
    } finally {
      setIsActionLoading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && u.isActive) ||
                         (filter === 'inactive' && !u.isActive) ||
                         (filter === 'admin' && u.isAdmin)
    return matchesSearch && matchesFilter
  })

  const StatCard = ({ title, value, icon: Icon, color = 'blue' }: any) => (
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

  const QuickActionCard = ({ title, description, icon: Icon, onClick, color = 'blue' }: any) => (
    <div 
      className={`bg-white rounded-2xl shadow-sm p-4 md:p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-${color}-500 hover:border-${color}-600 group relative overflow-hidden`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h3 className="text-base md:text-lg font-black text-gray-900 group-hover:text-purple-700 transition-colors">{title}</h3>
          <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">{description}</p>
        </div>
        <div className={`p-2 md:p-3 rounded-lg md:rounded-xl bg-${color}-50 group-hover:bg-${color}-100 transition-colors`}>
          <Icon className={`h-6 w-6 md:h-8 md:w-8 text-${color}-500`} />
        </div>
      </div>
      <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-10 transition-opacity">
        <ChevronRight className="w-8 h-8 md:w-12 md:h-12 text-gray-900" />
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
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-black text-gray-900 tracking-tight">Admin</h1>
                <p className="hidden md:block text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Welcome back, <span className="text-purple-600">{user?.username}</span></p>
              </div>
            </div>
            <div className="flex items-center space-x-1 md:space-x-3">
              <button
                onClick={() => navigate('/admin/notifications')}
                className="p-2 md:p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                title="Notifications"
              >
                <Bell className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              <button
                onClick={() => navigate('/admin/settings')}
                className="p-2 md:p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                title="Settings"
              >
                <Settings className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 md:space-x-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold transition-all border border-red-100 hover:border-red-600 shadow-sm"
              >
                <LogOut className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-xs md:text-base">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {activeView === 'overview' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-8 md:mb-12">
              <StatCard
                title="Total Users"
                value={stats?.totalUsers || 0}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Active Admins"
                value={stats?.totalAdmins || 0}
                icon={Shield}
                color="purple"
              />
              <StatCard
                title="Pending Reports"
                value={stats?.pendingReports || 0}
                icon={AlertTriangle}
                color="orange"
              />
              <StatCard
                title="Total Comments"
                value={stats?.totalComments || 0}
                icon={MessageSquare}
                color="green"
              />
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 mb-8">
              <QuickActionCard
                title="User Management"
                description="View, edit, and manage all users"
                icon={Users}
                onClick={() => navigate('/admin/users')}
                color="blue"
              />
              <QuickActionCard
                title="Content Moderation"
                description="Review and moderate user content"
                icon={MessageSquare}
                onClick={() => navigate('/admin/moderation')}
                color="green"
              />
              <QuickActionCard
                title="Content Reports"
                description="Handle user reports and complaints"
                icon={AlertTriangle}
                onClick={() => navigate('/admin/reports')}
                color="orange"
              />
              <QuickActionCard
                title="Video Room Management"
                description="Review and manage video chat rooms"
                icon={Video}
                onClick={() => navigate('/admin/videos')}
                color="purple"
              />
              <QuickActionCard
                title="Analytics"
                description="View platform statistics and insights"
                icon={BarChart3}
                onClick={() => navigate('/admin/analytics')}
                color="blue"
              />
              <QuickActionCard
                title="System Logs"
                description="Monitor system activity and events"
                icon={Activity}
                onClick={() => navigate('/admin/logs')}
                color="gray"
              />
            </div>
          </>
        ) : activeView === 'users' ? (
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-8 border-b border-gray-100 bg-gray-50/30">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-center space-x-3 md:space-x-5">
                  <button 
                    onClick={() => navigate('/admin/dashboard')}
                    className="p-2 md:p-3 bg-white shadow-sm border border-gray-100 hover:shadow-md rounded-xl md:rounded-2xl transition-all text-gray-600 hover:text-purple-600"
                  >
                    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                  <div>
                    <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight">User Management</h2>
                    <p className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-0.5 md:mt-1">Community Control Center</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                  <div className="relative flex-1 min-w-[200px] md:min-w-[280px]">
                    <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                    <input
                      type="text"
                      placeholder="Search users..."
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
                    <option value="inactive">Suspended</option>
                    <option value="admin">Administrators</option>
                  </select>
                  <button 
                    onClick={() => fetchUsers(true)}
                    disabled={loading}
                    className="p-2.5 md:p-3.5 bg-white border border-gray-200 text-gray-400 hover:text-purple-600 hover:border-purple-100 rounded-xl md:rounded-2xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                    title="Refresh List"
                  >
                    <RotateCw className={`w-5 h-5 md:w-6 md:h-6 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Mobile User Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                <div key={u.id} className="p-4 hover:bg-purple-50/30 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-md">
                        {(u.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-bold text-gray-900">{u.username || 'Unknown'}</div>
                        <div className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Joined {u.joinDate ? new Date(u.joinDate).toLocaleDateString() : 'Unknown'}</div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleViewUser(u.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        disabled={isActionLoading}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUser(u)
                          setIsEditModalOpen(true)
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleSuspendUser(u.id, u.isActive)}
                        className={`p-2 rounded-lg transition-all ${u.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                        disabled={isActionLoading}
                      >
                        {u.isActive ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        disabled={isActionLoading}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-400 font-black uppercase block mb-1">Email</span>
                      <span className="text-gray-700 font-bold truncate block">{u.email}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-400 font-black uppercase block mb-1">Status</span>
                      <span className={`font-black uppercase tracking-widest ${u.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-400 font-black uppercase block mb-1">Role</span>
                      <span className={`font-black uppercase tracking-widest ${u.isAdmin ? 'text-purple-600' : 'text-gray-500'}`}>
                        {u.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-400 font-black uppercase block mb-1">Last Seen</span>
                      <span className="text-gray-700 font-bold">
                        {u.lastActive !== 'Never' ? new Date(u.lastActive).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-400">No users found</p>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">User Identity</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Email Address</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Access Level</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Last Seen</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                  {filteredUsers.length > 0 ? filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-purple-50/30 transition-colors group">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-md group-hover:scale-110 transition-transform">
                            {(u.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-base font-bold text-gray-900">{u.username || 'Unknown'}</div>
                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Joined {u.joinDate ? new Date(u.joinDate).toLocaleDateString() : 'Unknown'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600 font-bold">{u.email}</td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          u.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {u.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-400 font-bold">
                        {u.lastActive !== 'Never' ? new Date(u.lastActive).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleViewUser(u.id)}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                            title="View Details"
                            disabled={isActionLoading}
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUser(u)
                              setIsEditModalOpen(true)
                            }}
                            className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                            title="Edit User"
                          >
                            <UserPlus className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleSuspendUser(u.id, u.isActive)}
                            className={`p-2.5 rounded-xl transition-all border border-transparent ${u.isActive ? 'text-red-600 hover:bg-red-50 hover:border-red-100' : 'text-green-600 hover:bg-green-50 hover:border-green-100'}`}
                            title={u.isActive ? 'Suspend User' : 'Reactivate User'}
                            disabled={isActionLoading}
                          >
                            {u.isActive ? <Ban className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                            title="Delete User Permanently"
                            disabled={isActionLoading}
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <Users className="w-16 h-16 text-gray-200 mb-4" />
                          <p className="text-xl font-bold text-gray-400">No users found</p>
                          <p className="text-sm text-gray-300 mt-1">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeView === 'reports' ? (
          <AdminReportsList />
        ) : activeView === 'analytics' ? (
          <div className="space-y-8">
            <div className="flex items-center space-x-5 mb-8">
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className="p-3 bg-white shadow-sm border border-gray-100 hover:shadow-md rounded-2xl transition-all text-gray-600 hover:text-purple-600"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Platform Analytics</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Insights & Performance Metrics</p>
              </div>
            </div>

            {analyticsData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">User Growth</h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-bold text-gray-600">Today</span>
                          <span className="text-sm font-black text-purple-600">+{analyticsData.users.newUsersToday}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full" style={{ width: `${Math.min(100, (analyticsData.users.newUsersToday / 10) * 100)}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-bold text-gray-600">This Week</span>
                          <span className="text-sm font-black text-blue-600">+{analyticsData.users.newUsersThisWeek}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (analyticsData.users.newUsersThisWeek / 50) * 100)}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-bold text-gray-600">This Month</span>
                          <span className="text-sm font-black text-green-600">+{analyticsData.users.newUsersThisMonth}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full" style={{ width: `${Math.min(100, (analyticsData.users.newUsersThisMonth / 200) * 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Content Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Comments</p>
                        <p className="text-2xl font-black text-gray-900">{analyticsData.content.totalComments}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Activities</p>
                        <p className="text-2xl font-black text-gray-900">{analyticsData.content.totalActivities}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-black text-red-400 uppercase mb-1">Moderated</p>
                        <p className="text-2xl font-black text-red-600">{analyticsData.content.moderatedComments + analyticsData.content.moderatedActivities}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-2xl">
                        <p className="text-[10px] font-black text-green-400 uppercase mb-1">Resolved</p>
                        <p className="text-2xl font-black text-green-600">{analyticsData.content.resolvedReports}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Platform Health</h3>
                    <div className="flex items-center justify-center h-32">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path className="text-gray-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                          <path className="text-green-500" strokeDasharray="98, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-gray-900">98%</span>
                          <span className="text-[8px] font-black text-gray-400 uppercase">Uptime</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-xs font-bold text-gray-400 mt-4">All systems operational</p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Platform Distribution</h3>
                  </div>
                  <div className="p-8">
                    <div className="flex items-end justify-between h-48 gap-4">
                      {[45, 67, 89, 34, 56, 78, 92].map((val, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full bg-purple-100 rounded-t-xl relative group" style={{ height: `${val}%` }}>
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              {val}%
                            </div>
                            <div className="absolute inset-0 bg-purple-500 rounded-t-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                          <span className="text-[10px] font-black text-gray-400 uppercase">Day {i+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              </div>
            )}
          </div>
        ) : activeView === 'logs' ? (
          <div className="space-y-8">
            <div className="flex items-center space-x-5 mb-8">
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className="p-3 bg-white shadow-sm border border-gray-100 hover:shadow-md rounded-2xl transition-all text-gray-600 hover:text-purple-600"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">System Logs</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Audit Trail & System Health</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Admin Audit Trail</h3>
                  <button onClick={fetchAuditLogs} className="text-purple-600 hover:text-purple-700">
                    <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-50">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Resource</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {auditLogs.length > 0 ? auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">{log.adminUser?.user?.username || 'System'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                              log.action === 'delete' ? 'bg-red-100 text-red-700' :
                              log.action === 'update' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs font-medium text-gray-500">{log.resource_type} #{log.resource_id}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-bold">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold">No audit logs found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">System Info</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    {systemInfo ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase">OS Platform</span>
                          <span className="text-sm font-black text-gray-900">{systemInfo.platform}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase">Node Version</span>
                          <span className="text-sm font-black text-purple-600">{systemInfo.nodeVersion}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase">CPU Cores</span>
                          <span className="text-sm font-black text-gray-900">{systemInfo.cpus}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400 uppercase">Memory</span>
                          <span className="text-sm font-black text-gray-900">{Math.round(systemInfo.totalmem / 1024 / 1024 / 1024)} GB</span>
                        </div>
                        <div className="pt-4 border-t border-gray-50">
                          <div className="flex justify-between mb-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Memory Usage</span>
                            <span className="text-[10px] font-black text-gray-900">{Math.round((1 - systemInfo.freemem / systemInfo.totalmem) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-purple-500 h-full transition-all duration-1000" 
                              style={{ width: `${(1 - systemInfo.freemem / systemInfo.totalmem) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className="text-xs font-black uppercase tracking-widest">Live Server Status</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                      <span>API Latency</span>
                      <span className="text-green-400">24ms</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                      <span>Socket Conn.</span>
                      <span className="text-green-400">Active</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                      <span>DB Status</span>
                      <span className="text-green-400">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeView === 'moderation' ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-5">
                <button 
                  onClick={() => navigate('/admin/dashboard')}
                  className="p-3 bg-white shadow-sm border border-gray-100 hover:shadow-md rounded-2xl transition-all text-gray-600 hover:text-purple-600"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Content Moderation</h2>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Review and manage user content</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={moderationFilter}
                  onChange={(e) => setModerationFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-sm"
                >
                  <option value="all">All Content</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="deleted">Deleted</option>
                </select>
                <button 
                  onClick={fetchModerationData}
                  className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-purple-600 rounded-xl transition-all"
                >
                  <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="flex flex-wrap border-b border-gray-100 bg-gray-50/30">
                {[
                  { id: 'comments', label: 'Comments' },
                  { id: 'activities', label: 'Activities' },
                  { id: 'events', label: 'Events' },
                  { id: 'dms', label: 'DMs' },
                  { id: 'chat', label: 'Chat / DMs' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setModerationTab(tab.id as any)}
                    className={`flex-1 min-w-[50%] sm:min-w-0 py-4 px-2 text-[11px] md:text-sm font-black uppercase tracking-tight md:tracking-widest transition-all border-b-2 ${
                      moderationTab === tab.id 
                        ? 'text-purple-600 border-purple-600 bg-white shadow-inner' 
                        : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-100/50'
                    } border-r border-gray-100/50`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {moderationTab === 'comments' && (
                      comments.length > 0 ? comments.map((c) => (
                        <div key={c.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-black">
                                {c.author?.username?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{c.author?.username}</p>
                                <p className="text-[10px] text-gray-400 font-black uppercase">{new Date(c.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  setEditingContent({ id: c.id, type: 'comment', text: c.content })
                                  setIsEditContentModalOpen(true)
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Content"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {c.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleModerateComment(c.id, 'approved')}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleModerateComment(c.id, 'rejected')}
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={() => handleDeleteComment(c.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-700 bg-white p-4 rounded-xl border border-gray-100">{c.content}</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Type: {c.commentable_type}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase">•</span>
                            <span className={`text-[10px] font-black uppercase ${
                              c.status === 'approved' ? 'text-green-500' : 
                              c.status === 'rejected' ? 'text-orange-500' : 
                              'text-blue-500'
                            }`}>{c.status}</span>
                          </div>
                        </div>
                      )) : <p className="text-center py-12 text-gray-400 font-bold">No comments found</p>
                    )}

                    {moderationTab === 'activities' && (
                      activities.length > 0 ? activities.map((a) => (
                        <div key={a.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                                {a.user?.username?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{a.user?.username}</p>
                                <p className="text-[10px] text-gray-400 font-black uppercase">{new Date(a.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  setEditingContent({ id: a.id, type: 'activity', text: a.description })
                                  setIsEditContentModalOpen(true)
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Content"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {a.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleModerateActivity(a.id, 'approved')}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleModerateActivity(a.id, 'rejected')}
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 bg-white p-4 rounded-xl border border-gray-100">{a.description}</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Type: {a.activity_type}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase">•</span>
                            <span className={`text-[10px] font-black uppercase ${
                              a.status === 'approved' ? 'text-green-500' : 
                              a.status === 'rejected' ? 'text-orange-500' : 
                              'text-blue-500'
                            }`}>{a.status}</span>
                          </div>
                        </div>
                      )) : <p className="text-center py-12 text-gray-400 font-bold">No activities found</p>
                    )}

                    {moderationTab === 'events' && (
                      events_list.length > 0 ? events_list.map((e) => (
                        <div key={e.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 font-black">
                                {e.creator?.username?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{e.title}</p>
                                <p className="text-[10px] text-gray-400 font-black uppercase">Hosted by {e.creator?.username} • {new Date(e.start_time).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleDeleteEvent(e.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Event"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-700 bg-white p-4 rounded-xl border border-gray-100">{e.description || 'No description'}</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Type: {e.event_type}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase">•</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase">Location: {e.location}</span>
                          </div>
                        </div>
                      )) : <p className="text-center py-12 text-gray-400 font-bold">No events found</p>
                    )}

                    {moderationTab === 'dms' && (
                      dms_list.length > 0 ? dms_list.map((dm) => (
                        <div key={dm.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-black">
                                {dm.creator?.username?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">
                                  {dm.users?.map((u: any) => u.username).join(', ')}
                                </p>
                                <p className="text-[10px] text-gray-400 font-black uppercase">Created by {dm.creator?.username} • {new Date(dm.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleDeleteAdminDM(dm.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete DM"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Status: {dm.status}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase">•</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase">Group: {dm.is_group_chat ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      )) : <p className="text-center py-12 text-gray-400 font-bold">No DMs found</p>
                    )}

                    {moderationTab === 'chat' && (
                      chatMessages.length > 0 ? chatMessages.map((m) => (
                        <div key={m.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black">
                                {m.sender?.username?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{m.sender?.username}</p>
                                <p className="text-[10px] text-gray-400 font-black uppercase">{new Date(m.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => {
                                  setEditingContent({ id: m.id, type: 'chat', text: m.content })
                                  setIsEditContentModalOpen(true)
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Content"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {m.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleModerateChatMessage(m.id, 'approved')}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleModerateChatMessage(m.id, 'rejected')}
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                    title="Reject"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button 
                                onClick={() => handleDeleteChatMessage(m.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-700 bg-white p-4 rounded-xl border border-gray-100">{m.content}</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase">
                              {m.room_id ? `Room: ${m.room?.name}` : `DM: ${m.dm?.name || 'Direct Message'}`}
                            </span>
                            <span className="text-[10px] font-black text-gray-400 uppercase">•</span>
                            <span className={`text-[10px] font-black uppercase ${
                              m.status === 'approved' ? 'text-green-500' : 
                              m.status === 'rejected' ? 'text-orange-500' : 
                              'text-blue-500'
                            }`}>{m.status}</span>
                          </div>
                        </div>
                      )) : <p className="text-center py-12 text-gray-400 font-bold">No chat messages found</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-16 text-center border border-gray-100">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-purple-50 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 rotate-3 group-hover:rotate-0 transition-transform">
              <Activity className="w-8 h-8 md:w-12 md:h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">Coming Soon</h2>
            <p className="text-gray-500 max-w-md mx-auto text-base md:text-lg font-medium">The <span className="text-purple-600 font-black uppercase tracking-widest">{activeView}</span> module is currently being refined for the best administrative experience.</p>
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="mt-8 md:mt-10 bg-gray-900 text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-xl hover:shadow-purple-200 flex items-center mx-auto space-x-3"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span>Back to Admin</span>
            </button>
          </div>
        )}
      </main>

      {/* View User Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsViewModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-white/20">
              <div className="bg-white px-8 pt-8 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">User Profile</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Detailed Member Information</p>
                  </div>
                  <button onClick={() => setIsViewModalOpen(false)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-2xl transition-all">
                    <XCircle className="w-8 h-8" />
                  </button>
                </div>
                <div className="space-y-8">
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-xl ring-4 ring-purple-50">
                      {(selectedUser.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-3xl font-black text-gray-900 tracking-tight">{selectedUser.username}</h4>
                      <p className="text-gray-400 font-bold text-lg">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-inner">
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Account Status</p>
                      <span className={`inline-flex px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        selectedUser.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedUser.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Permission Level</p>
                      <span className={`inline-flex px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        selectedUser.isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {selectedUser.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Member Since</p>
                      <p className="text-base font-black text-gray-700">{selectedUser.joinDate ? new Date(selectedUser.joinDate).toLocaleDateString() : 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Last Activity</p>
                      <p className="text-base font-black text-gray-700">{selectedUser.lastActive !== 'Never' ? new Date(selectedUser.lastActive).toLocaleDateString() : 'Never'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 ml-1">Spiritual Intention</p>
                      <p className="text-base text-gray-700 bg-purple-50/50 p-4 rounded-2xl border border-purple-100 font-bold leading-relaxed">{selectedUser.spiritual_intention || 'No intention set'}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 ml-1">Biography</p>
                      <p className="text-base text-gray-600 italic bg-gray-50/50 p-4 rounded-2xl border border-gray-100 leading-relaxed">{selectedUser.bio || 'No bio provided'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl text-center border border-blue-100 shadow-sm">
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter mb-1">Streak</p>
                      <p className="text-2xl font-black text-blue-600">{selectedUser.meditation_streak || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl text-center border border-green-100 shadow-sm">
                      <p className="text-[10px] text-green-400 font-black uppercase tracking-tighter mb-1">Contribs</p>
                      <p className="text-2xl font-black text-green-600">{selectedUser.community_contributions || 0}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl text-center border border-orange-100 shadow-sm">
                      <p className="text-[10px] text-orange-400 font-black uppercase tracking-tighter mb-1">Events</p>
                      <p className="text-2xl font-black text-orange-700">{selectedUser.events_attended || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row-reverse gap-4">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full sm:w-auto inline-flex justify-center rounded-2xl px-8 py-3.5 bg-gray-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-gray-800 transition-all shadow-xl"
                >
                  Close
                </button>
                {!selectedUser.isAdmin && (
                  <button
                    type="button"
                    onClick={() => handlePromoteUser(selectedUser.id)}
                    className="w-full sm:w-auto inline-flex justify-center rounded-2xl px-8 py-3.5 bg-[#6B46C1] text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#553C9A] transition-all shadow-xl shadow-purple-100"
                  >
                    Promote to Admin
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSuspendUser(selectedUser.id, selectedUser.isActive)}
                  className={`w-full sm:w-auto inline-flex justify-center rounded-2xl px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl ${
                    selectedUser.isActive ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-green-600 hover:bg-green-700 shadow-green-100'
                  }`}
                >
                  {selectedUser.isActive ? 'Suspend User' : 'Reactivate User'}
                </button>
                {!selectedUser.isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="w-full sm:w-auto inline-flex justify-center rounded-2xl px-8 py-3.5 bg-red-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-800 transition-all shadow-xl"
                  >
                    Delete Permanently
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsEditModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-white/20">
              <form onSubmit={handleUpdateUser}>
                <div className="bg-white px-10 pt-10 pb-6">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">Edit User</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 ml-1">Update Member Credentials</p>
                    </div>
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-2xl transition-all">
                      <XCircle className="w-8 h-8" />
                    </button>
                  </div>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">Username</label>
                        <input
                          type="text"
                          value={selectedUser.username}
                          onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">Email Address</label>
                        <input
                          type="email"
                          value={selectedUser.email}
                          onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
                      <label className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-4 block flex items-center">
                        <Lock className="w-4 h-4 mr-2" /> Change Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter new password to reset"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none font-bold shadow-sm"
                      />
                      <p className="text-[10px] text-gray-400 mt-3 ml-1 font-bold italic uppercase tracking-tighter">Leave blank to keep current password</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">First Name</label>
                        <input
                          type="text"
                          value={selectedUser.first_name || ''}
                          onChange={(e) => setSelectedUser({...selectedUser, first_name: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none font-bold shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">Last Name</label>
                        <input
                          type="text"
                          value={selectedUser.last_name || ''}
                          onChange={(e) => setSelectedUser({...selectedUser, last_name: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none font-bold shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">Spiritual Intention</label>
                      <input
                        type="text"
                        value={selectedUser.spiritual_intention || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, spiritual_intention: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none font-bold shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">Biography</label>
                      <textarea
                        rows={3}
                        value={selectedUser.bio || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, bio: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none font-bold shadow-sm resize-none"
                      />
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

      {/* Edit Content Modal */}
      {isEditContentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsEditContentModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-white/20">
              <form onSubmit={handleSaveEditedContent}>
                <div className="bg-white px-10 pt-10 pb-6">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">Edit Content</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 ml-1">Modify User Generated Text</p>
                    </div>
                    <button type="button" onClick={() => setIsEditContentModalOpen(false)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-2xl transition-all">
                      <XCircle className="w-8 h-8" />
                    </button>
                  </div>
                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block ml-1">Content Text</label>
                      <textarea
                        rows={6}
                        value={editingContent.text}
                        onChange={(e) => setEditingContent({...editingContent, text: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none font-bold shadow-sm resize-none"
                      />
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
                    onClick={() => setIsEditContentModalOpen(false)}
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
    </div>
  )
}

export default AdminDashboard
