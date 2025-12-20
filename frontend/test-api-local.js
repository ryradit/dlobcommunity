// Quick test to verify pre-order API error handling
console.log('Testing pre-order API...');

async function testPreOrderAPI() {
  try {
    console.log('Testing localhost API...');
    
    const testPayload = {
      nama: 'Test User',
      ukuran: 'L', 
      warna: 'blue',
      lengan: 'short',
      namaPunggung: 'TEST',
      tanpaNamaPunggung: false
    };

    const response = await fetch('http://localhost:3000/api/pre-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response text:', errorText);
      
      try {
        const errorData = JSON.parse(errorText);
        console.log('Parsed error data:', errorData);
      } catch (parseError) {
        console.log('Could not parse error as JSON');
      }
    } else {
      const result = await response.json();
      console.log('Success result:', result);
    }

    // Also test the debug endpoint
    console.log('\n--- Testing debug endpoint ---');
    const debugResponse = await fetch('http://localhost:3000/api/debug');
    const debugData = await debugResponse.json();
    console.log('Debug endpoint result:', debugData);

  } catch (error) {
    console.error('Test error:', error);
  }
}

testPreOrderAPI();