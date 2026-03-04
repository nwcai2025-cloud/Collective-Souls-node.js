import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="home-page">
      {/* Hero Section - full width and extended to navbar */}
      <section className="hero-gradient text-white py-20" style={{ marginTop: '-5rem', paddingTop: '7rem' }}>
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome to Collective Souls</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">Connect with awakened souls, share your spiritual path, and grow together in a supportive community.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-spiritual px-8 py-3 text-lg">Join Our Community</Link>
            <Link to="/guidelines" className="btn-spiritual px-8 py-3 text-lg">Community Guidelines</Link>
          </div>
        </div>
      </section>

      {/* Community Highlights - matching original */}
      <section id="learn-more" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-serene-blue mb-12">Our Spiritual Community</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Mindfulness */}
            <div className="card-spiritual text-center">
              <div className="w-16 h-16 bg-mindful-purple rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🧘</span>
              </div>
              <h3 className="text-xl font-semibold text-serene-blue mb-3">Mindfulness Practice</h3>
              <p className="text-gray-600">Daily meditation sessions and guided practices to cultivate inner peace and presence.</p>
            </div>

            {/* Feature 2: Spiritual Growth */}
            <div className="card-spiritual text-center">
              <div className="w-16 h-16 bg-calm-green rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold text-serene-blue mb-3">Spiritual Growth</h3>
              <p className="text-gray-600">Workshops, courses, and resources to support your personal spiritual evolution.</p>
            </div>

            {/* Feature 3: Community Connection */}
            <div className="card-spiritual text-center">
              <div className="w-16 h-16 bg-serene-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-serene-blue mb-3">Community Connection</h3>
              <p className="text-gray-600">Connect with like-minded souls through chats, forums, and video gatherings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Discussions - matching original */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-serene-blue mb-12">Featured Discussions</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Discussion 1 */}
            <div className="card-spiritual">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-mindful-purple rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">Morning Meditation Circle</p>
                      <p className="text-sm text-gray-500">🌿 Mindfulness • 12 participants</p>
                    </div>
                    <span className="text-sm text-gray-400">💬 24</span>
                  </div>
                  <p className="text-gray-600 mt-2">Join our daily morning meditation to start your day with peace and intention.</p>
                  <div className="flex space-x-3 mt-3">
                    <Link to="/register" className="btn-spiritual px-4 py-2 text-sm">Join Now</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Discussion 2 */}
            <div className="card-spiritual">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-calm-green rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">Energy Healing Share</p>
                      <p className="text-sm text-gray-500">🔮 Energy Work • 8 participants</p>
                    </div>
                    <span className="text-sm text-gray-400">💬 15</span>
                  </div>
                  <p className="text-gray-600 mt-2">Share your experiences with energy healing and learn from others' journeys.</p>
                  <div className="flex space-x-3 mt-3">
                    <Link to="/register" className="btn-spiritual px-4 py-2 text-sm">Join Now</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Discussion 3 */}
            <div className="card-spiritual">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-serene-blue rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">Spiritual Awakening Stories</p>
                      <p className="text-sm text-gray-500">✨ Personal Growth • 22 participants</p>
                    </div>
                    <span className="text-sm text-gray-400">💬 42</span>
                  </div>
                  <p className="text-gray-600 mt-2">Share your spiritual awakening journey and connect with others on similar paths.</p>
                  <div className="flex space-x-3 mt-3">
                    <Link to="/register" className="btn-spiritual px-4 py-2 text-sm">Join Now</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Discussion 4 */}
            <div className="card-spiritual">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-purple-400 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">Chakra Balancing Group</p>
                      <p className="text-sm text-gray-500">🌈 Energy Centers • 10 participants</p>
                    </div>
                    <span className="text-sm text-gray-400">💬 18</span>
                  </div>
                  <p className="text-gray-600 mt-2">Explore chakra healing techniques and share your experiences with energy alignment.</p>
                  <div className="flex space-x-3 mt-3">
                    <Link to="/register" className="btn-spiritual px-4 py-2 text-sm">Join Now</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - matching original */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-serene-blue mb-12">What Our Members Say</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="card-spiritual">
              <p className="text-gray-600 italic mb-4">"Finding this community has been a blessing. The support and wisdom shared here have helped me grow spiritually in ways I never imagined possible."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-mindful-purple rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-gray-800">Sarah J.</p>
                  <p className="text-sm text-gray-500">Member since 2025</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="card-spiritual">
              <p className="text-gray-600 italic mb-4">"The meditation circles and energy healing sessions have transformed my daily practice. I feel more connected to myself and others."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-calm-green rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-gray-800">Michael T.</p>
                  <p className="text-sm text-gray-500">Member since 2025</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="card-spiritual">
              <p className="text-gray-600 italic mb-4">"This platform has become my spiritual home. The connections I've made here are deep and meaningful - exactly what I was seeking."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-serene-blue rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-gray-800">Emma R.</p>
                  <p className="text-sm text-gray-500">Member since 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
