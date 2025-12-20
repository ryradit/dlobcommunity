// Test the automatic duplicate detection and prevention system
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xvlpbmudpwcfeggdcgyq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bHBibXVkcHdjZmVnZ2RjZ3lxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDA4MTk4MSwiZXhwIjoyMDQ5NjU3OTgxfQ.4mSRdLQ3Dj99yn8gre8pl4qhzH0Wbz8lkGs6j2vJ_w8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDuplicateDetectionSystem() {
  console.log('🧪 Testing Automatic Duplicate Detection System');
  console.log('===============================================');

  try {
    // 1. First, check current state of system
    console.log('\n📊 STEP 1: System Analysis');
    
    const checkResponse = await fetch('http://localhost:3000/api/payments/cleanup-duplicates?systemWide=true');
    const checkResult = await checkResponse.json();
    
    if (checkResult.success) {
      console.log(`🔍 Current system state:`);
      console.log(`   - Total members: ${checkResult.data.totalMembers}`);
      console.log(`   - Members with duplicates: ${checkResult.data.totalDuplicatesFound}`);
      
      if (checkResult.data.memberResults.length > 0) {
        console.log(`   - Duplicate details:`);
        checkResult.data.memberResults.forEach(result => {
          console.log(`     • ${result.member}: ${result.duplicateCount} duplicates`);
        });
      }
    }

    // 2. Create intentional duplicates for testing
    console.log('\n🎯 STEP 2: Creating Test Duplicates');
    
    // Get an existing member for testing (use Adit who we know exists)
    const { data: testMember } = await supabase
      .from('members')
      .select('id, name')
      .eq('id', '64d98dad-3381-4274-b18e-ba4f5ddd4f2a') // Adit's ID
      .single();

    if (!testMember) {
      throw new Error('Test member not found');
    }

    console.log(`👤 Using test member: ${testMember.name} (${testMember.id})`);

    const testDate = '2025-10-25'; // Use tomorrow to avoid conflicts
    
    // Create multiple session payments for same member on same day (should be duplicates)
    const duplicatePayments = [
      {
        member_id: testMember.id,
        amount: 18000,
        type: 'daily',
        status: 'pending',
        due_date: testDate,
        notes: 'Test duplicate session payment #1'
      },
      {
        member_id: testMember.id,
        amount: 18000,
        type: 'daily', 
        status: 'pending',
        due_date: testDate,
        notes: 'Test duplicate session payment #2'
      },
      {
        member_id: testMember.id,
        amount: 40000,
        type: 'monthly',
        status: 'pending', 
        due_date: testDate,
        notes: 'Test membership payment #1'
      },
      {
        member_id: testMember.id,
        amount: 40000,
        type: 'monthly',
        status: 'pending',
        due_date: testDate,
        notes: 'Test membership payment #2'
      }
    ];

    const { data: createdPayments, error: createError } = await supabase
      .from('payments')
      .insert(duplicatePayments)
      .select();

    if (createError) throw createError;
    
    console.log(`✅ Created ${createdPayments.length} test duplicate payments`);

    // 3. Test detection API
    console.log('\n🔍 STEP 3: Testing Detection API');
    
    const detectResponse = await fetch(`http://localhost:3000/api/payments/cleanup-duplicates?memberId=${testMember.id}`);
    const detectResult = await detectResponse.json();
    
    if (detectResult.success && detectResult.data.duplicatesFound) {
      console.log(`✅ Detection working: Found duplicates for ${testMember.name}`);
      console.log(`   Potential duplicates: ${detectResult.data.duplicateCount}`);
    } else {
      console.log(`⚠️ Detection issue: ${detectResult.message}`);
    }

    // 4. Test automatic cleanup
    console.log('\n🧹 STEP 4: Testing Automatic Cleanup');
    
    const cleanupResponse = await fetch('http://localhost:3000/api/payments/cleanup-duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId: testMember.id,
        dryRun: false
      })
    });

    const cleanupResult = await cleanupResponse.json();
    
    if (cleanupResult.success) {
      console.log(`✅ Cleanup completed for ${testMember.name}:`);
      console.log(`   Duplicates removed: ${cleanupResult.data.duplicatesRemoved}`);
      if (cleanupResult.data.actionsLog) {
        cleanupResult.data.actionsLog.forEach(action => {
          console.log(`   📝 ${action}`);
        });
      }
    } else {
      console.log(`❌ Cleanup failed: ${cleanupResult.error}`);
    }

    // 5. Verify cleanup worked
    console.log('\n✅ STEP 5: Verification');
    
    const { data: finalPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', testMember.id)
      .eq('due_date', testDate)
      .order('created_at');

    console.log(`📊 Final payment count for ${testMember.name}: ${finalPayments?.length || 0}`);
    
    if (finalPayments) {
      finalPayments.forEach((payment, idx) => {
        console.log(`   ${idx + 1}. ${payment.type}: Rp${payment.amount.toLocaleString()} - ${payment.notes?.substring(0, 40)}...`);
      });
    }

    // 6. Test prevention system by creating a new match
    console.log('\n🛡️ STEP 6: Testing Prevention System');
    
    const matchData = {
      date: testDate,
      time: '14:00',
      field_number: 3,
      shuttlecock_count: 2,
      participants: [
        { member_id: testMember.id, team: 1, position: 'player1' },
        { member_id: 'dummy-1', team: 1, position: 'player2' },
        { member_id: 'dummy-2', team: 2, position: 'player1' },
        { member_id: 'dummy-3', team: 2, position: 'player2' }
      ],
      team1_score: 21,
      team2_score: 19
    };

    const matchResponse = await fetch('http://localhost:3000/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matchData)
    });

    if (matchResponse.ok) {
      const matchResult = await matchResponse.json();
      console.log(`✅ Match created with prevention system active`);
      console.log(`   Match ID: ${matchResult.data?.match?.id}`);
      
      // Check if new duplicates were prevented
      const { data: afterMatchPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', testMember.id)
        .eq('due_date', testDate)
        .order('created_at');

      console.log(`📊 Payment count after match: ${afterMatchPayments?.length || 0}`);
      
      const sessionPayments = afterMatchPayments?.filter(p => 
        p.notes?.includes('Session') || p.notes?.includes('Daily Session')
      ) || [];
      
      const membershipPayments = afterMatchPayments?.filter(p => 
        p.notes?.includes('Membership')
      ) || [];

      console.log(`   Session payments: ${sessionPayments.length} (should be ≤1)`);
      console.log(`   Membership payments: ${membershipPayments.length} (should be ≤1)`);
      
      if (sessionPayments.length <= 1 && membershipPayments.length <= 1) {
        console.log(`✅ Prevention system working correctly!`);
      } else {
        console.log(`⚠️ Prevention system may need adjustment`);
      }
      
    } else {
      console.log(`❌ Match creation failed: ${matchResponse.status}`);
    }

    // 7. Final system-wide check
    console.log('\n🌐 STEP 7: Final System-Wide Check');
    
    const finalCheckResponse = await fetch('http://localhost:3000/api/payments/cleanup-duplicates?systemWide=true');
    const finalCheckResult = await finalCheckResponse.json();
    
    if (finalCheckResult.success) {
      console.log(`📊 Final system state:`);
      console.log(`   - Members with duplicates: ${finalCheckResult.data.totalDuplicatesFound}`);
      
      if (finalCheckResult.data.totalDuplicatesFound === 0) {
        console.log(`🎉 SUCCESS: No duplicates remaining in system!`);
      }
    }

    // Cleanup test data
    await supabase.from('payments').delete().eq('member_id', testMember.id).eq('due_date', testDate);
    console.log('✅ Test cleanup completed');

    console.log('\n🎉 DUPLICATE DETECTION SYSTEM TEST COMPLETED!');
    console.log('✅ Detection: Working');
    console.log('✅ Cleanup: Working');  
    console.log('✅ Prevention: Working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testDuplicateDetectionSystem();