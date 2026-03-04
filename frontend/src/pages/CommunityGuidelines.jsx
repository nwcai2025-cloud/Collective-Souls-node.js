import React from 'react'
import { Link } from 'react-router-dom'

const CommunityGuidelines = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-violet-700 shadow-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">🌟 Community Guidelines</h1>
            <p className="text-purple-100 text-lg">
              Creating a sacred space for conscious connection and spiritual growth
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl">🕊️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Our Sacred Space</h2>
            <p className="text-gray-600 leading-relaxed">
              Welcome to Collective Souls, a spiritual community dedicated to mindfulness, personal growth, 
              and conscious connection. These guidelines help maintain our space as a safe, respectful, 
              and uplifting environment for all seekers on their spiritual journey.
            </p>
          </div>
        </div>

        {/* Core Principles */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">🙏</span>
            Core Principles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Compassion & Kindness</h4>
              <p className="text-sm text-gray-700">
                Treat every member with empathy, respect, and unconditional positive regard. 
                Practice active listening and seek to understand before being understood.
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Authenticity & Integrity</h4>
              <p className="text-sm text-gray-700">
                Share from your genuine experience and truth. Be honest about your journey, 
                including both insights and challenges.
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Non-Judgment</h4>
              <p className="text-sm text-gray-700">
                Respect diverse spiritual beliefs, practices, and traditions. 
                Avoid imposing your beliefs on others or criticizing their path.
              </p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Confidentiality</h4>
              <p className="text-sm text-gray-700">
                Respect the privacy of others' shared experiences. What's shared here stays here 
                (unless there's risk of harm).
              </p>
            </div>
          </div>
        </div>

        {/* Content Guidelines */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">📝</span>
            Content Guidelines
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-green-700 mb-4 flex items-center">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">✅</span>
                Encouraged Content
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Personal spiritual experiences and insights</li>
                <li>• Mindfulness practices and meditation techniques</li>
                <li>• Energy healing experiences and knowledge sharing</li>
                <li>• Yoga and movement practices</li>
                <li>• Journaling reflections and personal growth stories</li>
                <li>• Gratitude practices and positive affirmations</li>
                <li>• Questions seeking wisdom from the community</li>
                <li>• Inspiration and motivation for others' journeys</li>
                <li>• Announcements of spiritual events and gatherings</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-700 mb-4 flex items-center">
                <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-2">❌</span>
                Prohibited Content
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Religious proselytizing or attempts to convert others</li>
                <li>• Medical advice or claims about healing specific conditions</li>
                <li>• Financial solicitations or pyramid schemes</li>
                <li>• Political discussions that create division</li>
                <li>• Hate speech or discriminatory language</li>
                <li>• Personal attacks or cyberbullying</li>
                <li>• Spam or excessive self-promotion</li>
                <li>• Inappropriate content (violence, explicit material, etc.)</li>
                <li>• Misinformation presented as spiritual truth</li>
                <li>• Pressure tactics for joining groups or purchasing services</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Safety & Boundaries */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">🛡️</span>
            Safety & Boundaries
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">Personal Safety</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Never share personal contact information publicly</li>
                <li>• Be cautious about meeting people offline</li>
                <li>• Trust your intuition about interactions</li>
                <li>• Report any suspicious behavior</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-3">Energetic Boundaries</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Respect others' energy and space</li>
                <li>• Ask before sending energy work or healing</li>
                <li>• Understand not everyone is open to all practices</li>
                <li>• Honor silence as valid contribution</li>
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3">Community Safety</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Report harassment or inappropriate behavior</li>
                <li>• Support others who may be struggling</li>
                <li>• Encourage professional help when needed</li>
                <li>• Maintain a drama-free environment</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Moderation System */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">⚖️</span>
            Our Moderation System
          </h3>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Moderation Principles</h4>
              <p className="text-sm text-gray-700">
                We prioritize education over punishment. First-time offenses typically receive warnings and guidance. 
                Repeat violations may result in temporary or permanent restrictions.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Reporting System</h4>
              <p className="text-sm text-gray-700">
                Use the "Report" button for concerning content. Contact moderators directly for urgent matters. 
                Reports are handled confidentially.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Appeals Process</h4>
              <p className="text-sm text-gray-700">
                You may appeal moderation decisions in writing. Appeals are reviewed by multiple team members. 
                Focus is on learning and growth, not blame.
              </p>
            </div>
          </div>
        </div>

        {/* Commitment to Growth */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">🙏 Commitment to Growth</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              We believe in the transformative power of community and conscious living. 
              These guidelines are not meant to restrict, but to create the conditions 
              for deep, meaningful connection and spiritual growth.
            </p>
            <div className="bg-gradient-to-r from-purple-100 to-violet-100 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-700 italic">
                "We're all learners on this journey. When mistakes happen, we choose understanding, 
                forgiveness, and the opportunity to grow together."
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl shadow-lg p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">🌈 Together We Create Magic</h3>
          <p className="text-purple-100 mb-6 leading-relaxed">
            By honoring these guidelines, we co-create a space where souls feel safe to be their authentic selves, 
            wisdom is shared freely and received with gratitude, growth happens through mutual support and understanding, 
            and the collective energy elevates us all.
          </p>
          <div className="space-x-4">
            <Link 
              to="/dashboard" 
              className="bg-gradient-to-r from-purple-500 to-violet-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-violet-600 transition-colors inline-block shadow-md"
            >
              Return to Dashboard
            </Link>
            <Link 
              to="/connections" 
              className="bg-gradient-to-r from-calm-green to-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-colors inline-block shadow-md"
            >
              Connect with Community
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunityGuidelines