<template>
  <div class="admin-donation-dashboard">
    <div class="dashboard-header">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Donation Management</h1>
      
      <!-- Quick Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Donations</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.total_donations }}</p>
            </div>
            <div class="p-3 bg-green-100 rounded-full">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Amount</p>
              <p class="text-2xl font-bold text-gray-900">${{ formatCurrency(stats.total_amount) }}</p>
            </div>
            <div class="p-3 bg-blue-100 rounded-full">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Unique Donors</p>
              <p class="text-2xl font-bold text-gray-900">{{ stats.unique_donors }}</p>
            </div>
            <div class="p-3 bg-purple-100 rounded-full">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Average Donation</p>
              <p class="text-2xl font-bold text-gray-900">${{ formatCurrency(stats.average_donation) }}</p>
            </div>
            <div class="p-3 bg-yellow-100 rounded-full">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white rounded-lg shadow mb-6 p-6">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select v-model="filters.status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <select v-model="filters.payment_method" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Methods</option>
            <option value="stripe">Stripe</option>
            <option value="paypal">PayPal</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input v-model="filters.search" type="text" placeholder="Search by name, email, or username..." class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <div class="md:col-span-2 flex gap-2">
          <button @click="fetchDonations" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Apply Filters
          </button>
          <button @click="resetFilters" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Donations Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">Recent Donations</h2>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donation ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="donation in donations" :key="donation.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{{ donation.id }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div>
                  <div class="font-medium">{{ donation.donor_name || donation.user.username }}</div>
                  <div class="text-gray-500">{{ donation.donor_email || donation.user.email }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${{ formatCurrency(donation.amount) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span class="capitalize">{{ donation.payment_gateway }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(donation.payment_status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ donation.payment_status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(donation.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="viewDonationDetails(donation.id)" class="text-blue-600 hover:text-blue-900 mr-4">
                  View
                </button>
                <button v-if="donation.payment_status === 'pending'" @click="updateDonationStatus(donation.id, 'completed')" class="text-green-600 hover:text-green-900 mr-4">
                  Mark Complete
                </button>
                <button v-if="donation.payment_status === 'pending'" @click="updateDonationStatus(donation.id, 'failed')" class="text-red-600 hover:text-red-900">
                  Mark Failed
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.total_pages > 1" class="px-6 py-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ pagination.current_page }} of {{ pagination.total_pages }} pages
          </div>
          <div class="flex gap-2">
            <button @click="changePage(pagination.current_page - 1)" :disabled="pagination.current_page <= 1" class="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <button @click="changePage(pagination.current_page + 1)" :disabled="pagination.current_page >= pagination.total_pages" class="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Donation Details Modal -->
    <DonationDetailsModal 
      v-if="selectedDonation" 
      :donation="selectedDonation" 
      @close="selectedDonation = null"
      @update-status="handleStatusUpdate"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useAuth } from '../../composables/useAuth';
import { useApi } from '../../composables/useApi';
import DonationDetailsModal from './DonationDetailsModal.vue';

export default {
  name: 'AdminDonationDashboard',
  components: {
    DonationDetailsModal
  },
  setup() {
    const { user } = useAuth();
    const api = useApi();
    
    const stats = ref({
      total_amount: 0,
      total_donations: 0,
      unique_donors: 0,
      average_donation: 0
    });
    
    const donations = ref([]);
    const selectedDonation = ref(null);
    const loading = ref(false);
    
    const filters = reactive({
      status: '',
      payment_method: '',
      search: '',
      page: 1,
      limit: 20
    });
    
    const pagination = ref({
      current_page: 1,
      total_pages: 1,
      total_donations: 0,
      per_page: 20
    });

    const fetchStats = async () => {
      try {
        const response = await api.get('/api/donations/stats');
        stats.value = response.data;
      } catch (error) {
        console.error('Failed to fetch donation stats:', error);
      }
    };

    const fetchDonations = async () => {
      loading.value = true;
      try {
        const params = { ...filters };
        const response = await api.get('/api/donations/admin', { params });
        
        donations.value = response.data.donations;
        pagination.value = response.data.pagination;
      } catch (error) {
        console.error('Failed to fetch donations:', error);
      } finally {
        loading.value = false;
      }
    };

    const viewDonationDetails = async (donationId) => {
      try {
        const response = await api.get(`/api/donations/admin/${donationId}`);
        selectedDonation.value = response.data;
      } catch (error) {
        console.error('Failed to fetch donation details:', error);
      }
    };

    const updateDonationStatus = async (donationId, status) => {
      try {
        await api.put(`/api/donations/admin/${donationId}/status`, { status });
        await fetchDonations();
        await fetchStats();
      } catch (error) {
        console.error('Failed to update donation status:', error);
      }
    };

    const handleStatusUpdate = async (donationId, status) => {
      await updateDonationStatus(donationId, status);
      selectedDonation.value = null;
    };

    const changePage = (page) => {
      filters.page = page;
      fetchDonations();
    };

    const resetFilters = () => {
      filters.status = '';
      filters.payment_method = '';
      filters.search = '';
      filters.page = 1;
      fetchDonations();
    };

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

    onMounted(() => {
      fetchStats();
      fetchDonations();
    });

    return {
      stats,
      donations,
      selectedDonation,
      loading,
      filters,
      pagination,
      fetchDonations,
      viewDonationDetails,
      updateDonationStatus,
      handleStatusUpdate,
      changePage,
      resetFilters,
      getStatusClass,
      formatCurrency,
      formatDate
    };
  }
};
</script>

<style scoped>
.admin-donation-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
</style>