#!/usr/bin/env node

/**
 * Test script for the donation system
 * This script tests the backend donation API endpoints
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3004';
const TEST_USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYm9iIiwiZW1haWwiOiJib2JAZXhhbXBsZS5jb20iLCJpYXQiOjE3NzEwMjk5MDYsImV4cCI6MTc3MTAyOTkwNn0.65ae681c1ae3cbf7ba4b4d73a380aae67676d2741feec130762710a64a323875';

async function testDonationSystem() {
  console.log('🧪 Testing Donation System...\n');

  try {
    // Test 1: Get available payment gateways (public endpoint)
    console.log('1. Testing payment gateways endpoint...');
    const gatewaysResponse = await axios.get(`${BASE_URL}/api/donations/gateways`);
    console.log('✅ Gateways response:', gatewaysResponse.data);
    
    // Test 2: Test donation confirmation (public endpoint)
    console.log('\n2. Testing donation confirmation endpoint...');
    const confirmResponse = await axios.post(
      `${BASE_URL}/api/donations/confirm`,
      {
        donation_id: 'test-donation-123',
        transaction_id: 'test_transaction_123',
        status: 'completed',
        gateway_response: {
          test: true,
          method: 'manual_test'
        }
      }
    );
    console.log('✅ Donation confirmation test:', confirmResponse.data);

    console.log('\n🎉 Public donation endpoints are working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testDonationSystem();
}

module.exports = { testDonationSystem };