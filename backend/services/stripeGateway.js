const Stripe = require('stripe');
const { logger } = require('../utils/logger');

class StripeGateway {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  /**
   * Create a payment intent for donation
   * @param {Object} options - Payment options
   * @returns {Promise<Object>}
   */
  async createPayment(options) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(options.amount * 100), // Stripe expects amount in cents
        currency: options.currency.toLowerCase(),
        description: options.description,
        metadata: {
          donation_id: options.metadata.donation_id,
          user_id: options.metadata.user_id,
          is_recurring: options.metadata.is_recurring,
          recurring_interval: options.metadata.recurring_interval
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        paymentUrl: null, // Stripe uses client-side integration
        status: paymentIntent.status
      };

    } catch (error) {
      logger.error('Stripe payment intent creation failed:', error);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * @param {Object} payload - Webhook payload
   * @param {string} signature - Webhook signature
   * @returns {boolean}
   */
  async verifyWebhookSignature(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      return event !== null;
    } catch (error) {
      logger.error('Stripe webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process webhook event
   * @param {Object} payload - Webhook payload
   * @returns {Promise<Object>}
   */
  async processWebhookEvent(payload) {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      payload.headers ? payload.headers['stripe-signature'] : payload['stripe-signature'],
      this.webhookSecret
    );

    const donationId = event.data.object.metadata.donation_id;
    const transactionId = event.data.object.id;

    switch (event.type) {
      case 'payment_intent.succeeded':
        return {
          type: 'payment_succeeded',
          donationId: donationId,
          transactionId: transactionId,
          amount: event.data.object.amount / 100, // Convert back to dollars
          currency: event.data.object.currency
        };

      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        return {
          type: 'payment_failed',
          donationId: donationId,
          transactionId: transactionId,
          reason: event.data.object.last_payment_error?.message
        };

      case 'charge.refunded':
        return {
          type: 'payment_refunded',
          donationId: donationId,
          transactionId: transactionId,
          refundId: event.data.object.refunds.data[0]?.id
        };

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
        return { type: 'unknown', donationId: donationId };
    }
  }

  /**
   * Refund a payment
   * @param {Object} options - Refund options
   * @returns {Promise<Object>}
   */
  async refundPayment(options) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: options.transactionId,
        amount: Math.round(options.amount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          reason: options.reason
        }
      });

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100 // Convert back to dollars
      };

    } catch (error) {
      logger.error('Stripe refund failed:', error);
      throw new Error(`Stripe refund failed: ${error.message}`);
    }
  }

  /**
   * Create a customer for recurring donations
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>}
   */
  async createCustomer(customerData) {
    try {
      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata: {
          user_id: customerData.user_id
        }
      });

      return {
        success: true,
        customerId: customer.id
      };

    } catch (error) {
      logger.error('Stripe customer creation failed:', error);
      throw new Error(`Stripe customer creation failed: ${error.message}`);
    }
  }

  /**
   * Create a subscription for recurring donations
   * @param {Object} options - Subscription options
   * @returns {Promise<Object>}
   */
  async createSubscription(options) {
    try {
      const interval = options.interval === 'yearly' ? 'year' : 'month';
      
      const subscription = await this.stripe.subscriptions.create({
        customer: options.customerId,
        items: [{
          price_data: {
            currency: options.currency.toLowerCase(),
            product_data: {
              name: 'Collective Souls Monthly Donation'
            },
            unit_amount: Math.round(options.amount * 100),
            recurring: {
              interval: interval
            }
          }
        }],
        metadata: {
          donation_id: options.donationId,
          user_id: options.userId
        }
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status
      };

    } catch (error) {
      logger.error('Stripe subscription creation failed:', error);
      throw new Error(`Stripe subscription creation failed: ${error.message}`);
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {boolean} immediately - Cancel immediately or at period end
   * @returns {Promise<Object>}
   */
  async cancelSubscription(subscriptionId, immediately = false) {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId, {
        cancel_at_period_end: !immediately
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        canceledAt: subscription.canceled_at
      };

    } catch (error) {
      logger.error('Stripe subscription cancellation failed:', error);
      throw new Error(`Stripe subscription cancellation failed: ${error.message}`);
    }
  }
}

module.exports = StripeGateway;