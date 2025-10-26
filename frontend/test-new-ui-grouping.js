// Test the NEW UI grouping logic (member_name + due_date)
async function testNewUIGrouping() {
  try {
    console.log('🔍 NEW UI GROUPING ANALYSIS (member_name + due_date)');
    console.log('===================================================');

    const response = await fetch('http://localhost:3000/api/payments');
    const data = await response.json();
    const payments = data.data.payments;

    console.log(`📊 Total payments in API: ${payments.length}`);

    // Simulate the NEW UI grouping logic (member_name + due_date)
    const newUIGroups = {};
    payments.forEach(payment => {
      const key = `${payment.member.name}_${payment.due_date}`;
      if (!newUIGroups[key]) {
        newUIGroups[key] = {
          memberName: payment.member.name,
          dueDate: payment.due_date,
          payments: [],
          shuttlecockPayments: [],
          membershipPayments: [],
          sessionPayments: []
        };
      }
      
      newUIGroups[key].payments.push({
        id: payment.id,
        type: payment.type,
        amount: payment.amount,
        member_id: payment.member_id,
        isShuttlecock: payment.notes?.includes('Shuttlecock') || false,
        isSession: payment.notes?.includes('Session') || payment.notes?.includes('Daily Session') || false,
        isMembership: payment.notes?.includes('Membership') || false
      });
      
      // Categorize like the UI does
      if (payment.notes?.includes('Shuttlecock')) {
        newUIGroups[key].shuttlecockPayments.push(payment);
      } else if (payment.notes?.includes('Membership')) {
        newUIGroups[key].membershipPayments.push(payment);
      } else if (payment.notes?.includes('Session') || payment.notes?.includes('Daily Session')) {
        newUIGroups[key].sessionPayments.push(payment);
      }
    });

    console.log(`📦 NEW UI Groups created: ${Object.keys(newUIGroups).length} (was 4 before)`);
    
    Object.values(newUIGroups).forEach((group, index) => {
      console.log(`\n📋 Group ${index + 1}: ${group.memberName} - ${group.dueDate}`);
      console.log(`   Total payments: ${group.payments.length}`);
      console.log(`   🏸 Shuttlecock payments: ${group.shuttlecockPayments.length}`);
      console.log(`   💳 Membership payments: ${group.membershipPayments.length}`);
      console.log(`   📅 Session payments: ${group.sessionPayments.length}`);
      
      // Show member IDs involved
      const memberIds = [...new Set(group.payments.map(p => p.member_id))];
      console.log(`   👤 Member IDs involved: ${memberIds.length}`);
      memberIds.forEach(id => {
        const count = group.payments.filter(p => p.member_id === id).length;
        console.log(`      - ${id.substring(0, 8)}...: ${count} payments`);
      });
      
      // Show payment breakdown
      group.payments.forEach(p => {
        const type = p.isShuttlecock ? '🏸 Shuttlecock' : 
                    p.isMembership ? '💳 Membership' : 
                    p.isSession ? '📅 Session' : '❓ Other';
        console.log(`      ${type}: Rp${p.amount.toLocaleString()} (ID: ${p.id.substring(0, 8)}...)`);
      });
    });

    // Compare old vs new grouping
    console.log('\n🔄 COMPARISON:');
    console.log(`📊 OLD grouping (member_id + due_date): 4 groups`);
    console.log(`📊 NEW grouping (member_name + due_date): ${Object.keys(newUIGroups).length} groups`);
    
    if (Object.keys(newUIGroups).length < 4) {
      console.log('✅ SUCCESS: Duplicate members merged into fewer groups!');
      
      // Check Ryan specifically
      const ryanGroups = Object.values(newUIGroups).filter(g => g.memberName.includes('Ryan'));
      if (ryanGroups.length === 1) {
        const ryanGroup = ryanGroups[0];
        console.log(`✅ Ryan's 8 payments now grouped together:`);
        console.log(`   🏸 ${ryanGroup.shuttlecockPayments.length} shuttlecock payments`);
        console.log(`   💳 ${ryanGroup.membershipPayments.length} membership payments`);
        console.log(`   📅 ${ryanGroup.sessionPayments.length} session payments`);
        console.log(`   🔗 Total: ${ryanGroup.payments.length} payments`);
      }
    } else {
      console.log('❌ Issue: Groups not reduced as expected');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNewUIGrouping();