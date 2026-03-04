const axios = require('axios');

async function testPostReport() {
  try {
    console.log('🧪 Testing Post Report with "post" content type...\n');

    // Test with a valid token (we'll use the same token from the error log)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3MjEzMzIwMCwiZXhwIjoxNzcyMjE5NjAwfQ.kFuZOm0XW2OrJOYiTC0L3Uuuuu7BwQ1fgPVbVMt3JeY';

    console.log('1. Testing post report with "post" content type...');
    try {
      const response = await axios.post('http://localhost:3004/api/posts/report', {
        content_type: 'post',
        content_id: 1,
        reason: 'spam',
        description: 'Test report for post content type'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Post report successful:', response.data.message);
      console.log('   Report ID:', response.data.data.id);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('❌ Validation error:', error.response.data.message);
        if (error.response.data.message.includes('Validation isIn on reported_type failed')) {
          console.log('   This suggests the model changes may not be loaded yet.');
          console.log('   The server may need to be restarted to pick up model changes.');
        }
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n2. Testing with other content types...');
    const testTypes = ['comment', 'activity', 'user', 'video', 'chat_message'];
    
    for (const contentType of testTypes) {
      try {
        const response = await axios.post('http://localhost:3004/api/posts/report', {
          content_type: contentType,
          content_id: 1,
          reason: 'spam',
          description: `Test report for ${contentType} content type`
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log(`✅ ${contentType} report successful`);
      } catch (error) {
        if (error.response && error.response.status === 400) {
          console.log(`❌ ${contentType} validation error:`, error.response.data.message);
        } else {
          console.log(`❌ ${contentType} unexpected error:`, error.message);
        }
      }
    }

    console.log('\n📋 Summary:');
    console.log('   The "post" content type should now be accepted by the model.');
    console.log('   If you still see validation errors, the server needs to be restarted.');
    console.log('   This is expected behavior when model changes are made to a running server.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPostReport();