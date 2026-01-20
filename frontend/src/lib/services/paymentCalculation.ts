// Payment calculation service for DLOB badminton club
// Handles membership fees, shuttlecock fees, and match-based payments

export interface MembershipPayment {
  member_id: string;
  month: number;
  year: number;
  weeks_in_month: number;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paid_date?: string;
}

export interface MatchPayment {
  member_id: string;
  match_id: string;
  shuttlecock_count: number;
  shuttlecock_fee: number;
  membership_fee: number;
  attendance_fee: number;
  total_amount: number;
  has_membership: boolean;
}

export interface PaymentCalculation {
  member_id: string;
  member_name: string;
  membership_status: 'paid' | 'unpaid';
  shuttlecock_fee: number;
  attendance_fee: number;
  total_due: number;
  breakdown: {
    shuttlecock_cost: number;
    attendance_cost: number;
    membership_discount: boolean;
  };
}

export class PaymentCalculationService {
  // Constants
  static readonly SHUTTLECOCK_COST_PER_PIECE = 3000;
  static readonly ATTENDANCE_FEE_WITHOUT_MEMBERSHIP = 18000;
  static readonly MONTHLY_MEMBERSHIP_4_WEEKS = 40000;
  static readonly MONTHLY_MEMBERSHIP_5_WEEKS = 45000;

  /**
   * Calculate how many weeks are in the current month
   */
  static getWeeksInMonth(year: number, month: number): number {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    
    // If month has 29+ days, it likely has 5 weeks
    return daysInMonth >= 29 ? 5 : 4;
  }

  /**
   * Get monthly membership fee based on number of weeks
   */
  static getMonthlyMembershipFee(year: number, month: number): number {
    const weeks = this.getWeeksInMonth(year, month);
    return weeks === 5 ? this.MONTHLY_MEMBERSHIP_5_WEEKS : this.MONTHLY_MEMBERSHIP_4_WEEKS;
  }

  /**
   * Check if a member has paid their monthly membership
   */
  static hasPaidMembership(membershipPayments: MembershipPayment[], memberId: string): boolean {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const membershipPayment = membershipPayments.find(
      payment => payment.member_id === memberId && 
                 payment.month === currentMonth && 
                 payment.year === currentYear
    );

    return membershipPayment?.status === 'paid';
  }

  /**
   * Calculate shuttlecock cost per member for a specific day
   * Each player pays full price per shuttlecock (3000 per shuttlecock per person)
   */
  static calculateShuttlecockCostPerMember(
    totalShuttlecocks: number, 
    totalPlayersOnDay: number
  ): number {
    if (totalPlayersOnDay === 0) return 0;
    
    // Each person pays 3000 per shuttlecock (not split cost)
    return totalShuttlecocks * this.SHUTTLECOCK_COST_PER_PIECE;
  }

  /**
   * Calculate payment for a single member on match day
   */
  static calculateMemberPayment(
    memberId: string,
    memberName: string,
    hasMembership: boolean,
    shuttlecockCostPerMember: number
  ): PaymentCalculation {
    let attendanceFee = 0;
    let shuttlecockFee = shuttlecockCostPerMember;
    
    // If member doesn't have membership, they pay attendance fee
    if (!hasMembership) {
      attendanceFee = this.ATTENDANCE_FEE_WITHOUT_MEMBERSHIP;
    }

    const totalDue = shuttlecockFee + attendanceFee;

    return {
      member_id: memberId,
      member_name: memberName,
      membership_status: hasMembership ? 'paid' : 'unpaid',
      shuttlecock_fee: shuttlecockFee,
      attendance_fee: attendanceFee,
      total_due: totalDue,
      breakdown: {
        shuttlecock_cost: shuttlecockFee,
        attendance_cost: attendanceFee,
        membership_discount: hasMembership
      }
    };
  }

  /**
   * Calculate payments for all members who played on a specific day
   */
  static calculateDayPayments(
    playersOnDay: Array<{ id: string; name: string }>,
    totalShuttlecocksUsed: number,
    membershipPayments: MembershipPayment[]
  ): PaymentCalculation[] {
    const shuttlecockCostPerMember = this.calculateShuttlecockCostPerMember(
      totalShuttlecocksUsed,
      playersOnDay.length
    );

    return playersOnDay.map(player => {
      const hasMembership = this.hasPaidMembership(membershipPayments, player.id);
      
      return this.calculateMemberPayment(
        player.id,
        player.name,
        hasMembership,
        shuttlecockCostPerMember
      );
    });
  }

  /**
   * Generate payment breakdown message for WhatsApp/notification
   */
  static generatePaymentMessage(calculations: PaymentCalculation[], date: string): string {
    const totalRevenue = calculations.reduce((sum, calc) => sum + calc.total_due, 0);
    
    let message = `🏸 DLOB Payment Summary - ${date}\n\n`;
    
    calculations.forEach(calc => {
      message += `👤 ${calc.member_name}\n`;
      message += `   Shuttlecock: Rp ${calc.shuttlecock_fee.toLocaleString('id-ID')}\n`;
      
      if (calc.attendance_fee > 0) {
        message += `   Attendance: Rp ${calc.attendance_fee.toLocaleString('id-ID')}\n`;
      } else {
        message += `   ✅ Membership Active (No attendance fee)\n`;
      }
      
      message += `   Total: Rp ${calc.total_due.toLocaleString('id-ID')}\n\n`;
    });
    
    message += `💰 Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}\n`;
    message += `👥 Total Players: ${calculations.length}`;
    
    return message;
  }

  /**
   * Create payment records for database insertion
   */
  static createPaymentRecords(
    calculations: PaymentCalculation[],
    matchIds: string[],
    date: string
  ): any[] {
    return calculations.map(calc => ({
      member_id: calc.member_id,
      amount: calc.total_due,
      type: 'daily',
      status: 'pending',
      due_date: date,
      match_id: matchIds[0], // Associate with first match of the day
      shuttlecock_count: 0, // Will be calculated from match data
      membership_fee: 0,
      shuttlecock_fee: calc.shuttlecock_fee,
      attendance_fee: calc.attendance_fee,
      notes: `Payment for matches on ${date}. ${calc.breakdown.membership_discount ? 'Membership active.' : 'No membership - includes attendance fee.'}`
    }));
  }
}

// Helper functions for formatting
export const formatCurrency = (amount: number): string => {
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Example usage:
/*
const playersOnDay = [
  { id: '1', name: 'Ryan Ahmad' },
  { id: '2', name: 'Budi Santoso' },
  { id: '3', name: 'Siti Nurhaliza' },
  { id: '4', name: 'Ahmad Fauzi' }
];

const membershipPayments = [
  { member_id: '1', month: 10, year: 2025, status: 'paid' },
  { member_id: '2', month: 10, year: 2025, status: 'unpaid' }
];

const calculations = PaymentCalculationService.calculateDayPayments(
  playersOnDay,
  3, // 3 shuttlecocks used total - each person pays 3000 × 3 = 9000 for shuttlecocks
  membershipPayments
);

console.log(PaymentCalculationService.generatePaymentMessage(calculations, '2025-10-22'));

// Result: Each person pays 9,000 for shuttlecocks + attendance fee (if no membership)
// Ryan (has membership): 9,000 (shuttlecocks only)
// Budi (no membership): 9,000 + 18,000 = 27,000 (shuttlecocks + attendance fee)
*/