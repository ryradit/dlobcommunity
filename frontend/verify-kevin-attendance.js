// Test Kevin's attendance calculation locally
console.log('🧪 Testing Attendance Calculation Logic');
console.log('=====================================\n');

// Kevin's match data (we know he has 1 match on 2025-10-24)
const memberMatches = [
  { date: '2025-10-24', id: 'kevin-match-1' }
];

console.log('🎾 Kevin\'s matches:', memberMatches);

// Calculate attendance from member matches (same logic as analytics)
const matchDates = [...new Set(memberMatches.map(match => match.date))];

console.log('📅 Unique match dates:', matchDates);

// Generate Saturdays in the last 3 months
const now = new Date();
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(now.getMonth() - 3);

const allSaturdays = [];
const current = new Date(threeMonthsAgo);

// Find the first Saturday
while (current.getDay() !== 6) { // 6 = Saturday
  current.setDate(current.getDate() + 1);
}

// Collect all Saturdays until now
while (current <= now) {
  allSaturdays.push(current.toISOString().split('T')[0]);
  current.setDate(current.getDate() + 7); // Next Saturday
}

console.log('\n📅 All Saturdays in last 3 months:');
console.log('Total Saturdays:', allSaturdays.length);
console.log('First Saturday:', allSaturdays[0]);
console.log('Last Saturday:', allSaturdays[allSaturdays.length - 1]);
console.log('Kevin\'s match date (2025-10-24) included?', allSaturdays.includes('2025-10-24'));

const attendedSessions = matchDates.filter(date => allSaturdays.includes(date)).length;
const calculatedAttendanceRate = allSaturdays.length > 0 ? 
  (attendedSessions / allSaturdays.length) * 100 : 0;

console.log('\n📊 Attendance Calculation:');
console.log('Match dates that are Saturdays:', attendedSessions);
console.log('Total Saturday sessions:', allSaturdays.length);
console.log('Calculated attendance rate:', Math.round(calculatedAttendanceRate) + '%');

console.log('\n🎯 Expected Result:');
if (calculatedAttendanceRate > 0) {
  console.log('✅ SUCCESS: Kevin should show ' + Math.round(calculatedAttendanceRate) + '% attendance rate');
  console.log('✅ This means match participation is counting as attendance!');
} else {
  console.log('❌ ISSUE: Still showing 0% - need to debug further');
}

// Check if 2025-10-24 is indeed a Saturday
const kevinMatchDate = new Date('2025-10-24');
const dayOfWeek = kevinMatchDate.getDay();
console.log('\n📅 Kevin\'s match date analysis:');
console.log('Date: 2025-10-24');
console.log('Day of week:', dayOfWeek, '(0=Sunday, 6=Saturday)');
console.log('Is Saturday?', dayOfWeek === 6 ? 'YES ✅' : 'NO ❌');

if (dayOfWeek !== 6) {
  console.log('\n⚠️  IMPORTANT: Kevin\'s match is not on a Saturday!');
  console.log('The attendance calculation only counts Saturday sessions.');
  console.log('This explains why attendance rate might still be 0%.');
}