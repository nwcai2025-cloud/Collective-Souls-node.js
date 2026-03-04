import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL + '/api' || 'http://localhost:3004/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface FeatureFlag {
  id: number;
  featureName: string;
  isEnabled: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagStatus {
  total: number;
  enabled: number;
  disabled: number;
  features: {
    liveVideoStreaming: boolean;
    videoCalls: boolean;
    phoneCalls: boolean;
    anyCommunicationFeatures: boolean;
  };
}

class FeatureFlagService {
  async getAllFlags(): Promise<{ data: { flags: FeatureFlag[] } }> {
    return await api.get('/admin/feature-flags');
  }

  async updateFlag(featureName: string, isEnabled: boolean): Promise<{ data: { flag: FeatureFlag } }> {
    return await api.put(`/admin/feature-flags/${featureName}`, { isEnabled });
  }

  async createFlag(flagData: {
    featureName: string;
    isEnabled: boolean;
    description?: string;
  }): Promise<{ data: { flag: FeatureFlag } }> {
    return await api.post('/admin/feature-flags', flagData);
  }

  async getStatus(): Promise<{ data: FeatureFlagStatus }> {
    return await api.get('/admin/feature-flags/status');
  }

  // Convenience methods for checking specific features
  async isLiveVideoStreamingEnabled(): Promise<boolean> {
    const status = await this.getStatus();
    return status.data.features.liveVideoStreaming;
  }

  async isVideoCallsEnabled(): Promise<boolean> {
    const status = await this.getStatus();
    return status.data.features.videoCalls;
  }

  async isPhoneCallsEnabled(): Promise<boolean> {
    const status = await this.getStatus();
    return status.data.features.phoneCalls;
  }

  async areAnyCommunicationFeaturesEnabled(): Promise<boolean> {
    const status = await this.getStatus();
    return status.data.features.anyCommunicationFeatures;
  }
}

export const featureFlagService = new FeatureFlagService();