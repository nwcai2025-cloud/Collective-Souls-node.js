const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { User, Donation } = require('../models');
const paymentGatewayService = require('../services/paymentGatewayService');

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || !user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    next();
    } catch (error) {
    console.error('Admin check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to validate donation amount
const validateDonationAmount = (amount) => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Invalid donation amount');
  }
  if (numAmount > 10000) {
    throw new Error('Donation amount too high');
  }
  return numAmount;
};

/**
 * @route   POST /api/donations/initiate
 * @desc    Initiate a donation
 * @access  Private
 */
router.post('/initiate', authenticateToken, [
  body('amount').isFloat({ min: 0.01, max: 10000 }).withMessage('Amount must be between $0.01 and $10,000'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
  body('payment_method').isIn(['google_pay', 'venmo', 'other']).withMessage('Invalid payment method'),
  body('donor_name').optional().isLength({ max: 100 }).withMessage('Donor name too long'),
  body('donor_email').optional().isEmail().withMessage('Invalid email'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message too long'),
  body('is_recurring').optional().isBoolean().withMessage('Invalid recurring flag'),
  body('recurring_interval').optional().isIn(['monthly', 'yearly']).withMessage('Invalid recurring interval')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, currency = 'USD', payment_method, donor_name, donor_email, message, is_recurring, recurring_interval } = req.body;

    // Validate amount
    const validatedAmount = validateDonationAmount(amount);

    // Create donation record
    const donation = await Donation.create({
      user_id: req.user.id,
      amount: validatedAmount,
      currency: currency.toUpperCase(),
      payment_status: 'pending',
      payment_gateway: payment_method,
      donor_name: donor_name || null,
      donor_email: donor_email || null,
      message: message || null,
      is_recurring: is_recurring || false,
      recurring_interval: is_recurring ? recurring_interval : null
    });

    console.log(`Donation initiated: ${donation.id} for user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Donation initiated successfully',
      data: {
        donation_id: donation.id,
        amount: donation.amount,
        currency: donation.currency,
        payment_method: donation.payment_gateway,
        status: donation.payment_status
      }
    });

  } catch (error) {
    console.error('Donation initiation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate donation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/donations/confirm
 * @desc    Confirm a donation (called by payment gateway webhooks)
 * @access  Private (with webhook secret)
 */
router.post('/confirm', async (req, res) => {
  try {
    const { donation_id, transaction_id, status, gateway_response } = req.body;

    if (!donation_id || !transaction_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    const donation = await Donation.findByPk(donation_id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Validate status
    const validStatuses = ['completed', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Update donation
    await donation.update({
      payment_status: status,
      gateway_transaction_id: transaction_id,
      gateway_response: JSON.stringify(gateway_response || {}),
      updated_at: new Date()
    });

    console.log(`Donation confirmed: ${donation_id} - Status: ${status}`);

    res.json({
      success: true,
      message: 'Donation confirmed successfully',
      data: {
        donation_id: donation.id,
        status: donation.payment_status,
        transaction_id: donation.gateway_transaction_id
      }
    });

  } catch (error) {
    console.error('Donation confirmation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm donation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/donations/history
 * @desc    Get user's donation history
 * @access  Private
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Donation.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      offset: offset,
      limit: limit
    });

    res.json({
      success: true,
      data: {
        donations: rows,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_donations: count,
          per_page: limit
        }
      }
    });

  } catch (error) {
    console.error('Failed to get donation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve donation history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/donations/stats
 * @desc    Get donation statistics (admin only)
 * @access  Private (Admin)
 */
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const where = { payment_status: 'completed' };
    if (start_date && end_date) {
      where.created_at = {
        [require('sequelize').Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const totalAmount = await Donation.sum('amount', { where });
    const totalDonations = await Donation.count({ where });
    const uniqueDonors = await Donation.count({
      distinct: true,
      col: 'user_id',
      where
    });

    const stats = {
      total_amount: totalAmount || 0,
      total_donations: totalDonations || 0,
      unique_donors: uniqueDonors || 0,
      average_donation: totalDonations > 0 ? (totalAmount / totalDonations).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Failed to get donation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve donation statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/donations/admin
 * @desc    Get all donations for admin management
 * @access  Private (Admin)
 */
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const payment_method = req.query.payment_method;
    const search = req.query.search;

    const where = {};
    if (status) where.payment_status = status;
    if (payment_method) where.payment_gateway = payment_method;

    if (search) {
      where[require('sequelize').Op.or] = [
        { donor_name: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { donor_email: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { '$user.username$': { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Donation.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }],
      order: [['created_at', 'DESC']],
      offset: offset,
      limit: limit
    });

    res.json({
      success: true,
      data: {
        donations: rows,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(count / limit),
          total_donations: count,
          per_page: limit
        }
      }
    });

  } catch (error) {
    console.error('Failed to get admin donations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve donations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/donations/admin/:id
 * @desc    Get single donation details (admin only)
 * @access  Private (Admin)
 */
router.get('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }]
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    res.json({
      success: true,
      data: donation
    });

  } catch (error) {
    console.error('Failed to get donation details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve donation details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/donations/gateways
 * @desc    Get available payment gateways
 * @access  Public
 */
router.get('/gateways', async (req, res) => {
  try {
    const config = paymentGatewayService.getGatewayConfig();
    
    res.json({
      success: true,
      data: {
        gateways: config.enabledGateways,
        configurations: config.config,
        features: {
          google_pay: {
            name: 'Google Pay',
            description: 'Fast, secure mobile payments',
            icon: 'google-pay',
            supportedCurrencies: ['USD'],
            requiresApp: true
          },
          venmo: {
            name: 'Venmo',
            description: 'Send money to friends, split bills, pay at stores',
            icon: 'venmo',
            supportedCurrencies: ['USD'],
            manualVerification: true,
            qrCode: true
          }
        }
      }
    });

  } catch (error) {
    console.error('Failed to get payment gateways:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment gateways',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   PUT /api/donations/admin/:id/status
 * @desc    Update donation status (admin only)
 * @access  Private (Admin)
 */
router.put('/admin/:id/status', authenticateToken, requireAdmin, [
  body('status').isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const donation = await Donation.findByPk(id);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    await donation.update({
      payment_status: status,
      updated_at: new Date()
    });

    console.log(`Donation status updated: ${id} - Status: ${status}`);

    res.json({
      success: true,
      message: 'Donation status updated successfully',
      data: {
        donation_id: donation.id,
        status: donation.payment_status
      }
    });

  } catch (error) {
    console.error('Failed to update donation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update donation status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;