/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mindful-purple': '#6B46C1',
        'serene-blue': '#3B82F6',
        'calm-green': '#10B981',
        'spiritual-purple': '#8B5CF6',
        'spiritual-green': '#059669',
        'spiritual-blue': '#60A5FA',
        'primary': '#6B46C1',
        'secondary': '#10B981',
        'purple': '#8B5CF6',
        'accent': '#F59E0B',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}