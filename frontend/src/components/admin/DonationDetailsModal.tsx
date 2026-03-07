import React from 'react';

interface Donation {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_gateway: string;
  gateway_transaction_id: string | null;
  gateway_response: string | null;
  donor_name: string | null;
  donor_email: string | null;
  message: string | null;
  is_recurring: boolean;
  recurring_interval: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

interface DonationDetailsModalProps {
  donation: Donation;
  onClose: () => void;
  onUpdateStatus: (donationId: number, status: string) => void;
}

const DonationDetailsModal: React.FC<DonationDetailsModalProps> = ({ donation, onClose, onUpdateStatus }) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return parseFloat(amount.toString()).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatGatewayResponse = (response: string | null) => {
    try {
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return response || 'No response data';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Donation Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Donation ID</label>
              <p className="text-lg font-mono font-semibold text-gray-900">#{donation.id}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <p className="text-lg font-semibold text-gray-900">${formatCurrency(donation.amount)} {donation.currency}</p>
            </div>
          </div>

          {/* Donor Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Donor Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{donation.donor_name || donation.user.username || 'Anonymous'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{donation.donor_email || donation.user.email || 'Not provided'}</p>
              </div>
              {donation.user && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <p className="text-gray-900">{donation.user.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <p className="text-gray-900">{donation.user.username}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <span className="capitalize px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{donation.payment_gateway}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 text-sm rounded-full ${getStatusClass(donation.payment_status)}`}>{donation.payment_status}</span>
              </div>
              {donation.gateway_transaction_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                  <p className="font-mono text-sm text-gray-900">{donation.gateway_transaction_id}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recurring</label>
                <span className={`px-2 py-1 text-sm rounded-full ${donation.is_recurring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {donation.is_recurring ? 'Yes' : 'No'}
                </span>
                {donation.is_recurring && donation.recurring_interval && (
                  <span className="ml-2 text-sm text-gray-600">
                    ({donation.recurring_interval})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Message */}
          {donation.message && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <p className="text-gray-900 italic">"{donation.message}"</p>
            </div>
          )}

          {/* Gateway Response */}
          {donation.gateway_response && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Gateway Response</label>
              <pre className="text-xs bg-white p-3 rounded text-gray-800 overflow-auto max-h-32">{formatGatewayResponse(donation.gateway_response)}</pre>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
              <p className="text-gray-900">{formatDate(donation.created_at)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Updated</label>
              <p className="text-gray-900">{formatDate(donation.updated_at)}</p>
            </div>
          </div>

          {/* Actions */}
          {donation.payment_status === 'pending' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-gray-900 mb-3">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => onUpdateStatus(donation.id, 'completed')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Mark as Completed
                </button>
                <button 
                  onClick={() => onUpdateStatus(donation.id, 'failed')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Mark as Failed
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationDetailsModal;