import { UserEvent, ApiResponse } from '../types/index';

export interface UserEventResponse {
  success: boolean;
  data: {
    user_events: UserEvent[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalEvents: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  message?: string;
}

export interface CreateRoomResponse {
  success: boolean;
  data: {
    chat_room_id: number;
    chat_room: {
      id: number;
      name: string;
      description: string;
      room_type: string;
    };
    event: any;
  };
  message: string;
}

export interface RoomDetailsResponse {
  success: boolean;
  data: {
    room_url: string;
    room_type: string;
    room_created_at: string;
    event: any;
  };
  message?: string;
}

class UserEventService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      throw new Error('No authentication token found');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getUserEvents(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<UserEventResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.status) searchParams.append('status', params.status);
    if (params?.type) searchParams.append('type', params.type);

    console.log('userEventService.getUserEvents - fetching...');
    const response = await fetch(`/api/user-events?${searchParams.toString()}`, {
      headers: this.getAuthHeaders()
    });

    console.log('userEventService.getUserEvents - response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('userEventService.getUserEvents - error:', errorText);
      throw new Error('Failed to fetch user events');
    }

    const data = await response.json();
    console.log('userEventService.getUserEvents - data:', data);
    return data;
  }

  async getUpcomingEvents(limit: number = 10): Promise<UserEventResponse> {
    const response = await fetch(`/api/user-events/upcoming?limit=${limit}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch upcoming events');
    }

    return response.json();
  }

  async getPastEvents(params?: {
    page?: number;
    limit?: number;
  }): Promise<UserEventResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`/api/user-events/past?${searchParams.toString()}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch past events');
    }

    return response.json();
  }

  async getOwnerEvents(params?: {
    page?: number;
    limit?: number;
  }): Promise<UserEventResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`/api/user-events/owners?${searchParams.toString()}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch owner events');
    }

    return response.json();
  }

  async getRoomEligibleEvents(): Promise<UserEventResponse> {
    const response = await fetch('/api/user-events/room-eligible', {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch room eligible events');
    }

    return response.json();
  }

  async createRoom(eventId: number, roomType: string = 'both'): Promise<CreateRoomResponse> {
    const response = await fetch(`/api/user-events/${eventId}/create-room`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ room_type: roomType })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create room');
    }

    return response.json();
  }

  async getRoomDetails(eventId: number): Promise<RoomDetailsResponse> {
    const response = await fetch(`/api/user-events/${eventId}/room`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get room details');
    }

    return response.json();
  }

  async updateRoom(eventId: number, data: {
    room_url?: string;
    room_type?: string;
    room_created?: boolean;
  }): Promise<any> {
    const response = await fetch(`/api/user-events/${eventId}/room`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update room');
    }

    return response.json();
  }

  async deleteRoom(eventId: number): Promise<any> {
    const response = await fetch(`/api/user-events/${eventId}/room`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete room');
    }

    return response.json();
  }

  async joinEvent(eventId: number): Promise<any> {
    const response = await fetch(`/api/events/${eventId}/join`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to join event');
    }

    return response.json();
  }

  async leaveEvent(eventId: number): Promise<any> {
    const response = await fetch(`/api/events/${eventId}/join`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to leave event');
    }

    return response.json();
  }
}

export const userEventService = new UserEventService();