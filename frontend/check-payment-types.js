// Check what payment types are allowed in the database
fetch('http://localhost:3000/api/payments')
.then(response => response.json())
.then(data => {
  console.log('📊 Current payments in system:', data);
  
  // Look at existing payments to see what types are used
  if (data.data && data.data.length > 0) {
    const existingTypes = [...new Set(data.data.map(p => p.type))];
    console.log('📋 Existing payment types in database:', existingTypes);
  } else {
    console.log('ℹ️ No existing payments to check types from');
  }
})
.catch(error => {
  console.error('❌ Error checking payments:', error.message);
});