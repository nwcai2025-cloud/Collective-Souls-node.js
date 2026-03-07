import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import NotificationBell from './NotificationBell'
import DonateButton from './DonateButton'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const { connectSocket, disconnectSocket } = useSocket()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [isDarkTheme, setIsDarkTheme] = React.useState(false)

  // Load theme preference from localStorage
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('collective-souls-theme')
    const initialTheme = savedTheme === 'dark'
    setIsDarkTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  // Apply theme to document
  const applyTheme = (isDark) => {
    const root = document.documentElement
    if (isDark) {
      // Apply dark theme
      root.style.setProperty('--bg-primary', 'var(--bg-primary-dark)')
      root.style.setProperty('--bg-secondary', 'var(--bg-secondary-dark)')
      root.style.setProperty('--bg-tertiary', 'var(--bg-tertiary-dark)')
      root.style.setProperty('--text-primary', 'var(--text-primary-dark)')
      root.style.setProperty('--text-secondary', 'var(--text-secondary-dark)')
      root.style.setProperty('--text-muted', 'var(--text-muted-dark)')
      root.style.setProperty('--border-color', 'var(--border-color-dark)')
      root.style.setProperty('--shadow-color', 'var(--shadow-color-dark)')

      // Update body background with dark gradient
      document.body.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)'
      document.body.style.backgroundAttachment = 'fixed'
      document.body.style.color = 'var(--text-primary-dark)'

      // Add dark class for additional styling
      document.body.classList.add('dark-theme')
    } else {
      // Apply light theme (reset to defaults)
      root.style.setProperty('--bg-primary', 'var(--bg-primary)')
      root.style.setProperty('--bg-secondary', 'var(--bg-secondary)')
      root.style.setProperty('--bg-tertiary', 'var(--bg-tertiary)')
      root.style.setProperty('--text-primary', 'var(--text-primary)')
      root.style.setProperty('--text-secondary', 'var(--text-secondary)')
      root.style.setProperty('--text-muted', 'var(--text-muted)')
      root.style.setProperty('--border-color', 'var(--border-color)')
      root.style.setProperty('--shadow-color', 'var(--shadow-color)')

      // Reset body styles
      document.body.style.background = ''
      document.body.style.backgroundColor = 'var(--bg-primary)'
      document.body.style.color = 'var(--text-primary)'

      // Remove dark class
      document.body.classList.remove('dark-theme')
    }
  }

  const toggleTheme = () => {
    const newTheme = !isDarkTheme
    setIsDarkTheme(newTheme)
    applyTheme(newTheme)
    localStorage.setItem('collective-souls-theme', newTheme ? 'dark' : 'light')
  }

  const handleLogout = async () => {
    try {
      await logout()
      disconnectSocket()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleLogin = () => {
    connectSocket()
  }

  // Check if current route is an auth page
  const isAuthPage = ['/login', '/register', '/admin'].includes(location.pathname)
  const isDashboardPage = location.pathname === '/dashboard'

  return (
    <div className={`min-h-screen flex flex-col ${isDashboardPage ? 'bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50' : ''}`}>
      {/* Header - matching Django original */}
<header className="text-white py-4 sticky top-0 z-50 bg-purple-600" style={{ backgroundColor: '#6B46C1' }}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center flex-shrink-0">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
              <span className="text-mindful-purple font-bold text-lg">🕊️</span>
            </div>
            <Link to="/dashboard" className="text-xl font-semibold text-white hover:text-gray-200">Collective Souls</Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 ml-auto">
            {user ? (
              <>
                {(user.is_staff || user.is_superuser || user.is_admin) && (
                  <Link to="/admin/dashboard" className="btn-spiritual px-4 py-2">Admin</Link>
                )}
                <Link to="/dashboard" className="btn-spiritual px-4 py-2">Dashboard</Link>
                <Link to={`/profile/${user?.username}`} className="btn-spiritual px-4 py-2">Profile</Link>
                <DonateButton />
                <NotificationBell />
                <button onClick={handleLogout} className="btn-spiritual px-4 py-2 whitespace-nowrap">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-spiritual px-4 py-2">Login</Link>
                <Link to="/register" className="btn-spiritual px-4 py-2">Register</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button - Pushed to far right */}
          <div className="md:hidden flex items-center ml-auto space-x-1">
            {user && <NotificationBell />}
            <button
              id="mobileMenuButton"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-white bg-purple-600"
              style={{ backgroundColor: '#6B46C1' }}
            >
              <span id="mobileMenuIcon" className="text-white text-xl">{isMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Menu */}
        {isMenuOpen && (
          <div id="mobileMenu" className="md:hidden border-t border-purple-700 z-[1100] shadow-lg bg-purple-600" style={{ backgroundColor: '#6B46C1' }}>
            <div className="container mx-auto px-2 py-2 my-1">
              <div className="flex flex-row justify-start space-x-2 items-center overflow-x-auto no-scrollbar">
              {user ? (
                  <>
                    {(user.is_staff || user.is_superuser || user.is_admin) && (
                      <Link to="/admin/dashboard" onClick={() => setIsMenuOpen(false)} className="text-white whitespace-nowrap hover:text-gray-200 py-1.5 px-3 rounded-full border border-white/20 text-sm transition-colors">Admin</Link>
                    )}
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-white whitespace-nowrap hover:text-gray-200 py-1.5 px-3 rounded-full border border-white/20 text-sm transition-colors">Dashboard</Link>
                    <Link to={`/profile/${user?.username}`} onClick={() => setIsMenuOpen(false)} className="text-white whitespace-nowrap hover:text-gray-200 py-1.5 px-3 rounded-full border border-white/20 text-sm transition-colors">Profile</Link>
                    <DonateButton />
                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-white whitespace-nowrap hover:text-gray-200 py-1.5 px-3 rounded-full border border-white/20 text-sm transition-colors">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="text-white whitespace-nowrap hover:text-gray-200 py-1.5 px-3 rounded-full border border-white/20 text-sm transition-colors">Login</Link>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)} className="text-white whitespace-nowrap hover:text-gray-200 py-1.5 px-3 rounded-full border border-white/20 text-sm transition-colors">Register</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
<main className="flex-1 bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50">
        {children || <Outlet />}
      </main>

      {/* Footer - only show on non-auth pages */}
      {!isAuthPage && (
        <footer className="bg-gray-800 text-white py-8 mt-auto">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  <Link to="/" className="text-white hover:text-gray-300">🕊️ Collective Souls</Link>
                </h3>
                <p className="text-gray-400 mb-4">A spiritual community for awakened souls to connect, grow, and support each other on their
                  spiritual journeys.</p>
                <p className="text-sm text-gray-400">© 2025 Collective Souls. All rights reserved.</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link to="/login" className="text-gray-300 hover:text-white">Login</Link></li>
                  <li><Link to="/register" className="text-gray-300 hover:text-white">Register</Link></li>
                  <li><Link to="/about" className="text-gray-300 hover:text-white">About Us</Link></li>
                  <li><Link to="/guidelines" className="text-gray-300 hover:text-white">Community Guidelines</Link></li>
                  <li><Link to="/contact" className="text-gray-300 hover:text-white">Contact</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-6 text-center">
              <p className="text-lg italic text-gray-300">"The wound is the place where the Light enters you." - Rumi</p>
            </div>
          </div>
        </footer>
      )}
      </div>
  )
}

export default Layout
