import { SupabaseClient } from '@supabase/supabase-js';

export interface BranchPricing {
  branchId: string;
  // Shuttlecock fee:
  // For DLBC: cost per cock per member (default 2500)
  // For Pusat: total cost per cock (default 12000), split among 4 members = 3000
  shuttlecockFee: number;
  costPerMemberPerCock: number;
  // Attendance fee (per day of attendance):
  attendanceFee: number;
  // Special attendance fee when playing only 1 match in a day (e.g. DLBC = 5000)
  singleMatchAttendanceFee?: number;
}

export const DEFAULT_DLBC_PRICING: BranchPricing = {
  branchId: 'dlob-cikupa',
  shuttlecockFee: 3000, // Rp 3.000 per member per cock
  costPerMemberPerCock: 3000,
  attendanceFee: 12000, // Rp 12.000 / day (> 1 match)
  singleMatchAttendanceFee: 5000, // Rp 5.000 / day (cuma 1 match)
};

export const DEFAULT_PUSAT_PRICING: BranchPricing = {
  branchId: 'dlob-pusat',
  shuttlecockFee: 12000, // Rp 12.000 total per cock
  costPerMemberPerCock: 3000, // 12000 / 4
  attendanceFee: 18000, // Rp 18.000 / day
  singleMatchAttendanceFee: 18000,
};

/**
 * Fetch dynamic pricing for a given branch from app_settings with fallback to defaults.
 */
export async function getBranchPricing(
  supabase: SupabaseClient,
  branchId: string = 'dlob-pusat'
): Promise<BranchPricing> {
  const isDlbc = branchId === 'dlob-cikupa' || branchId === 'cikupa';
  const targetBranch = isDlbc ? 'dlob-cikupa' : 'dlob-pusat';
  const defaultPricing = isDlbc ? DEFAULT_DLBC_PRICING : DEFAULT_PUSAT_PRICING;

  const shuttlecockKey = `shuttlecock_fee_${targetBranch}`;
  const attendanceKey = `attendance_fee_${targetBranch}`;
  const singleAttendanceKey = `attendance_fee_single_${targetBranch}`;

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', [shuttlecockKey, attendanceKey, singleAttendanceKey]);

    if (error || !data) {
      return defaultPricing;
    }

    const shuttlecockRow = data.find((r) => r.key === shuttlecockKey);
    const attendanceRow = data.find((r) => r.key === attendanceKey);
    const singleAttendanceRow = data.find((r) => r.key === singleAttendanceKey);

    const parsedShuttlecock = shuttlecockRow?.value ? parseInt(shuttlecockRow.value, 10) : defaultPricing.shuttlecockFee;
    const parsedAttendance = attendanceRow?.value ? parseInt(attendanceRow.value, 10) : defaultPricing.attendanceFee;
    const parsedSingle = singleAttendanceRow?.value ? parseInt(singleAttendanceRow.value, 10) : defaultPricing.singleMatchAttendanceFee;

    const shuttlecockFee = !isNaN(parsedShuttlecock) && parsedShuttlecock > 0 ? parsedShuttlecock : defaultPricing.shuttlecockFee;
    const attendanceFee = !isNaN(parsedAttendance) && parsedAttendance >= 0 ? parsedAttendance : defaultPricing.attendanceFee;
    const singleMatchAttendanceFee = parsedSingle !== undefined && !isNaN(parsedSingle) && parsedSingle >= 0 ? parsedSingle : defaultPricing.singleMatchAttendanceFee;

    const costPerMemberPerCock = isDlbc ? shuttlecockFee : Math.round(shuttlecockFee / 4);

    return {
      branchId: targetBranch,
      shuttlecockFee,
      costPerMemberPerCock,
      attendanceFee,
      singleMatchAttendanceFee,
    };
  } catch (err) {
    console.warn(`Error fetching branch pricing for ${branchId}, using defaults:`, err);
    return defaultPricing;
  }
}
