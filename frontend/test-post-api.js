// Test POST endpoint
fetch('http://localhost:3000/api/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    test: 'data',
    timestamp: new Date().toISOString()
  })
})
.then(response => {
  console.log('📡 POST Test Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('📋 POST Test API Response:', data);
})
.catch(error => {
  console.error('❌ POST Test Request failed:', error.message);
});