// Direct test of payments API endpoint
fetch('http://localhost:3000/api/payments')
.then(response => {
  console.log('📡 Payments API Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('📋 Full payments API response:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.data) {
    console.log('📊 Payment statistics:');
    console.log('- Total payments:', data.data.payments.length);
    console.log('- Session payments found:', data.data.payments.filter(p => p.match).length);
    console.log('- Legacy payments found:', data.data.payments.filter(p => !p.match).length);
    
    if (data.data.payments.length > 0) {
      console.log('📋 Sample payment record:');
      console.log(JSON.stringify(data.data.payments[0], null, 2));
    }
  }
})
.catch(error => {
  console.error('❌ Payments API test failed:', error.message);
});