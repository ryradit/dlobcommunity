/**
 * DLOB Membership and Payment Calculation Service
 * 
 * Pricing Structure:
 * - Monthly Membership: Rp40,000 (4 weeks) or Rp45,000 (5 weeks)
 * - With membership: Only pay shuttlecock fees per session
 * - Without membership: Rp18,000 per session + shuttlecock fees
 * - Sessions: Every Saturday at 8:00 PM
 */

export interface MembershipStatus {
  hasMembership: boolean;
  membershipMonth: number;
  membershipYear: number;
  membershipAmount: number;
  weeksInMonth: number;
  expiryDate: Date;
}

export interface SessionPayment {
  memberId: string;
  sessionDate: string;
  sessionFee: number; // Rp18,000 if no membership, 0 if has membership
  shuttlecockFee: number; // Varies based on shuttlecocks used
  totalFee: number;
  hasMembership: boolean;
  breakdown: {
    sessionCost: number;
    shuttlecockCost: number;
    membershipDiscount: number;
  };
}

export interface MembershipFee {
  memberId: string;
  month: number;
  year: number;
  weeksInMonth: number;
  amount: number; // Rp40,000 or Rp45,000
  dueDate: string;
  description: string;
}

export class MembershipCalculationService {
  
  /**
   * Calculate the number of weeks in a given month
   */
  static getWeeksInMonth(year: number, month: number): number {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    // Count Saturdays in the month
    const saturdays = [];
    const current = new Date(firstDay);
    
    // Find first Saturday
    while (current.getDay() !== 6) {
      current.setDate(current.getDate() + 1);
    }
    
    // Count all Saturdays
    while (current.getMonth() === month - 1) {
      saturdays.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
    
    return saturdays.length;
  }

  /**
   * Calculate monthly membership fee based on weeks in month
   */
  static calculateMonthlyFee(year: number, month: number): MembershipFee {
    const weeksInMonth = this.getWeeksInMonth(year, month);
    const amount = weeksInMonth === 5 ? 45000 : 40000;
    
    const dueDate = new Date(year, month - 1, 1);
    const monthName = dueDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    return {
      memberId: '', // To be set by caller
      month,
      year,
      weeksInMonth,
      amount,
      dueDate: dueDate.toISOString().split('T')[0],
      description: `Membership fee for ${monthName} (${weeksInMonth} weeks)`
    };
  }

  /**
   * Check if member has active membership for a specific date
   */
  static checkMembershipStatus(
    membershipPayments: Array<{
      month: number;
      year: number;
      status: string;
      amount: number;
      weeks_in_month: number;
    }>,
    sessionDate: Date
  ): MembershipStatus {
    const sessionMonth = sessionDate.getMonth() + 1;
    const sessionYear = sessionDate.getFullYear();
    
    const currentMembership = membershipPayments.find(
      payment => 
        payment.month === sessionMonth && 
        payment.year === sessionYear && 
        payment.status === 'paid'
    );

    if (currentMembership) {
      return {
        hasMembership: true,
        membershipMonth: sessionMonth,
        membershipYear: sessionYear,
        membershipAmount: currentMembership.amount,
        weeksInMonth: currentMembership.weeks_in_month,
        expiryDate: new Date(sessionYear, sessionMonth, 0) // Last day of month
      };
    }

    return {
      hasMembership: false,
      membershipMonth: sessionMonth,
      membershipYear: sessionYear,
      membershipAmount: 0,
      weeksInMonth: this.getWeeksInMonth(sessionYear, sessionMonth),
      expiryDate: new Date(sessionYear, sessionMonth, 0)
    };
  }

  /**
   * Calculate session payment for a member
   */
  static calculateSessionPayment(
    memberId: string,
    sessionDate: Date,
    shuttlecocksUsed: number,
    membershipStatus: MembershipStatus,
    shuttlecockCostPerPiece: number = 3000
  ): SessionPayment {
    const sessionFee = membershipStatus.hasMembership ? 0 : 18000;
    const shuttlecockFee = shuttlecocksUsed * shuttlecockCostPerPiece;
    const totalFee = sessionFee + shuttlecockFee;

    return {
      memberId,
      sessionDate: sessionDate.toISOString().split('T')[0],
      sessionFee,
      shuttlecockFee,
      totalFee,
      hasMembership: membershipStatus.hasMembership,
      breakdown: {
        sessionCost: membershipStatus.hasMembership ? 0 : 18000,
        shuttlecockCost: shuttlecockFee,
        membershipDiscount: membershipStatus.hasMembership ? 18000 : 0
      }
    };
  }

  /**
   * Calculate payments for multiple members in a session
   */
  static calculateGroupSessionPayments(
    memberIds: string[],
    sessionDate: Date,
    shuttlecocksUsed: number,
    membershipPayments: Record<string, Array<{
      month: number;
      year: number;
      status: string;
      amount: number;
      weeks_in_month: number;
    }>>
  ): SessionPayment[] {
    return memberIds.map(memberId => {
      const memberMemberships = membershipPayments[memberId] || [];
      const membershipStatus = this.checkMembershipStatus(memberMemberships, sessionDate);
      
      return this.calculateSessionPayment(
        memberId,
        sessionDate,
        shuttlecocksUsed,
        membershipStatus
      );
    });
  }

  /**
   * Get all Saturday sessions in a month
   */
  static getSaturdaySessionsInMonth(year: number, month: number): Date[] {
    const sessions = [];
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    const current = new Date(firstDay);
    
    // Find first Saturday
    while (current.getDay() !== 6) {
      current.setDate(current.getDate() + 1);
    }
    
    // Collect all Saturdays at 8 PM
    while (current.getMonth() === month - 1) {
      const saturday = new Date(current);
      saturday.setHours(20, 0, 0, 0); // 8 PM
      sessions.push(saturday);
      current.setDate(current.getDate() + 7);
    }
    
    return sessions;
  }

  /**
   * Get next Saturday session
   */
  static getNextSaturdaySession(): Date {
    const today = new Date();
    const daysUntilSaturday = (6 - today.getDay()) % 7;
    const nextSaturday = new Date(today);
    
    if (daysUntilSaturday === 0) {
      // If today is Saturday, check if it's before 8 PM
      if (today.getHours() >= 20) {
        // After 8 PM Saturday, get next Saturday
        nextSaturday.setDate(today.getDate() + 7);
      }
    } else {
      nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    }
    
    nextSaturday.setHours(20, 0, 0, 0); // 8 PM
    return nextSaturday;
  }

  /**
   * Generate payment summary message
   */
  static generatePaymentSummary(
    sessionPayments: SessionPayment[],
    sessionDate: Date
  ): string {
    const totalRevenue = sessionPayments.reduce((sum, payment) => sum + payment.totalFee, 0);
    const membersWithMembership = sessionPayments.filter(p => p.hasMembership).length;
    const membersWithoutMembership = sessionPayments.filter(p => !p.hasMembership).length;
    
    const sessionDateStr = sessionDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `🏸 DLOB Saturday Session - ${sessionDateStr}\n\n` +
      `👥 Participants: ${sessionPayments.length} members\n` +
      `✅ With membership: ${membersWithMembership} members (only shuttlecock fees)\n` +
      `💰 Without membership: ${membersWithoutMembership} members (Rp18,000 + shuttlecock)\n\n` +
      `💸 Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}\n\n` +
      `📋 Individual Payments:\n` +
      sessionPayments.map(payment => 
        `• ${payment.memberId}: Rp ${payment.totalFee.toLocaleString('id-ID')} ` +
        `${payment.hasMembership ? '(membership active)' : '(no membership)'}`
      ).join('\n');
  }

  /**
   * Create membership payment records for all active members
   */
  static createMonthlyMembershipPayments(
    memberIds: string[],
    year: number,
    month: number
  ): MembershipFee[] {
    const baseFee = this.calculateMonthlyFee(year, month);
    
    return memberIds.map(memberId => ({
      ...baseFee,
      memberId
    }));
  }
}