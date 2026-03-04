const express = require('express');
const { requireAdmin, requirePermission } = require('../middleware/auth');
const FeatureFlagService = require('../services/featureFlagService');
const { AdminAuditLog } = require('../models/Admin');

const router = express.Router();

/**
 * Get all feature flags
 */
router.get('/feature-flags', requireAdmin, requirePermission('admin', 'view_logs'), async (req, res) => {
  try {
    const flags = await FeatureFlagService.getAllFlags();
    
    res.json({
      success: true,
      data: {
        flags: flags.map(flag => ({
          id: flag.id,
          featureName: flag.feature_name,
          isEnabled: flag.is_enabled,
          description: flag.description,
          createdAt: flag.created_at,
          updatedAt: flag.updated_at
        }))
      }
    });
  } catch (error) {
    console.error('Error getting feature flags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feature flags',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

/**
 * Update a feature flag
 */
router.put('/feature-flags/:featureName', requireAdmin, requirePermission('admin', 'system_settings'), async (req, res) => {
  try {
    const { featureName } = req.params;
    const { isEnabled } = req.body;
    
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isEnabled must be a boolean value'
      });
    }

    const updatedFlag = await FeatureFlagService.updateFlag(featureName, isEnabled);
    
    // Log the change
    await AdminAuditLog.create({
      action: 'feature_flag_update',
      resource_type: 'feature_flag',
      resource_id: updatedFlag.id,
      admin_user_id: req.user.id,
      details: JSON.stringify({
        feature_name: featureName,
        old_value: !isEnabled,
        new_value: isEnabled
      })
    });

    res.json({
      success: true,
      message: `Feature flag '${featureName}' ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        flag: {
          id: updatedFlag.id,
          featureName: updatedFlag.feature_name,
          isEnabled: updatedFlag.is_enabled,
          description: updatedFlag.description,
          updatedAt: updatedFlag.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update feature flag',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

/**
 * Create a new feature flag
 */
router.post('/feature-flags', requireAdmin, requirePermission('admin', 'system_settings'), async (req, res) => {
  try {
    const { featureName, isEnabled, description } = req.body;
    
    if (!featureName || typeof featureName !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'featureName is required and must be a string'
      });
    }

    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isEnabled must be a boolean value'
      });
    }

    const newFlag = await FeatureFlagService.createFlag({
      feature_name: featureName,
      is_enabled: isEnabled,
      description: description || null
    });

    // Log the creation
    await AdminAuditLog.create({
      action: 'feature_flag_create',
      resource_type: 'feature_flag',
      resource_id: newFlag.id,
      admin_user_id: req.user.id,
      details: JSON.stringify({
        feature_name: featureName,
        is_enabled: isEnabled,
        description: description
      })
    });

    res.status(201).json({
      success: true,
      message: `Feature flag '${featureName}' created successfully`,
      data: {
        flag: {
          id: newFlag.id,
          featureName: newFlag.feature_name,
          isEnabled: newFlag.is_enabled,
          description: newFlag.description,
          createdAt: newFlag.created_at
        }
      }
    });
  } catch (error) {
    console.error('Error creating feature flag:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create feature flag',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

/**
 * Get feature flag status summary
 */
router.get('/feature-flags/status', requireAdmin, requirePermission('admin', 'view_logs'), async (req, res) => {
  try {
    const flags = await FeatureFlagService.getAllFlags();
    const status = {
      total: flags.length,
      enabled: flags.filter(f => f.is_enabled).length,
      disabled: flags.filter(f => !f.is_enabled).length,
      features: {
        liveVideoStreaming: await FeatureFlagService.isLiveVideoStreamingEnabled(),
        videoCalls: await FeatureFlagService.isVideoCallsEnabled(),
        phoneCalls: await FeatureFlagService.isPhoneCallsEnabled(),
        anyCommunicationFeatures: await FeatureFlagService.areAnyCommunicationFeaturesEnabled()
      }
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting feature flag status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feature flag status',
      error: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

module.exports = router;