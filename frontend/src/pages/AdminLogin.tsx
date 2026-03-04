import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/authService'
import { Shield, Lock, Mail, Eye, EyeOff, Users, MessageCircle, TrendingUp, AlertTriangle } from 'lucide-react'

interface AdminLoginFormData {
  username: string
  password: string
}

const AdminLogin: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginFormData>()

  const onSubmit = async (data: AdminLoginFormData) => {
    try {
      console.log('AdminLogin form submitted with:', data)
      
      // Use the unified login function - it will work for both regular users and admins
      await login(data.username, data.password)
      console.log('Admin login completed successfully')
      
      // The login function in AuthContext already sets the user state.
      // We can just navigate to the dashboard, and the AdminProtectedRoute will handle the rest.
      toast.success('Welcome, Administrator!')
      navigate('/admin/dashboard')
    } catch (error: any) {
      console.error('Admin login error:', error)
      toast.error(error.message || 'Admin login failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-purple-900" />
          </div>
          <h2 className="text-3xl font-bold text-white">Admin Portal</h2>
          <p className="mt-2 text-purple-200">Access reserved for authorized administrators</p>
        </div>

        <div className="mt-8 bg-white bg-opacity-10 backdrop-blur-md py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-white border-opacity-20">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white">
                Admin Username
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-purple-200" />
                </div>
                <input
                  {...register('username', { 
                    required: 'Username is required'
                  })}
                  type="text"
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-purple-300 rounded-md shadow-sm placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-white bg-opacity-20 text-white"
                  placeholder="admin"
                />
              </div>
              {errors.username && (
                <p className="mt-2 text-sm text-red-300">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-purple-200" />
                </div>
                <input
                  {...register('password', { 
                    required: 'Password is required' 
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-purple-300 rounded-md shadow-sm placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent bg-white bg-opacity-20 text-white"
                  placeholder="Enter your admin password"
                  autoComplete="current-password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    className="text-purple-200 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-300">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-purple-900 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
              >
                Access Admin Panel
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-300 border-opacity-50" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-purple-200">Not an administrator?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-purple-300 border-opacity-50 rounded-md shadow-sm text-sm font-medium text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors"
              >
                Return to User Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Features Preview */}
      <div className="mt-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-2">Admin Features</h3>
          <p className="text-purple-200">Manage your spiritual community with powerful tools</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-purple-900" />
            </div>
            <h4 className="text-lg font-semibold text-white text-center mb-2">User Management</h4>
            <p className="text-purple-200 text-center text-sm">
              Monitor user activity, manage accounts, and ensure community safety
            </p>
          </div>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-purple-900" />
            </div>
            <h4 className="text-lg font-semibold text-white text-center mb-2">Content Moderation</h4>
            <p className="text-purple-200 text-center text-sm">
              Review and manage community content to maintain a positive environment
            </p>
          </div>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-6 border border-white border-opacity-20">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-purple-900" />
            </div>
            <h4 className="text-lg font-semibold text-white text-center mb-2">Analytics</h4>
            <p className="text-purple-200 text-center text-sm">
              Track community growth, engagement, and spiritual practice trends
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin