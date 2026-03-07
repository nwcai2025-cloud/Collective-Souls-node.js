<template>
  <div class="donation-form">
    <div class="donation-header">
      <h2>Support Collective Souls</h2>
      <p>Your donation helps us maintain and improve our platform</p>
    </div>

    <div class="donation-amount">
      <label for="amount">Donation Amount</label>
      <div class="amount-input">
        <span class="currency-symbol">$</span>
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

    <div class="donation-message">
      <label for="message">Message (Optional)</label>
      <textarea
        id="message"
        v-model="message"
        placeholder="Share why you're supporting us..."
        maxlength="500"
      ></textarea>
    </div>

    <div class="payment-methods">
      <label>Choose Payment Method</label>
      
      <!-- Google Pay Option -->
      <div 
        class="payment-option"
        :class="{ selected: selectedMethod === 'google_pay' }"
        @click="selectPaymentMethod('google_pay')"
      >
        <div class="payment-icon">
          <i class="fab fa-google-pay"></i>
        </div>
        <div class="payment-details">
          <h3>Google Pay</h3>
          <p>Fast, secure mobile payments</p>
        </div>
        <div class="payment-select">
          <input
            type="radio"
            name="payment_method"
            value="google_pay"
            v-model="selectedMethod"
          />
        </div>
      </div>

      <!-- Venmo Option -->
      <div 
        class="payment-option"
        :class="{ selected: selectedMethod === 'venmo' }"
        @click="selectPaymentMethod('venmo')"
      >
        <div class="payment-icon">
          <i class="fab fa-venmo"></i>
        </div>
        <div class="payment-details">
          <h3>venmo</h3>
          <p>Send money to friends, split bills</p>
        </div>
        <div class="payment-select">
          <input
            type="radio"
            name="payment_method"
            value="venmo"
            v-model="selectedMethod"
          />
        </div>
      </div>
    </div>

    <!-- Google Pay Button -->
    <div v-if="selectedMethod === 'google_pay'" class="google-pay-container">
      <button 
        v-if="googlePayReady"
        class="google-pay-button"
        @click="initiateGooglePay"
      >
        <i class="fab fa-google-pay"></i>
        Pay with Google Pay
      </button>
      <div v-else class="google-pay-loading">
        Loading Google Pay...
      </div>
    </div>

    <!-- Venmo Instructions -->
    <div v-if="selectedMethod === 'venmo'" class="venmo-instructions">
      <div class="venmo-step">
        <div class="step-number">1</div>
        <div class="step-content">
          <h4>Open Venmo App</h4>
          <p>Open the Venmo app on your phone</p>
        </div>
      </div>
      
      <div class="venmo-step">
        <div class="step-number">2</div>
        <div class="step-content">
          <h4>Send Payment</h4>
          <p>Send <strong>${{ amount }}</strong> to <strong>{{ venmoUsername }}</strong></p>
          <div class="venmo-qr">
            <div class="qr-placeholder">
              <i class="fas fa-qrcode"></i>
              <span>QR Code</span>
            </div>
          </div>
        </div>
      </div>

      <div class="venmo-step">
        <div class="step-number">3</div>
        <div class="step-content">
          <h4>Add Reference</h4>
          <p>Use reference: <strong>{{ venmoReference }}</strong></p>
        </div>
      </div>

      <div class="venmo-step">
        <div class="step-number">4</div>
        <div class="step-content">
          <h4>Confirm Payment</h4>
          <div class="venmo-confirmation">
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
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="donation-message-box" :class="messageType">
      {{ message }}
    </div>

    <!-- Loading Spinner -->
    <div v-if="loading" class="loading-spinner">
      <div class="spinner"></div>
      <span>Processing donation...</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DonationForm',
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
    selectPaymentMethod(method) {
      this.selectedMethod = method;
    },

    generateVenmoReference() {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9);
      this.venmoReference = `CS-${timestamp}-${random}`;
    },

    async loadGooglePay() {
      try {
        // Check if Google Pay is available
        if (window.google && window.google.payments) {
          this.googlePayReady = true;
        } else {
          // Load Google Pay library
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
        // Get payment configuration from backend
        const response = await fetch('/api/donations/gateways');
        const config = await response.json();

        if (!config.success) {
          throw new Error('Failed to get payment configuration');
        }

        // Create Google Pay payment request
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

        // Initialize Google Pay
        const paymentsClient = new window.google.payments.api.PaymentsClient({
          environment: config.data.configurations.google_pay.environment
        });

        const canMakePayment = await paymentsClient.isReadyToPay({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: ['CARD']
        });

        if (canMakePayment.result) {
          // Show Google Pay sheet
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
        // Send payment data to backend
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
        // Send Venmo confirmation to backend
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
          this.generateVenmoReference(); // Generate new reference for next donation
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
      
      // Clear message after 5 seconds
      setTimeout(() => {
        this.messageText = '';
        this.messageType = '';
      }, 5000);
    }
  }
}
</script>

<style scoped>
.donation-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.donation-header h2 {
  color: #333;
  margin-bottom: 0.5rem;
}

.donation-header p {
  color: #666;
  margin-bottom: 2rem;
}

.donation-amount {
  margin-bottom: 1.5rem;
}

.donation-amount label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.amount-input {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-symbol {
  position: absolute;
  left: 1rem;
  color: #666;
  font-size: 1.2rem;
  pointer-events: none;
}

.amount-input input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  transition: border-color 0.3s;
}

.amount-input input:focus {
  outline: none;
  border-color: #007bff;
}

.donation-message {
  margin-bottom: 1.5rem;
}

.donation-message label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.donation-message textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
}

.payment-methods label {
  display: block;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #333;
}

.payment-option {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.payment-option:hover {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.payment-option.selected {
  border-color: #007bff;
  background-color: #e3f2fd;
}

.payment-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.payment-icon i {
  font-size: 1.5rem;
  color: #333;
}

.payment-details h3 {
  margin: 0 0 0.25rem 0;
  color: #333;
}

.payment-details p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.payment-select {
  margin-left: auto;
}

.payment-select input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.google-pay-container {
  margin-top: 1rem;
}

.google-pay-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.google-pay-button:hover {
  background-color: #0056b3;
}

.google-pay-loading {
  text-align: center;
  color: #666;
  padding: 1rem;
}

.venmo-instructions {
  margin-top: 1rem;
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}

.venmo-step {
  display: flex;
  margin-bottom: 1.5rem;
}

.venmo-step:last-child {
  margin-bottom: 0;
}

.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 1rem;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.step-content p {
  margin: 0 0 1rem 0;
  color: #666;
}

.venmo-qr {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  display: inline-block;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
}

.qr-placeholder i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.venmo-confirmation {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.venmo-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
}

.confirm-btn {
  padding: 0.75rem 1.5rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.confirm-btn:hover {
  background-color: #218838;
}

.donation-message-box {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
}

.donation-message-box.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.donation-message-box.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  color: #666;
}

.spinner {
  width: 20px;
  height: 20px;
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
</style>