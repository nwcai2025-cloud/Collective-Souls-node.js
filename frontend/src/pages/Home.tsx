import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  MessageCircle, 
  UserCheck, 
  Calendar, 
  Sparkles, 
  Globe, 
  Heart, 
  Star,
  Moon,
  Sun,
  Video
} from 'lucide-react'

const Home: React.FC = () => {
  const [isDarkTheme, setIsDarkTheme] = React.useState(false)

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme)
    if (!isDarkTheme) {
      document.body.classList.add('dark-theme')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark-theme')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mindful-purple via-serene-blue to-calm-green">
      {/* Navigation */}
      <nav className="bg-white bg-opacity-20 backdrop-blur-md border-b border-white border-opacity-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Collective Souls</h1>
                <p className="text-sm text-white text-opacity-80">Spiritual Connection Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
                aria-label="Toggle theme"
              >
                {isDarkTheme ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
              </button>
              
              <Link
                to="/video-lobby"
                className="inline-block mt-4 text-yellow-300 hover:text-white transition-colors"
              >
                Join Video Chat
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6">
              Find Your
              <span className="block text-yellow-300">Spiritual Connection</span>
            </h1>
            <p className="text-xl text-white text-opacity-90 mb-8 max-w-lg mx-auto lg:mx-0">
              Join a community of like-minded individuals seeking meaningful connections 
              through shared spiritual practices and personal growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/register"
                className="bg-yellow-400 text-mindful-purple px-8 py-3 rounded-md font-semibold text-lg hover:bg-yellow-300 transition-all transform hover:scale-105"
              >
                Join Now
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-md font-semibold text-lg hover:bg-white hover:text-mindful-purple transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 border border-white border-opacity-20">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-white" />
                  <p className="text-white font-semibold">1000+</p>
                  <p className="text-white text-sm opacity-80">Members</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-white" />
                  <p className="text-white font-semibold">24/7</p>
                  <p className="text-white text-sm opacity-80">Chat Support</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 text-white" />
                  <p className="text-white font-semibold">Verified</p>
                  <p className="text-white text-sm opacity-80">Community</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-white" />
                  <p className="text-white font-semibold">Daily</p>
                  <p className="text-white text-sm opacity-80">Events</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white rounded-full opacity-10 animate-bounce"></div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose Collective Souls?</h2>
            <p className="text-xl text-white text-opacity-80">Discover what makes our community special</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all">
              <div className="w-12 h-12 bg-yellow-400 bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-yellow-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Meaningful Connections</h3>
              <p className="text-white text-opacity-80">
                Connect with individuals who share your spiritual journey and values. 
                Build relationships that support your personal growth.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all">
              <div className="w-12 h-12 bg-yellow-400 bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-yellow-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Global Community</h3>
              <p className="text-white text-opacity-80">
                Join a diverse community from around the world. Share different perspectives 
                and learn from various spiritual traditions.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all">
              <div className="w-12 h-12 bg-yellow-400 bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-yellow-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Personal Growth</h3>
              <p className="text-white text-opacity-80">
                Track your spiritual practices, set goals, and celebrate your progress 
                with our comprehensive personal development tools.
              </p>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all">
              <div className="w-12 h-12 bg-yellow-400 bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-yellow-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Live Video Chat</h3>
              <p className="text-white text-opacity-80">
                Connect face-to-face with community members through our secure video chat rooms. 
                Perfect for meditation groups, spiritual discussions, and meaningful conversations.
              </p>
              <Link
                to="/video-lobby"
                className="inline-block mt-4 text-yellow-300 hover:text-white transition-colors"
              >
                Join Video Chat →
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-12 border border-white border-opacity-20">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Begin Your Journey?</h2>
            <p className="text-xl text-white text-opacity-80 mb-8 max-w-2xl mx-auto">
              Take the first step towards finding meaningful connections and spiritual growth. 
              Join our community today and start your journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-yellow-400 text-mindful-purple px-8 py-3 rounded-md font-semibold text-lg hover:bg-yellow-300 transition-all transform hover:scale-105"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-md font-semibold text-lg hover:bg-white hover:text-mindful-purple transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home