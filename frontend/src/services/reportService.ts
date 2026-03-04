import axios from 'axios';

// Create axios instance with authentication
const api = axios.create({
  baseURL: '/api',
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

// Report types
export interface ReportData {
  content_type: 'comment' | 'activity' | 'user' | 'video' | 'chat_message';
  content_id: number;
  reason: string;
  description: string;
}

export interface ReportResponse {
  success: boolean;
  message: string;
  report: {
    id: number;
    content_type: string;
    content_id: number;
    reason: string;
    description: string;
    status: string;
    created_at: string;
  };
}

// Submit report
export const submitReport = async (reportData: ReportData): Promise<ReportResponse> => {
  try {
    const response = await api.post('/posts/report', reportData);
    return response.data;
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
};

// Get user reports (for admin use)
export const getUserReports = async (userId: number) => {
  try {
    const response = await api.get(`/admin/reports/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user reports:', error);
    throw error;
  }
};

// Get all reports (for admin use)
export const getAllReports = async (page = 1, limit = 20) => {
  try {
    const response = await api.get(`/admin/reports?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

// Update report status (for admin use)
export const updateReportStatus = async (reportId: number, status: string) => {
  try {
    const response = await api.put(`/admin/reports/${reportId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
};

// Delete report (for admin use)
export const deleteReport = async (reportId: number) => {
  try {
    const response = await api.delete(`/admin/reports/${reportId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};