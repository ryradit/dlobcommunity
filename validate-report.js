const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qtdayzlrwmzdezkavjpd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE0MDI4OCwiZXhwIjoyMDc2NzE2Mjg4fQ.jMEuVvHyeNDqfcdqXDsqQFbFAvMWiSiaYRROwVPzxQU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateReport() {
  const startDate = '2026-02-20';
  const endDate = '2026-04-07';
  
  console.log('🔍 Validating Report for Period:', startDate, 'to', endDate);
  console.log('');

  try {
    // Query match_members table
    console.log('📊 Fetching Match Payments...');
    const { data: matchPayments, error: matchError } = await supabase
      .from('match_members')
      .select('*')
      .gte('created_at', startDate + 'T00:00:00')
      .lte('created_at', endDate + 'T23:59:59')
      .eq('payment_status', 'paid');

    if (matchError) {
      console.error('❌ Error fetching match payments:', matchError);
      return;
    }

    console.log(`Found ${matchPayments?.length || 0} paid match payments`);
    
    let totalMatchRevenue = 0;
    if (matchPayments && matchPayments.length > 0) {
      totalMatchRevenue = matchPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
      console.log(`  Total from matches: Rp ${totalMatchRevenue.toLocaleString('id-ID')}`);
      console.log(`  Sample:`, matchPayments.slice(0, 3).map(p => ({
        member: p.member_name,
        amount: p.total_amount,
        status: p.payment_status,
        created_at: p.created_at
      })));
    }

    // Query memberships table
    console.log('');
    console.log('📊 Fetching Membership Payments...');
    const { data: membershipPayments, error: membershipError } = await supabase
      .from('memberships')
      .select('*')
      .gte('created_at', startDate + 'T00:00:00')
      .lte('created_at', endDate + 'T23:59:59')
      .eq('payment_status', 'paid');

    if (membershipError) {
      console.error('❌ Error fetching membership payments:', membershipError);
      return;
    }

    console.log(`Found ${membershipPayments?.length || 0} paid membership payments`);
    
    let totalMembershipRevenue = 0;
    if (membershipPayments && membershipPayments.length > 0) {
      totalMembershipRevenue = membershipPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      console.log(`  Total from memberships: Rp ${totalMembershipRevenue.toLocaleString('id-ID')}`);
      console.log(`  Sample:`, membershipPayments.slice(0, 3).map(p => ({
        member: p.member_name,
        month: p.month,
        year: p.year,
        amount: p.amount,
        status: p.payment_status,
        created_at: p.created_at
      })));
    }

    // Calculate totals
    const totalRevenue = totalMatchRevenue + totalMembershipRevenue;
    const totalPaidCount = (matchPayments?.length || 0) + (membershipPayments?.length || 0);

    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('✅ VALIDATION REPORT');
    console.log('═══════════════════════════════════════');
    console.log(`Period: ${startDate} to ${endDate}`);
    console.log('');
    console.log(`Match Payments (Paid):        ${matchPayments?.length || 0} items`);
    console.log(`  Revenue from Matches:       Rp ${totalMatchRevenue.toLocaleString('id-ID')}`);
    console.log('');
    console.log(`Membership Payments (Paid):   ${membershipPayments?.length || 0} items`);
    console.log(`  Revenue from Memberships:   Rp ${totalMembershipRevenue.toLocaleString('id-ID')}`);
    console.log('');
    console.log(`TOTAL REVENUE:                Rp ${totalRevenue.toLocaleString('id-ID')}`);
    console.log(`TOTAL PAID ITEMS:             ${totalPaidCount}`);
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📋 COMPARISON WITH REPORT IMAGE');
    console.log('═══════════════════════════════════════');
    console.log(`Report shows:        Rp 1.180.000 with 83 payments received`);
    console.log(`Database shows:      Rp ${totalRevenue.toLocaleString('id-ID')} with ${totalPaidCount} payments`);
    console.log('');
    
    if (totalRevenue === 1180000 && totalPaidCount === 83) {
      console.log('✅ VALIDATION PASSED - Data matches report!');
    } else {
      console.log('❌ VALIDATION FAILED - Discrepancy found!');
      if (totalRevenue !== 1180000) {
        console.log(`   Revenue mismatch: Expected Rp 1.180.000, got Rp ${totalRevenue.toLocaleString('id-ID')}`);
        console.log(`   Difference: Rp ${(1180000 - totalRevenue).toLocaleString('id-ID')}`);
      }
      if (totalPaidCount !== 83) {
        console.log(`   Payment count mismatch: Expected 83, got ${totalPaidCount}`);
        console.log(`   Difference: ${83 - totalPaidCount} items`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

validateReport();
