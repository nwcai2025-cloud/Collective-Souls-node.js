import axios from 'axios';

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

// Post types
export interface Post {
  id: number;
  user_id: number;
  content: string;
  post_type: 'reflection' | 'gratitude' | 'question' | 'inspiration' | 'announcement';
  post_type_emoji: string;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    username: string;
    profile_image: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  reaction_counts: {
    heart: number;
    pray: number;
    sparkle: number;
    lightbulb: number;
    peace: number;
  };
  user_reaction: string | null;
  like_count: number;
  comment_count: number;
}

export interface Comment {
  id: number;
  content: string;
  author_id: number;
  commentable_type: string;
  commentable_id: number;
  parent_id: number | null;
  is_edited: boolean;
  created_at: string;
  author: {
    id: number;
    username: string;
    profile_image: string | null;
  };
}

// Get all posts
export const getPosts = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/posts?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
};

// Get single post
export const getPost = async (id: number) => {
  try {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching post:', error);
    throw error;
  }
};

// Create post
export const createPost = async (data: { content: string; post_type?: string }) => {
  try {
    const response = await api.post('/posts', data);
    return response.data;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Update post
export const updatePost = async (id: number, data: { content: string; post_type?: string }) => {
  try {
    const response = await api.put(`/posts/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// Delete post
export const deletePost = async (id: number) => {
  try {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Add/update reaction
export const addReaction = async (postId: number, reactionType: string) => {
  try {
    const response = await api.post(`/posts/${postId}/like`, { reaction_type: reactionType });
    return response.data;
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
};

// Remove reaction
export const removeReaction = async (postId: number) => {
  try {
    const response = await api.delete(`/posts/${postId}/like`);
    return response.data;
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
};

// Get comments for a post
export const getComments = async (postId: number, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/posts/${postId}/comments?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

// Add comment to post
export const addComment = async (postId: number, content: string, parentId?: number) => {
  try {
    const response = await api.post(`/posts/${postId}/comments`, { 
      content, 
      parent_id: parentId 
    });
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Report post
export const reportPost = async (postId: number, reason: string, description?: string) => {
  try {
    const response = await api.post(`/posts/${postId}/report`, { reason, description });
    return response.data;
  } catch (error) {
    console.error('Error reporting post:', error);
    throw error;
  }
};

// Block user
export const blockUser = async (userId: number) => {
  try {
    const response = await api.post(`/users/${userId}/block`);
    return response.data;
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

// Unblock user
export const unblockUser = async (userId: number) => {
  try {
    const response = await api.delete(`/users/${userId}/block`);
    return response.data;
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};

// Mute user
export const muteUser = async (userId: number) => {
  try {
    const response = await api.post(`/users/${userId}/mute`);
    return response.data;
  } catch (error) {
    console.error('Error muting user:', error);
    throw error;
  }
};

// Unmute user
export const unmuteUser = async (userId: number) => {
  try {
    const response = await api.delete(`/users/${userId}/mute`);
    return response.data;
  } catch (error) {
    console.error('Error unmuting user:', error);
    throw error;
  }
};

// Report user
export const reportUser = async (userId: number, reason: string, description?: string) => {
  try {
    const response = await api.post(`/users/${userId}/report`, { reason, description });
    return response.data;
  } catch (error) {
    console.error('Error reporting user:', error);
    throw error;
  }
};

// Get moderation status for a user
export const getModerationStatus = async (userId: number) => {
  try {
    const response = await api.get(`/users/${userId}/moderation-status`);
    return response.data;
  } catch (error) {
    console.error('Error getting moderation status:', error);
    throw error;
  }
};

// Get blocked users
export const getBlockedUsers = async () => {
  try {
    const response = await api.get('/users/blocked/list');
    return response.data;
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    throw error;
  }
};

// Get muted users
export const getMutedUsers = async () => {
  try {
    const response = await api.get('/users/muted/list');
    return response.data;
  } catch (error) {
    console.error('Error fetching muted users:', error);
    throw error;
  }
};