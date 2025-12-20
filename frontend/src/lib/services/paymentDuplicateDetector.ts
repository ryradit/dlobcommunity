// Payment Duplicate Detection and Prevention System
import { supabase } from '@/lib/supabase';

export class PaymentDuplicateDetector {
  /**
   * Detect and resolve duplicate session/membership payments for a member
   * @param memberId - Member to check
   * @param dueDate - Date to check (optional, defaults to current month)
   * @returns Detection results and actions taken
   */
  static async detectAndResolveDuplicates(memberId: string, dueDate?: string) {
    try {
      console.log('🔍 Starting duplicate payment detection for member:', memberId);
      
      const checkDate = dueDate || new Date().toISOString().split('T')[0];
      const currentMonth = new Date(checkDate).getMonth() + 1;
      const currentYear = new Date(checkDate).getFullYear();
      
      // Get all session and membership payments for this member this month
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', memberId)
        .in('type', ['daily', 'monthly'])
        .gte('due_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('due_date', currentMonth === 12 ? `${currentYear + 1}-01-01` : `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log(`📊 Found ${payments?.length || 0} session/membership payments for member this month`);

      if (!payments || payments.length <= 1) {
        return {
          duplicatesFound: false,
          duplicatesRemoved: 0,
          payments: payments || [],
          message: 'No duplicates detected'
        };
      }

      // Categorize payments
      const sessionPayments = payments.filter(p => 
        p.type === 'daily' && 
        (p.notes?.includes('Session') || p.notes?.includes('Daily Session') || 
         (p.notes?.includes('attendance') && !p.notes?.includes('Shuttlecock')))
      );
      
      const membershipPayments = payments.filter(p => 
        p.type === 'monthly' || p.notes?.includes('Membership')
      );

      console.log(`📋 Categorized payments:`, {
        sessionPayments: sessionPayments.length,
        membershipPayments: membershipPayments.length
      });

      let duplicatesRemoved = 0;
      let actionsLog = [];

      // RULE 1: Multiple session payments on same day = Keep first, delete rest
      if (sessionPayments.length > 1) {
        const sessionsByDate: { [key: string]: any[] } = {};
        sessionPayments.forEach(payment => {
          if (!sessionsByDate[payment.due_date]) {
            sessionsByDate[payment.due_date] = [];
          }
          sessionsByDate[payment.due_date].push(payment);
        });

        for (const [date, paymentsOnDate] of Object.entries(sessionsByDate)) {
          if ((paymentsOnDate as any[]).length > 1) {
            // Keep the first created, delete the rest
            const toKeep = (paymentsOnDate as any[])[0];
            const toDelete = (paymentsOnDate as any[]).slice(1);

            for (const payment of toDelete) {
              const { error: deleteError } = await supabase
                .from('payments')
                .delete()
                .eq('id', payment.id);

              if (!deleteError) {
                duplicatesRemoved++;
                actionsLog.push(`Deleted duplicate session payment: ${payment.id} (${date})`);
                console.log(`❌ Deleted duplicate session payment: ${payment.id}`);
              }
            }
          }
        }
      }

      // RULE 2: Multiple membership payments = Keep latest, delete older ones
      if (membershipPayments.length > 1) {
        const sortedMemberships = membershipPayments.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const toKeep = sortedMemberships[0];
        const toDelete = sortedMemberships.slice(1);

        for (const payment of toDelete) {
          const { error: deleteError } = await supabase
            .from('payments')
            .delete()
            .eq('id', payment.id);

          if (!deleteError) {
            duplicatesRemoved++;
            actionsLog.push(`Deleted duplicate membership payment: ${payment.id}`);
            console.log(`❌ Deleted duplicate membership payment: ${payment.id}`);
          }
        }
      }

      // RULE 3: Both session AND membership payments = Keep membership, delete session
      const remainingSessionPayments = await this.getLatestPayments(memberId, currentMonth, currentYear, 'session');
      const remainingMembershipPayments = await this.getLatestPayments(memberId, currentMonth, currentYear, 'membership');

      if (remainingSessionPayments.length > 0 && remainingMembershipPayments.length > 0) {
        console.log('⚠️ Found both session and membership payments - membership takes priority');
        
        for (const sessionPayment of remainingSessionPayments) {
          const { error: deleteError } = await supabase
            .from('payments')
            .delete()
            .eq('id', sessionPayment.id);

          if (!deleteError) {
            duplicatesRemoved++;
            actionsLog.push(`Deleted session payment (membership takes priority): ${sessionPayment.id}`);
            console.log(`❌ Deleted session payment (membership priority): ${sessionPayment.id}`);
          }
        }
      }

      return {
        duplicatesFound: duplicatesRemoved > 0,
        duplicatesRemoved,
        actionsLog,
        message: duplicatesRemoved > 0 
          ? `Removed ${duplicatesRemoved} duplicate payments` 
          : 'No duplicates found'
      };

    } catch (error) {
      console.error('❌ Error in duplicate detection:', error);
      return {
        duplicatesFound: false,
        duplicatesRemoved: 0,
        error: (error as Error).message,
        message: 'Error during duplicate detection'
      };
    }
  }

  /**
   * Get latest payments for a member in a specific month and type
   */
  private static async getLatestPayments(memberId: string, month: number, year: number, type: 'session' | 'membership') {
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', memberId)
      .gte('due_date', `${year}-${month.toString().padStart(2, '0')}-01`)
      .lt('due_date', month === 12 ? `${year + 1}-01-01` : `${year}-${(month + 1).toString().padStart(2, '0')}-01`)
      .order('created_at', { ascending: false });

    if (!payments) return [];

    if (type === 'session') {
      return payments.filter(p => 
        p.type === 'daily' && 
        (p.notes?.includes('Session') || p.notes?.includes('Daily Session'))
      );
    } else {
      return payments.filter(p => 
        p.type === 'monthly' || p.notes?.includes('Membership')
      );
    }
  }

  /**
   * Check if creating a new payment would cause duplicates
   * @param memberId - Member ID
   * @param paymentType - 'daily' or 'monthly'
   * @param dueDate - Payment due date
   * @returns True if payment would be duplicate
   */
  static async wouldCreateDuplicate(memberId: string, paymentType: 'daily' | 'monthly', dueDate: string) {
    try {
      const currentMonth = new Date(dueDate).getMonth() + 1;
      const currentYear = new Date(dueDate).getFullYear();

      // Check existing payments this month
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', memberId)
        .gte('due_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('due_date', currentMonth === 12 ? `${currentYear + 1}-01-01` : `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (!existingPayments || existingPayments.length === 0) {
        return false; // No existing payments, safe to create
      }

      // Check for session payment duplicates
      if (paymentType === 'daily') {
        const existingSessionPayments = existingPayments.filter(p => 
          p.type === 'daily' && 
          p.due_date === dueDate &&
          (p.notes?.includes('Session') || p.notes?.includes('Daily Session'))
        );
        
        const existingMembershipPayments = existingPayments.filter(p => 
          p.type === 'monthly' || p.notes?.includes('Membership')
        );

        return existingSessionPayments.length > 0 || existingMembershipPayments.length > 0;
      }

      // Check for membership payment duplicates  
      if (paymentType === 'monthly') {
        const existingMembershipPayments = existingPayments.filter(p => 
          p.type === 'monthly' || p.notes?.includes('Membership')
        );

        return existingMembershipPayments.length > 0;
      }

      return false;

    } catch (error) {
      console.error('❌ Error checking for duplicates:', error);
      return false; // Err on the side of allowing creation
    }
  }

  /**
   * Run system-wide duplicate detection and cleanup
   * @param dryRun - If true, only reports duplicates without deleting
   * @returns Summary of duplicates found and actions taken
   */
  static async systemWideCleanup(dryRun: boolean = false) {
    try {
      console.log('🧹 Starting system-wide duplicate cleanup...');
      
      // Get all members with payments
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, name, email');

      if (membersError) throw membersError;

      let totalDuplicatesFound = 0;
      let totalDuplicatesRemoved = 0;
      let memberResults = [];

      for (const member of members || []) {
        console.log(`🔍 Checking member: ${member.name} (${member.id})`);
        
        if (dryRun) {
          // Just detect, don't remove
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          
          const { data: payments } = await supabase
            .from('payments')
            .select('*')
            .eq('member_id', member.id)
            .in('type', ['daily', 'monthly'])
            .gte('due_date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
            .lt('due_date', currentMonth === 12 ? `${currentYear + 1}-01-01` : `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

          if (payments && payments.length > 1) {
            totalDuplicatesFound++;
            memberResults.push({
              member: member.name,
              duplicateCount: payments.length - 1,
              action: 'detected_only'
            });
          }
        } else {
          // Actually remove duplicates
          const result = await this.detectAndResolveDuplicates(member.id);
          
          if (result.duplicatesFound) {
            totalDuplicatesFound++;
            totalDuplicatesRemoved += result.duplicatesRemoved;
            memberResults.push({
              member: member.name,
              duplicateCount: result.duplicatesRemoved,
              action: 'removed',
              details: result.actionsLog
            });
          }
        }
      }

      return {
        success: true,
        totalMembers: members?.length || 0,
        totalDuplicatesFound,
        totalDuplicatesRemoved,
        memberResults,
        dryRun,
        message: dryRun 
          ? `Found ${totalDuplicatesFound} members with duplicates (dry run)`
          : `Removed ${totalDuplicatesRemoved} duplicates from ${totalDuplicatesFound} members`
      };

    } catch (error) {
      console.error('❌ System-wide cleanup error:', error);
      return {
        success: false,
        error: (error as Error).message,
        message: 'Error during system-wide cleanup'
      };
    }
  }
}

export default PaymentDuplicateDetector;