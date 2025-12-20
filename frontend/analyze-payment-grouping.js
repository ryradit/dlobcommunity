// Analyze payment grouping issues and duplicate members
const fs = require('fs');

async function analyzePaymentGrouping() {
  try {
    console.log('🔍 PAYMENT GROUPING ANALYSIS');
    console.log('============================');

    const response = await fetch('http://localhost:3000/api/payments');
    const data = await response.json();
    const payments = data.data.payments;

    console.log(`📊 Total payments in API: ${payments.length}`);
    console.log(`📊 Stats show: ${data.data.stats.total} payments`);

    // Group by member name to find duplicates
    const memberGroups = {};
    payments.forEach(payment => {
      const memberName = payment.member.name;
      if (!memberGroups[memberName]) {
        memberGroups[memberName] = {};
      }
      
      const memberId = payment.member_id;
      if (!memberGroups[memberName][memberId]) {
        memberGroups[memberName][memberId] = [];
      }
      
      memberGroups[memberName][memberId].push(payment);
    });

    console.log('\n🧑‍🤝‍🧑 MEMBER ANALYSIS:');
    Object.entries(memberGroups).forEach(([name, memberIds]) => {
      const idCount = Object.keys(memberIds).length;
      const totalPayments = Object.values(memberIds).flat().length;
      
      console.log(`\n👤 ${name}:`);
      console.log(`   - Unique IDs: ${idCount}`);
      console.log(`   - Total Payments: ${totalPayments}`);
      
      if (idCount > 1) {
        console.log(`   🚨 DUPLICATE DETECTED!`);
        Object.entries(memberIds).forEach(([id, payments]) => {
          console.log(`   - ID ${id.substring(0, 8)}...: ${payments.length} payments`);
        });
      }
    });

    // Analyze UI grouping logic (member_id + due_date)
    console.log('\n🔗 UI GROUPING ANALYSIS (member_id + due_date):');
    const uiGroups = {};
    payments.forEach(payment => {
      const key = `${payment.member_id}_${payment.due_date}`;
      if (!uiGroups[key]) {
        uiGroups[key] = {
          memberName: payment.member.name,
          memberId: payment.member_id,
          dueDate: payment.due_date,
          payments: []
        };
      }
      uiGroups[key].payments.push({
        type: payment.type,
        amount: payment.amount,
        isShuttlecock: payment.notes?.includes('Shuttlecock') || false,
        isSession: payment.notes?.includes('Session') || payment.notes?.includes('Daily Session') || false,
        isMembership: payment.notes?.includes('Membership') || false
      });
    });

    console.log(`📦 UI Groups created: ${Object.keys(uiGroups).length}`);
    
    Object.values(uiGroups).forEach((group, index) => {
      console.log(`\nGroup ${index + 1}: ${group.memberName} - ${group.dueDate}`);
      console.log(`   Member ID: ${group.memberId.substring(0, 8)}...`);
      console.log(`   Payments: ${group.payments.length}`);
      group.payments.forEach(p => {
        const type = p.isShuttlecock ? '🏸 Shuttlecock' : 
                    p.isMembership ? '💳 Membership' : 
                    p.isSession ? '📅 Session' : '❓ Other';
        console.log(`     - ${type}: Rp${p.amount.toLocaleString()}`);
      });
    });

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Total payments: ${payments.length}`);
    console.log(`📦 UI groups: ${Object.keys(uiGroups).length}`);
    console.log(`👥 Unique member names: ${Object.keys(memberGroups).length}`);
    
    const duplicateMembers = Object.entries(memberGroups).filter(([name, ids]) => Object.keys(ids).length > 1);
    if (duplicateMembers.length > 0) {
      console.log(`🚨 Duplicate members detected: ${duplicateMembers.length}`);
      console.log('   This causes payments to be split across multiple UI groups!');
    } else {
      console.log('✅ No duplicate members found');
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

analyzePaymentGrouping();