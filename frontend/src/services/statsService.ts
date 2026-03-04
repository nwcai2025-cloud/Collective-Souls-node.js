export const fetchStats = async () => {
  try {
    const response = await fetch('/api/stats/realtime')
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching stats:', error)
    return { success: false, message: 'Failed to fetch stats' }
  }
}