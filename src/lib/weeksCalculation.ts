/**
 * Membership and Weeks Calculation Utility
 * Used for smart detection of weeks in month (4 or 5 weeks)
 * 
 * Pricing:
 * - 4 weeks: Rp 40,000
 * - 5 weeks: Rp 45,000
 */

/**
 * Calculate number of Saturdays (badminton sessions) in a given month
 * @param date - The date to calculate from (defaults to current date)
 * @returns Number of Saturdays in the month
 */
export function getSaturdaysInMonth(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let saturdayCount = 0;
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 6) { // Saturday = 6
      saturdayCount++;
    }
  }
  
  return saturdayCount;
}

/**
 * Get all Saturday dates in a given month
 * @param date - The date to calculate from (defaults to current date)
 * @returns Array of Saturday dates
 */
export function getSaturdayDatesInMonth(date: Date = new Date()): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const saturdays: Date[] = [];
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 6) { // Saturday = 6
      saturdays.push(new Date(d));
    }
  }
  
  return saturdays;
}

/**
 * Calculate membership fee based on weeks in month
 * @param weeksInMonth - Number of weeks (4 or 5)
 * @returns Monthly membership fee in Rupiah
 */
export function calculateMembershipFee(weeksInMonth: number): number {
  return weeksInMonth === 4 ? 40000 : 45000;
}

/**
 * Get membership fee breakdown
 * @param weeksInMonth - Number of weeks (4 or 5)
 * @returns Object with weeks, fee, and cost per week
 */
export function getMembershipBreakdown(weeksInMonth: number) {
  const fee = calculateMembershipFee(weeksInMonth);
  const costPerWeek = Math.round(fee / weeksInMonth);
  
  return {
    weeksInMonth,
    totalFee: fee,
    costPerWeek,
    costPerWeekFormatted: new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(costPerWeek),
    totalFeeFormatted: new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(fee),
  };
}

/**
 * Get month name in Indonesian
 * @param date - The date to get month from
 * @returns Month name in Indonesian
 */
export function getMonthNameIndonesian(date: Date = new Date()): string {
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  return monthNames[date.getMonth()];
}

/**
 * Get smart week detection result for current month
 * @returns Object with detected weeks, fee, and display message
 */
export function detectCurrentMonthWeeks() {
  const now = new Date();
  const saturdays = getSaturdayDatesInMonth(now);
  const weeksInMonth = saturdays.length;
  const fee = calculateMembershipFee(weeksInMonth);
  const monthName = getMonthNameIndonesian(now);
  const year = now.getFullYear();
  
  return {
    weeksInMonth,
    saturdayCount: saturdays.length,
    fee,
    monthName,
    year,
    displayText: `${monthName} ${year} - ${weeksInMonth} minggu (${saturdays.length} sesi Sabtu)`,
    saturdayDates: saturdays,
  };
}

/**
 * Check if a specific date is a Saturday (badminton session day)
 * @param date - The date to check
 * @returns true if Saturday, false otherwise
 */
export function isBadmintonDay(date: Date): boolean {
  return date.getDay() === 6;
}
