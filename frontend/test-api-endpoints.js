// Simple test using curl commands to test the API endpoints
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function testAPIEndpoints() {
  console.log('🧪 Simple API Endpoint Test');
  console.log('===========================');

  try {
    // Test basic API connectivity
    console.log('1. Testing API connectivity...');
    
    // First, let's check if we can reach the API at all
    const testPayload = {
      paymentId: "test-id",
      memberId: "test-member-id"
    };

    // Create a simple test using PowerShell Invoke-RestMethod
    const testScript = `
      try {
        $body = @{
          paymentId = "test-payment-id"
          memberId = "test-member-id"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/payments/convert-to-membership" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
        Write-Host "API Response: $($response | ConvertTo-Json)"
      } catch {
        Write-Host "API Error: $($_.Exception.Message)"
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
      }
    `;

    console.log('Making API call to convert-to-membership endpoint...');
    
    try {
      const { stdout, stderr } = await execAsync(`powershell -Command "${testScript}"`);
      console.log('API Test Result:');
      console.log(stdout);
      if (stderr) {
        console.log('Stderr:', stderr);
      }
    } catch (error) {
      console.error('PowerShell execution error:', error.message);
    }

    console.log('\n✅ API endpoint test completed');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPIEndpoints();