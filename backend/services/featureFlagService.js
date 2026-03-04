const { FeatureFlag } = require('../models');

/**
 * Service for managing feature flags
 */
class FeatureFlagService {
  /**
   * Check if a feature is enabled
   * @param {string} featureName - The name of the feature to check
   * @returns {Promise<boolean>} Whether the feature is enabled
   */
  static async isFeatureEnabled(featureName) {
    try {
      const flag = await FeatureFlag.findOne({
        where: { feature_name: featureName }
      });
      
      if (!flag) {
        console.warn(`Feature flag '${featureName}' not found, defaulting to enabled`);
        return true; // Default to enabled if flag doesn't exist
      }
      
      return flag.is_enabled;
    } catch (error) {
      console.error(`Error checking feature flag '${featureName}':`, error);
      return true; // Default to enabled on error
    }
  }

  /**
   * Get all feature flags
   * @returns {Promise<Array>} Array of all feature flags
   */
  static async getAllFlags() {
    try {
      return await FeatureFlag.findAll({
        order: [['feature_name', 'ASC']]
      });
    } catch (error) {
      console.error('Error getting all feature flags:', error);
      return [];
    }
  }

  /**
   * Update a feature flag
   * @param {string} featureName - The name of the feature to update
   * @param {boolean} isEnabled - Whether the feature should be enabled
   * @returns {Promise<Object>} Updated flag
   */
  static async updateFlag(featureName, isEnabled) {
    try {
      const flag = await FeatureFlag.findOne({
        where: { feature_name: featureName }
      });

      if (!flag) {
        throw new Error(`Feature flag '${featureName}' not found`);
      }

      flag.is_enabled = isEnabled;
      await flag.save();

      return flag;
    } catch (error) {
      console.error(`Error updating feature flag '${featureName}':`, error);
      throw error;
    }
  }

  /**
   * Create a new feature flag
   * @param {Object} flagData - Flag data including name, enabled status, and description
   * @returns {Promise<Object>} Created flag
   */
  static async createFlag(flagData) {
    try {
      const flag = await FeatureFlag.create(flagData);
      return flag;
    } catch (error) {
      console.error('Error creating feature flag:', error);
      throw error;
    }
  }

  /**
   * Check multiple features at once
   * @param {Array<string>} featureNames - Array of feature names to check
   * @returns {Promise<Object>} Object with feature names as keys and boolean values
   */
  static async checkMultipleFeatures(featureNames) {
    try {
      const flags = await FeatureFlag.findAll({
        where: {
          feature_name: featureNames
        }
      });

      const result = {};
      featureNames.forEach(name => {
        const flag = flags.find(f => f.feature_name === name);
        result[name] = flag ? flag.is_enabled : true; // Default to enabled
      });

      return result;
    } catch (error) {
      console.error('Error checking multiple features:', error);
      // Return all features as enabled on error
      return featureNames.reduce((acc, name) => {
        acc[name] = true;
        return acc;
      }, {});
    }
  }

  /**
   * Check if video calls are enabled
   * @returns {Promise<boolean>} Whether video calls are enabled
   */
  static async isVideoCallsEnabled() {
    return await this.isFeatureEnabled('video_calls');
  }

  /**
   * Check if phone calls are enabled
   * @returns {Promise<boolean>} Whether phone calls are enabled
   */
  static async isPhoneCallsEnabled() {
    return await this.isFeatureEnabled('phone_calls');
  }

  /**
   * Check if live video streaming is enabled (master switch)
   * @returns {Promise<boolean>} Whether live video streaming is enabled
   */
  static async isLiveVideoStreamingEnabled() {
    return await this.isFeatureEnabled('live_video_streaming');
  }

  /**
   * Check if any video/phone features are enabled
   * @returns {Promise<boolean>} Whether any communication features are enabled
   */
  static async areAnyCommunicationFeaturesEnabled() {
    const features = await this.checkMultipleFeatures([
      'live_video_streaming',
      'video_calls', 
      'phone_calls'
    ]);
    
    return Object.values(features).some(enabled => enabled);
  }
}

module.exports = FeatureFlagService;