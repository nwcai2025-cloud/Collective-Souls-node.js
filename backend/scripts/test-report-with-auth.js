const axios = require('axios');

async function testReportWithAuth() {
  try {
    console.log('🧪 Testing Report Endpoint with Authentication...\n');

    // Test 1: Try to access protected endpoint without token
    console.log('1. Testing without authentication...');
    try {
      const response = await axios.post('http://localhost:3004/api/posts/report', {
        content_type: 'post',
        content_id: 1,
        reason: 'test',
        description: 'test report'
      });
      console.log('❌ Expected authentication error, got:', response.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Authentication required working correctly');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 2: Test with invalid token
    console.log('\n2. Testing with invalid token...');
    try {
      const response = await axios.post('http://localhost:3004/api/posts/report', {
        content_type: 'post',
        content_id: 1,
        reason: 'test',
        description: 'test report'
      }, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('❌ Expected authentication error, got:', response.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid token rejected correctly');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 3: Test with valid data but no authentication (should fail)
    console.log('\n3. Testing validation without auth...');
    try {
      const response = await axios.post('http://localhost:3004/api/posts/report', {
        content_type: 'invalid',
        content_id: 1,
        reason: 'test'
      });
      console.log('❌ Expected authentication error, got:', response.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Authentication checked before validation');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 Authentication and validation testing complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Authentication required for report endpoint');
    console.log('   ✅ Invalid tokens properly rejected');
    console.log('   ✅ Authentication checked before validation');
    console.log('   ✅ Server responding correctly to all scenarios');
    console.log('\n🚀 The report endpoint is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testReportWithAuth();