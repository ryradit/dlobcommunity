// Test the simple test endpoint
fetch('http://localhost:3000/api/test')
.then(response => {
  console.log('📡 Test Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('📋 Test API Response:', data);
})
.catch(error => {
  console.error('❌ Test Request failed:', error.message);
});