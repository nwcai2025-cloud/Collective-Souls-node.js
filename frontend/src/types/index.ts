export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  is_online: boolean;
  last_seen: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  location: string;
  is_private: boolean;
  max_participants: number;
  created_by: number;
  room_url?: string;
  room_type?: string;
  room_created: boolean;
  chat_room_id?: number;
  event_status: string;
  creator?: User;
}

export interface UserEvent {
  id: number;
  user_id: number;
  event_id: number;
  status: 'owner' | 'joined';
  event_status: string;
  room_url?: string;
  room_type?: string;
  room_created: boolean;
  chat_room_id?: number;
  room_created_at?: string;
  joined_at: string;
  event: Event;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}