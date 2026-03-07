import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/authService';

interface DonationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'google_pay' | 'venmo'>('google_pay');
  
  const [formData, setFormData] = useState({
    amount: '25.00',
    currency: 'USD',
    payment_method: 'google_pay',
    donor_name: user?.username || '',
    donor_email: user?.email || '',
    message: '',
    venmoPaymentId: '',
    venmoReference: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMethodChange = (method: 'google_pay' | 'venmo') => {
    setSelectedMethod(method);
    setFormData(prev => ({
      ...prev,
      payment_method: method
    }));
  };

  const validateForm = () => {
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0 || amount > 10000) {
      setError('Please enter a valid amount between $0.01 and $10,000');
      return false;
    }

    if (selectedMethod === 'venmo' && !formData.venmoPaymentId.trim()) {
      setError('Please enter your Venmo payment ID');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/donations/initiate', {
        ...formData,
        amount: parseFloat(formData.amount)
      });

      if (response.success) {
        console.log('Donation initiated:', response.data);
        onSuccess();
      }
    } catch (error: any) {
      console.error('Donation failed:', error);
      setError(error.response?.data?.message || 'Failed to initiate donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Support Collective Souls</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                max="10000"
                className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="25.00"
                required
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleMethodChange('google_pay')}
                className={`p-3 border rounded-md text-left ${
                  selectedMethod === 'google_pay' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Google Pay</span>
                  <span className="text-xs text-gray-500">Fast & Secure</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('venmo')}
                className={`p-3 border rounded-md text-left ${
                  selectedMethod === 'venmo' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Venmo</span>
                  <span className="text-xs text-gray-500">Manual</span>
                </div>
              </button>
            </div>
          </div>

          {/* Google Pay Section */}
          {selectedMethod === 'google_pay' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-center space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Pay with Google</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-blue-700 text-center">Secure payment processing</p>
            </div>
          )}

          {/* Venmo Section */}
          {selectedMethod === 'venmo' && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-700 font-medium">Send ${formData.amount} to:</p>
                <p className="text-lg font-bold text-green-800">@CollectiveSouls</p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-700 font-medium">Use reference:</p>
                <p className="text-sm font-mono text-yellow-800 bg-white px-2 py-1 rounded">CS-{Date.now()}-{Math.random().toString(36).substr(2, 9)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Venmo Payment ID</label>
                <input
                  type="text"
                  name="venmoPaymentId"
                  value={formData.venmoPaymentId}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter payment ID from Venmo"
                />
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Share why you're supporting us..."
              maxLength="200"
            />
            <p className="mt-1 text-xs text-gray-500">Max 200 characters</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-md hover:from-green-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : selectedMethod === 'google_pay' ? (
                'Pay with Google'
              ) : (
                'Confirm Venmo Payment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonationModal;
