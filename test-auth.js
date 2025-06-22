import fetch from 'node-fetch';

async function testAuth() {
  console.log('🧪 Testing authentication endpoints...');
  
  try {
    // Test the server is running
    const response = await fetch('http://localhost:5000/api/users/profile', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Server response status:', response.status);
    const data = await response.text();
    console.log('Server response:', data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth(); 