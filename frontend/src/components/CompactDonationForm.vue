<template>
  <div class="compact-donation-form">
    <div class="form-header">
      <h3>Support Collective Souls</h3>
      <p class="form-subtitle">Your donation helps us maintain and improve our platform</p>
    </div>

    <div class="form-content">
      <!-- Amount Input -->
      <div class="amount-section">
        <label for="amount">Amount</label>
        <div class="amount-input">
          <span class="currency">$</span>
          <input
            id="amount"
            type="number"
            v-model="amount"
            placeholder="25.00"
            min="1"
            max="10000"
            step="0.01"
          />
        </div>
      </div>

      <!-- Payment Method Selection -->
      <div class="method-section">
        <label>Payment Method</label>
        <div class="method-options">
          <button 
            class="method-btn"
            :class="{ active: selectedMethod === 'google_pay' }"
            @click="selectMethod('google_pay')"
          >
            <i class="fab fa-google-pay"></i>
            Google Pay
          </button>
          <button 
            class="method-btn"
            :class="{ active: selectedMethod === 'venmo' }"
            @click="selectMethod('venmo')"
          >
            <i class="fab fa-venmo"></i>
            Venmo
          </button>
        </div>
      </div>

      <!-- Google Pay Button -->
      <div v-if="selectedMethod === 'google_pay'" class="google-pay-section">
        <button 
          v-if="googlePayReady"
          class="google-pay-btn"
          @click="initiateGooglePay"
        >
          <i class="fab fa-google-pay"></i>
          Pay with Google Pay
        </button>
        <div v-else class="loading-text">Loading Google Pay...</div>
      </div>

      <!-- Venmo Instructions -->
      <div v-if="selectedMethod === 'venmo'" class="venmo-section">
        <div class="venmo-step">
          <span class="step-label">Send ${{ amount }} to:</span>
          <span class="venmo-handle">{{ venmoUsername }}</span>
        </div>
        <div class="venmo-step">
          <span class="step-label">Use reference:</span>
          <span class="venmo-reference">{{ venmoReference }}</span>
        </div>
        <div class="venmo-step">
          <input
            v-model="venmoPaymentId"
            placeholder="Enter Venmo payment ID"
            class="venmo-input"
          />
          <button @click="confirmVenmoPayment" class="confirm-btn">
            Confirm Payment
          </button>
        </div>
      </div>

      <!-- Message Input -->
      <div class="message-section">
        <label for="message">Message (Optional)</label>
        <textarea
          id="message"
          v-model="message"
          placeholder="Share why you're supporting us..."
          maxlength="200"
        ></textarea>
      </div>

      <!-- Status Messages -->
      <div v-if="messageText" class="status-message" :class="messageType">
        {{ messageText }}
      </div>

      <!-- Loading Indicator -->
      <div v-if="loading" class="loading-indicator">
        <div class="spinner"></div>
        <span>Processing...</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CompactDonationForm',
  data() {
    return {
      amount: 25.00,
      message: '',
      selectedMethod: 'google_pay',
      venmoUsername: '@CollectiveSouls',
      venmoReference: '',
      venmoPaymentId: '',
      googlePayReady: false,
      loading: false,
      messageText: '',
      messageType: ''
    }
  },
  mounted() {
    this.generateVenmoReference();
    this.loadGooglePay();
  },
  methods: {
    selectMethod(method) {
      this.selectedMethod = method;
    },

    generateVenmoReference() {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      this.venmoReference = `CS-${timestamp}-${random}`;
    },

    async loadGooglePay() {
      try {
        if (window.google && window.google.payments) {
          this.googlePayReady = true;
        } else {
          const script = document.createElement('script');
          script.src = 'https://pay.google.com/gp/p/js/pay.js';
          script.onload = () => {
            this.googlePayReady = true;
          };
          document.head.appendChild(script);
        }
      } catch (error) {
        console.error('Google Pay loading failed:', error);
      }
    },

    async initiateGooglePay() {
      if (!this.googlePayReady) {
        this.showMessage('Google Pay is not available', 'error');
        return;
      }

      this.loading = true;

      try {
        const response = await fetch('/api/donations/gateways');
        const config = await response.json();

        if (!config.success) {
          throw new Error('Failed to get payment configuration');
        }

        const paymentRequest = {
          apiVersion: 2,
          apiVersionMinor: 0,
          merchantInfo: {
            merchantName: 'Collective Souls',
            merchantId: config.data.configurations.google_pay.merchantId
          },
          transactionInfo: {
            totalPriceStatus: 'FINAL',
            totalPrice: this.amount.toFixed(2),
            currencyCode: 'USD'
          },
          allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA']
            }
          }]
        };

        const paymentsClient = new window.google.payments.api.PaymentsClient({
          environment: config.data.configurations.google_pay.environment
        });

        const canMakePayment = await paymentsClient.isReadyToPay({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: ['CARD']
        });

        if (canMakePayment.result) {
          paymentsClient.loadPaymentData(paymentRequest)
            .then(paymentData => {
              this.processGooglePayPayment(paymentData);
            })
            .catch(error => {
              this.showMessage('Payment cancelled or failed', 'error');
              this.loading = false;
            });
        } else {
          this.showMessage('Google Pay is not available on this device', 'error');
          this.loading = false;
        }

      } catch (error) {
        console.error('Google Pay initiation failed:', error);
        this.showMessage('Failed to initiate Google Pay', 'error');
        this.loading = false;
      }
    },

    async processGooglePayPayment(paymentData) {
      try {
        const response = await fetch('/api/donations/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.$store.state.token}`
          },
          body: JSON.stringify({
            amount: this.amount,
            currency: 'USD',
            payment_method: 'google_pay',
            message: this.message,
            paymentData: paymentData
          })
        });

        const result = await response.json();

        if (result.success) {
          this.showMessage('Thank you for your donation!', 'success');
          this.loading = false;
        } else {
          throw new Error(result.message || 'Payment processing failed');
        }

      } catch (error) {
        console.error('Google Pay processing failed:', error);
        this.showMessage('Payment processing failed', 'error');
        this.loading = false;
      }
    },

    async confirmVenmoPayment() {
      if (!this.venmoPaymentId.trim()) {
        this.showMessage('Please enter your Venmo payment ID', 'error');
        return;
      }

      this.loading = true;

      try {
        const response = await fetch('/api/donations/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.$store.state.token}`
          },
          body: JSON.stringify({
            amount: this.amount,
            currency: 'USD',
            payment_method: 'venmo',
            message: this.message,
            venmoPaymentId: this.venmoPaymentId,
            venmoReference: this.venmoReference
          })
        });

        const result = await response.json();

        if (result.success) {
          this.showMessage('Thank you for your donation! Payment will be verified manually.', 'success');
          this.loading = false;
          this.generateVenmoReference();
        } else {
          throw new Error(result.message || 'Venmo payment confirmation failed');
        }

      } catch (error) {
        console.error('Venmo payment confirmation failed:', error);
        this.showMessage('Payment confirmation failed', 'error');
        this.loading = false;
      }
    },

    showMessage(text, type) {
      this.messageText = text;
      this.messageType = type;
      
      setTimeout(() => {
        this.messageText = '';
        this.messageType = '';
      }, 5000);
    }
  }
}
</script>

<style scoped>
.compact-donation-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-header h3 {
  color: #333;
  margin-bottom: 0.25rem;
  font-size: 1.25rem;
}

.form-subtitle {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.amount-section label,
.method-section label,
.message-section label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.amount-input {
  position: relative;
  display: flex;
  align-items: center;
}

.currency {
  position: absolute;
  left: 0.75rem;
  color: #666;
  font-size: 1.1rem;
  pointer-events: none;
  z-index: 1;
}

.amount-input input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  transition: border-color 0.3s;
}

.amount-input input:focus {
  outline: none;
  border-color: #007bff;
}

.method-options {
  display: flex;
  gap: 0.5rem;
}

.method-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.method-btn:hover {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.method-btn.active {
  border-color: #007bff;
  background-color: #e3f2fd;
}

.method-btn i {
  font-size: 1rem;
}

.google-pay-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.google-pay-btn:hover {
  background-color: #0056b3;
}

.loading-text {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.venmo-section {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e1e5e9;
}

.venmo-step {
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.venmo-step:last-child {
  margin-bottom: 0;
}

.step-label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 600;
}

.venmo-handle,
.venmo-reference {
  font-size: 0.9rem;
  font-weight: 600;
  color: #007bff;
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid #e1e5e9;
}

.venmo-input {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.confirm-btn {
  width: 100%;
  padding: 0.5rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.confirm-btn:hover {
  background-color: #218838;
}

.message-section textarea {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.9rem;
  resize: vertical;
  min-height: 60px;
  max-height: 100px;
}

.status-message {
  padding: 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
}

.status-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e1e5e9;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* FontAwesome icons fallback styles */
.fab {
  font-family: 'Font Awesome 5 Brands', sans-serif;
}

.fas {
  font-family: 'Font Awesome 5 Free', sans-serif;
  font-weight: 900;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .compact-donation-form {
    max-width: 100%;
    padding: 1rem;
  }
  
  .method-options {
    flex-direction: column;
  }
  
  .venmo-section {
    padding: 0.75rem;
  }
}
</style>