import axios from 'axios';

// Use relative URL to leverage Vite proxy in development
const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchCommunityActivities = async (all = false) => {
  try {
    const response = await api.get(`/activities/community${all ? '?all=true' : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching community activities:', error);
    throw error;
  }
};

export const fetchUserActivities = async (all = false) => {
  try {
    const response = await api.get(`/activities/recent${all ? '?all=true' : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user activities:', error);
    throw error;
  }
};

export const logActivity = async (activityData: {
  activity_type: string;
  duration: number;
  date: string;
  description?: string;
}) => {
  try {
    const response = await api.post('/activities', activityData);
    return response.data;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};
