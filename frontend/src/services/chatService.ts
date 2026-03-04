import axios from 'axios';

// Enhanced API URL detection for mobile compatibility
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:3004`;
  }
  return 'http://localhost:3004';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  console.log('Token from localStorage:', token); // Debug log
  if (token) {
    console.log('Authorization header set:', `Bearer ${token}`); // Debug log
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  } else {
    console.log('No token found in localStorage'); // Debug log
    return {
      'Content-Type': 'application/json'
    };
  }
};

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding auth header:', `Bearer ${token.substring(0, 10)}...`); // Debug log
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Types
export interface ChatRoom {
  id: number;
  name: string;
  description: string;
  room_type: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  max_participants: number;
  is_community_room: boolean;
  is_private: boolean;
  participant_count: number;
  is_participant: boolean;
  creator: {
    id: number;
    username: string;
  };
}

export interface DirectMessage {
  id: number;
  name: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_group_chat: boolean;
  is_active: boolean;
  status: 'pending' | 'accepted' | 'declined';
  participants: Array<{
    id: number;
    username: string;
    profile_image: string;
  }>;
  participant_count: number;
  last_message: Message | null;
  creator: {
    id: number;
    username: string;
  };
}

export interface Message {
  id: number;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'system';
  file_url: string | null;
  file_name: string | null;
  file_size: number;
  sender_id: number;
  room_id: number | null;
  dm_id: number | null;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  sender: {
    id: number;
    username: string;
    profile_image: string;
  };
  reactions: Array<{
    id: number;
    message_id: number;
    user_id: number;
    emoji: string;
    created_at: string;
    user: {
      id: number;
      username: string;
    };
  }>;
}

export interface UserPresence {
  id: number;
  user_id: number;
  is_online: boolean;
  last_seen: string;
  current_room_id: number | null;
  user: {
    id: number;
    username: string;
    profile_image: string;
  };
  current_room: {
    id: number;
    name: string;
  } | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  currentPage: number;
  totalPages: number;
  totalRooms?: number;
  totalDMs?: number;
  totalMessages?: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Room Management
export const chatService = {
  // Get all chat rooms
  async getRooms(params: PaginationParams = {}) {
    console.log('getRooms called with params:', params); // Debug log
    const token = localStorage.getItem('token');
    console.log('Token in getRooms:', token ? `Bearer ${token.substring(0, 10)}...` : 'No token'); // Debug log
    const response = await api.get('/chat/rooms/', { params });
    console.log('getRooms response:', response.data); // Debug log
    return response.data;
  },

  // Create new room
  async createRoom(roomData: {
    name: string;
    description?: string;
    room_type?: string;
    is_private?: boolean;
    max_participants?: number;
  }) {
    const response = await api.post('/chat/rooms/', roomData);
    return response.data;
  },

  // Get room details
  async getRoom(roomId: number) {
    const response = await api.get(`/chat/rooms/${roomId}/`);
    return response.data;
  },

  // Join a room
  async joinRoom(roomId: number) {
    const response = await api.post(`/chat/rooms/${roomId}/join/`);
    return response.data;
  },

  // Leave a room
  async leaveRoom(roomId: number) {
    const response = await api.post(`/chat/rooms/${roomId}/leave/`);
    return response.data;
  },

  // Delete a room (owner only)
  async deleteRoom(roomId: number) {
    const response = await api.delete(`/chat/rooms/${roomId}/`);
    return response.data;
  },

  // Get room messages
  async getRoomMessages(roomId: number, params: PaginationParams = {}) {
    const response = await api.get(`/chat/rooms/${roomId}/messages/`, { params });
    return response.data;
  },

  // Direct Messages
  // Get all DMs
  async getDMs(params: PaginationParams = {}) {
    const response = await api.get('/chat/dms/', { params });
    return response.data;
  },

  // Start new DM
  async startDM(recipientId: number, initialMessage?: string) {
    const response = await api.post('/chat/dms/start', {
      recipient_id: recipientId,
      initial_message: initialMessage
    });
    return response.data;
  },

  // Get DM details
  async getDM(dmId: number) {
    const response = await api.get(`/chat/dms/${dmId}/`);
    return response.data;
  },

  // Get DM messages
  async getDMMessages(dmId: number, params: PaginationParams = {}) {
    const response = await api.get(`/chat/dms/${dmId}/messages/`, { params });
    return response.data;
  },

  // Respond to DM request
  async respondToDM(dmId: number, action: 'accepted' | 'declined') {
    const response = await api.post(`/chat/dms/${dmId}/respond/`, { action });
    return response.data;
  },

  // Delete DM
  async deleteDM(dmId: number) {
    const response = await api.delete(`/chat/dms/${dmId}/`);
    return response.data;
  },

  // Message Management
  // Send message
  async sendMessage(messageData: {
    content?: string;
    message_type?: 'text' | 'file' | 'image' | 'system';
    room_id?: number;
    dm_id?: number;
    file?: File;
  }) {
    const formData = new FormData();
    if (messageData.content) formData.append('content', messageData.content);
    if (messageData.message_type) formData.append('message_type', messageData.message_type);
    if (messageData.room_id) formData.append('room_id', messageData.room_id.toString());
    if (messageData.dm_id) formData.append('dm_id', messageData.dm_id.toString());
    if (messageData.file) formData.append('file', messageData.file);

    const response = await api.post('/chat/messages/send/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Add/remove reaction
  async toggleReaction(messageId: number, emoji: string) {
    const response = await api.post(`/chat/messages/${messageId}/react/`, { emoji });
    return response.data;
  },

  // Presence Management
  // Get online users
  async getOnlineUsers() {
    const response = await api.get('/chat/presence/online/');
    return response.data;
  },

  // Get user presence
  async getUserPresence() {
    const response = await api.get('/chat/presence/');
    return response.data;
  },

  // Update user presence
  async updateUserPresence(presenceData: {
    is_online?: boolean;
    current_room_id?: number | null;
  }) {
    const response = await api.post('/chat/presence/', presenceData);
    return response.data;
  }
};

export default chatService;