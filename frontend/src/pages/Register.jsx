import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm()

  const password = watch('password')
  const confirmPassword = watch('confirmPassword')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        age_verified: data.age_verified === 'true',
        spiritual_intention: data.spiritual_intention,
        bio: data.bio,
        accept_guidelines: data.accept_guidelines === true
      })

      if (result.success) {
        toast.success('Account created successfully!')
        navigate('/dashboard')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const validatePassword = (value) => {
    if (value.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(value)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(value)) {
      return 'Password must contain at least one number'
    }
    return true
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
            <span className="text-white text-2xl">🌱</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join our spiritual community and begin your journey
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md lg:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-purple-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" name="csrfmiddlewaretoken" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  {...register('first_name', {
                    required: 'First name is required'
                  })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mindful-purple focus:border-transparent transition-all duration-200"
                  placeholder="Enter your first name"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  {...register('last_name', {
                    required: 'Last name is required'
                  })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mindful-purple focus:border-transparent transition-all duration-200"
                  placeholder="Enter your last name"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                {...register('username', {
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters'
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Username can only contain letters, numbers, and underscores'
                  }
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mindful-purple focus:border-transparent transition-all duration-200"
                placeholder="Choose a username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address'
                  }
                })}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mindful-purple focus:border-transparent transition-all duration-200"
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="age_verified" className="block text-sm font-medium text-gray-700 mb-2">
                Age Verification
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <input
                    {...register('age_verified', {
                      required: 'You must confirm you are 18 years or older'
                    })}
                    id="age_yes"
                    name="age_verified"
                    type="radio"
                    value="true"
                    className="h-4 w-4 text-mindful-purple focus:ring-mindful-purple border-gray-300"
                  />
                  <label htmlFor="age_yes" className="text-sm text-gray-700 cursor-pointer">
                    Yes, I am 18 years or older
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    {...register('age_verified', {
                      required: 'You must confirm you are 18 years or older'
                    })}
                    id="age_no"
                    name="age_verified"
                    type="radio"
                    value="false"
                    className="h-4 w-4 text-mindful-purple focus:ring-mindful-purple border-gray-300"
                  />
                  <label htmlFor="age_no" className="text-sm text-gray-700 cursor-pointer">
                    No, I am under 18 years old
                  </label>
                </div>
              </div>
              {errors.age_verified && (
                <p className="mt-1 text-sm text-red-600">{errors.age_verified.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="spiritual_intention" className="block text-sm font-medium text-gray-700 mb-1">
                Spiritual Intention
              </label>
              <select
                {...register('spiritual_intention', {
                  required: 'Please select your spiritual intention'
                })}
                id="spiritual_intention"
                name="spiritual_intention"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-mindful-purple focus:border-transparent transition-all duration-200"
              >
                <option value="">Select your spiritual intention</option>
                <option value="mindfulness_meditation">Mindfulness & Meditation</option>
                <option value="spiritual_growth">Spiritual Growth</option>
                <option value="energy_healing">Energy Healing</option>
                <option value="community_connection">Community Connection</option>
                <option value="self_discovery">Self-Discovery</option>
              </select>
              {errors.spiritual_intention && (
                <p className="mt-1 text-sm text-red-600">{errors.spiritual_intention.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="accept_guidelines" className="block text-sm font-medium text-gray-700 mb-2">
                Community Guidelines
              </label>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <input
                    {...register('accept_guidelines', {
                      required: 'You must accept the Community Guidelines to register'
                    })}
                    id="accept_guidelines"
                    name="accept_guidelines"
                    type="checkbox"
                    className="h-4 w-4 text-mindful-purple focus:ring-mindful-purple border-gray-300 mt-1"
                  />
                  <div>
                    <label htmlFor="accept_guidelines" className="text-sm text-gray-700 cursor-pointer">
                      I have read and accept the{' '}
                      <Link 
                        to="/guidelines" 
                        target="_blank"
                        className="text-mindful-purple hover:text-purple-700 font-medium underline"
                      >
                        Community Guidelines
                      </Link>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      By checking this box, you agree to uphold our community standards and create a safe, respectful space for all members.
                    </p>
                  </div>
                </div>
              </div>
              {errors.accept_guidelines && (
                <p className="mt-1 text-sm text-red-600">{errors.accept_guidelines.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    validate: validatePassword
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mindful-purple focus:border-transparent transition-all duration-200"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="text-gray-500 hover:text-gray-700">
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match'
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mindful-purple focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="text-gray-500 hover:text-gray-700">
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </span>
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-mindful-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mindful-purple"
              >
                {isLoading ? (
                  <span className="animate-spin h-5 w-5">🌀</span>
                ) : (
                  'Register'
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
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-mindful-purple hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mindful-purple">
                Sign in to your account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register