// Test if we're in demo mode
fetch('http://localhost:3000/api/matches', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(response => {
  console.log('📡 Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('📋 API Response:');
  console.log(JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error('❌ Request failed:', error.message);
});