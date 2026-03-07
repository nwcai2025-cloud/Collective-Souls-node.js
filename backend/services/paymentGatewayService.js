const { Donation } = require('../models');
const GooglePayGateway = require('./googlePayGateway');
const VenmoGateway = require('./venmoGateway');

class PaymentGatewayService {
  constructor() {
    this.gateways = new Map();
    this.config = {
      google_pay: {
        enabled: process.env.GOOGLE_PAY_ENABLED === 'true',
        merchantId: process.env.GOOGLE_PAY_MERCHANT_ID,
        gatewayMerchantId: process.env.GOOGLE_PAY_GATEWAY_MERCHANT_ID,
        environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST'
      },
      venmo: {
        enabled: process.env.VENMO_ENABLED === 'true',
        username: process.env.VENMO_USERNAME || '@CollectiveSouls'
      }
    };
    
    this.initializeGateways();
  }

  /**
   * Initialize and register all available payment gateways
   */
  initializeGateways() {
    // Register Google Pay gateway
    if (this.config.google_pay.enabled) {
      const googlePayGateway = new GooglePayGateway();
      this.registerGateway('google_pay', googlePayGateway);
    }

    // Register Venmo gateway
    if (this.config.venmo.enabled) {
      const venmoGateway = new VenmoGateway();
      this.registerGateway('venmo', venmoGateway);
    }
  }

  /**
   * Register a payment gateway
   * @param {string} name - Gateway name
   * @param {Object} gateway - Gateway implementation
   */
  registerGateway(name, gateway) {
    this.gateways.set(name, gateway);
    console.log(`Payment gateway registered: ${name}`);
  }

  /**
   * Get a payment gateway instance
   * @param {string} name - Gateway name
   * @returns {Object|null}
   */
  getGateway(name) {
    return this.gateways.get(name) || null;
  }

  /**
   * Process a donation
   * @param {Object} donation - Donation object
   * @returns {Promise<Object>}
   */
  async processDonation(donation) {
    const gateway = this.getGateway(donation.payment_gateway);
    
    if (!gateway) {
      throw new Error(`Payment gateway not found: ${donation.payment_gateway}`);
    }

    try {
      // Create payment intent/transaction
      const paymentResult = await gateway.createPayment({
        amount: donation.amount,
        currency: donation.currency,
        description: `Donation to Collective Souls - ${donation.message || 'General Support'}`,
        metadata: {
          donation_id: donation.id,
          user_id: donation.user_id,
          is_recurring: donation.is_recurring,
          recurring_interval: donation.recurring_interval
        }
      });

      // Update donation with payment details
      await donation.update({
        gateway_transaction_id: paymentResult.transactionId,
        gateway_response: JSON.stringify(paymentResult),
        payment_status: 'pending'
      });

      return {
        success: true,
        paymentUrl: paymentResult.paymentUrl || null,
        clientSecret: paymentResult.clientSecret || null,
        transactionId: paymentResult.transactionId
      };

    } catch (error) {
      console.error('Payment processing failed:', error);
      
      // Update donation status to failed
      await donation.update({
        payment_status: 'failed',
        gateway_response: JSON.stringify({ error: error.message })
      });

      throw error;
    }
  }

  /**
   * Handle payment webhook
   * @param {string} gatewayName - Gateway name
   * @param {Object} payload - Webhook payload
   * @param {string} signature - Webhook signature
   * @returns {Promise<Object>}
   */
  async handleWebhook(gatewayName, payload, signature) {
    const gateway = this.getGateway(gatewayName);
    
    if (!gateway) {
      throw new Error(`Payment gateway not found: ${gatewayName}`);
    }

    // Verify webhook signature
    const isValid = await gateway.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // Process webhook event
    const event = await gateway.processWebhookEvent(payload);
    
    if (event.type === 'payment_succeeded' || event.type === 'payment_completed') {
      await this.updateDonationStatus(event.donationId, 'completed', event.transactionId);
    } else if (event.type === 'payment_failed' || event.type === 'payment_canceled') {
      await this.updateDonationStatus(event.donationId, 'failed', event.transactionId);
    } else if (event.type === 'payment_refunded') {
      await this.updateDonationStatus(event.donationId, 'refunded', event.transactionId);
    }

    return { success: true, event: event.type };
  }

  /**
   * Update donation status
   * @param {number} donationId - Donation ID
   * @param {string} status - New status
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<void>}
   */
  async updateDonationStatus(donationId, status, transactionId) {
    const donation = await Donation.findByPk(donationId);
    if (!donation) {
      throw new Error('Donation not found');
    }

    await donation.update({
      payment_status: status,
      gateway_transaction_id: transactionId,
      updated_at: new Date()
    });

    console.log(`Donation ${donationId} status updated to ${status}`);
  }

  /**
   * Refund a donation
   * @param {number} donationId - Donation ID
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>}
   */
  async refundDonation(donationId, reason = 'Refund requested') {
    const donation = await Donation.findByPk(donationId);
    if (!donation) {
      throw new Error('Donation not found');
    }

    if (donation.payment_status !== 'completed') {
      throw new Error('Cannot refund non-completed donation');
    }

    const gateway = this.getGateway(donation.payment_gateway);
    if (!gateway) {
      throw new Error('Payment gateway not available');
    }

    try {
      const refundResult = await gateway.refundPayment({
        transactionId: donation.gateway_transaction_id,
        amount: donation.amount,
        reason: reason
      });

      await donation.update({
        payment_status: 'refunded',
        gateway_response: JSON.stringify(refundResult),
        updated_at: new Date()
      });

      return { success: true, refundId: refundResult.refundId };
    } catch (error) {
      console.error('Refund failed:', error);
      throw error;
    }
  }

  /**
   * Get payment gateway configuration
   * @returns {Object}
   */
  getGatewayConfig() {
    return {
      availableGateways: Array.from(this.gateways.keys()),
      enabledGateways: Object.keys(this.config).filter(key => this.config[key].enabled),
      config: this.config
    };
  }
}

// Singleton instance
const paymentGatewayService = new PaymentGatewayService();

module.exports = paymentGatewayService;