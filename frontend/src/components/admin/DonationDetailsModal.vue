<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 class="text-lg font-semibold text-gray-900">Donation Details</h2>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div v-if="donation" class="p-6 space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <label class="block text-sm font-medium text-gray-700 mb-2">Donation ID</label>
            <p class="text-lg font-mono font-semibold text-gray-900">#{{ donation.id }}</p>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <label class="block text-sm font-medium text-gray-700 mb-2">Amount</label>
            <p class="text-lg font-semibold text-gray-900">${{ formatCurrency(donation.amount) }} {{ donation.currency }}</p>
          </div>
        </div>

        <!-- Donor Information -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-md font-semibold text-gray-900 mb-3">Donor Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p class="text-gray-900">{{ donation.donor_name || donation.user.username || 'Anonymous' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p class="text-gray-900">{{ donation.donor_email || donation.user.email || 'Not provided' }}</p>
            </div>
            <div v-if="donation.user">
              <label class="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <p class="text-gray-900">{{ donation.user.id }}</p>
            </div>
            <div v-if="donation.user">
              <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <p class="text-gray-900">{{ donation.user.username }}</p>
            </div>
          </div>
        </div>

        <!-- Payment Information -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-md font-semibold text-gray-900 mb-3">Payment Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <span class="capitalize px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{{ donation.payment_gateway }}</span>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span :class="getStatusClass(donation.payment_status)" class="px-2 py-1 text-sm rounded-full">{{ donation.payment_status }}</span>
            </div>
            <div v-if="donation.gateway_transaction_id">
              <label class="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
              <p class="font-mono text-sm text-gray-900">{{ donation.gateway_transaction_id }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Recurring</label>
              <span :class="donation.is_recurring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="px-2 py-1 text-sm rounded-full">
                {{ donation.is_recurring ? 'Yes' : 'No' }}
              </span>
              <span v-if="donation.is_recurring && donation.recurring_interval" class="ml-2 text-sm text-gray-600">
                ({{ donation.recurring_interval }})
              </span>
            </div>
          </div>
        </div>

        <!-- Message -->
        <div v-if="donation.message" class="bg-gray-50 p-4 rounded-lg">
          <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <p class="text-gray-900 italic">"{{ donation.message }}"</p>
        </div>

        <!-- Gateway Response -->
        <div v-if="donation.gateway_response" class="bg-gray-50 p-4 rounded-lg">
          <label class="block text-sm font-medium text-gray-700 mb-2">Gateway Response</label>
          <pre class="text-xs bg-white p-3 rounded text-gray-800 overflow-auto max-h-32">{{ formatGatewayResponse(donation.gateway_response) }}</pre>
        </div>

        <!-- Timestamps -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <label class="block text-sm font-medium text-gray-700 mb-2">Created</label>
            <p class="text-gray-900">{{ formatDate(donation.created_at) }}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <label class="block text-sm font-medium text-gray-700 mb-2">Updated</label>
            <p class="text-gray-900">{{ formatDate(donation.updated_at) }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div v-if="donation.payment_status === 'pending'" class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-md font-semibold text-gray-900 mb-3">Update Status</h3>
          <div class="flex flex-wrap gap-2">
            <button 
              @click="$emit('update-status', donation.id, 'completed')"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Mark as Completed
            </button>
            <button 
              @click="$emit('update-status', donation.id, 'failed')"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Mark as Failed
            </button>
          </div>
        </div>

        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button 
            @click="$emit('close')"
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>

      <div v-else class="p-6 text-center text-gray-500">
        Loading donation details...
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DonationDetailsModal',
  props: {
    donation: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'update-status'],
  setup() {
    const getStatusClass = (status) => {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'failed': return 'bg-red-100 text-red-800';
        case 'refunded': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    const formatCurrency = (amount) => {
      return parseFloat(amount).toFixed(2);
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString();
    };

    const formatGatewayResponse = (response) => {
      try {
        const parsed = typeof response === 'string' ? JSON.parse(response) : response;
        return JSON.stringify(parsed, null, 2);
      } catch (error) {
        return response || 'No response data';
      }
    };

    return {
      getStatusClass,
      formatCurrency,
      formatDate,
      formatGatewayResponse
    };
  }
};
</script>

<style scoped>
/* Modal styles are included in the template */
</style>