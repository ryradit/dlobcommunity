// Client-side membership service - uses API endpoints instead of direct database access

export interface MembershipStatus {
  hasActiveMembership: boolean;
  membershipType: 'monthly' | null;
  membershipExpiry: string | null;
  currentMonthPaid: boolean;
}

export class MembershipService {
  /**
   * Check if a member has active membership for the current month
   */
  static async checkMembershipStatus(memberId: string): Promise<MembershipStatus> {
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1; // 1-12
      const currentYear = today.getFullYear();

      // Check for active membership payment in current month using API
      const response = await fetch(`/api/payments?member_id=${memberId}&type=monthly`);
      const result = await response.json();
      
      if (!result.success) {
        return {
          hasActiveMembership: false,
          membershipType: null,
          membershipExpiry: null,
          currentMonthPaid: false
        };
      }

      const payments = result.data.payments || result.data || [];
      
      // Find membership payment for current month
      const membershipPayment = payments.find((payment: any) => {
        const paymentDate = new Date(payment.due_date);
        const paymentMonth = paymentDate.getMonth() + 1;
        const paymentYear = paymentDate.getFullYear();
        
        return (
          payment.type === 'monthly' && 
          paymentMonth === currentMonth && 
          paymentYear === currentYear &&
          (payment.status === 'paid' || payment.status === 'pending')
        );
      });

      const hasActiveMembership = !!membershipPayment;
      const monthEnd = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
      
      return {
        hasActiveMembership,
        membershipType: hasActiveMembership ? 'monthly' : null,
        membershipExpiry: hasActiveMembership ? monthEnd : null,
        currentMonthPaid: hasActiveMembership
      };

    } catch (error) {
      console.error('Error in checkMembershipStatus:', error);
      return {
        hasActiveMembership: false,
        membershipType: null,
        membershipExpiry: null,
        currentMonthPaid: false
      };
    }
  }

  /**
   * Calculate session payment amount based on membership status
   */
  static async calculateSessionPayment(memberId: string): Promise<{
    sessionFee: number;
    shuttlecockFee: number;
    totalAmount: number;
    description: string;
    paymentType: 'member' | 'non-member';
  }> {
    const membershipStatus = await this.checkMembershipStatus(memberId);
    
    const shuttlecockFee = 5000; // Standard shuttlecock fee
    
    if (membershipStatus.hasActiveMembership) {
      // Member only pays shuttlecock fee
      return {
        sessionFee: 0,
        shuttlecockFee,
        totalAmount: shuttlecockFee,
        description: 'Saturday Session - Member Rate (Only Shuttlecock Fee)',
        paymentType: 'member'
      };
    } else {
      // Non-member pays full session + shuttlecock
      const sessionFee = 18000;
      return {
        sessionFee,
        shuttlecockFee,
        totalAmount: sessionFee + shuttlecockFee,
        description: 'Saturday Session - Non-Member Rate (Session + Shuttlecock)',
        paymentType: 'non-member'
      };
    }
  }

  /**
   * Create session payment records for a Saturday match (API-based)
   */
  static async createSessionPayments(matchId: string, memberIds: string[]): Promise<void> {
    try {
      console.log(`🏸 Creating session payments for match ${matchId} with ${memberIds.length} members`);

      const paymentRecords = [];
      
      // Get all members info via API
      const membersResponse = await fetch('/api/members');
      const membersResult = await membersResponse.json();
      const allMembers = membersResult.success ? membersResult.data : [];
      
      for (const memberId of memberIds) {
        const paymentCalc = await this.calculateSessionPayment(memberId);
        
        // Get member info
        const member = allMembers.find((m: any) => m.id === memberId);
        const memberName = member?.name || 'Unknown Member';
        
        // Create session payment record via API
        if (paymentCalc.totalAmount > 0) {
          const paymentData = {
            member_id: memberId,
            match_id: matchId,
            type: 'daily', // Use 'daily' as per schema constraints
            amount: paymentCalc.totalAmount,
            notes: `${paymentCalc.description} - ${memberName}`,
            due_date: new Date().toISOString().split('T')[0], // Due immediately
            status: 'pending'
          };

          const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
          });

          if (!response.ok) {
            throw new Error(`Failed to create payment for ${memberName}`);
          }

          paymentRecords.push(paymentData);
        }
        
        console.log(`💰 ${memberName}: ${paymentCalc.paymentType} - Rp${paymentCalc.totalAmount.toLocaleString()}`);
      }

      console.log(`✅ Created ${paymentRecords.length} session payment records via API`);

    } catch (error) {
      console.error('Error in createSessionPayments:', error);
      throw error;
    }
  }

  /**
   * Get next Saturday date
   */
  static getNextSaturday(): Date {
    const today = new Date();
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + (6 - today.getDay()));
    
    // If today is Saturday, get next Saturday
    if (today.getDay() === 6) {
      nextSaturday.setDate(today.getDate() + 7);
    }
    
    return nextSaturday;
  }

  /**
   * Calculate membership fee for current month
   */
  static calculateMembershipFee(): { fee: number; weeks: number; description: string } {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first and last day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Count Saturdays in the current month
    let saturdayCount = 0;
    const tempDate = new Date(firstDay);
    while (tempDate <= lastDay) {
      if (tempDate.getDay() === 6) { // Saturday
        saturdayCount++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    const fee = saturdayCount === 4 ? 40000 : 45000;
    const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    return {
      fee,
      weeks: saturdayCount,
      description: `Monthly Membership - ${monthName} (${saturdayCount} weeks)`
    };
  }

  /**
   * Determine if a payment indicates member status (shuttlecock-only payment)
   */
  static isShuttlecockOnlyPayment(amount: number, notes?: string): boolean {
    // Shuttlecock-only payments are typically Rp5,000 or have member-related notes
    return (
      amount <= 5000 || 
      !!(notes && (
        notes.toLowerCase().includes('shuttlecock') ||
        notes.toLowerCase().includes('member rate') ||
        notes.toLowerCase().includes('membership')
      ))
    );
  }

  /**
   * Determine if a payment can be converted to membership (non-member session payment)
   */
  static canConvertToMembership(payment: any): boolean {
    return (
      payment.status === 'pending' &&
      payment.amount >= 18000 && // Has attendance fee
      !this.isShuttlecockOnlyPayment(payment.amount, payment.notes)
    );
  }

  /**
   * Determine if a member payment can be converted back to daily payment
   */
  static canConvertToDailyPayment(payment: any): boolean {
    return (
      payment.status === 'pending' &&
      this.isShuttlecockOnlyPayment(payment.amount, payment.notes)
    );
  }
}