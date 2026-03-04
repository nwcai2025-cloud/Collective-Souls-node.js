import React, { useState } from 'react'
import { 
  Flag, 
  AlertTriangle, 
  User, 
  MessageCircle, 
  Video, 
  Eye, 
  EyeOff, 
  Shield, 
  XCircle, 
  CheckCircle,
  Send,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { submitReport } from '../services/reportService'

// Polyfill for crypto.randomUUID for older browsers
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

interface ReportButtonProps {
  contentType: 'comment' | 'activity' | 'user' | 'video' | 'chat_message'
  contentId: number
  contentPreview?: string
  reportedUserId?: number
  onReportSubmitted?: () => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

interface ReportFormData {
  reason: string
  description: string
  includeContent: boolean
}

const ReportButton: React.FC<ReportButtonProps> = ({
  contentType,
  contentId,
  contentPreview,
  reportedUserId,
  onReportSubmitted,
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ReportFormData>({
    reason: '',
    description: '',
    includeContent: true
  })

  const reportReasons = [
    { value: 'spam', label: 'Spam or Advertising', icon: AlertCircle },
    { value: 'harassment', label: 'Harassment or Bullying', icon: Shield },
    { value: 'inappropriate', label: 'Inappropriate Content', icon: EyeOff },
    { value: 'impersonation', label: 'Impersonation', icon: User },
    { value: 'scam', label: 'Scam or Fraud', icon: AlertTriangle },
    { value: 'privacy', label: 'Privacy Violation', icon: Eye },
    { value: 'other', label: 'Other Issue', icon: Flag }
  ]

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'comment': return 'Comment'
      case 'activity': return 'Activity'
      case 'user': return 'User Profile'
      case 'video': return 'Video Content'
      case 'chat_message': return 'Chat Message'
      default: return 'Content'
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'comment': return MessageCircle
      case 'activity': return MessageCircle
      case 'user': return User
      case 'video': return Video
      case 'chat_message': return MessageCircle
      default: return Flag
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.reason) {
      toast.error('Please select a reason for reporting')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Please provide a description of the issue')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Submit report using report service (which includes token automatically)
      const response = await submitReport({
        content_type: contentType,
        content_id: contentId,
        reason: formData.reason,
        description: formData.description
      })

      if (response.success) {
        toast.success('Report submitted successfully')
        setIsModalOpen(false)
        setFormData({ reason: '', description: '', includeContent: true })
        if (onReportSubmitted) onReportSubmitted()
      } else {
        throw new Error(response.message || 'Failed to submit report')
      }
    } catch (error: any) {
      console.error('Error submitting report:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit report. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const IconComponent = getContentTypeIcon(contentType)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`
          inline-flex items-center space-x-2 px-3 py-2 rounded-lg font-bold text-sm
          transition-all duration-200 transform hover:scale-105
          ${variant === 'default' 
            ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' 
            : variant === 'outline' 
              ? 'border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400' 
              : 'text-red-600 hover:bg-red-50'
          }
          ${size === 'sm' ? 'text-xs px-2 py-1' : size === 'lg' ? 'text-base px-4 py-3' : ''}
          ${className}
        `}
        title={`Report ${getContentTypeLabel(contentType)}`}
      >
        <Flag className={`w-4 h-4 ${size === 'lg' ? 'w-5 h-5' : ''}`} />
        <span className="hidden sm:inline">Report</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}>
              <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-white/20">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-8 pt-8 pb-6">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Report {getContentTypeLabel(contentType)}</h3>
                          <p className="text-sm text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Help us keep the community safe</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Content Preview */}
                    {contentPreview && (
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs font-black text-gray-400 uppercase mb-2">Content Preview</p>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100">
                          {contentPreview}
                        </p>
                      </div>
                    )}

                    {/* Reason Selection */}
                    <div>
                      <label className="block text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Reason for Reporting</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {reportReasons.map((reason) => {
                          const Icon = reason.icon
                          return (
                            <label key={reason.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all cursor-pointer group">
                              <input
                                type="radio"
                                name="reason"
                                value={reason.value}
                                checked={formData.reason === reason.value}
                                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                                className="sr-only"
                              />
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                formData.reason === reason.value 
                                  ? 'border-red-500 bg-red-500' 
                                  : 'border-gray-300 group-hover:border-red-300'
                              }`}>
                                {formData.reason === reason.value && <CheckCircle className="w-4 h-4 text-white" />}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Icon className={`w-4 h-4 ${
                                  formData.reason === reason.value ? 'text-red-500' : 'text-gray-400'
                                }`} />
                                <span className="text-sm font-bold text-gray-900">{reason.label}</span>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Description</label>
                      <textarea
                        rows={5}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Please describe what makes this content inappropriate or problematic. Be specific and include any relevant details."
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none font-bold shadow-sm resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-2 font-black uppercase tracking-widest">This helps moderators understand the issue better</p>
                    </div>

                    {/* Include Content Option */}
                    <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <input
                        type="checkbox"
                        id="includeContent"
                        checked={formData.includeContent}
                        onChange={(e) => setFormData({...formData, includeContent: e.target.checked})}
                        className="w-4 h-4 text-red-600 bg-white border-gray-300 rounded focus:ring-red-500"
                      />
                      <label htmlFor="includeContent" className="text-sm font-bold text-gray-900">
                        Include content in report
                      </label>
                      <div className="ml-auto">
                        {formData.includeContent ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>

                    {/* Guidelines */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-black text-blue-800 mb-1">Community Guidelines</p>
                          <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Be specific about what makes the content problematic</li>
                            <li>• Do not submit false or malicious reports</li>
                            <li>• Reports are reviewed by trained moderators</li>
                            <li>• Your report will remain confidential</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-8 py-6 flex flex-col sm:flex-row-reverse gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.reason || !formData.description.trim()}
                    className="w-full sm:w-auto inline-flex justify-center rounded-xl px-8 py-3 bg-red-600 text-sm font-black uppercase tracking-widest text-white hover:bg-red-700 transition-all shadow-xl shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Send className="w-4 h-4" />
                        <span>Submit Report</span>
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto inline-flex justify-center rounded-xl px-8 py-3 bg-white text-sm font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all border border-gray-200 shadow-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ReportButton