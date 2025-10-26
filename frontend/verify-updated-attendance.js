// Test updated attendance calculation logic
console.log('🧪 Testing UPDATED Attendance Calculation Logic');
console.log('==============================================\n');

// Kevin's match data (we know he has 1 match on 2025-10-24 which is a Friday)
const memberMatches = [
  { date: '2025-10-24', id: 'kevin-match-1' }
];

console.log('🎾 Kevin\'s matches:', memberMatches);

// Calculate attendance from member matches (NEW LOGIC)
const matchDates = [...new Set(memberMatches.map(match => match.date))];
console.log('📅 Unique match dates:', matchDates);

// Generate regular Saturdays in the last 3 months
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

console.log('\n📅 Regular Saturday sessions:', allSaturdays.length);

// NEW LOGIC: Include match dates as valid session days
const allSessionDays = [...new Set([...allSaturdays, ...matchDates])].sort();
console.log('📅 Total session days (Saturdays + match dates):', allSessionDays.length);
console.log('📅 All session days:', allSessionDays.slice(-5), '...(showing last 5)');

const attendedSessions = matchDates.length; // All matches count as attendance
const calculatedAttendanceRate = allSessionDays.length > 0 ? 
  (attendedSessions / allSessionDays.length) * 100 : 0;

console.log('\n📊 NEW Attendance Calculation:');
console.log('Match dates (attended sessions):', attendedSessions);
console.log('Total session days (Saturdays + match days):', allSessionDays.length);
console.log('Calculated attendance rate:', Math.round(calculatedAttendanceRate) + '%');

console.log('\n🎯 Expected Result:');
if (calculatedAttendanceRate > 0) {
  console.log('✅ SUCCESS: Kevin should now show ' + Math.round(calculatedAttendanceRate) + '% attendance rate');
  console.log('✅ Logic: Match participation counts as attendance, regardless of day!');
} else {
  console.log('❌ STILL ISSUE: Something else is wrong');
}

// Show the improvement
const oldLogicRate = allSaturdays.length > 0 ? (matchDates.filter(date => allSaturdays.includes(date)).length / allSaturdays.length) * 100 : 0;
console.log('\n🔄 Comparison:');
console.log('Old logic (Saturdays only):', Math.round(oldLogicRate) + '%');
console.log('New logic (flexible days):', Math.round(calculatedAttendanceRate) + '%');
console.log('Improvement:', calculatedAttendanceRate > oldLogicRate ? '✅ FIXED!' : '❌ Still same');

console.log('\n📊 This should fix Kevin\'s attendance display in both:');
console.log('1. Main analytics card (Attendance Rate: ' + Math.round(calculatedAttendanceRate) + '%)');
console.log('2. Performance Trends chart (Attendance Rate: ' + Math.round(calculatedAttendanceRate) + '%)');