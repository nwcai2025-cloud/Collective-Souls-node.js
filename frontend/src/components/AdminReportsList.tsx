import React, { useState, useEffect, useCallback } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Shield, 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  Edit,
  Trash2,
  MessageCircle,
  Users,
  Video,
  FileText,
  RotateCw
} from 'lucide-react'
import { adminAPI } from '../services/adminService'
import toast from 'react-hot-toast'

interface Report {
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
  reporter?: {
    id: number
    username: string
    email: string
  }
  reported_content?: {
    id: number
    content?: string
    title?: string
    username?: string
    name?: string
  }
}

interface AdminUser {
  id: number
  user?: {
    username: string
  }
}

const AdminReportsList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Modal states
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'dismissed'>('resolved')
  const [isActionLoading, setIsActionLoading] = useState(false)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminAPI.getReports()
      if (response.data && response.data.success && response.data.data && response.data.data.reports) {
        setReports(response.data.data.reports)
      } else {
        setReports([])
      }
    } catch (err: any) {
      console.error('Failed to fetch reports:', err)
      setError('Failed to load reports. Please try again.')
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchQuery === '' || 
      report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.reporter?.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (report.reported_content?.content || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const matchesType = typeFilter === 'all' || report.reported_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const sortedReports = [...filteredReports].sort((a, b) => {
    const aValue = a[sortBy as keyof Report]
    const bValue = b[sortBy as keyof Report]
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const handleReviewReport = (report: Report) => {
    setSelectedReport(report)
    setIsDetailsModalOpen(true)
  }

  const handleResolveReport = async () => {
    if (!selectedReport) return

    try {
      setIsActionLoading(true)
      await adminAPI.reviewReport(selectedReport.id, {
        status: resolutionStatus,
        resolution_notes: resolutionNotes
      })
      
      toast.success(`Report ${resolutionStatus} successfully`)
      setIsResolutionModalOpen(false)
      setIsDetailsModalOpen(false)
      setResolutionNotes('')
      fetchReports()
    } catch (err) {
      console.error('Failed to resolve report:', err)
      toast.error('Failed to resolve report')
    } finally {
      setIsActionLoading(false)
    }
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare className="w-4 h-4" />
      case 'activity': return <MessageCircle className="w-4 h-4" />
      case 'user': return <User className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'chat_message': return <MessageCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
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
          <FileText className="w-3 h-3 mr-1" />
          Unknown
        </span>
    }
  }

  const getReportContentPreview = (report: Report) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Content Reports</h2>
          <p className="text-sm text-gray-500 font-medium">Manage user reports and complaints</p>
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

          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-all border border-purple-100 disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-bold text-sm">Refresh</span>
          </button>
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
            <div className="p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600">Pending</p>
              <p className="text-2xl font-black text-gray-900">{reports.filter(r => r.status === 'pending').length}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
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

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : sortedReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer" onClick={() => { setSortBy('created_at'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Date {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Reporter</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Content</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {sortedReports.map((report) => (
                  <tr key={report.id} className="hover:bg-purple-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{new Date(report.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-400">{new Date(report.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-black text-sm">
                          {(report.reporter?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{report.reporter?.username || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{report.reporter?.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          {getReportIcon(report.reported_type)}
                        </div>
                        <span className="text-sm font-bold text-gray-900">{getReportTypeLabel(report.reported_type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-bold text-gray-900">{report.reason}</p>
                        {report.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{report.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm text-gray-700 line-clamp-3">{getReportContentPreview(report)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleReviewReport(report)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100"
                          title="Review Report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-500">No content reports match your current filters.</p>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {isDetailsModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsDetailsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-white/20">
              <div className="bg-white px-8 pt-8 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Report Details</h3>
                    <p className="text-sm text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Content Review & Management</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(selectedReport.status)}
                    <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all">
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Report Information */}
                  <div className="space-y-6">
                    <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Report Information</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 font-black uppercase mb-1">Report ID</p>
                            <p className="text-sm font-bold text-gray-900">#{selectedReport.id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-black uppercase mb-1">Reported Type</p>
                            <div className="flex items-center space-x-2">
                              <div className="p-1.5 bg-gray-100 rounded-lg">
                                {getReportIcon(selectedReport.reported_type)}
                              </div>
                              <span className="text-sm font-bold text-gray-900">{getReportTypeLabel(selectedReport.reported_type)}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-black uppercase mb-1">Reported Content ID</p>
                          <p className="text-sm font-bold text-gray-900">#{selectedReport.reported_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-black uppercase mb-1">Reported Reason</p>
                          <p className="text-sm font-bold text-gray-900">{selectedReport.reason}</p>
                        </div>
                        {selectedReport.description && (
                          <div>
                            <p className="text-xs text-gray-400 font-black uppercase mb-1">Detailed Description</p>
                            <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100">{selectedReport.description}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 font-black uppercase mb-1">Reported At</p>
                            <p className="text-sm font-bold text-gray-900">{new Date(selectedReport.created_at).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-black uppercase mb-1">Status</p>
                            {getStatusBadge(selectedReport.status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reporter Information */}
                    <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Reporter Information</h4>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-black text-lg">
                          {(selectedReport.reporter?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-lg font-black text-gray-900">{selectedReport.reporter?.username || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{selectedReport.reporter?.email || 'No email provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="space-y-6">
                    <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Reported Content</h4>
                      <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{getReportContentPreview(selectedReport)}</p>
                      </div>
                    </div>

                    {/* Resolution History */}
                    {selectedReport.reviewed_at && (
                      <div className="bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Resolution History</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-black uppercase">Reviewed By</span>
                            <span className="text-sm font-bold text-gray-900">
                              {selectedReport.reviewed_by ? `Admin #${selectedReport.reviewed_by}` : 'System'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-black uppercase">Reviewed At</span>
                            <span className="text-sm font-bold text-gray-900">{new Date(selectedReport.reviewed_at).toLocaleString()}</span>
                          </div>
                          {selectedReport.resolution_notes && (
                            <div>
                              <span className="text-xs text-gray-400 font-black uppercase mb-2 block">Resolution Notes</span>
                              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100">{selectedReport.resolution_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row-reverse gap-4">
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false)
                    setIsResolutionModalOpen(true)
                  }}
                  disabled={selectedReport.status !== 'pending'}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl px-8 py-3 bg-[#6B46C1] text-sm font-black uppercase tracking-widest text-white hover:bg-[#553C9A] transition-all shadow-xl shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedReport.status === 'pending' ? 'Resolve Report' : 'Already Resolved'}
                </button>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl px-8 py-3 bg-white text-sm font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all border border-gray-200 shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {isResolutionModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsResolutionModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-white/20">
              <div className="bg-white px-8 pt-8 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">Resolve Report</h3>
                    <p className="text-sm text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Finalize Report Review</p>
                  </div>
                  <button onClick={() => setIsResolutionModalOpen(false)} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      <div>
                        <p className="font-bold text-yellow-800">Report #{selectedReport.id}</p>
                        <p className="text-sm text-yellow-700">Please provide resolution details below</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Resolution Status</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setResolutionStatus('resolved')}
                        className={`p-4 rounded-xl border-2 font-black uppercase tracking-widest transition-all ${
                          resolutionStatus === 'resolved' 
                            ? 'border-green-500 bg-green-50 text-green-700' 
                            : 'border-gray-200 bg-white text-gray-500 hover:border-green-300'
                        }`}
                      >
                        <CheckCircle className="w-5 h-5 mb-2 mx-auto" />
                        Resolve
                      </button>
                      <button
                        onClick={() => setResolutionStatus('dismissed')}
                        className={`p-4 rounded-xl border-2 font-black uppercase tracking-widest transition-all ${
                          resolutionStatus === 'dismissed' 
                            ? 'border-red-500 bg-red-50 text-red-700' 
                            : 'border-gray-200 bg-white text-gray-500 hover:border-red-300'
                        }`}
                      >
                        <XCircle className="w-5 h-5 mb-2 mx-auto" />
                        Dismiss
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Resolution Notes</label>
                    <textarea
                      rows={6}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Please provide details about your decision and any actions taken..."
                      className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none font-bold shadow-sm resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-2 font-black uppercase tracking-widest">This will be visible in the audit log</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row-reverse gap-4">
                <button
                  onClick={handleResolveReport}
                  disabled={isActionLoading || !resolutionNotes.trim()}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl px-8 py-3 bg-[#6B46C1] text-sm font-black uppercase tracking-widest text-white hover:bg-[#553C9A] transition-all shadow-xl shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActionLoading ? 'Processing...' : 'Submit Resolution'}
                </button>
                <button
                  onClick={() => setIsResolutionModalOpen(false)}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl px-8 py-3 bg-white text-sm font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all border border-gray-200 shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReportsList