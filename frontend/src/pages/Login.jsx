import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      username: '',
      password: ''
    }
  })

  const onSubmit = async (data) => {
    try {
      setIsConnecting(true)
      const result = await login(data.username, data.password)

      if (result.success) {
        toast.success('Welcome back! 🙏')
        navigate(from, { replace: true })
      } else {
        // Enhanced error handling for mobile
        const errorMessage = result.message || 'Login failed'
        toast.error(errorMessage, {
          duration: 5000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fecaca'
          }
        })
      }
    } catch (error) {
      console.error('Login submission error:', error)
      toast.error('Unable to connect. Please check your internet connection and try again.', {
        duration: 6000,
        style: {
          background: '#fee2e2',
          color: '#991b1b'
        }
      })
    } finally {
      setIsConnecting(false)
    }
  }

  // Handle network status changes
  const handleNetworkChange = () => {
    if (!navigator.onLine) {
      toast.error('No internet connection. Please check your network and try again.', {
        duration: 8000,
        style: {
          background: '#fef3c7',
          color: '#92400e'
        }
      })
    } else {
      toast.success('Internet connection restored!')
    }
  }

  React.useEffect(() => {
    window.addEventListener('online', handleNetworkChange)
    window.addEventListener('offline', handleNetworkChange)

    return () => {
      window.removeEventListener('online', handleNetworkChange)
      window.removeEventListener('offline', handleNetworkChange)
    }
  }, [])

  return (
      <div className="min-h-screen bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-mindful-purple rounded-full flex items-center justify-center mx-auto shadow-lg">
            <span className="text-white text-2xl">🧘‍♂️</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your spiritual community
          </p>
          {!navigator.onLine && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
              <span className="text-sm">⚠️ No internet connection</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-purple-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            <input type="hidden" name="csrfmiddlewaretoken" />

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username or Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">@</span>
                </div>
                <input
                  {...register('username', {
                    required: 'Please enter your username or email'
                  })}
                  type="text"
                  id="username"
                  name="username"
                  autoComplete="username"
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mindful-purple focus:border-transparent sm:text-sm transition-colors"
                  placeholder="Enter your username or email"
                  disabled={loading || isConnecting}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">🔒</span>
                </div>
                <input
                  {...register('password', {
                    required: 'Please enter your password'
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mindful-purple focus:border-transparent sm:text-sm transition-colors"
                  placeholder="Enter your password"
                  disabled={loading || isConnecting}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || isConnecting}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-mindful-purple focus:ring-mindful-purple border-gray-300 rounded transition-colors"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link 
                  to="/forgot-password" 
                  className="font-medium text-mindful-purple hover:text-purple-700 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || isConnecting || !navigator.onLine}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-all duration-200 ${
                  loading || isConnecting || !navigator.onLine
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-mindful-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mindful-purple transform hover:scale-105'
                }`}
              >
                {loading || isConnecting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 bg-gradient-to-r from-transparent via-gray-200 to-transparent">
                  New to our community?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link 
                to="/register"
                className="w-full flex justify-center py-2 px-4 border border-mindful-purple rounded-md shadow-sm text-sm font-medium text-mindful-purple bg-white hover:bg-mindful-purple hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mindful-purple transition-all duration-200 transform hover:scale-105"
              >
                Create new account
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Login
