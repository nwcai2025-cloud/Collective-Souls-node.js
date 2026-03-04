import React, { useState, useEffect } from 'react'
import { 
  Flag, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  User, 
  MessageCircle, 
  Video, 
  Calendar, 
  Search, 
  Filter,
  AlertTriangle,
  Shield,
  Send
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

interface UserReport {
  id: number
  reporter_id: number
  reported_type: 'comment' | 'activity' | 'video' | 'user' | 'chat_message'
  reported_id: number
  reason: string
  description: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_by: number | null
  reviewed_at: string | null
  resolution_notes: string | null
  created_at: string
  reported_content?: {
    id: number
    content?: string
    title?: string
    username?: string
    name?: string
  }
}

const UserReportHistory: React.FC = () => {
  const { user } = useAuth()
  const [reports, setReports] = useState<UserReport[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const fetchReports = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/reports/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setReports(data.data.reports || [])
        }
      } else {
        throw new Error('Failed to fetch reports')
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load your reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [user])

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === '' || 
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.reported_content?.content || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const matchesType = typeFilter === 'all' || report.reported_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageCircle className="w-4 h-4" />
      case 'activity': return <MessageCircle className="w-4 h-4" />
      case 'user': return <User className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'chat_message': return <MessageCircle className="w-4 h-4" />
      default: return <Flag className="w-4 h-4" />
    }
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'comment': return 'Comment'
      case 'activity': return 'Activity'
      case 'user': return 'User Profile'
      case 'video': return 'Video Content'
      case 'chat_message': return 'Chat Message'
      default: return 'Content'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>
      case 'reviewed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
          <Eye className="w-3 h-3 mr-1" />
          Reviewed
        </span>
      case 'resolved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Resolved
        </span>
      case 'dismissed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Dismissed
        </span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-gray-100 text-gray-800">
          <Flag className="w-3 h-3 mr-1" />
          Unknown
        </span>
    }
  }

  const getReportContentPreview = (report: UserReport) => {
    const content = report.reported_content
    if (!content) return 'Content not available'

    switch (report.reported_type) {
      case 'comment':
      case 'activity':
      case 'chat_message':
        return content.content || 'No content available'
      case 'user':
        return `User: ${content.username || 'Unknown'}`
      case 'video':
        return `Video: ${content.title || 'Untitled'}`
      default:
        return 'Content preview not available'
    }
  }

  if (!user) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-500">Please log in to view your report history.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Reports</h2>
          <p className="text-sm text-gray-500 font-medium">Track the status of your submitted reports</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm w-full transition-all font-bold text-sm"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-sm"
          >
            <option value="all">All Types</option>
            <option value="comment">Comments</option>
            <option value="activity">Activities</option>
            <option value="user">Users</option>
            <option value="video">Videos</option>
            <option value="chat_message">Chat Messages</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600">Total Reports</p>
              <p className="text-2xl font-black text-gray-900">{reports.length}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Flag className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600">Pending</p>
              <p className="text-2xl font-black text-gray-900">{reports.filter(r => r.status === 'pending').length}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600">Resolved</p>
              <p className="text-2xl font-black text-gray-900">{reports.filter(r => r.status === 'resolved').length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600">Dismissed</p>
              <p className="text-2xl font-black text-gray-900">{reports.filter(r => r.status === 'dismissed').length}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-purple-50/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    {/* Report Header */}
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {getReportIcon(report.reported_type)}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900">{getReportTypeLabel(report.reported_type)}</h4>
                        <p className="text-sm text-gray-500">Reported {new Date(report.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="ml-auto">
                        {getStatusBadge(report.status)}
                      </div>
                    </div>

                    {/* Report Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase mb-1">Reason</p>
                        <p className="text-sm font-bold text-gray-900">{report.reason}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase mb-1">Reported Content</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          {getReportContentPreview(report)}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-xs font-black text-gray-400 uppercase mb-1">Description</p>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100">
                        {report.description}
                      </p>
                    </div>

                    {/* Resolution Notes */}
                    {report.resolution_notes && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-black text-green-800">Resolution Notes</span>
                        </div>
                        <p className="text-sm text-green-700">{report.resolution_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 min-w-[200px]">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-black uppercase">Report ID</p>
                      <p className="text-sm font-bold text-gray-900">#{report.id}</p>
                    </div>
                    
                    {report.status === 'pending' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-700 font-bold">Under Review</p>
                        <p className="text-xs text-yellow-600 mt-1">Our moderation team is reviewing this report.</p>
                      </div>
                    )}
                    
                    {report.status === 'resolved' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs text-green-700 font-bold">Resolved</p>
                        <p className="text-xs text-green-600 mt-1">This report has been resolved by our team.</p>
                      </div>
                    )}
                    
                    {report.status === 'dismissed' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-700 font-bold">Dismissed</p>
                        <p className="text-xs text-red-600 mt-1">This report was reviewed and dismissed.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-500">You haven't submitted any reports yet.</p>
            <p className="text-sm text-gray-400 mt-2">Reports you submit will appear here for tracking.</p>
          </div>
        )}
      </div>

      {/* Empty State with Guidance */}
      {reports.length === 0 && !loading && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
              <Send className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-gray-900 mb-2">How to Report Content</h3>
              <p className="text-gray-600 mb-4">
                If you encounter content that violates our community guidelines, you can report it by:
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Clicking the "Report" button on any comment, post, or user profile</li>
                <li>• Selecting the appropriate reason for your report</li>
                <li>• Providing a detailed description of the issue</li>
                <li>• Submitting the report for moderator review</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserReportHistory