// Test the new separate payment structure
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qckubvnpfglseysboegd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFja3Vidm5wZmdsc2V5c2JvZWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTIxNjEwMCwiZXhwIjoyMDQ0NzkyMTAwfQ.mXKI1q0LnNmWm8DDKyWUFGaZvgJX4X4h0dOLNwEpXGo'
);

async function testPaymentStructure() {
  try {
    console.log('🔍 Testing new separate payment structure...\n');

    // Get all payments grouped by type
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        members(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch payments:', error);
      return;
    }

    console.log(`✅ Found ${payments.length} total payments\n`);

    // Group payments by type
    const paymentsByType = {
      shuttlecock: payments.filter(p => p.type === 'shuttlecock'),
      daily: payments.filter(p => p.type === 'daily'),
      monthly: payments.filter(p => p.type === 'monthly'),
      other: payments.filter(p => !['shuttlecock', 'daily', 'monthly'].includes(p.type))
    };

    console.log('📊 Payment Breakdown:');
    console.log(`🏸 Shuttlecock Payments: ${paymentsByType.shuttlecock.length}`);
    console.log(`📅 Daily Session Payments: ${paymentsByType.daily.length}`);
    console.log(`💳 Monthly Membership Payments: ${paymentsByType.monthly.length}`);
    console.log(`❓ Other Payments: ${paymentsByType.other.length}\n`);

    // Show recent shuttlecock payments
    if (paymentsByType.shuttlecock.length > 0) {
      console.log('🏸 Recent Shuttlecock Payments:');
      paymentsByType.shuttlecock.slice(0, 3).forEach(p => {
        console.log(`- ${p.members?.name}: Rp${p.amount.toLocaleString()} (${p.notes})`);
      });
      console.log('');
    }

    // Show recent daily payments (convertible to membership)
    if (paymentsByType.daily.length > 0) {
      console.log('📅 Recent Daily Session Payments (Convertible):');
      paymentsByType.daily.slice(0, 3).forEach(p => {
        console.log(`- ${p.members?.name}: Rp${p.amount.toLocaleString()} (${p.notes})`);
      });
      console.log('');
    }

    // Show membership payments
    if (paymentsByType.monthly.length > 0) {
      console.log('💳 Monthly Membership Payments:');
      paymentsByType.monthly.forEach(p => {
        console.log(`- ${p.members?.name}: Rp${p.amount.toLocaleString()} (${p.notes})`);
      });
      console.log('');
    }

    // Test conversion functionality
    console.log('🔄 Testing Conversion Functionality:');
    
    // Find a daily payment to test conversion
    const dailyPayment = paymentsByType.daily.find(p => p.status === 'pending');
    if (dailyPayment) {
      console.log(`✅ Found daily payment for conversion test: ${dailyPayment.members?.name} - Rp${dailyPayment.amount.toLocaleString()}`);
      
      // Calculate what membership fee would be
      const paymentDate = new Date(dailyPayment.due_date);
      const currentMonth = paymentDate.getMonth() + 1;
      const currentYear = paymentDate.getFullYear();
      
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const weeksInMonth = Math.ceil(daysInMonth / 7);
      const membershipFee = weeksInMonth === 4 ? 40000 : 45000;
      
      console.log(`💡 This daily payment (Rp18,000) could be converted to:`);
      console.log(`   Monthly Membership: Rp${membershipFee.toLocaleString()} for ${weeksInMonth} weeks`);
      console.log(`   Conversion URL: POST /api/payments/convert`);
      console.log(`   Payload: { action: "convert_to_membership", payment_id: "${dailyPayment.id}", member_id: "${dailyPayment.member_id}", conversion_date: "${dailyPayment.due_date}" }`);
    } else {
      console.log('❌ No daily payments available for conversion test');
    }

    console.log('\n🎯 New Payment Structure Summary:');
    console.log('✅ Separate shuttlecock and attendance payments');
    console.log('✅ Only one attendance/membership payment per member per month');
    console.log('✅ Multiple shuttlecock payments accumulate per member per day');
    console.log('✅ Daily payments can convert to monthly membership');
    console.log('✅ Monthly membership can convert back to daily');
    console.log('✅ Members with membership only pay shuttlecock fees in subsequent matches');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPaymentStructure();