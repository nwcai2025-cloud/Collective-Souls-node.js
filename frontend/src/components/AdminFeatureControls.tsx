import React, { useState, useEffect } from 'react';
import { featureFlagService } from '../services/featureFlagService';
import toast from 'react-hot-toast';
import {
  Shield,
  Video,
  Phone,
  ToggleRight,
  ToggleLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface FeatureFlag {
  id: number;
  featureName: string;
  isEnabled: boolean;
  description: string;
  updatedAt: string;
}

const AdminFeatureControls: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [showStatus, setShowStatus] = useState(false);

  const featureConfig = {
    live_video_streaming: {
      name: 'Live Video Streaming',
      icon: Shield,
      color: 'purple',
      description: 'Master switch for all video and phone features'
    },
    video_calls: {
      name: 'Video Calls',
      icon: Video,
      color: 'blue',
      description: 'Enable/disable video call functionality'
    },
    phone_calls: {
      name: 'Phone Calls',
      icon: Phone,
      color: 'green',
      description: 'Enable/disable phone call functionality'
    }
  };

  const getFeatureColor = (featureName: string) => {
    const config = featureConfig[featureName as keyof typeof featureConfig];
    return config?.color || 'gray';
  };

  const getFeatureIcon = (featureName: string) => {
    const config = featureConfig[featureName as keyof typeof featureConfig];
    return config?.icon || Shield;
  };

  const getFeatureName = (featureName: string) => {
    const config = featureConfig[featureName as keyof typeof featureConfig];
    return config?.name || featureName;
  };

  const getFeatureDescription = (featureName: string) => {
    const config = featureConfig[featureName as keyof typeof featureConfig];
    return config?.description || '';
  };

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const response = await featureFlagService.getAllFlags();
      setFlags(response.data.flags);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  const updateFlag = async (flag: FeatureFlag) => {
    try {
      setIsUpdating(flag.id);
      const response = await featureFlagService.updateFlag(flag.featureName, !flag.isEnabled);
      
      setFlags(prev => prev.map(f => 
        f.id === flag.id 
          ? { ...f, isEnabled: !f.isEnabled, updatedAt: response.data.flag.updatedAt }
          : f
      ));
      
      toast.success(`Feature "${getFeatureName(flag.featureName)}" ${!flag.isEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating feature flag:', error);
      toast.error('Failed to update feature flag');
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusSummary = () => {
    const total = flags.length;
    const enabled = flags.filter(f => f.isEnabled).length;
    const disabled = total - enabled;
    
    return { total, enabled, disabled };
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-bold">Loading feature controls...</p>
          </div>
        </div>
      </div>
    );
  }

  const status = getStatusSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Feature Controls</h2>
            <p className="text-purple-100 text-lg">Manage platform communication features</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchFlags}
              disabled={loading}
              className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-xl transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowStatus(!showStatus)}
              className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-xl transition-all"
            >
              {showStatus ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              <span>{showStatus ? 'Hide' : 'Show'} Status</span>
            </button>
          </div>
        </div>
        
        {showStatus && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100 font-bold">Total Features</p>
                  <p className="text-2xl font-black">{status.total}</p>
                </div>
                <Settings className="w-8 h-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100 font-bold">Enabled</p>
                  <p className="text-2xl font-black text-green-200">{status.enabled}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100 font-bold">Disabled</p>
                  <p className="text-2xl font-black text-red-200">{status.disabled}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {flags.map((flag) => {
          const Icon = getFeatureIcon(flag.featureName);
          const color = getFeatureColor(flag.featureName);
          const featureName = getFeatureName(flag.featureName);
          const description = getFeatureDescription(flag.featureName);

          return (
            <div
              key={flag.id}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 bg-${color}-100 rounded-2xl flex items-center justify-center text-${color}-600 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{featureName}</h3>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                  </div>
                </div>
                
                {/* Status Indicator */}
                <div className="flex flex-col items-end space-y-2">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                    flag.isEnabled 
                      ? `bg-${color}-100 text-${color}-700` 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {flag.isEnabled ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-400 font-bold">
                    Updated: {new Date(flag.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Toggle Control */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 font-medium">
                  {flag.isEnabled ? 'Currently enabled for all users' : 'Currently disabled for all users'}
                </div>
                
                <button
                  onClick={() => updateFlag(flag)}
                  disabled={isUpdating === flag.id}
                  className={`relative inline-flex items-center h-8 rounded-full w-14 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-500 ${
                    flag.isEnabled ? `bg-${color}-500` : 'bg-gray-200'
                  } ${isUpdating === flag.id ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                >
                  <span
                    className={`inline-block w-6 h-6 transform bg-white rounded-full shadow-md transition-transform ${
                      flag.isEnabled ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                  {isUpdating === flag.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </button>
              </div>

              {/* Warning for Master Switch */}
              {flag.featureName === 'live_video_streaming' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs text-yellow-700 font-bold uppercase tracking-widest">
                      Master Control
                    </span>
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">
                    Disabling this will turn off ALL video and phone features, regardless of individual settings.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-6 border border-gray-200">
        <h3 className="text-lg font-black text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const allEnabled = flags.every(f => f.isEnabled);
              flags.forEach(flag => updateFlag({ ...flag, isEnabled: !allEnabled }));
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
          >
            Enable All Features
          </button>
          <button
            onClick={() => {
              const allDisabled = flags.every(f => !f.isEnabled);
              flags.forEach(flag => updateFlag({ ...flag, isEnabled: allDisabled }));
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
          >
            Disable All Features
          </button>
          <button
            onClick={() => {
              // Enable only video and phone calls, disable master switch
              const videoFlag = flags.find(f => f.featureName === 'video_calls');
              const phoneFlag = flags.find(f => f.featureName === 'phone_calls');
              const masterFlag = flags.find(f => f.featureName === 'live_video_streaming');
              
              if (videoFlag) updateFlag({ ...videoFlag, isEnabled: true });
              if (phoneFlag) updateFlag({ ...phoneFlag, isEnabled: true });
              if (masterFlag) updateFlag({ ...masterFlag, isEnabled: true });
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
          >
            Enable Communication Features
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminFeatureControls;