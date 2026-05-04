const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qtdayzlrwmzdezkavjpd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZGF5emxyd216ZGV6a2F2anBkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTE0MDI4OCwiZXhwIjoyMDc2NzE2Mjg4fQ.jMEuVvHyeNDqfcdqXDsqQFbFAvMWiSiaYRROwVPzxQU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateShuttlecockReport() {
  const now = new Date();
  console.log(`📊 Validating Shuttlecock Usage Report`);
  console.log(`Report generated at: ${now.toISOString()}`);    console.log(`Current UTC Date: ${now.toUTCString()}`);
    console.log('');  console.log('');

  try {
    // Fetch ALL matches to analyze
    console.log('📥 Fetching all matches from database...');
    const { data: allMatches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false });

    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError);
      return;
    }

    console.log(`✅ Found ${allMatches?.length || 0} total matches`);
    console.log('');

    // Calculate boundaries for current UTC date
    const now = new Date();
    
    // Week calculation (Sunday to Saturday) in UTC
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setUTCHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setUTCHours(23, 59, 59, 999);
    
    // Month calculation in UTC
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    currentMonthStart.setUTCHours(0, 0, 0, 0);
    
    const currentMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
    currentMonthEnd.setUTCHours(23, 59, 59, 999);
    
    // Year calculation in UTC
    const currentYearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    currentYearStart.setUTCHours(0, 0, 0, 0);
    
    const currentYearEnd = new Date(Date.UTC(now.getUTCFullYear(), 11, 31));
    currentYearEnd.setUTCHours(23, 59, 59, 999);

    console.log('📅 PERIOD BOUNDARIES:');
    console.log(`  Week:  ${currentWeekStart.toISOString()} to ${currentWeekEnd.toISOString()}`);
    console.log(`  Month: ${currentMonthStart.toISOString()} to ${currentMonthEnd.toISOString()}`);
    console.log(`  Year:  ${currentYearStart.toISOString()} to ${currentYearEnd.toISOString()}`);
    console.log('');

    // Analyze matches by period
    let weeklyMatches = [];
    let monthlyMatches = [];
    let yearlyMatches = [];
    let totalMatches = [];
    
    // Initialize monthly aggregates
    const monthlyAggregates = Array(12).fill(null).map(() => ({ shuttlecocks: 0, matches: 0 }));

    if (allMatches && allMatches.length > 0) {
      allMatches.forEach((match, idx) => {
        // Parse match date
        const dateStr = match.match_date || match.created_at;
        const matchDate = new Date(dateStr);
        
        // Normalize to start of day in UTC
        const normalized = new Date(Date.UTC(
          matchDate.getUTCFullYear(),
          matchDate.getUTCMonth(),
          matchDate.getUTCDate()
        ));
        
        const shuttlecocks = match.shuttlecock_count || 0;
        
        const matchInfo = {
          idx: idx + 1,
          dateStr: dateStr,
          normalized: normalized.toISOString(),
          shuttlecocks,
          type: match.match_number ? `Match #${match.match_number}` : 'Match'
        };

        // Check periods
        const isWeekly = normalized >= currentWeekStart && normalized <= currentWeekEnd;
        const isMonthly = normalized >= currentMonthStart && normalized <= currentMonthEnd;
        const isYearly = normalized >= currentYearStart && normalized <= currentYearEnd;

        if (isWeekly) {
          weeklyMatches.push(matchInfo);
        }
        if (isMonthly) {
          monthlyMatches.push(matchInfo);
        }
        if (isYearly) {
          yearlyMatches.push(matchInfo);
          // Add to monthly aggregate
          const monthIndex = matchDate.getUTCMonth();
          monthlyAggregates[monthIndex].shuttlecocks += shuttlecocks;
          monthlyAggregates[monthIndex].matches += 1;
        }
        
        totalMatches.push(matchInfo);
      });
    }

    // Calculate totals
    const weeklyShuttles = weeklyMatches.reduce((sum, m) => sum + m.shuttlecocks, 0);
    const monthlyShuttles = monthlyMatches.reduce((sum, m) => sum + m.shuttlecocks, 0);
    const yearlyShuttles = yearlyMatches.reduce((sum, m) => sum + m.shuttlecocks, 0);
    const totalShuttles = totalMatches.reduce((sum, m) => sum + m.shuttlecocks, 0);

    console.log('📊 THIS WEEK MATCHES (5 Apr - 11 Apr 2026):');
    console.log(`  Count: ${weeklyMatches.length} matches`);
    console.log(`  Total Shuttlecocks: ${weeklyShuttles}`);
    if (weeklyMatches.length > 0) {
      console.log('  Details:');
      weeklyMatches.forEach(m => {
        console.log(`    ${m.idx}. ${m.normalized} - ${m.shuttlecocks} shuttlecocks (${m.type})`);
      });
    } else {
      console.log('  ❌ NO MATCHES THIS WEEK');
    }
    console.log('');

    console.log('📊 THIS MONTH MATCHES (April 2026):');
    console.log(`  Count: ${monthlyMatches.length} matches`);
    console.log(`  Total Shuttlecocks: ${monthlyShuttles}`);
    if (monthlyMatches.length > 0) {
      console.log('  First 5 matches:');
      monthlyMatches.slice(0, 5).forEach(m => {
        console.log(`    ${m.idx}. ${m.normalized} - ${m.shuttlecocks} shuttlecocks`);
      });
      if (monthlyMatches.length > 5) {
        console.log(`    ... and ${monthlyMatches.length - 5} more`);
      }
    }
    console.log('');

    console.log('📊 THIS YEAR MATCHES (2026):');
    console.log(`  Count: ${yearlyMatches.length} matches`);
    console.log(`  Total Shuttlecocks: ${yearlyShuttles}`);
    console.log('');

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SHUTTLECOCK USAGE VALIDATION REPORT');
    console.log('═══════════════════════════════════════════════════');
    const weekStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay());
    const weekEnd = new Date(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate() + 6);
    const monthStart = now.getUTCMonth() + 1; // 1-indexed for display
    console.log(`Current UTC Date: ${now.toUTCString()}`);
    console.log('');
    
    console.log('📋 PERIOD BREAKDOWN:');
    console.log('-'.repeat(50));
    console.log(`This Week (${weekStart.getUTCDate()} Apr - ${weekEnd.getUTCDate()} Apr):   ${weeklyShuttles} shuttlecocks (${weeklyMatches.length} matches)`);
    console.log(`This Month (April):            ${monthlyShuttles} shuttlecocks (${monthlyMatches.length} matches)`);
    console.log(`This Year (2026):              ${yearlyShuttles} shuttlecocks (${yearlyMatches.length} matches)`);
    console.log(`Total (All Time):              ${totalShuttles} shuttlecocks (${totalMatches.length} matches)`);
    console.log('-'.repeat(50));
    console.log('');
    
    // Display monthly breakdown
    console.log('📅 MONTHLY BREAKDOWN FOR 2026:');
    console.log('-'.repeat(50));
    const monthNamesID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    monthlyAggregates.forEach((aggregate, monthIndex) => {
      if (aggregate.matches > 0 || monthIndex === now.getUTCMonth()) { // Show months with data or current month
        console.log(`${String(monthIndex + 1).padStart(2, '0')}. ${monthNamesID[monthIndex].padEnd(10)} : ${String(aggregate.shuttlecocks).padStart(3)} shuttlecocks (${aggregate.matches} matches)`);
      }
    });
    console.log('-'.repeat(50));

    console.log('🔍 VALIDATION CHECK:');
    console.log(`  Report shows This Week:      0 shuttlecocks (0 matches)`);
    console.log(`  Database shows This Week:    ${weeklyShuttles} shuttlecocks (${weeklyMatches.length} matches)`);
    console.log(`  ${weeklyShuttles === 0 ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log('');
    console.log(`  Report shows This Month:     39 shuttlecocks (19 matches)`);
    console.log(`  Database shows This Month:   ${monthlyShuttles} shuttlecocks (${monthlyMatches.length} matches)`);
    console.log(`  ${monthlyShuttles === 39 && monthlyMatches.length === 19 ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log('');
    console.log(`  Report shows This Year:      188 shuttlecocks (95 matches)`);
    console.log(`  Database shows This Year:    ${yearlyShuttles} shuttlecocks (${yearlyMatches.length} matches)`);
    console.log(`  ${yearlyShuttles === 188 && yearlyMatches.length === 95 ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log('');
    console.log(`  Report shows Total:          188 shuttlecocks (95 matches)`);
    console.log(`  Database shows Total:        ${totalShuttles} shuttlecocks (${totalMatches.length} matches)`);
    console.log(`  ${totalShuttles === 188 && totalMatches.length === 95 ? '✅ MATCH' : '❌ MISMATCH'}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error during validation:', error);
  }

  process.exit(0);
}

validateShuttlecockReport();
