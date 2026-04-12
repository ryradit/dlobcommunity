'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { CreditCard, TrendingUp, AlertCircle, Users, Award, Plus, X, Search, Check, Ban, Eye, Trash2, ChevronDown, ChevronUp, Edit, Save, Image as ImageIcon, CheckSquare, Square, Sparkles, Send, Zap, HelpCircle, ChevronLeft, ChevronRight, MoreVertical, Calendar } from 'lucide-react';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/LoadingSkeletons';
import { getSaturdaysInMonth } from '@/lib/weeksCalculation';
import TutorialOverlay from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import { formatReportDate } from '@/lib/reportGenerator';

interface Match {
  id: string;
  match_number: number;
  shuttlecock_count: number;
  cost_per_shuttlecock: number;
  total_cost: number;
  cost_per_member: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  created_by: string;
  match_date?: string;
}

interface MatchMember {
  id: string;
  match_id: string;
  member_name: string;
  amount_due: number;
  attendance_fee: number;
  has_membership: boolean;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled' | 'revision' | 'rejected';
  paid_at: string | null;
  payment_proof: string | null;
  additional_amount?: number;
}

interface Membership {
  id: string;
  member_name: string;
  month: number;
  year: number;
  weeks_in_month: number;
  amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled' | 'rejected';
  paid_at: string | null;
  payment_proof: string | null;
  created_at: string;
}

export default function AdminPembayaranPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filterMode, setFilterMode] = useState<'all' | 'weekly' | 'daily'>('all'); // 'all', 'weekly', 'daily'
  const [selectedFilterDate, setSelectedFilterDate] = useState<Date | null>(null); // for weekly or daily filter
  const [showFilterSection, setShowFilterSection] = useState(false); // collapse/expand filters
  const [selectedWeek, setSelectedWeek] = useState<Date | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchMembers, setMatchMembers] = useState<Record<string, MatchMember[]>>({});
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [membershipMap, setMembershipMap] = useState<Record<string, Membership>>({});
  const [allMembers, setAllMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [newMemberInputs, setNewMemberInputs] = useState<Record<string, string>>({});
  const [creatingMember, setCreatingMember] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNextMonthConfirm, setShowNextMonthConfirm] = useState(false);
  const [pendingCreateAction, setPendingCreateAction] = useState<'match' | 'membership' | null>(null);
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});
  const [editingMatch, setEditingMatch] = useState<{
    matchId: string;
    match_date: string;
    shuttlecock_count: number;
    members: Record<string, { name: string; memberId: string }>;
  } | null>(null);
  const [waiveAttendanceFee, setWaiveAttendanceFee] = useState<Set<string>>(new Set());
  const [overrideMembership, setOverrideMembership] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'memberships'>('matches');
  const [newMatch, setNewMatch] = useState({
    shuttlecock_count: 1,
    member1: '',
    member2: '',
    member3: '',
    member4: '',
    match_date: '',
  });
  const [matchDateMembershipMap, setMatchDateMembershipMap] = useState<Record<string, Membership>>({});
  const [paymentExemptMembers, setPaymentExemptMembers] = useState<Set<string>>(new Set());
  const [createMatchMembershipPayers, setCreateMatchMembershipPayers] = useState<Set<string>>(new Set());
  const [waNotificationResult, setWaNotificationResult] = useState<{
    wa: { results: { name: string; phone: string; status: string; error?: string }[]; summary: { sent: number; failed: number; skipped: number } } | null;
    email: { results: { name: string; email: string; status: string; error?: string }[]; summary: { sent: number; failed: number; skipped: number } } | null;
  } | null>(null);
  const [newMembership, setNewMembership] = useState({
    member_name: '',
    weeks_in_month: 4,
  });
  const [weeksAutoDetected, setWeeksAutoDetected] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{
    type: 'match' | 'membership';
    id: string;
    matchId?: string;
    memberName: string;
    amount: number;
    proofUrl: string | null;
  } | null>(null);
  
  // Bulk confirmation states
  const [selectedPayments, setSelectedPayments] = useState<Array<{ id: string; type: 'match' | 'membership'; memberName: string; amount: number; matchId?: string; proofUrl?: string | null }>>([]);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [confirmIrreversible, setConfirmIrreversible] = useState(false);
  const [isConfirmingRevisions, setIsConfirmingRevisions] = useState(false);
  
  // Bulk revision states
  const [showBulkRevisionModal, setShowBulkRevisionModal] = useState(false);
  const [bulkRevising, setBulkRevising] = useState(false);
  const [bulkRevisionAmount, setBulkRevisionAmount] = useState('');
  const [bulkRevisionReason, setBulkRevisionReason] = useState('');

  // Rejection states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [paymentToReject, setPaymentToReject] = useState<{
    type: 'match' | 'membership';
    id: string;
    matchId?: string;
    memberName: string;
  } | null>(null);

  // Smart Actions & Suggestion Cards states (NEW MVP)
  const [smartActions, setSmartActions] = useState<Array<{
    id: string;
    type: 'auto-confirm' | 'confirm-all' | 'send-reminders' | 'flag-suspicious' | 'generate-payment-report';
    title: string;
    description: string;
    count?: number;
    payments?: Array<{ id: string; type: 'match' | 'membership'; memberName: string; amount: number; matchId?: string; proofUrl?: string | null }>;
    priority: 'high' | 'medium' | 'low';
    icon: string;
  }>>([]);
  
  const [suggestionCards, setSuggestionCards] = useState<Array<{
    id: string;
    type: 'attention' | 'success' | 'info' | 'warning';
    title: string;
    description: string;
    action?: {
      label: string;
      actionType: string;
      data?: any;
    };
    dismissible: boolean;
    priority: number;
  }>>([]);
  
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Attendance info modal
  const [showAttendanceInfoModal, setShowAttendanceInfoModal] = useState(false);

  // Custom period report modal
  const [showCustomPeriodModal, setShowCustomPeriodModal] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  
  // Create initial dates as ISO strings to avoid Date serialization issues
  const getDefaultStartDate = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDayOfMonth.toISOString().split('T')[0];
  };
  
  const getDefaultEndDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const [customPeriodData, setCustomPeriodData] = useState({
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate()
  });

  // Tutorial for pembayaran page
  const tutorialSteps = getTutorialSteps('pembayaran');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('admin-pembayaran', tutorialSteps);
  
  // Report generation
  const { generateFinancialReport, generateShuttlecockReport, isGenerating: isGeneratingReport } = useReportGenerator();

  // Helper function to calculate week date range
  const getWeekDateRange = (weeksBack: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeksBack * 7 - 1)); // -1 because we include today
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  // Get total revenue for a specific date (April 11, 2026)
  const getTotalRevenueForDate = async (dateStr: string = '2026-04-11') => {
    try {
      console.log(`📊 Fetching revenue for ${dateStr}...`);
      
      const targetDate = new Date(dateStr);
      const normalizedTargetDate = new Date(targetDate);
      normalizedTargetDate.setHours(0, 0, 0, 0);
      
      const normalizedEndDate = new Date(targetDate);
      normalizedEndDate.setHours(23, 59, 59, 999);
      
      let totalRevenue = 0;
      let totalPaidItems = 0;
      let totalPendingItems = 0;
      let paymentDetails: Array<{
        memberName: string;
        type: string;
        amount: number;
        status: string;
        dueDate: string;
      }> = [];

      // Fetch ALL matches on this date
      const { data: matchesOnDate, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;

      if (matchesOnDate && matchesOnDate.length > 0) {
        // Check each match for the target date
        const matchIds = matchesOnDate
          .map(match => {
            const matchDate = match.match_date ? new Date(match.match_date) : new Date(match.created_at);
            const normalizedMatchDate = new Date(matchDate);
            normalizedMatchDate.setHours(0, 0, 0, 0);
            
            if (normalizedMatchDate >= normalizedTargetDate && normalizedMatchDate <= normalizedEndDate) {
              return match.id;
            }
            return null;
          })
          .filter(id => id !== null);

        // Fetch match members for matching matches
        if (matchIds.length > 0) {
          const { data: allMatchMembers, error: membersError } = await supabase
            .from('match_members')
            .select('*')
            .in('match_id', matchIds);

          if (membersError) throw membersError;

          if (allMatchMembers) {
            allMatchMembers.forEach(member => {
              if (member.payment_status === 'paid') {
                totalRevenue += member.total_amount;
                totalPaidItems += 1;
              } else if (member.payment_status === 'pending') {
                totalPendingItems += 1;
              }

              paymentDetails.push({
                memberName: member.member_name,
                type: `Match Payment`,
                amount: member.total_amount,
                status: member.payment_status,
                dueDate: dateStr,
              });
            });
          }
        }
      }

      // Fetch memberships on this date
      const { data: membershipsOnDate, error: membershipsError } = await supabase
        .from('memberships')
        .select('*')
        .order('created_at', { ascending: false });

      if (membershipsError) throw membershipsError;

      if (membershipsOnDate) {
        membershipsOnDate.forEach(membership => {
          const membershipDate = new Date(membership.created_at);
          const normalizedMembershipDate = new Date(membershipDate);
          normalizedMembershipDate.setHours(0, 0, 0, 0);

          if (normalizedMembershipDate >= normalizedTargetDate && normalizedMembershipDate <= normalizedEndDate) {
            if (membership.payment_status === 'paid') {
              totalRevenue += membership.amount;
              totalPaidItems += 1;
            } else if (membership.payment_status === 'pending') {
              totalPendingItems += 1;
            }

            paymentDetails.push({
              memberName: membership.member_name,
              type: 'Monthly Membership',
              amount: membership.amount,
              status: membership.payment_status,
              dueDate: dateStr,
            });
          }
        });
      }

      const summary = {
        date: dateStr,
        totalRevenue,
        totalPaidItems,
        totalPendingItems,
        totalItems: totalPaidItems + totalPendingItems,
        paymentDetails,
      };

      console.log(`✅ Revenue for ${dateStr}:`, summary);
      return summary;
    } catch (error) {
      console.error(`❌ Error fetching revenue for ${dateStr}:`, error);
      alert(`Gagal mengambil data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  // Generate report for specific number of weeks
  const handleGenerateWeeklyReport = async (weeks: number) => {
    const dateRange = getWeekDateRange(weeks);
    const startDateStr = dateRange.start;
    const endDateStr = dateRange.end;
    
    // Convert to Date objects
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // Format period strings
    const periodStart = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const periodEnd = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const allPayments: Array<{
      memberName: string;
      type: string;
      amount: number;
      status: 'paid' | 'pending' | 'overdue';
      dueDate: string;
      paidDate?: string;
    }> = [];

    try {
      // Fetch ALL matches (not just current month) with their members
      console.log(`📊 Fetching all matches for ${weeks} week(s):`, startDateStr, 'to', endDateStr);
      const { data: allMatches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('match_number', { ascending: false });

      if (matchesError) throw matchesError;

      if (allMatches && allMatches.length > 0) {
        // Fetch match members for each match
        const matchMembersMap: Record<string, MatchMember[]> = {};
        const memberQueries = allMatches.map(match =>
          supabase
            .from('match_members')
            .select('*')
            .eq('match_id', match.id)
        );
        
        const membersResults = await Promise.allSettled(memberQueries);
        membersResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const res = result.value as { data: MatchMember[] | null; error: any };
            if (!res.error && res.data) {
              matchMembersMap[allMatches[index].id] = res.data;
            }
          }
        });

        // Filter matches within period and their payments
        allMatches.forEach((match, matchIndex) => {
          const matchDate = match.match_date ? new Date(match.match_date) : new Date(match.created_at);
          
          // Set time boundaries for comparison
          const normalizedMatchDate = new Date(matchDate);
          normalizedMatchDate.setHours(0, 0, 0, 0);
          
          const normalizedStartDate = new Date(startDate);
          normalizedStartDate.setHours(0, 0, 0, 0);
          
          const normalizedEndDate = new Date(endDate);
          normalizedEndDate.setHours(23, 59, 59, 999);
          
          if (normalizedMatchDate >= normalizedStartDate && normalizedMatchDate <= normalizedEndDate) {
            const membersList = matchMembersMap[match.id] || [];
            membersList.forEach(member => {
              allPayments.push({
                memberName: member.member_name,
                type: `Match #${matchIndex + 1}`,
                amount: member.total_amount,
                status: member.payment_status === 'paid' ? 'paid' : 
                        member.payment_status === 'pending' ? 'pending' : 
                        'overdue',
                dueDate: match.match_date || match.created_at,
                paidDate: member.paid_at || undefined,
              });
            });
          }
        });
      }

      // Fetch ALL memberships with period filter
      console.log(`📊 Fetching all memberships for ${weeks} week(s):`, startDateStr, 'to', endDateStr);
      const { data: allMemberships, error: membershipsError } = await supabase
        .from('memberships')
        .select('*')
        .order('created_at', { ascending: false });

      if (membershipsError) throw membershipsError;

      if (allMemberships) {
        allMemberships.forEach(membership => {
          const membershipDate = new Date(membership.created_at);
          
          // Set time boundaries
          const normalizedMembershipDate = new Date(membershipDate);
          normalizedMembershipDate.setHours(0, 0, 0, 0);
          
          const normalizedStartDate = new Date(startDate);
          normalizedStartDate.setHours(0, 0, 0, 0);
          
          const normalizedEndDate = new Date(endDate);
          normalizedEndDate.setHours(23, 59, 59, 999);
          
          if (normalizedMembershipDate >= normalizedStartDate && normalizedMembershipDate <= normalizedEndDate) {
            allPayments.push({
              memberName: membership.member_name,
              type: 'Monthly Membership',
              amount: membership.amount,
              status: membership.payment_status === 'paid' ? 'paid' : 
                      membership.payment_status === 'pending' ? 'pending' : 
                      'overdue',
              dueDate: membership.created_at,
              paidDate: membership.paid_at || undefined,
            });
          }
        });
      }

      if (allPayments.length === 0) {
        alert(`Tidak ada data pembayaran untuk ${weeks} minggu terakhir`);
        return;
      }

      // Calculate summary for period
      const totalRevenuePeriod = allPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      const totalPending = allPayments.filter(p => p.status === 'pending').length;
      const totalPaid = allPayments.filter(p => p.status === 'paid').length;
      const collectionRatePeriod = totalPaid > 0 ? ((totalPaid / (totalPaid + totalPending)) * 100).toFixed(1) : '0';

      console.log(`✅ ${weeks} Week Report Summary:`, {
        period: `${periodStart} - ${periodEnd}`,
        totalRevenue: totalRevenuePeriod,
        totalPaidItems: totalPaid,
        totalPendingItems: totalPending,
        totalItems: allPayments.length
      });

      // Prepare report data
      const reportData = {
        period: {
          start: periodStart,
          end: periodEnd,
        },
        summary: {
          totalRevenue: totalRevenuePeriod,
          totalPending: totalPending,
          totalPaid: totalPaid,
          totalMembers: new Set(allPayments.map(p => p.memberName)).size,
          paymentRate: parseFloat(collectionRatePeriod as string),
        },
        payments: allPayments.sort((a, b) => {
          // Sort: paid first, then by date
          if (a.status !== b.status) {
            return a.status === 'paid' ? -1 : 1;
          }
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }),
      };

      // Generate report
      const result = await generateFinancialReport(reportData, {
        share: false,
      });

      if (result.success) {
        console.log(`✅ ${weeks} week report generated:`, result.filename);
      } else {
        alert(`Gagal membuat laporan: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error generating ${weeks} week report:`, error);
      alert(`Gagal membuat laporan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Membership rollback states
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [rollbackMembership, setRollbackMembership] = useState<Membership | null>(null);
  const [rollbackPreview, setRollbackPreview] = useState<{
    member_name: string;
    month: number;
    year: number;
    total_pending_matches: number;
    matches_will_get_attendance_fee: number;
    total_attendance_fees_to_add: number;
  } | null>(null);
  const [isLoadingRollback, setIsLoadingRollback] = useState(false);

  // Utility function to calculate weeks in current month
  const calculateWeeksInMonth = (date: Date = new Date()): number => {
    return getSaturdaysInMonth(date);
  };

  // Auto-detect weeks when membership modal opens
  useEffect(() => {
    if (showMembershipModal) {
      const detectedWeeks = calculateWeeksInMonth();
      setNewMembership(prev => ({
        ...prev,
        weeks_in_month: detectedWeeks,
      }));
      setWeeksAutoDetected(true);
    } else {
      setWeeksAutoDetected(false);
    }
  }, [showMembershipModal]);

  // Fetch memberships for match date's month when creating a match
  // Re-runs when date changes OR when the modal is opened/closed
  useEffect(() => {
    async function fetchMatchDateMemberships() {
      if (!newMatch.match_date) {
        setMatchDateMembershipMap({});
        setPaymentExemptMembers(new Set());
        setCreateMatchMembershipPayers(new Set());
        return;
      }

      const matchDate = new Date(newMatch.match_date);
      const matchMonth = matchDate.getMonth() + 1;
      const matchYear = matchDate.getFullYear();

      try {
        // Fetch PAID memberships only
        const { data: memberships, error } = await supabase
          .from('memberships')
          .select('*')
          .eq('month', matchMonth)
          .eq('year', matchYear)
          .eq('payment_status', 'paid'); // Only PAID memberships

        if (error) {
          console.error('Error fetching match date memberships:', error);
          setMatchDateMembershipMap({});
        } else {
          const map: Record<string, Membership> = {};
          if (memberships) {
            memberships.forEach((m) => {
              map[m.member_name.toLowerCase().trim()] = m;
            });
          }
          setMatchDateMembershipMap(map);
        }

        // Fetch payment exempt members (VIP status)
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('is_payment_exempt', true);

        if (profileError) {
          console.error('Error fetching payment exempt members:', profileError);
          setPaymentExemptMembers(new Set());
        } else {
          const exemptSet = new Set<string>();
          if (profiles) {
            profiles.forEach(p => exemptSet.add(p.full_name.toLowerCase()));
          }
          setPaymentExemptMembers(exemptSet);
        }
      } catch (error) {
        console.error('Error fetching match date memberships:', error);
        setMatchDateMembershipMap({});
        setPaymentExemptMembers(new Set());
      }
    }

    fetchMatchDateMemberships();
  }, [newMatch.match_date, showCreateModal]);

  // Load data function - defined outside useEffect so it can be called from other functions
  const loadData = useCallback(async () => {
    setLoading(true);
    
    // Use selected month instead of current month
    const targetMonth = selectedMonth.getMonth() + 1;
    const targetYear = selectedMonth.getFullYear();
    
    const [matchesResult, membershipsResult, profilesResult] = await Promise.allSettled([
      // Fetch matches for selected month
      cachedQuery(
        `admin-payment-matches-${targetMonth}-${targetYear}`,
        async () => {
          const monthStart = new Date(targetYear, targetMonth - 1, 1);
          const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);
          
          const result = await supabase
            .from('matches')
            .select('*')
            .gte('match_date', monthStart.toISOString())
            .lte('match_date', monthEnd.toISOString())
            .order('match_date', { ascending: true });
          return result;
        },
        30000 // 30 seconds cache
      ),
      // Fetch memberships for selected month
      cachedQuery(
        `admin-memberships-${targetMonth}-${targetYear}`,
        async () => {
          const result = await supabase
            .from('memberships')
            .select('*')
            .eq('month', targetMonth)
            .eq('year', targetYear)
            .neq('payment_status', 'cancelled')
            .order('created_at', { ascending: false });
          return result;
        },
        30000
      ),
      // Fetch all profiles for member list
      cachedQuery(
        'admin-all-profiles',
        async () => {
          const result = await supabase
            .from('profiles')
            .select('id, full_name')
            .order('full_name', { ascending: true });
          return result;
        },
        60000 // 1 minute cache
      ),
    ]);
    
    // Process matches
    if (matchesResult.status === 'fulfilled') {
      const matchesRes = matchesResult.value as { data: Match[] | null; error: any };
      if (!matchesRes.error && matchesRes.data) {
        setMatches(matchesRes.data);
        
        // Fetch match members in parallel for all matches
        const memberQueries = matchesRes.data.map(match =>
          supabase
            .from('match_members')
            .select('*')
            .eq('match_id', match.id)
        );
        
        const membersResults = await Promise.allSettled(memberQueries);
        const membersMap: Record<string, MatchMember[]> = {};
        
        membersResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const res = result.value as { data: MatchMember[] | null; error: any };
            if (!res.error && res.data) {
              membersMap[matchesRes.data![index].id] = res.data;
            }
          }
        });
        
        setMatchMembers(membersMap);
      }
    }
    
    // Process memberships
    if (membershipsResult.status === 'fulfilled') {
      const membershipsRes = membershipsResult.value as { data: Membership[] | null; error: any };
      if (!membershipsRes.error && membershipsRes.data) {
        setMemberships(membershipsRes.data);
        
        const map: Record<string, Membership> = {};
        membershipsRes.data.forEach((m) => {
          map[m.member_name.toLowerCase()] = m;
        });
        setMembershipMap(map);
      }
    }
    
    // Process profiles for member list
    if (profilesResult.status === 'fulfilled') {
      const profilesRes = profilesResult.value as { data: Array<{ id: string; full_name: string }> | null; error: any };
      if (!profilesRes.error && profilesRes.data) {
        setAllMembers(
          profilesRes.data.map((p) => ({
            id: p.id,
            name: p.full_name || 'Unnamed',
          }))
        );
      }
    }
    
    // Recalculate attendance fees after data is loaded
    await recalculateAttendanceFees();
    
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => {
    loadData();
  }, [pathname, selectedMonth]);

  async function fetchMatches() {
    try {
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_number', { ascending: false });

      if (error) throw error;

      setMatches(matchesData || []);

      // Fetch match members for each match
      const membersMap: Record<string, MatchMember[]> = {};
      for (const match of matchesData || []) {
        const { data: members, error: membersError } = await supabase
          .from('match_members')
          .select('*')
          .eq('match_id', match.id);

        if (!membersError && members) {
          membersMap[match.id] = members;
        }
      }
      setMatchMembers(membersMap);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMemberships() {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const { data: membershipsData, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .neq('payment_status', 'cancelled')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMemberships(membershipsData || []);

      const map: Record<string, Membership> = {};
      membershipsData?.forEach((m) => {
        map[m.member_name.toLowerCase()] = m;
      });
      setMembershipMap(map);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    }
  }

  async function recalculateAttendanceFees() {
    try {
      console.log('🔄 Recalculating attendance fees - DISABLED');
      console.log('   Reason: This function was incorrectly updating match_members');
      console.log('   across different months. Membership should be checked at match');
      console.log('   creation time only, not recalculated later.');
      
      // IMPORTANT: This function is now disabled because it was causing incorrect
      // membership detection across months. For example, it would mark March matches
      // as having membership if the member has February membership, which is wrong.
      // 
      // Membership status should ONLY be set when the match is created, based on
      // the membership for that specific match's month.
      //
      // If we need to recalculate in the future, we must:
      // 1. Fetch each match with its match_date
      // 2. Extract the month/year from match_date
      // 3. Query memberships for that specific month
      // 4. Only update match_members for that specific match_id
      
      return; // Exit early - do not recalculate
    } catch (error) {
      console.error('Error in recalculateAttendanceFees:', error);
    }
  }

  async function fetchAllMembers() {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });

      if (error) throw error;

      const members = profilesData
        ?.map(p => ({
          id: p.id,
          name: p.full_name || p.email?.split('@')[0] || ''
        }))
        .filter(m => m.name !== '') || [];

      setAllMembers(members);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }

  async function createTempMemberInline(memberKey: string) {
    const name = newMemberInputs[memberKey]?.trim();
    if (!name) return;
    setCreatingMember(prev => ({ ...prev, [memberKey]: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/create-temp-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ full_name: name }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      if (!data.existed) {
        setAllMembers(prev => [...prev, { id: data.id, name: data.full_name }].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setNewMatch(prev => ({ ...prev, [memberKey]: data.full_name }));
      setNewMemberInputs(prev => ({ ...prev, [memberKey]: '' }));
    } finally {
      setCreatingMember(prev => ({ ...prev, [memberKey]: false }));
    }
  }

  function hasMembership(memberName: string): boolean {
    return membershipMap[memberName.toLowerCase()]?.payment_status === 'paid';
  }

  // Fetch Smart Suggestions (MVP Feature) - Month-aware
  async function fetchSmartSuggestions() {
    if (loadingSuggestions) return;
    
    setLoadingSuggestions(true);
    try {
      // Use selected month instead of current month
      const targetMonth = selectedMonth.getMonth() + 1;
      const targetYear = selectedMonth.getFullYear();
      
      const response = await fetch('/api/ai/payment-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: targetMonth,
          year: targetYear
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSmartActions(data.smartActions || []);
        setSuggestionCards(data.suggestionCards || []);
        console.log('✅ Smart suggestions loaded:', data.smartActions?.length || 0, 'actions,', data.suggestionCards?.length || 0, 'cards');
      }
    } catch (error) {
      console.error('Error fetching smart suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menuButton = document.querySelector('[data-report-menu-button]');
      const menuDropdown = document.querySelector('[data-report-menu-dropdown]');
      
      if (menuButton && menuDropdown && 
          !menuButton.contains(event.target as Node) && 
          !menuDropdown.contains(event.target as Node)) {
        setShowReportMenu(false);
      }
    };

    if (showReportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showReportMenu]);

  // Load smart suggestions when data changes or month changes
  useEffect(() => {
    if (!loading) {
      // Always fetch suggestions even when no matches/memberships
      // This ensures we clear stale data when switching to empty months
      fetchSmartSuggestions();
    }
  }, [loading, matches.length, memberships.length, selectedMonth]);

  // Handle smart action execution
  async function executeSmartAction(action: typeof smartActions[0]) {
    if (action.type === 'auto-confirm' && action.payments) {
      setSelectedPayments(action.payments);
      setIsConfirmingRevisions(false);
      setShowBulkConfirmModal(true);
    } else if (action.type === 'confirm-all' && action.payments) {
      // Confirm ALL pending payments (including without proof - will require checklist)
      setSelectedPayments(action.payments);
      setIsConfirmingRevisions(false);
      setShowBulkConfirmModal(true);
    } else if (action.type === 'send-reminders') {
      alert('Reminder feature coming soon!');
    } else if (action.type === 'flag-suspicious') {
      alert('Flagging feature coming soon!');
    } else if (action.type === 'generate-payment-report') {
      // Generate payment report
      await handleGenerateFinancialReport(false);
    }
  }

  // Handle suggestion card action
  async function executeSuggestionAction(card: typeof suggestionCards[0]) {
    if (!card.action) return;
    
    if (card.action.actionType === 'auto-confirm' && card.action.data?.payments) {
      setSelectedPayments(card.action.data.payments);
      setIsConfirmingRevisions(false);
      setShowBulkConfirmModal(true);
      dismissSuggestion(card.id);
    } else if (card.action.actionType === 'send-reminders') {
      alert('Reminder feature coming soon!');
    } else if (card.action.actionType === 'flag-suspicious') {
      alert('Flagging feature coming soon!');
    } else if (card.action.actionType === 'generate-report') {
      // Generate financial report
      await handleGenerateFinancialReport(false);
      dismissSuggestion(card.id);
    }
  }

  // Dismiss suggestion card
  function dismissSuggestion(id: string) {
    setDismissedSuggestions(prev => [...prev, id]);
  }
  
  // Generate Financial Report
  async function handleGenerateFinancialReport(share: boolean = false) {
    if (matches.length === 0 && memberships.length === 0) {
      alert('Tidak ada data pembayaran untuk membuat laporan');
      return;
    }

    // Get current month/year
    const now = new Date();
    const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const periodStart = `1 ${now.toLocaleDateString('id-ID', { month: 'long' })} ${now.getFullYear()}`;
    const periodEnd = `${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()} ${now.toLocaleDateString('id-ID', { month: 'long' })} ${now.getFullYear()}`;

    // Prepare payment data
    const allPayments: Array<{
      memberName: string;
      type: string;
      amount: number;
      status: 'paid' | 'pending' | 'overdue';
      dueDate: string;
      paidDate?: string;
    }> = [];

    // Add match payments
    matches.forEach((match, matchIndex) => {
      const monthlyMatchNumber = matchIndex + 1; // Calculate monthly match number
      const members = matchMembers[match.id] || [];
      members.forEach(member => {
        allPayments.push({
          memberName: member.member_name,
          type: `Match #${monthlyMatchNumber}`,
          amount: member.total_amount,
          status: member.payment_status === 'paid' ? 'paid' : 
                  member.payment_status === 'pending' ? 'pending' : 
                  'overdue',
          dueDate: match.match_date || match.created_at,
          paidDate: member.paid_at || undefined,
        });
      });
    });

    // Add membership payments
    memberships.forEach(membership => {
      allPayments.push({
        memberName: membership.member_name,
        type: 'Monthly Membership',
        amount: membership.amount,
        status: membership.payment_status === 'paid' ? 'paid' : 
                membership.payment_status === 'pending' ? 'pending' : 
                'overdue',
        dueDate: membership.created_at,
        paidDate: membership.paid_at || undefined,
      });
    });

    // Prepare report data
    const reportData = {
      period: {
        start: periodStart,
        end: periodEnd,
      },
      summary: {
        totalRevenue: monthlyRecap.totalRevenue,
        totalPending: allPayments.filter(p => p.status === 'pending').length,
        totalPaid: allPayments.filter(p => p.status === 'paid').length,
        totalMembers: new Set(allPayments.map(p => p.memberName)).size,
        paymentRate: collectionRate,
      },
      payments: allPayments.sort((a, b) => {
        // Sort: paid first, then by date
        if (a.status !== b.status) {
          return a.status === 'paid' ? -1 : 1;
        }
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }),
    };

    // Generate report
    const result = await generateFinancialReport(reportData, {
      share,
    });

    if (result.success) {
      console.log('✅ Financial report generated:', result.filename);
    } else {
      alert(`Gagal membuat laporan: ${result.error}`);
    }
  }

  // Generate Weekly Financial Report
  async function handleGenerateWeeklyFinancialReport(weekDate: Date, share: boolean = false) {
    if (matches.length === 0 && memberships.length === 0) {
      alert('Tidak ada data pembayaran untuk membuat laporan minggu ini');
      return;
    }

    // Get Saturday of the week (match day)
    const saturday = new Date(weekDate);
    saturday.setDate(saturday.getDate() - saturday.getDay() + 6); // Get Saturday
    
    const weekStartDate = new Date(saturday);
    weekStartDate.setDate(weekStartDate.getDate() - 6); // Sunday before
    const weekEndDate = new Date(saturday);
    weekEndDate.setDate(weekEndDate.getDate() + 1); // End of Saturday

    const periodStart = `${weekStartDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}`;
    const periodEnd = `${weekEndDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    const weekType = `Minggu (${saturday.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})`;

    // Filter payments for this week (matches and memberships created/due in this week)
    const allPayments: Array<{
      memberName: string;
      type: string;
      amount: number;
      status: 'paid' | 'pending' | 'overdue';
      dueDate: string;
      paidDate?: string;
    }> = [];

    // Add week-specific match payments
    matches.forEach((match, matchIndex) => {
      const matchDate = match.match_date ? new Date(match.match_date) : new Date(match.created_at);
      // Include matches from this week
      if (matchDate >= weekStartDate && matchDate <= weekEndDate) {
        const monthlyMatchNumber = matchIndex + 1;
        const members = matchMembers[match.id] || [];
        members.forEach(member => {
          allPayments.push({
            memberName: member.member_name,
            type: `Match #${monthlyMatchNumber}`,
            amount: member.total_amount,
            status: member.payment_status === 'paid' ? 'paid' : 
                    member.payment_status === 'pending' ? 'pending' : 
                    'overdue',
            dueDate: match.match_date || match.created_at,
            paidDate: member.paid_at || undefined,
          });
        });
      }
    });

    // Add week-specific membership payments (if any)
    memberships.forEach(membership => {
      const membershipDate = new Date(membership.created_at);
      if (membershipDate >= weekStartDate && membershipDate <= weekEndDate) {
        allPayments.push({
          memberName: membership.member_name,
          type: 'Monthly Membership',
          amount: membership.amount,
          status: membership.payment_status === 'paid' ? 'paid' : 
                  membership.payment_status === 'pending' ? 'pending' : 
                  'overdue',
          dueDate: membership.created_at,
          paidDate: membership.paid_at || undefined,
        });
      }
    });

    // Calculate weekly summary
    const weeklyRevenue = allPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const weeklyCollectionRate = allPayments.length > 0 
      ? Math.round((allPayments.filter(p => p.status === 'paid').length / allPayments.length) * 100)
      : 0;

    // Prepare report data
    const reportData = {
      period: {
        start: periodStart,
        end: periodEnd,
      },
      summary: {
        totalRevenue: weeklyRevenue,
        totalPending: allPayments.filter(p => p.status === 'pending').length,
        totalPaid: allPayments.filter(p => p.status === 'paid').length,
        totalMembers: new Set(allPayments.map(p => p.memberName)).size,
        paymentRate: weeklyCollectionRate,
      },
      payments: allPayments.sort((a, b) => {
        // Sort: paid first, then by date
        if (a.status !== b.status) {
          return a.status === 'paid' ? -1 : 1;
        }
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }),
    };

    // Generate report
    const result = await generateFinancialReport(reportData, {
      share,
    });

    if (result.success) {
      console.log('✅ Weekly financial report generated:', result.filename);
    } else {
      alert(`Gagal membuat laporan mingguan: ${result.error}`);
    }
  }

  // Generate Custom Period Financial Report
  async function handleGenerateCustomPeriodReport(share: boolean = false) {
    const startDateStr = customPeriodData.startDate;
    const endDateStr = customPeriodData.endDate;
    
    // Convert to Date objects
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // Format period strings
    const periodStart = startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const periodEnd = endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const allPayments: Array<{
      memberName: string;
      type: string;
      amount: number;
      status: 'paid' | 'pending' | 'overdue';
      dueDate: string;
      paidDate?: string;
    }> = [];

    try {
      // Fetch ALL matches (not just current month) with their members
      console.log('📊 Fetching all matches for period:', startDateStr, 'to', endDateStr);
      const { data: allMatches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('match_number', { ascending: false });

      if (matchesError) throw matchesError;

      if (allMatches && allMatches.length > 0) {
        // Fetch match members for each match
        const matchMembersMap: Record<string, MatchMember[]> = {};
        const memberQueries = allMatches.map(match =>
          supabase
            .from('match_members')
            .select('*')
            .eq('match_id', match.id)
        );
        
        const membersResults = await Promise.allSettled(memberQueries);
        membersResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const res = result.value as { data: MatchMember[] | null; error: any };
            if (!res.error && res.data) {
              matchMembersMap[allMatches[index].id] = res.data;
            }
          }
        });

        // Filter matches within period and their payments
        allMatches.forEach((match, matchIndex) => {
          const matchDate = match.match_date ? new Date(match.match_date) : new Date(match.created_at);
          
          // Set time boundaries for comparison
          const normalizedMatchDate = new Date(matchDate);
          normalizedMatchDate.setHours(0, 0, 0, 0);
          
          const normalizedStartDate = new Date(startDate);
          normalizedStartDate.setHours(0, 0, 0, 0);
          
          const normalizedEndDate = new Date(endDate);
          normalizedEndDate.setHours(23, 59, 59, 999);
          
          if (normalizedMatchDate >= normalizedStartDate && normalizedMatchDate <= normalizedEndDate) {
            const membersList = matchMembersMap[match.id] || [];
            membersList.forEach(member => {
              allPayments.push({
                memberName: member.member_name,
                type: `Match #${matchIndex + 1}`,
                amount: member.total_amount,
                status: member.payment_status === 'paid' ? 'paid' : 
                        member.payment_status === 'pending' ? 'pending' : 
                        'overdue',
                dueDate: match.match_date || match.created_at,
                paidDate: member.paid_at || undefined,
              });
            });
          }
        });
      }

      // Fetch ALL memberships with period filter
      console.log('📊 Fetching all memberships for period:', startDateStr, 'to', endDateStr);
      const { data: allMemberships, error: membershipsError } = await supabase
        .from('memberships')
        .select('*')
        .order('created_at', { ascending: false });

      if (membershipsError) throw membershipsError;

      if (allMemberships) {
        allMemberships.forEach(membership => {
          const membershipDate = new Date(membership.created_at);
          
          // Set time boundaries
          const normalizedMembershipDate = new Date(membershipDate);
          normalizedMembershipDate.setHours(0, 0, 0, 0);
          
          const normalizedStartDate = new Date(startDate);
          normalizedStartDate.setHours(0, 0, 0, 0);
          
          const normalizedEndDate = new Date(endDate);
          normalizedEndDate.setHours(23, 59, 59, 999);
          
          if (normalizedMembershipDate >= normalizedStartDate && normalizedMembershipDate <= normalizedEndDate) {
            allPayments.push({
              memberName: membership.member_name,
              type: 'Monthly Membership',
              amount: membership.amount,
              status: membership.payment_status === 'paid' ? 'paid' : 
                      membership.payment_status === 'pending' ? 'pending' : 
                      'overdue',
              dueDate: membership.created_at,
              paidDate: membership.paid_at || undefined,
            });
          }
        });
      }

      if (allPayments.length === 0) {
        alert('Tidak ada data pembayaran dalam periode yang dipilih');
        return;
      }

      // Calculate summary for period
      const totalRevenuePeriod = allPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      const totalPending = allPayments.filter(p => p.status === 'pending').length;
      const totalPaid = allPayments.filter(p => p.status === 'paid').length;
      const collectionRatePeriod = totalPaid > 0 ? ((totalPaid / (totalPaid + totalPending)) * 100).toFixed(1) : '0';

      console.log('✅ Custom Period Report Summary:', {
        period: `${periodStart} - ${periodEnd}`,
        totalRevenue: totalRevenuePeriod,
        totalPaidItems: totalPaid,
        totalPendingItems: totalPending,
        totalItems: allPayments.length
      });

      // Prepare report data
      const reportData = {
        period: {
          start: periodStart,
          end: periodEnd,
        },
        summary: {
          totalRevenue: totalRevenuePeriod,
          totalPending: totalPending,
          totalPaid: totalPaid,
          totalMembers: new Set(allPayments.map(p => p.memberName)).size,
          paymentRate: parseFloat(collectionRatePeriod as string),
        },
        payments: allPayments.sort((a, b) => {
          // Sort: paid first, then by date
          if (a.status !== b.status) {
            return a.status === 'paid' ? -1 : 1;
          }
          return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        }),
      };

      // Generate report
      const result = await generateFinancialReport(reportData, {
        share,
      });

      if (result.success) {
        console.log('✅ Custom period financial report generated:', result.filename);
        setShowCustomPeriodModal(false);
      } else {
        alert(`Gagal membuat laporan: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error generating custom period report:', error);
      alert(`Gagal membuat laporan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate Shuttlecock Usage Report
  async function handleGenerateShuttlecockReport() {
    try {
      const now = new Date();
      
      // Fetch ALL matches for the current year (not just the selected month)
      const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const yearEnd = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59));
      
      const { data: allYearMatches, error: yearMatchesError } = await supabase
        .from('matches')
        .select('*')
        .gte('match_date', yearStart.toISOString())
        .lte('match_date', yearEnd.toISOString())
        .order('match_date', { ascending: false });
      
      if (yearMatchesError) {
        console.error('Error fetching year matches:', yearMatchesError);
        return;
      }
      
      const reportMatches = allYearMatches || [];
      
      console.log(`📊 Fetched ${reportMatches.length} matches for year ${now.getUTCFullYear()}`);
      
      // Get current week start (Sunday) - in UTC
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay());
      currentWeekStart.setUTCHours(0, 0, 0, 0);
      
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
      currentWeekEnd.setUTCHours(23, 59, 59, 999);
      
      // Get current month boundaries - in UTC
      const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      currentMonthStart.setUTCHours(0, 0, 0, 0);
      
      const currentMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
      currentMonthEnd.setUTCHours(23, 59, 59, 999);
      
      // Get current year boundaries - in UTC
      const currentYearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      currentYearStart.setUTCHours(0, 0, 0, 0);
      
      const currentYearEnd = new Date(Date.UTC(now.getUTCFullYear(), 11, 31));
      currentYearEnd.setUTCHours(23, 59, 59, 999);
      
      // Calculate totals by period from matches array
      let weeklyShuttlecocks = 0;
      let weeklyMatches = 0;
      let monthlyShuttlecocks = 0;
      let monthlyMatches = 0;
      let yearlyShuttlecocks = 0;
      let yearlyMatches = 0;
      let totalShuttlecocks = 0;
      let totalMatches = 0;
      
      // Initialize monthly aggregates for all 12 months
      const monthlyAggregates = Array(12).fill(null).map(() => ({ shuttlecocks: 0, matches: 0 }));
      
      console.log('📊 Report generation started at:', now.toISOString());
      console.log('📅 Week boundaries:', currentWeekStart.toISOString(), 'to', currentWeekEnd.toISOString());
      console.log('📅 Month boundaries:', currentMonthStart.toISOString(), 'to', currentMonthEnd.toISOString());
      console.log('📅 Year boundaries:', currentYearStart.toISOString(), 'to', currentYearEnd.toISOString());
      
      reportMatches.forEach((match, idx) => {
        // Parse match date properly - could be ISO string or Date
        let matchDate: Date;
        const dateSource = match.match_date || match.created_at;
        
        if (typeof dateSource === 'string') {
          matchDate = new Date(dateSource);
        } else {
          matchDate = new Date(dateSource);
        }
        
        // Normalize to start of day in UTC for comparison
        const normalizedMatchDate = new Date(Date.UTC(
          matchDate.getUTCFullYear(),
          matchDate.getUTCMonth(),
          matchDate.getUTCDate()
        ));
        
        const shuttleCount = match.shuttlecock_count || 0;
        
        console.log(`Match ${idx + 1}: ${normalizedMatchDate.toISOString()} (${match.match_date || match.created_at}) - ${shuttleCount} shuttlecocks`);
        
        totalShuttlecocks += shuttleCount;
        totalMatches += 1;
        
        // Check if match is in current week
        if (normalizedMatchDate >= currentWeekStart && normalizedMatchDate <= currentWeekEnd) {
          console.log(`  ✓ Included in This Week`);
          weeklyShuttlecocks += shuttleCount;
          weeklyMatches += 1;
        }
        
        // Check if match is in current month
        if (normalizedMatchDate >= currentMonthStart && normalizedMatchDate <= currentMonthEnd) {
          console.log(`  ✓ Included in This Month`);
          monthlyShuttlecocks += shuttleCount;
          monthlyMatches += 1;
        }
        
        // Check if match is in current year and aggregate by month
        if (normalizedMatchDate >= currentYearStart && normalizedMatchDate <= currentYearEnd) {
          console.log(`  ✓ Included in This Year`);
          yearlyShuttlecocks += shuttleCount;
          yearlyMatches += 1;
          
          // Add to monthly aggregate
          const matchMonth = matchDate.getUTCMonth();
          monthlyAggregates[matchMonth].shuttlecocks += shuttleCount;
          monthlyAggregates[matchMonth].matches += 1;
        }
      });
      
      console.log('📊 Aggregated Results:', {
        weekly: { shuttlecocks: weeklyShuttlecocks, matches: weeklyMatches },
        monthly: { shuttlecocks: monthlyShuttlecocks, matches: monthlyMatches },
        yearly: { shuttlecocks: yearlyShuttlecocks, matches: yearlyMatches },
        total: { shuttlecocks: totalShuttlecocks, matches: totalMatches }
      });
      
      // Format month name
      const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      const yearName = now.getFullYear().toString();
      
      // Format week range
      const weekStart = currentWeekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const weekEnd = currentWeekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      
      // Prepare summaries
      const summaries = [
        {
          periodName: 'This Week',
          periodLabel: `${weekStart} - ${weekEnd}`,
          shuttlecocks: weeklyShuttlecocks,
          matches: weeklyMatches,
        },
        {
          periodName: 'This Month',
          periodLabel: monthName,
          shuttlecocks: monthlyShuttlecocks,
          matches: monthlyMatches,
        },
        {
          periodName: 'This Year',
          periodLabel: yearName,
          shuttlecocks: yearlyShuttlecocks,
          matches: yearlyMatches,
        },
        {
          periodName: 'Total',
          periodLabel: 'All Time',
          shuttlecocks: totalShuttlecocks,
          matches: totalMatches,
        },
      ];

      // Add monthly breakdowns only for months that have occurred (up to current month)
      const monthNamesID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const monthNamesEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      
      const monthlySummaries = [];
      const currentMonthIndex = now.getUTCMonth();
      
      for (let monthIndex = 0; monthIndex <= currentMonthIndex; monthIndex++) {
        monthlySummaries.push({
          month: `${monthNamesID[monthIndex]} ${yearName}`,
          monthLabel: monthNamesEN[monthIndex],
          shuttlecocks: monthlyAggregates[monthIndex].shuttlecocks,
          matches: monthlyAggregates[monthIndex].matches,
        });
      }

      console.log('✅ Shuttlecock Usage Report Summary:', summaries);
      console.log('✅ Monthly Breakdown:', monthlySummaries);

      // Prepare report data with separate sections
      const reportData = {
        reportDate: `Shuttlecock Usage Report - ${now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        generatedDate: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        summaries,
        monthlySummaries,
      };

      // Generate report
      const result = await generateShuttlecockReport(reportData);

      if (result.success) {
        console.log('✅ Shuttlecock usage report generated:', result.filename);
      } else {
        alert(`Gagal membuat laporan: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error generating shuttlecock report:', error);
      alert(`Gagal membuat laporan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const getCreationPermission = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const selectedMonthNum = selectedMonth.getMonth();
    const selectedYear = selectedMonth.getFullYear();
    
    // Calculate month difference
    const monthDiff = (selectedYear - currentYear) * 12 + (selectedMonthNum - currentMonth);
    
    if (monthDiff < -2) {
      // More than 2 months ago - view only
      return { allowed: false, reason: 'past', message: 'Tidak bisa membuat data lebih dari 2 bulan lalu.' };
    } else if (monthDiff < 0) {
      // Past month (within 2 months) - allowed with note
      return { allowed: true, reason: 'past_allowed' };
    } else if (monthDiff === 0) {
      // Current month - full access
      return { allowed: true, reason: 'current' };
    } else if (monthDiff === 1) {
      // Next month - needs confirmation
      return { allowed: true, reason: 'next', needsConfirmation: true };
    } else {
      // Future months (2+) - disabled
      return { allowed: false, reason: 'future', message: 'Terlalu jauh ke depan. Maksimal 1 bulan ke depan.' };
    }
  };

  const handleCreateClick = (type: 'match' | 'membership') => {
    const permission = getCreationPermission();
    
    if (!permission.allowed) {
      alert(permission.message);
      return;
    }
    
    if (permission.needsConfirmation) {
      // Next month - show confirmation
      setPendingCreateAction(type);
      setShowNextMonthConfirm(true);
    } else {
      // Current month - proceed directly
      if (type === 'match') {
        setShowCreateModal(true);
      } else {
        setShowMembershipModal(true);
      }
    }
  };

  const confirmNextMonthCreation = () => {
    setShowNextMonthConfirm(false);
    if (pendingCreateAction === 'match') {
      setShowCreateModal(true);
    } else if (pendingCreateAction === 'membership') {
      setShowMembershipModal(true);
    }
    setPendingCreateAction(null);
  };

  // Create new match
  async function createMatch() {
    try {
      const members = [newMatch.member1, newMatch.member2, newMatch.member3, newMatch.member4].filter(m => m);
      
      if (members.length !== 4) {
        alert('Harap masukkan 4 anggota');
        return;
      }

      if (!newMatch.match_date) {
        alert('Harap pilih tanggal pertandingan');
        return;
      }

      // Check if date is in next month and needs confirmation
      const selectedDate = new Date(newMatch.match_date);
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const selectedMonth = selectedDate.getMonth();
      const selectedYear = selectedDate.getFullYear();
      
      const monthDiff = (selectedYear - currentYear) * 12 + (selectedMonth - currentMonth);
      
      if (monthDiff > 0) {
        const confirmed = confirm(
          `Anda akan membuat pertandingan untuk ${selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} (bulan depan).\\n\\nApakah Anda yakin ingin melanjutkan?`
        );
        if (!confirmed) {
          return; // User cancelled
        }
      }

      // Check for duplicate members
      const uniqueMembers = new Set(members.map(m => m.toLowerCase().trim()));
      if (uniqueMembers.size !== members.length) {
        alert('Tidak boleh ada anggota yang duplikat dalam satu pertandingan!');
        return;
      }

      const costPerShuttlecock = 12000;
      const totalCost = newMatch.shuttlecock_count * costPerShuttlecock;
      const costPerMember = totalCost / 4;

      // Get membership status for the match date's month (not selected month)
      const matchDate = new Date(newMatch.match_date);
      const matchMonth = matchDate.getMonth() + 1;
      const matchYear = matchDate.getFullYear();

      // Insert membership records for any players who opted in via checkbox
      if (createMatchMembershipPayers.size > 0) {
        const lastDay = new Date(matchYear, matchMonth, 0).getDate();
        let sats = 0;
        for (let d = 1; d <= lastDay; d++) { if (new Date(matchYear, matchMonth - 1, d).getDay() === 6) sats++; }
        const mFee = sats >= 5 ? 45000 : 40000;
        const membershipInserts = Array.from(createMatchMembershipPayers).map(name => ({
          member_name: name,
          month: matchMonth,
          year: matchYear,
          weeks_in_month: sats,
          amount: mFee,
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        }));
        const { error: membershipInsertError } = await supabase
          .from('memberships')
          .upsert(membershipInserts, { onConflict: 'member_name,month,year', ignoreDuplicates: false });
        if (membershipInsertError) {
          console.error('[Membership] Insert error:', membershipInsertError);
          alert(`⚠️ Gagal menyimpan membership: ${membershipInsertError.message}\n\nPertandingan tetap akan dibuat.`);
        } else {
          console.log(`[Membership] ✅ Saved ${createMatchMembershipPayers.size} membership payments`);
        }
      }

      // Fetch PAID memberships for the match's month (only paid memberships count!)
      const { data: matchMonthMemberships, error: membershipQueryError } = await supabase
        .from('memberships')
        .select('*')
        .eq('month', matchMonth)
        .eq('year', matchYear)
        .eq('payment_status', 'paid'); // Only consider PAID memberships

      if (membershipQueryError) {
        console.error('Error fetching memberships for match month:', membershipQueryError);
      }

      // Create a membership map for the match month (only PAID memberships)
      const matchMonthMembershipMap: Record<string, Membership> = {};
      if (matchMonthMemberships) {
        matchMonthMemberships.forEach((m) => {
          matchMonthMembershipMap[m.member_name.toLowerCase().trim()] = m;
        });
      }

      // Fetch member profiles to check payment_exempt status (VIP members)
      const { data: memberProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('full_name, is_payment_exempt, phone, email')
        .in('full_name', members);

      if (profilesError) {
        console.error('Error fetching member profiles:', profilesError);
      }

      // Create payment exempt map, phone map, and email map
      const paymentExemptMap: Record<string, boolean> = {};
      const phoneMap: Record<string, string> = {};
      const emailMap: Record<string, string> = {};
      if (memberProfiles) {
        memberProfiles.forEach((p) => {
          paymentExemptMap[p.full_name.toLowerCase()] = p.is_payment_exempt === true;
          if (p.phone) phoneMap[p.full_name.toLowerCase()] = p.phone;
          if (p.email) emailMap[p.full_name.toLowerCase()] = p.email;
        });
      }

      // Create match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          shuttlecock_count: newMatch.shuttlecock_count,
          status: 'active',
          created_by: user?.id,
          match_date: new Date(newMatch.match_date).toISOString(),
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Check which members already paid attendance fee on this day (other matches)
      const matchDayStart = new Date(newMatch.match_date);
      matchDayStart.setHours(0, 0, 0, 0);
      const matchDayEnd = new Date(newMatch.match_date);
      matchDayEnd.setHours(23, 59, 59, 999);
      const { data: sameDayFees } = await supabase
        .from('match_members')
        .select('member_name, matches!inner(match_date)')
        .gt('attendance_fee', 0)
        .gte('matches.match_date', matchDayStart.toISOString())
        .lte('matches.match_date', matchDayEnd.toISOString());
      const attendancePaidTodaySet = new Set(
        (sameDayFees || []).map(mm => mm.member_name.toLowerCase().trim())
      );

      // Create match members with membership check for match's month
      const membersData = members.map(memberName => {
        // Check if member is payment exempt (VIP/sponsor/special access)
        const isPaymentExempt = paymentExemptMap[memberName.toLowerCase()] === true;
        
        if (isPaymentExempt) {
          return {
            match_id: match.id,
            member_name: memberName,
            amount_due: 0,
            attendance_fee: 0,
            has_membership: true, // Mark as membership to show VIP status
            payment_status: 'pending',
          };
        }

        // Normal payment calculation for non-exempt members
        // Check membership for the match's month, not the selected month
        const memberMembership = matchMonthMembershipMap[memberName.toLowerCase().trim()];
        const hasMembershipStatus = !!memberMembership || createMatchMembershipPayers.has(memberName);
        const alreadyPaidToday = attendancePaidTodaySet.has(memberName.toLowerCase().trim());
        const shouldCharge = !hasMembershipStatus && !alreadyPaidToday;
        const attendanceFee = shouldCharge ? 18000 : 0;
        if (shouldCharge) attendancePaidTodaySet.add(memberName.toLowerCase().trim());
        
        return {
          match_id: match.id,
          member_name: memberName,
          amount_due: costPerMember,
          attendance_fee: attendanceFee,
          has_membership: hasMembershipStatus,
          attendance_paid_this_entry: shouldCharge,
          payment_status: 'pending',
        };
      });

      const { error: membersError } = await supabase
        .from('match_members')
        .insert(membersData);

      if (membersError) throw membersError;

      setShowCreateModal(false);
      setNewMatch({
        shuttlecock_count: 1,
        member1: '',
        member2: '',
        member3: '',
        member4: '',
        match_date: '',
      });
      setCreateMatchMembershipPayers(new Set());
      loadData();

      // Send WA + Email notifications in parallel
      try {
        const matchDateForFee = new Date(match.match_date);
        const feeMonth = matchDateForFee.getMonth();
        const feeYear = matchDateForFee.getFullYear();
        const feeLast = new Date(feeYear, feeMonth + 1, 0).getDate();
        let feeSats = 0;
        for (let d = 1; d <= feeLast; d++) { if (new Date(feeYear, feeMonth, d).getDay() === 6) feeSats++; }
        const notifMembershipFee = feeSats >= 5 ? 45000 : 40000;

        const notifMembers = membersData.map(m => ({
          name: m.member_name,
          phone: phoneMap[m.member_name.toLowerCase()] || '',
          email: emailMap[m.member_name.toLowerCase()] || '',
          amountDue: m.amount_due,
          attendanceFee: m.attendance_fee,
          hasMembership: m.has_membership,
          isPaymentExempt: paymentExemptMap[m.member_name.toLowerCase()] || false,
          membershipJustPaid: createMatchMembershipPayers.has(m.member_name),
          membershipAmount: createMatchMembershipPayers.has(m.member_name) ? notifMembershipFee : undefined,
        }));

        const [waRes, emailRes] = await Promise.all([
          fetch('/api/send-wa-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchDate: match.match_date, members: notifMembers }),
          }),
          fetch('/api/send-match-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchDate: match.match_date, members: notifMembers }),
          }),
        ]);

        const waData = waRes.ok ? await waRes.json() : null;
        const emailData = emailRes.ok ? await emailRes.json() : null;
        if (waData || emailData) {
          setWaNotificationResult({ wa: waData, email: emailData });
        }
      } catch (notifErr) {
        console.error('Notification error:', notifErr);
        // Non-blocking — match was already created successfully
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Gagal membuat pertandingan');
    }
  }

  async function createMembership() {
    try {
      if (!newMembership.member_name) {
        alert('Harap masukkan nama anggota');
        return;
      }

      // Use selectedMonth instead of current month
      const targetMonth = selectedMonth.getMonth() + 1;
      const targetYear = selectedMonth.getFullYear();
      const amount = newMembership.weeks_in_month === 4 ? 40000 : 45000;

      const { error } = await supabase
        .from('memberships')
        .insert({
          member_name: newMembership.member_name,
          month: targetMonth,
          year: targetYear,
          weeks_in_month: newMembership.weeks_in_month,
          amount: amount,
          payment_status: 'pending',
        });

      if (error) throw error;

      setShowMembershipModal(false);
      setNewMembership({
        member_name: '',
        weeks_in_month: 4,
      });
      fetchMemberships();
    } catch (error: any) {
      console.error('Error creating membership:', error);
      if (error.code === '23505') {
        alert('Anggota sudah memiliki membership untuk bulan ini');
      } else {
        alert('Gagal membuat membership');
      }
    }
  }

  function startEditingMatch(match: Match) {
    const members: Record<string, { name: string; memberId: string }> = {};
    matchMembers[match.id]?.forEach(member => {
      members[member.id] = { name: member.member_name, memberId: member.id };
    });

    setEditingMatch({
      matchId: match.id,
      match_date: match.match_date || '',
      shuttlecock_count: match.shuttlecock_count,
      members,
    });
    setExpandedMatches(prev => ({ ...prev, [match.id]: true }));
  }

  async function saveMatchChanges() {
    if (!editingMatch) return;

    try {
      // Get original match data to compare shuttlecock count
      const originalMatch = matches.find(m => m.id === editingMatch.matchId);
      const shuttlecockIncreased = originalMatch && editingMatch.shuttlecock_count > originalMatch.shuttlecock_count;

      // Update match
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          shuttlecock_count: editingMatch.shuttlecock_count,
          match_date: editingMatch.match_date ? new Date(editingMatch.match_date).toISOString() : null,
        })
        .eq('id', editingMatch.matchId);

      if (matchError) {
        console.error('Match update error:', matchError);
        throw matchError;
      }

      // Calculate costs
      const costPerShuttlecock = 12000;
      const newTotalCost = editingMatch.shuttlecock_count * costPerShuttlecock;
      const newCostPerMember = newTotalCost / 4;
      
      const oldTotalCost = (originalMatch?.shuttlecock_count || 0) * costPerShuttlecock;
      const oldCostPerMember = oldTotalCost / 4;
      const additionalCost = newCostPerMember - oldCostPerMember;

      // Get membership status for the match date's month (not selected month)
      const matchDate = editingMatch.match_date ? new Date(editingMatch.match_date) : (originalMatch?.match_date ? new Date(originalMatch.match_date) : new Date());
      const matchMonth = matchDate.getMonth() + 1;
      const matchYear = matchDate.getFullYear();

      // Fetch PAID memberships for the match's month (only paid memberships count!)
      const { data: matchMonthMemberships, error: membershipQueryError } = await supabase
        .from('memberships')
        .select('*')
        .eq('month', matchMonth)
        .eq('year', matchYear)
        .eq('payment_status', 'paid'); // Only consider PAID memberships

      if (membershipQueryError) {
        console.error('Error fetching memberships for match month:', membershipQueryError);
      }

      // Create a membership map for the match month (only PAID memberships)
      const matchMonthMembershipMap: Record<string, Membership> = {};
      if (matchMonthMemberships) {
        matchMonthMemberships.forEach((m) => {
          matchMonthMembershipMap[m.member_name.toLowerCase().trim()] = m;
        });
      }

      // Fetch member profiles to check payment_exempt status (VIP members)
      const memberNames = Object.values(editingMatch.members).map(m => m.name);
      const { data: memberProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('full_name, is_payment_exempt')
        .in('full_name', memberNames);

      if (profilesError) {
        console.error('Error fetching member profiles:', profilesError);
      }

      // Create payment exempt map
      const paymentExemptMap: Record<string, boolean> = {};
      if (memberProfiles) {
        memberProfiles.forEach((p) => {
          paymentExemptMap[p.full_name.toLowerCase()] = p.is_payment_exempt === true;
        });
      }

      // Check which members already paid attendance fee on this same day
      // in OTHER matches (excluding this one being edited)
      const editDayStart = new Date(matchDate);
      editDayStart.setHours(0, 0, 0, 0);
      const editDayEnd = new Date(matchDate);
      editDayEnd.setHours(23, 59, 59, 999);
      const { data: sameDayFees } = await supabase
        .from('match_members')
        .select('member_name, match_id, matches!inner(match_date)')
        .gt('attendance_fee', 0)
        .neq('match_id', editingMatch.matchId)
        .gte('matches.match_date', editDayStart.toISOString())
        .lte('matches.match_date', editDayEnd.toISOString());
      const editAttendancePaidSet = new Set(
        (sameDayFees || []).map(mm => mm.member_name.toLowerCase().trim())
      );

      // Update members
      for (const [memberId, memberData] of Object.entries(editingMatch.members)) {
        // Check if member is payment exempt (VIP/sponsor/special access)
        const isPaymentExempt = paymentExemptMap[memberData.name.toLowerCase()] === true;
        
        let hasMembershipStatus: boolean;
        let attendanceFee: number;
        
        if (isPaymentExempt) {
          console.log(`🎁 ${memberData.name} is payment exempt - all costs = 0`);
          hasMembershipStatus = true; // Mark as membership to show VIP status
          attendanceFee = 0;
        } else {
          // Normal payment calculation for non-exempt members
          // Check membership for the match's month, not the selected month
          const memberMembership = matchMonthMembershipMap[memberData.name.toLowerCase().trim()];
          hasMembershipStatus = !!memberMembership;
          const alreadyPaidElsewhere = editAttendancePaidSet.has(memberData.name.toLowerCase().trim());
          attendanceFee = hasMembershipStatus || alreadyPaidElsewhere ? 0 : 18000;
        }

        // Manual override: admin explicitly set this member as having membership
        if (overrideMembership.has(memberId)) {
          hasMembershipStatus = true;
          attendanceFee = 0;
        } else if (waiveAttendanceFee.has(memberId)) {
          // Manual override: admin explicitly waived this member's attendance fee
          attendanceFee = 0;
        }
        
        // Get current member data
        const currentMember = matchMembers[editingMatch.matchId]?.find(m => m.id === memberId);
        
        // If shuttlecock increased and member already paid, set to revision
        if (shuttlecockIncreased && currentMember?.payment_status === 'paid') {
          // Try to update with revision status and additional_amount
          let updateData: any = {
            member_name: memberData.name,
            amount_due: isPaymentExempt ? 0 : newCostPerMember, // Exempt members pay nothing
            attendance_fee: attendanceFee,
            has_membership: hasMembershipStatus,
          };

          // Try to add revision status if column exists
          try {
            updateData.payment_status = 'revision';
            updateData.additional_amount = additionalCost;
          } catch (e) {
            // If revision status not supported, keep as paid
            console.warn('Revision status not supported, keeping as paid');
          }

          const { error: memberError } = await supabase
            .from('match_members')
            .update(updateData)
            .eq('id', memberId);

          if (memberError) {
            console.error('Member update error (revision):', memberError);
            // If revision failed, try without revision status
            const { error: fallbackError } = await supabase
              .from('match_members')
              .update({
                member_name: memberData.name,
                amount_due: isPaymentExempt ? 0 : newCostPerMember, // Exempt members pay nothing
                attendance_fee: attendanceFee,
                has_membership: hasMembershipStatus,
              })
              .eq('id', memberId);
            
            if (fallbackError) throw fallbackError;
          }
        } else {
          // Normal update
          const { error: memberError } = await supabase
            .from('match_members')
            .update({
              member_name: memberData.name,
              amount_due: isPaymentExempt ? 0 : newCostPerMember, // Exempt members pay nothing
              attendance_fee: attendanceFee,
              has_membership: hasMembershipStatus,
            })
            .eq('id', memberId);

          if (memberError) {
            console.error('Member update error:', memberError);
            throw memberError;
          }
        }
      }

      if (shuttlecockIncreased) {
        alert(`Perubahan berhasil disimpan! Anggota yang sudah membayar perlu membayar tambahan Rp ${additionalCost.toLocaleString('id-ID')} untuk ${editingMatch.shuttlecock_count - (originalMatch?.shuttlecock_count || 0)} shuttlecock tambahan.`);
      } else {
        alert('Perubahan berhasil disimpan!');
      }
      setEditingMatch(null);
      setWaiveAttendanceFee(new Set());
      setOverrideMembership(new Set());
      loadData();
    } catch (error) {
      console.error('Error saving match changes:', error);
      alert(`Gagal menyimpan perubahan: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }
  }

  async function deleteMatch(matchId: string, matchNumber: number) {
    if (!confirm(`Hapus seluruh Pertandingan #${matchNumber}? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua entri pembayaran terkait.`)) {
      return;
    }

    try {
      const response = await fetch('/api/matches/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Gagal menghapus pertandingan');
      }
      
      alert('Pertandingan berhasil dihapus');
      loadData();
    } catch (error) {
      console.error('Error deleting match:', error);
      alert(`Gagal menghapus pertandingan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function deleteMatchMember(matchId: string, memberId: string, memberName: string) {
    if (!confirm(`Hapus entri pembayaran untuk ${memberName}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const response = await fetch('/api/matches/delete-member', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Gagal menghapus entri pembayaran');
      }
      
      alert('Entri pembayaran berhasil dihapus');
      loadData();
    } catch (error) {
      console.error('Error deleting match member:', error);
      alert(`Gagal menghapus entri pembayaran: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Bulk confirmation functions
  const togglePaymentSelection = (payment: { id: string; type: 'match' | 'membership'; memberName: string; amount: number; matchId?: string; proofUrl?: string }) => {
    setSelectedPayments(prev => {
      const exists = prev.find(p => p.id === payment.id && p.type === payment.type);
      if (exists) {
        return prev.filter(p => !(p.id === payment.id && p.type === payment.type));
      } else {
        return [...prev, payment];
      }
    });
  };

  const isPaymentSelected = (id: string, type: 'match' | 'membership') => {
    return selectedPayments.some(p => p.id === id && p.type === type);
  };

  const clearBulkSelection = () => {
    setSelectedPayments([]);
  };

  const openBulkConfirmModal = () => {
    if (selectedPayments.length === 0) return;
    setShowBulkConfirmModal(true);
  };

  const closeBulkConfirmModal = () => {
    setShowBulkConfirmModal(false);
    setConfirmIrreversible(false);
    setIsConfirmingRevisions(false);
  };

  async function handleBulkConfirmPayments() {
    if (selectedPayments.length === 0) return;
    
    // Check if user confirmed the irreversible action
    const paymentsWithoutProof = selectedPayments.filter(p => !p.proofUrl).length;
    if (paymentsWithoutProof > 0 && !confirmIrreversible) {
      alert('Harap centang konfirmasi untuk melanjutkan. Tindakan ini tidak dapat dibatalkan.');
      return;
    }

    try {
      setBulkConfirming(true);

      const now = new Date().toISOString();

      // Update payments - split by type
      const matchPayments = selectedPayments.filter(p => p.type === 'match');
      const membershipPayments = selectedPayments.filter(p => p.type === 'membership');

      const updatePromises: Promise<any>[] = [];

      // Update match payments
      if (matchPayments.length > 0) {
        const matchIds = matchPayments.map(p => p.id);
        const matchUpdatePromise = Promise.resolve(
          supabase
            .from('match_members')
            .update({
              payment_status: 'paid',
              paid_at: now,
            })
            .in('id', matchIds)
        );
        updatePromises.push(matchUpdatePromise);
      }

      // Update membership payments (with side effects)
      for (const payment of membershipPayments) {
        updatePromises.push(
          (async () => {
            // Get membership details
            const { data: membership } = await supabase
              .from('memberships')
              .select('member_name, month, year')
              .eq('id', payment.id)
              .single();

            // Update membership status
            await supabase
              .from('memberships')
              .update({
                payment_status: 'paid',
                paid_at: now,
              })
              .eq('id', payment.id);

            // Update related match members
            if (membership) {
              await supabase
                .from('match_members')
                .update({
                  attendance_fee: 0,
                  has_membership: true,
                })
                .eq('member_name', membership.member_name)
                .eq('payment_status', 'pending');
            }
          })()
        );
      }

      const results = await Promise.allSettled(updatePromises);
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (failedCount > 0) {
        alert(`${selectedPayments.length - failedCount} dari ${selectedPayments.length} pembayaran berhasil dikonfirmasi. ${failedCount} gagal.`);
      } else {
        alert(`${selectedPayments.length} pembayaran berhasil dikonfirmasi!`);
      }

      closeBulkConfirmModal();
      clearBulkSelection();
      await loadData();
      // Refresh smart suggestions after payment confirmation
      fetchSmartSuggestions();
    } catch (error) {
      console.error('Error bulk confirming payments:', error);
      alert('Gagal mengkonfirmasi pembayaran');
    } finally {
      setBulkConfirming(false);
    }
  }

  async function handleBulkConfirmRevisions() {
    if (selectedPayments.length === 0) return;

    try {
      setBulkConfirming(true);

      const now = new Date().toISOString();

      // Update payments - split by type
      const matchPayments = selectedPayments.filter(p => p.type === 'match');
      const membershipPayments = selectedPayments.filter(p => p.type === 'membership');

      const updatePromises: Promise<any>[] = [];

      // Update match payments - clear additional_amount for revisions
      if (matchPayments.length > 0) {
        const matchIds = matchPayments.map(p => p.id);
        const matchUpdatePromise = Promise.resolve(
          supabase
            .from('match_members')
            .update({
              payment_status: 'paid',
              paid_at: now,
              additional_amount: null, // Clear revision amount
            })
            .in('id', matchIds)
        );
        updatePromises.push(matchUpdatePromise);
      }

      // Update membership payments
      if (membershipPayments.length > 0) {
        const membershipIds = membershipPayments.map(p => p.id);
        const membershipUpdatePromise = Promise.resolve(
          supabase
            .from('memberships')
            .update({
              payment_status: 'paid',
              paid_at: now,
            })
            .in('id', membershipIds)
        );
        updatePromises.push(membershipUpdatePromise);
      }

      const results = await Promise.allSettled(updatePromises);
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (failedCount > 0) {
        alert(`${selectedPayments.length - failedCount} dari ${selectedPayments.length} revisi berhasil dikonfirmasi. ${failedCount} gagal.`);
      } else {
        alert(`${selectedPayments.length} revisi berhasil dikonfirmasi!`);
      }

      closeBulkConfirmModal();
      clearBulkSelection();
      await loadData();
      // Refresh smart suggestions after revision confirmation
      fetchSmartSuggestions();
    } catch (error) {
      console.error('Error bulk confirming revisions:', error);
      alert('Gagal mengkonfirmasi revisi');
    } finally {
      setBulkConfirming(false);
    }
  }

  // Rejection handler
  async function handleRejectPayment() {
    if (!paymentToReject) return;
    
    const finalReason = rejectionReason === 'other' 
      ? customRejectionReason 
      : rejectionReason;

    if (!finalReason.trim()) {
      alert('Harap pilih atau masukkan alasan penolakan');
      return;
    }

    try {
      setRejecting(true);

      if (paymentToReject.type === 'match') {
        const { error } = await supabase
          .from('match_members')
          .update({
            payment_status: 'rejected',
            rejection_reason: finalReason,
            rejection_date: new Date().toISOString(),
            rejected_by: user?.id,
          })
          .eq('id', paymentToReject.id);

        if (error) throw error;
      } else if (paymentToReject.type === 'membership') {
        const { error } = await supabase
          .from('memberships')
          .update({
            payment_status: 'rejected',
            rejection_reason: finalReason,
            rejection_date: new Date().toISOString(),
            rejected_by: user?.id,
          })
          .eq('id', paymentToReject.id);

        if (error) throw error;
      }

      alert(`Bukti pembayaran dari ${paymentToReject.memberName} telah ditolak. Member dapat mengupload ulang bukti yang benar.`);
      
      setShowRejectModal(false);
      setShowProofModal(false);
      setRejectionReason('');
      setCustomRejectionReason('');
      setPaymentToReject(null);
      setSelectedProof(null);
      
      await loadData();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Gagal menolak bukti pembayaran');
    } finally {
      setRejecting(false);
    }
  }

  // Bulk revision functions
  const closeBulkRevisionModal = () => {
    setShowBulkRevisionModal(false);
    setBulkRevisionAmount('');
    setBulkRevisionReason('');
  };

  async function handleBulkCreateRevisions() {
    if (selectedPayments.length === 0) return;
    
    const revisionAmount = parseFloat(bulkRevisionAmount);
    if (isNaN(revisionAmount) || revisionAmount <= 0) {
      alert('Jumlah revisi harus diisi dengan angka yang valid.');
      return;
    }
    
    if (!bulkRevisionReason.trim()) {
      alert('Alasan revisi harus diisi.');
      return;
    }

    try {
      setBulkRevising(true);

      // Update payments - split by type
      const matchPayments = selectedPayments.filter(p => p.type === 'match');
      const membershipPayments = selectedPayments.filter(p => p.type === 'membership');

      const updatePromises: Promise<any>[] = [];

      // Update match payments to revision status
      for (const payment of matchPayments) {
        const matchUpdatePromise = Promise.resolve(
          supabase
            .from('match_members')
            .update({
              payment_status: 'revision',
              additional_amount: revisionAmount,
            })
            .eq('id', payment.id)
        );
        updatePromises.push(matchUpdatePromise);
      }

      // Update membership payments to revision status
      for (const payment of membershipPayments) {
        const membershipUpdatePromise = Promise.resolve(
          supabase
            .from('memberships')
            .update({
              payment_status: 'revision',
              amount: revisionAmount,
            })
            .eq('id', payment.id)
        );
        updatePromises.push(membershipUpdatePromise);
      }

      const results = await Promise.allSettled(updatePromises);
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (failedCount > 0) {
        alert(`${selectedPayments.length - failedCount} dari ${selectedPayments.length} revisi berhasil dibuat. ${failedCount} gagal.`);
      } else {
        alert(`${selectedPayments.length} revisi berhasil dibuat! Member akan menerima tagihan tambahan Rp ${revisionAmount.toLocaleString('id-ID')}.`);
      }

      closeBulkRevisionModal();
      clearBulkSelection();
      await loadData();
    } catch (error) {
      console.error('Error bulk creating revisions:', error);
      alert('Gagal membuat revisi');
    } finally {
      setBulkRevising(false);
    }
  }

  async function updatePaymentStatus(matchId: string, memberId: string, status: 'paid' | 'cancelled') {
    try {
      const { error } = await supabase
        .from('match_members')
        .update({
          payment_status: status,
          paid_at: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', memberId);

      if (error) throw error;
      setShowProofModal(false);
      setSelectedProof(null);
      loadData();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Gagal mengupdate status pembayaran');
    }
  }

  async function updateMembershipStatus(membershipId: string, status: 'paid' | 'cancelled') {
    try {
      // Get the membership details first
      const { data: membership, error: getMembershipError } = await supabase
        .from('memberships')
        .select('member_name, month, year')
        .eq('id', membershipId)
        .single();

      if (getMembershipError) throw getMembershipError;

      // Update membership status
      const { error } = await supabase
        .from('memberships')
        .update({
          payment_status: status,
          paid_at: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', membershipId);

      if (error) throw error;

      // If status is paid, update all pending match_members records for this member
      // to set attendance_fee to 0 and has_membership to true
      if (status === 'paid' && membership) {
        const { data: updatedMembers, error: updateMatchesError } = await supabase
          .from('match_members')
          .update({
            attendance_fee: 0,
            has_membership: true,
          })
          .eq('member_name', membership.member_name)
          .eq('payment_status', 'pending')
          .select();

        if (updateMatchesError) {
          console.error('Error updating match members:', updateMatchesError);
          alert('Gagal mengupdate biaya kehadiran untuk pertandingan');
        }
      }

      // Refresh both lists
      await loadData();
      setShowProofModal(false);
      setSelectedProof(null);
    } catch (error) {
      console.error('Error updating membership status:', error);
      alert('Gagal mengupdate status membership');
    }
  }

  // Rollback membership functions
  async function openRollbackModal(membership: Membership) {
    setRollbackMembership(membership);
    setIsLoadingRollback(true);
    setShowRollbackModal(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/membership-rollback?id=${membership.id}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memuat preview rollback');
      if (json.data && json.data.length > 0) {
        setRollbackPreview(json.data[0]);
      }
    } catch (error: any) {
      console.error('Error previewing rollback:', error?.message ?? error);
      alert('Gagal memuat preview rollback: ' + (error?.message ?? ''));
      setShowRollbackModal(false);
    } finally {
      setIsLoadingRollback(false);
    }
  }

  async function executeRollback() {
    if (!rollbackMembership) return;

    setIsLoadingRollback(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/membership-rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ membershipId: rollbackMembership.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal rollback membership');

      if (json.data && json.data.length > 0) {
        const result = json.data[0];
        alert(`✅ Rollback berhasil!\n\n` +
          `Member: ${result.member_name}\n` +
          `Bulan: ${result.month}/${result.year}\n` +
          `Match records diupdate: ${result.updated_match_records}\n\n` +
          `Member sekarang kembali ke non-membership dan akan dikenakan biaya kehadiran.`);
      } else {
        alert('✅ Rollback berhasil!');
      }

      // Refresh data — invalidate membership cache so rollback is visible immediately
      queryCache.invalidatePattern(`admin-memberships-${rollbackMembership.month}-${rollbackMembership.year}`);
      await loadData();
      setShowRollbackModal(false);
      setRollbackMembership(null);
      setRollbackPreview(null);
    } catch (error: any) {
      const msg = error?.message ?? String(error);
      console.error('Error executing rollback:', msg);
      alert(`Gagal rollback membership:\n${msg}`);
    } finally {
      setIsLoadingRollback(false);
    }
  }

  // Helper function to get date string in YYYY-MM-DD format (local date)
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to get the Saturday of a given week (works with local dates)
  const getSaturdayOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate days to add to reach Saturday
    const daysToSaturday = (6 - day) % 7;
    
    const saturday = new Date(d);
    saturday.setDate(saturday.getDate() + daysToSaturday);
    
    return saturday;
  };

  // Helper function to get week start and end
  const getWeekBoundaries = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return { weekStart, weekEnd };
  };

  // Helper function to get day boundaries
  const getDayBoundaries = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return { dayStart, dayEnd };
  };

  // Helper function to check if a date is within the selected month
  const isDateInSelectedMonth = (date: Date) => {
    return date.getFullYear() === selectedMonth.getFullYear() &&
           date.getMonth() === selectedMonth.getMonth();
  };

  // Helper function to get the first week that starts in the month
  const getFirstWeekOfMonth = (month: Date) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const { weekStart } = getWeekBoundaries(firstDay);
    return weekStart;
  };

  // Helper function to get the last week that contains days in the month
  const getLastWeekOfMonth = (month: Date) => {
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const { weekEnd } = getWeekBoundaries(lastDay);
    return weekEnd;
  };

  const filteredMatches = matches.filter(match => {
    // First filter by search term
    const matchesSearch = matchMembers[match.id]?.some(member =>
      member.member_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? true;

    if (!matchesSearch) return false;

    // Then apply date filter if not 'all'
    if (filterMode === 'all') {
      return true;
    }

    const matchDate = new Date(match.match_date || match.created_at);

    if (filterMode === 'weekly' && selectedFilterDate) {
      // Get date strings in local date format (YYYY-MM-DD)
      const matchDateStr = getLocalDateString(matchDate);
      
      // Get the Saturday of the selected week
      const targetSaturday = getSaturdayOfWeek(selectedFilterDate);
      const targetSaturdayStr = getLocalDateString(targetSaturday);
      
      // Compare the local date strings directly
      return matchDateStr === targetSaturdayStr;
    }

    if (filterMode === 'daily' && selectedFilterDate) {
      const { dayStart, dayEnd } = getDayBoundaries(selectedFilterDate);
      return matchDate >= dayStart && matchDate <= dayEnd;
    }

    return true;
  });

  const filteredMemberships = memberships.filter(membership =>
    membership.member_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats for matches
  const matchesStats = {
    totalAmount: matches.reduce((sum, match) => {
      const members = matchMembers[match.id] || [];
      return sum + members.reduce((memberSum, m) => {
        // For revision, only count additional_amount
        if (m.payment_status === 'revision') {
          return memberSum + (m.additional_amount || 0);
        }
        return memberSum + m.total_amount;
      }, 0);
    }, 0),
    paidAmount: matches.reduce((sum, match) => {
      const members = matchMembers[match.id] || [];
      return sum + members.filter(m => m.payment_status === 'paid').reduce((memberSum, m) => memberSum + m.total_amount, 0);
    }, 0),
    pendingAmount: matches.reduce((sum, match) => {
      const members = matchMembers[match.id] || [];
      return sum + members.filter(m => m.payment_status === 'pending' || m.payment_status === 'revision').reduce((memberSum, m) => {
        // For revision, only count additional_amount
        if (m.payment_status === 'revision') {
          return memberSum + (m.additional_amount || 0);
        }
        return memberSum + m.total_amount;
      }, 0);
    }, 0),
  };

  // Calculate stats for memberships
  const membershipsStats = {
    totalAmount: memberships.reduce((sum, m) => sum + m.amount, 0),
    paidAmount: memberships.filter(m => m.payment_status === 'paid').reduce((sum, m) => sum + m.amount, 0),
    pendingAmount: memberships.filter(m => m.payment_status === 'pending').reduce((sum, m) => sum + m.amount, 0),
  };

  // Calculate monthly recap
  const monthlyRecap = {
    totalRevenue: matchesStats.paidAmount + membershipsStats.paidAmount,
    totalPending: matchesStats.pendingAmount + membershipsStats.pendingAmount,
    totalExpected: matchesStats.totalAmount + membershipsStats.totalAmount,
    matchesRevenue: matchesStats.paidAmount,
    membershipsRevenue: membershipsStats.paidAmount,
    totalMatches: matches.length,
    totalMemberships: memberships.length,
    paidMatchesCount: matches.filter(match => {
      const members = matchMembers[match.id] || [];
      return members.every(m => m.payment_status === 'paid');
    }).length,
    paidMembershipsCount: memberships.filter(m => m.payment_status === 'paid').length,
  };

  const collectionRate = monthlyRecap.totalExpected > 0 
    ? Math.round((monthlyRecap.totalRevenue / monthlyRecap.totalExpected) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
        <div className="text-gray-900 dark:text-white transition-colors duration-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-white py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">
      <div>
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 transition-colors duration-300">Pembayaran</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 transition-colors duration-300">Kelola pembayaran pertandingan dan membership</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* iOS AssistiveTouch Style Floating Menu */}
            <div className="relative">
              {/* Main FAB Button */}
              <button
                data-report-menu-button
                onClick={() => {
                  setShowReportMenu(!showReportMenu);
                  setActiveSubmenu(null);
                }}
                className={`p-3 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg relative z-40 ${
                  showReportMenu
                    ? 'bg-emerald-600 dark:bg-emerald-500 scale-110'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                }`}
                title="Menu Laporan"
              >
                <MoreVertical className={`w-6 h-6 transition-transform duration-300 ${showReportMenu ? 'rotate-90 text-white' : ''}`} />
              </button>

              {/* Modal Menu - Centered with Blur Background */}
              {showReportMenu && (
                <>
                  {/* Blur Backdrop */}
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-all duration-300"
                    onClick={() => {
                      setShowReportMenu(false);
                      setActiveSubmenu(null);
                    }}
                  />

                  {/* Modal Menu Container - Centered */}
                  <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                    <div className="pointer-events-auto">
                      {/* Main Menu - Grid Layout */}
                      {!activeSubmenu && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 backdrop-blur-xl border border-gray-200 dark:border-zinc-700">
                          <div className="text-center mb-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Menu Aplikasi</h3>
                          </div>

                          {/* Menu Grid - 3 items (2 active, 1 disabled) */}
                          <div className="grid grid-cols-2 gap-6 mb-4">
                            {/* 📋 Generate Report Payment */}
                            <button
                              onClick={() => setActiveSubmenu('laporan')}
                              className="flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/50 dark:hover:to-blue-800/50 border border-blue-200 dark:border-blue-700/50 transition-all duration-200 hover:scale-105"
                            >
                              <span className="text-5xl">📋</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">Generate Report<br/>Payment</span>
                            </button>

                            {/* 🏸 Generate Shuttlecock Report */}
                            <button
                              onClick={() => {
                                handleGenerateShuttlecockReport();
                                setShowReportMenu(false);
                                setActiveSubmenu(null);
                              }}
                              className="flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 hover:from-orange-100 hover:to-orange-200 dark:hover:from-orange-900/50 dark:hover:to-orange-800/50 border border-orange-200 dark:border-orange-700/50 transition-all duration-200 hover:scale-105"
                            >
                              <span className="text-5xl">🏸</span>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">Shuttlecock<br/>Usage</span>
                            </button>
                          </div>

                          {/* Second Row */}
                          <div className="grid grid-cols-2 gap-6">
                            {/* ⚙️ Pengaturan (Disabled) */}
                            <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 opacity-50 cursor-not-allowed">
                              <span className="text-5xl">⚙️</span>
                              <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400">Pengaturan</span>
                              <span className="text-xs text-gray-500 dark:text-zinc-500">Coming soon</span>
                            </div>

                            {/* 🔄 Aksi Massal (Disabled) */}
                            <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 opacity-50 cursor-not-allowed">
                              <span className="text-5xl">🔄</span>
                              <span className="text-sm font-semibold text-gray-600 dark:text-zinc-400">Aksi Massal</span>
                              <span className="text-xs text-gray-500 dark:text-zinc-500">Coming soon</span>
                            </div>
                          </div>

                          {/* Close Button */}
                          <button
                            onClick={() => setShowReportMenu(false)}
                            className="w-full mt-6 px-4 py-2 rounded-lg bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium transition-colors"
                          >
                            Tutup
                          </button>
                        </div>
                      )}

                      {/* Submenu - Report Period Options */}
                      {activeSubmenu === 'laporan' && (
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 backdrop-blur-xl border border-gray-200 dark:border-zinc-700">
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pilih Periode Laporan</h3>
                            <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">Buat laporan untuk periode yang diinginkan</p>
                          </div>

                          {/* Period Options Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* 1 Minggu */}
                            <button
                              onClick={() => {
                                handleGenerateWeeklyReport(1);
                                setShowReportMenu(false);
                                setActiveSubmenu(null);
                              }}
                              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-900/50 dark:hover:to-indigo-800/50 border border-indigo-200 dark:border-indigo-700/50 transition-all duration-200 hover:scale-105"
                            >
                              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">1W</span>
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">1 Minggu</span>
                            </button>

                            {/* 2 Minggu */}
                            <button
                              onClick={() => {
                                handleGenerateWeeklyReport(2);
                                setShowReportMenu(false);
                                setActiveSubmenu(null);
                              }}
                              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-900/50 dark:hover:to-indigo-800/50 border border-indigo-200 dark:border-indigo-700/50 transition-all duration-200 hover:scale-105"
                            >
                              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">2W</span>
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">2 Minggu</span>
                            </button>

                            {/* 3 Minggu */}
                            <button
                              onClick={() => {
                                handleGenerateWeeklyReport(3);
                                setShowReportMenu(false);
                                setActiveSubmenu(null);
                              }}
                              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-900/50 dark:hover:to-indigo-800/50 border border-indigo-200 dark:border-indigo-700/50 transition-all duration-200 hover:scale-105"
                            >
                              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">3W</span>
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">3 Minggu</span>
                            </button>

                            {/* 1 Bulan */}
                            <button
                              onClick={() => {
                                handleGenerateWeeklyReport(4);
                                setShowReportMenu(false);
                                setActiveSubmenu(null);
                              }}
                              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-900/50 dark:hover:to-indigo-800/50 border border-indigo-200 dark:border-indigo-700/50 transition-all duration-200 hover:scale-105"
                            >
                              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">1M</span>
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">1 Bulan</span>
                            </button>
                          </div>

                          {/* Custom Periode - Full Width */}
                          <button
                            onClick={() => {
                              setShowCustomPeriodModal(true);
                              setShowReportMenu(false);
                              setActiveSubmenu(null);
                            }}
                            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/50 dark:hover:to-emerald-800/50 border border-emerald-200 dark:border-emerald-700/50 transition-all duration-200 hover:scale-105 mb-6"
                          >
                            <span className="text-2xl">📅</span>
                            <div className="text-left">
                              <span className="font-semibold text-gray-900 dark:text-white">Periode Custom</span>
                              <p className="text-xs text-gray-600 dark:text-zinc-400">Pilih tanggal sendiri</p>
                            </div>
                          </button>

                          {/* Back Button */}
                          <button
                            onClick={() => setActiveSubmenu(null)}
                            className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-medium transition-colors"
                          >
                            Kembali
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Tutorial Button */}
            <button
              onClick={toggleTutorial}
              className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
              title="Tampilkan panduan fitur"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Monthly Recap */}
        <div className="mb-8 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-300 dark:border-blue-500/30 rounded-xl p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 transition-colors duration-300">
                  Rekap {selectedMonth.getMonth() === new Date().getMonth() && 
                         selectedMonth.getFullYear() === new Date().getFullYear() 
                         ? 'Bulan Ini' : 'Bulan'}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  {/* Month Navigator */}
                  <button
                    onClick={() => {
                      const prevMonth = new Date(selectedMonth);
                      prevMonth.setMonth(prevMonth.getMonth() - 1);
                      setSelectedMonth(prevMonth);
                    }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-300"
                    title="Bulan sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-400 dark:text-zinc-400 transition-colors duration-300" />
                  </button>
                  
                  <span className="text-sm font-medium text-gray-900 dark:text-white min-w-35 text-center transition-colors duration-300">
                    {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </span>
                  
                  <button
                    onClick={() => {
                      const nextMonth = new Date(selectedMonth);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      setSelectedMonth(nextMonth);
                    }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-300"
                    title="Bulan berikutnya"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-zinc-400 transition-colors duration-300" />
                  </button>

                  {/* Current Month Button */}
                  {(selectedMonth.getMonth() !== new Date().getMonth() || 
                    selectedMonth.getFullYear() !== new Date().getFullYear()) && (
                    <button
                      onClick={() => setSelectedMonth(new Date())}
                      className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors"
                    >
                      Bulan Ini
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Tingkat Penagihan</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded-full h-2 w-32 transition-colors duration-300">
                  <div 
                    className="bg-linear-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300">{collectionRate}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg p-4 shadow-sm transition-colors duration-300">
              <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Total Pendapatan</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400 transition-colors duration-300">
                Rp {monthlyRecap.totalRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg p-4 shadow-sm transition-colors duration-300">
              <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Menunggu Pembayaran</p>
              <p className="text-xl font-bold text-amber-600 dark:text-yellow-400 transition-colors duration-300">
                Rp {monthlyRecap.totalPending.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg p-4 shadow-sm transition-colors duration-300">
              <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Total Diharapkan</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400 transition-colors duration-300">
                Rp {monthlyRecap.totalExpected.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg p-4 shadow-sm transition-colors duration-300">
              <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Selisih</p>
              <p className={`text-xl font-bold transition-colors duration-300 ${monthlyRecap.totalPending > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                Rp {(monthlyRecap.totalExpected - monthlyRecap.totalRevenue).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-black/30 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4 shadow-sm transition-colors duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 transition-colors duration-300">Pertandingan</h3>
                <span className="text-xs text-gray-500 dark:text-zinc-500 transition-colors duration-300">{monthlyRecap.totalMatches} total</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-zinc-400 transition-colors duration-300">Pendapatan</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                    Rp {monthlyRecap.matchesRevenue.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-zinc-400 transition-colors duration-300">Lunas</span>
                  <span className="text-sm font-semibold text-green-400">
                    {monthlyRecap.paidMatchesCount} / {monthlyRecap.totalMatches}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-black/30 border border-purple-200 dark:border-purple-500/20 rounded-lg p-4 shadow-sm transition-colors duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 transition-colors duration-300">Membership</h3>
                <span className="text-xs text-gray-500 dark:text-zinc-500 transition-colors duration-300">{monthlyRecap.totalMemberships} total</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-zinc-400 transition-colors duration-300">Pendapatan</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                    Rp {monthlyRecap.membershipsRevenue.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-zinc-400 transition-colors duration-300">Lunas</span>
                  <span className="text-sm font-semibold text-green-400">
                    {monthlyRecap.paidMembershipsCount} / {monthlyRecap.totalMemberships}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Actions Section (MVP) */}
        {smartActions.length > 0 && (
          <div className="smart-actions-section mb-6 bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-6 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-colors duration-300" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Smart Actions</h2>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30 transition-colors duration-300">
                  {smartActions.length} available
                </span>
              </div>
              {loadingSuggestions && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 transition-colors duration-300">
                  <div className="w-4 h-4 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin transition-colors duration-300"></div>
                  Updating...
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {smartActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => executeSmartAction(action)}
                  className={`text-left p-4 rounded-lg border transition-all hover:scale-105 ${
                    action.priority === 'high'
                      ? 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-200 dark:hover:bg-emerald-500/20'
                      : action.priority === 'medium'
                      ? 'bg-amber-100 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 hover:bg-amber-200 dark:hover:bg-amber-500/20'
                      : 'bg-blue-100 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/40 hover:bg-blue-200 dark:hover:bg-blue-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{action.icon}</span>
                    {action.count && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border transition-colors duration-300 ${
                        action.priority === 'high'
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : action.priority === 'medium'
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-blue-500 text-white border-blue-600'
                      }`}>
                        {action.count}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 transition-colors duration-300">{action.title}</h3>
                  <p className="text-xs text-gray-700 dark:text-zinc-400 transition-colors duration-300">{action.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggestion Cards Section (MVP) */}
        {suggestionCards.filter(card => !dismissedSuggestions.includes(card.id)).length > 0 && (
          <div className="suggestion-cards-section mb-6 space-y-3">
            {suggestionCards
              .filter(card => !dismissedSuggestions.includes(card.id))
              .sort((a, b) => a.priority - b.priority)
              .map((card) => (
              <div
                key={card.id}
                className={`p-4 rounded-lg border-l-4 flex items-start justify-between gap-4 transition-colors duration-300 ${
                  card.type === 'success'
                    ? 'bg-green-50 dark:bg-green-500/10 border-green-500'
                    : card.type === 'attention'
                    ? 'bg-red-50 dark:bg-red-500/10 border-red-500'
                    : card.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500'
                    : 'bg-blue-50 dark:bg-blue-500/10 border-blue-500'
                }`}
              >
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 transition-colors duration-300">{card.title}</h3>
                  <p className="text-xs text-gray-700 dark:text-zinc-300 mb-3 transition-colors duration-300">{card.description}</p>
                  {card.action && (
                    <button
                      onClick={() => executeSuggestionAction(card)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        card.type === 'success'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : card.type === 'attention'
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : card.type === 'warning'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {card.action.label}
                    </button>
                  )}
                </div>
                {card.dismissible && (
                  <button
                    onClick={() => dismissSuggestion(card.id)}
                    className="text-gray-400 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
          <button
            onClick={() => setActiveTab('matches')}
            className={`pembayaran-tab-matches px-6 py-3 font-medium transition-colors duration-300 relative ${
              activeTab === 'matches'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Pertandingan
            {activeTab === 'matches' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('memberships')}
            className={`pembayaran-tab-memberships px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'memberships'
                ? 'text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Membership
            {activeTab === 'memberships' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />

            )}
          </button>
        </div>

        {/* Bulk Confirmation Banner */}
        {selectedPayments.length > 0 && (
          <div className="bulk-actions mb-6 bg-linear-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckSquare className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-sm font-semibold text-green-400">
                    {selectedPayments.length} pembayaran dipilih
                  </p>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5 transition-colors duration-300">
                    Total: Rp {selectedPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={openBulkConfirmModal}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-green-500/20"
                >
                  <Check className="w-4 h-4" />
                  Konfirmasi Semua
                </button>
                <button
                  onClick={clearBulkSelection}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  title="Batalkan pilihan"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {activeTab === 'matches' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-6 transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">Total Pembayaran</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Rp {matchesStats.totalAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-6 transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">Sudah Dibayar</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Rp {matchesStats.paidAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-6 transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">Belum Dibayar</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Rp {matchesStats.pendingAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-6 transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">Total Membership</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Rp {membershipsStats.totalAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-6 transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">Sudah Dibayar</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Rp {membershipsStats.paidAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 border border-gray-200 dark:border-white/10 rounded-xl p-6 transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">Belum Dibayar</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Rp {membershipsStats.pendingAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="action-buttons flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama anggota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pembayaran-search w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors duration-300"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {activeTab === 'matches' ? (
            <button
              onClick={() => handleCreateClick('match')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Buat Pertandingan
            </button>
          ) : (
            <button
              onClick={() => handleCreateClick('membership')}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Tambah Membership
            </button>
          )}
        </div>

        {/* Filter Controls - Only show for matches tab */}
        {activeTab === 'matches' && (
          <div className="mb-6 space-y-4">
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilterSection(!showFilterSection)}
              className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between"
            >
              <span className="font-medium text-gray-900 dark:text-white">Filter Pertandingan</span>
              <ChevronDown 
                size={20} 
                className={`text-gray-600 dark:text-zinc-400 transform transition-transform duration-300 ${showFilterSection ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Collapsible Filter Controls */}
            {showFilterSection && (
              <div className="space-y-4">
                {/* Filter Mode Buttons - 3 Column Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setFilterMode('all');
                      setSelectedFilterDate(null);
                    }}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${filterMode === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('weekly');
                      if (!selectedFilterDate) {
                        const saturdayOfCurrentWeek = getSaturdayOfWeek(new Date());
                        if (!isDateInSelectedMonth(saturdayOfCurrentWeek)) {
                          const firstDayOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
                          const firstSaturday = getSaturdayOfWeek(firstDayOfMonth);
                          setSelectedFilterDate(isDateInSelectedMonth(firstSaturday) ? firstSaturday : new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1));
                        } else {
                          setSelectedFilterDate(saturdayOfCurrentWeek);
                        }
                      }
                    }}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${filterMode === 'weekly' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
                  >
                    Sabtu
                  </button>
                  <button
                    onClick={() => {
                      setFilterMode('daily');
                      if (!selectedFilterDate) setSelectedFilterDate(new Date());
                    }}
                    className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${filterMode === 'daily' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-zinc-700'}`}
                  >
                    Tanggal
                  </button>
                </div>

                {/* Date Picker Controls */}
                {(filterMode === 'weekly' || filterMode === 'daily') && (
                  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg p-4 space-y-3">
                    {filterMode === 'weekly' && (
                      <>
                        <div className="flex gap-2 items-center flex-wrap">
                          <button
                            onClick={() => {
                              const prevSaturday = new Date(selectedFilterDate || new Date());
                              prevSaturday.setDate(prevSaturday.getDate() - 7);
                              if (isDateInSelectedMonth(prevSaturday)) {
                                setSelectedFilterDate(prevSaturday);
                              }
                            }}
                            disabled={(() => {
                              const prevSaturday = new Date(selectedFilterDate || new Date());
                              prevSaturday.setDate(prevSaturday.getDate() - 7);
                              return !isDateInSelectedMonth(prevSaturday);
                            })()}
                            className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium flex items-center gap-1"
                          >
                            <ChevronLeft size={16} />
                            <span className="hidden sm:inline">Sabtu Lalu</span>
                            <span className="sm:hidden">Prev</span>
                          </button>
                          <input
                            type="date"
                            value={selectedFilterDate?.toISOString().split('T')[0] || ''}
                            min={new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).toISOString().split('T')[0]}
                            max={new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).toISOString().split('T')[0]}
                            onChange={(e) => {
                              if (e.target.value) {
                                const newDate = new Date(e.target.value + 'T00:00:00');
                                if (isDateInSelectedMonth(newDate)) {
                                  const saturday = getSaturdayOfWeek(newDate);
                                  setSelectedFilterDate(saturday);
                                }
                              }
                            }}
                            className="px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm"
                          />
                          <button
                            onClick={() => {
                              const nextSaturday = new Date(selectedFilterDate || new Date());
                              nextSaturday.setDate(nextSaturday.getDate() + 7);
                              if (isDateInSelectedMonth(nextSaturday)) {
                                setSelectedFilterDate(nextSaturday);
                              }
                            }}
                            disabled={(() => {
                              const nextSaturday = new Date(selectedFilterDate || new Date());
                              nextSaturday.setDate(nextSaturday.getDate() + 7);
                              return !isDateInSelectedMonth(nextSaturday);
                            })()}
                            className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium flex items-center gap-1"
                          >
                            <span className="hidden sm:inline">Sabtu Depan</span>
                            <span className="sm:hidden">Next</span>
                            <ChevronRight size={16} />
                          </button>
                        </div>
                        {selectedFilterDate && (
                          <div className="text-sm text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 px-3 py-2 rounded">
                            Sabtu, {selectedFilterDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        )}
                      </>
                    )}
                    {filterMode === 'daily' && (
                      <>
                        <input
                          type="date"
                          value={selectedFilterDate?.toISOString().split('T')[0] || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              setSelectedFilterDate(new Date(e.target.value + 'T00:00:00'));
                            }
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm"
                        />
                        {selectedFilterDate && (
                          <div className="text-sm text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 px-3 py-2 rounded">
                            {selectedFilterDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {activeTab === 'matches' ? (
          <div className="payment-table space-y-6">
            {(searchTerm || filterMode !== 'all') && (
              <div className="bg-white dark:bg-zinc-900 border border-blue-300 dark:border-blue-500/30 rounded-lg p-3 transition-colors duration-300">
                <p className="text-sm text-gray-700 dark:text-zinc-300 transition-colors duration-300">
                  Menampilkan <span className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">{filteredMatches.length}</span> pertandingan 
                  {searchTerm && <span> dengan anggota yang cocok dengan "{searchTerm}"</span>}
                  {filterMode === 'weekly' && selectedFilterDate && (
                    <span>
                      {' '}pada hari Sabtu, {selectedFilterDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (dalam {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})
                    </span>
                  )}
                  {filterMode === 'daily' && selectedFilterDate && (
                    <span>
                      {' '}pada tanggal {new Date(selectedFilterDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  )}
                  {filteredMatches.length === 0 && (
                    <span className="text-yellow-400 ml-2">- Tidak ada hasil</span>
                  )}
                </p>
              </div>
            )}
            {filteredMatches.map((match, matchIndex) => {
              const isExpanded = expandedMatches[match.id] ?? true;
              const isEditing = editingMatch?.matchId === match.id;
              const monthlyMatchNumber = matchIndex + 1; // Calculate monthly match number
              return (
              <div key={match.id} className={`bg-white dark:bg-zinc-900 border rounded-xl p-6 transition-colors duration-300 ${isEditing ? 'border-blue-500' : 'border-gray-200 dark:border-white/10'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedMatches(prev => ({ ...prev, [match.id]: !isExpanded }))}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-300"
                        title={isExpanded ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 dark:text-zinc-400 transition-colors duration-300" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-zinc-400 transition-colors duration-300" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Pertandingan #{monthlyMatchNumber}</h3>
                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <div>
                              <label className="text-xs text-gray-600 dark:text-zinc-400 transition-colors duration-300">Tanggal (Sabtu)</label>
                              <input
                                type="date"
                                value={editingMatch.match_date}
                                onChange={(e) => {
                                  setEditingMatch({ ...editingMatch, match_date: e.target.value });
                                }}
                                className="w-full px-3 py-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-sm mt-1 transition-colors duration-300"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 dark:text-zinc-400 transition-colors duration-300">Jumlah Shuttlecock</label>
                              <input
                                type="number"
                                min="1"
                                value={editingMatch.shuttlecock_count}
                                onChange={(e) => setEditingMatch({ ...editingMatch, shuttlecock_count: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-sm mt-1 transition-colors duration-300"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                    {match.match_date ? (
                      <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">
                        Jadwal: {new Date(match.match_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">
                        Dibuat: {new Date(match.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => { setEditingMatch(null); setWaiveAttendanceFee(new Set()); setOverrideMembership(new Set()); }}
                          className="px-3 py-1 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-900 dark:text-white rounded text-sm transition-colors duration-300 flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Batal
                        </button>
                        <button
                          onClick={saveMatchChanges}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          Simpan
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-right mr-4">
                          <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">Shuttlecock: {match.shuttlecock_count}</p>
                          <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">Total Per Orang: Rp {((match.shuttlecock_count * 12000) / 4).toLocaleString('id-ID')}</p>
                        </div>
                        <button
                          onClick={() => startEditingMatch(match)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          title="Edit Pertandingan"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMatch(match.id, monthlyMatchNumber)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          title="Hapus Pertandingan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                <>
                  <div className="lg:hidden text-center py-2 text-xs text-gray-500 dark:text-zinc-500 border-t border-gray-200 dark:border-white/10 transition-colors duration-300">
                    ← Geser tabel untuk melihat semua kolom →
                  </div>
                  <div className="overflow-x-auto -mx-6 px-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full min-w-150">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
                        <th className="text-center py-3 px-2 w-12">
                          <CheckSquare className="w-4 h-4 text-gray-500 dark:text-zinc-500 mx-auto transition-colors duration-300" />
                        </th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300">Nama</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300">Shuttlecock</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300">
                          <div className="flex items-center justify-end gap-1">
                            Kehadiran
                            <button
                              onClick={() => setShowAttendanceInfoModal(true)}
                              className="p-0.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition-colors"
                              title="Info Biaya Kehadiran"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-500 transition-colors duration-300" />
                            </button>
                          </div>
                        </th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300">Total</th>
                        <th className="text-center py-3 px-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300">Status</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchMembers[match.id]
                        ?.filter(member => 
                          (!searchTerm || member.member_name.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map((member) => {
                        const canSelect = member.payment_status === 'pending' && member.payment_proof && member.payment_proof !== 'CASH_PAYMENT';
                        const isSelected = isPaymentSelected(member.id, 'match');
                        
                        return (
                        <tr key={member.id} className="border-b border-gray-100 dark:border-white/5 last:border-0 transition-colors duration-300">
                          <td className="py-3 px-2 text-center">
                            {canSelect && (
                              <button
                                onClick={() => togglePaymentSelection({
                                  id: member.id,
                                  type: 'match',
                                  memberName: member.member_name,
                                  amount: member.total_amount,
                                  matchId: match.id,
                                  proofUrl: member.payment_proof || undefined
                                })}
                                className="text-gray-500 dark:text-zinc-400 hover:text-green-500 dark:hover:text-green-400 transition-colors mx-auto"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-green-400" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <select
                                value={editingMatch.members[member.id]?.name || member.member_name}
                                onChange={(e) => setEditingMatch({
                                  ...editingMatch,
                                  members: {
                                    ...editingMatch.members,
                                    [member.id]: { name: e.target.value, memberId: member.id }
                                  }
                                })}
                                className="w-full px-3 py-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded text-gray-900 dark:text-white text-sm transition-colors duration-300"
                              >
                                {allMembers.map((m) => (
                                  <option key={m.id} value={m.name}>{m.name}</option>
                                ))}
                              </select>
                            ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 dark:text-white transition-colors duration-300">{member.member_name}</span>
                              {member.has_membership && (
                                <div title="Member aktif">
                                  <Award className="w-4 h-4 text-purple-400" />
                                </div>
                              )}
                            </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white transition-colors duration-300">Rp {member.amount_due.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                {overrideMembership.has(member.id) ? (
                                  // Admin manually marked as membership → free
                                  <>
                                    <Award className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-purple-400 text-xs">Gratis</span>
                                    <button
                                      onClick={() => setOverrideMembership(prev => { const n = new Set(prev); n.delete(member.id); return n; })}
                                      className="p-0.5 bg-zinc-600 hover:bg-zinc-500 rounded text-zinc-200 text-xs transition-colors"
                                      title="Batalkan override membership"
                                    >
                                      ↩
                                    </button>
                                  </>
                                ) : waiveAttendanceFee.has(member.id) ? (
                                  // Admin manually waived attendance fee
                                  <>
                                    <span className="text-green-400 text-xs">Dibebaskan</span>
                                    <button
                                      onClick={() => setWaiveAttendanceFee(prev => { const n = new Set(prev); n.delete(member.id); return n; })}
                                      className="p-0.5 bg-zinc-600 hover:bg-zinc-500 rounded text-zinc-200 text-xs transition-colors"
                                      title="Kembalikan biaya kehadiran"
                                    >
                                      ↩
                                    </button>
                                  </>
                                ) : member.attendance_fee > 0 ? (
                                  // Has fee — offer waive or mark as member
                                  <>
                                    <span className="text-yellow-400 text-xs">Rp {member.attendance_fee.toLocaleString('id-ID')}</span>
                                    <button
                                      onClick={() => setOverrideMembership(prev => new Set([...prev, member.id]))}
                                      className="p-0.5 bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
                                      title="Tandai sebagai member (fee = 0)"
                                    >
                                      <Award className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setWaiveAttendanceFee(prev => new Set([...prev, member.id]))}
                                      className="p-0.5 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                                      title="Bebaskan biaya kehadiran"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </>
                                ) : member.has_membership ? (
                                  // Already member in DB
                                  <span className="text-purple-400">Gratis</span>
                                ) : (
                                  // No fee, no membership — offer to mark as member
                                  <>
                                    <span className="text-gray-400 dark:text-zinc-500">-</span>
                                    <button
                                      onClick={() => setOverrideMembership(prev => new Set([...prev, member.id]))}
                                      className="p-0.5 bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
                                      title="Tandai sebagai member"
                                    >
                                      <Award className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              member.attendance_fee > 0 ? (
                                <span className="text-yellow-400">Rp {member.attendance_fee.toLocaleString('id-ID')}</span>
                              ) : member.has_membership ? (
                                <span className="text-purple-400">Gratis</span>
                              ) : (
                                <span className="text-gray-400 dark:text-zinc-500">-</span>
                              )
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white transition-colors duration-300">Rp {member.total_amount.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium transition-colors duration-300 ${
                                member.payment_status === 'paid'
                                  ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30'
                                  : member.payment_status === 'revision'
                                  ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30'
                                  : member.payment_status === 'rejected'
                                  ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30'
                                  : member.payment_status === 'cancelled'
                                  ? 'bg-gray-200 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-500/30'
                                  : member.payment_proof
                                  ? 'bg-amber-100 dark:bg-yellow-500/20 text-amber-700 dark:text-yellow-400 border border-amber-300 dark:border-yellow-500/30'
                                  : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30'
                              }`}
                            >
                              {member.payment_status === 'paid' 
                                ? 'Lunas' 
                                : member.payment_status === 'revision'
                                ? 'Revisi'
                                : member.payment_status === 'rejected'
                                ? 'Ditolak'
                                : member.payment_status === 'cancelled' 
                                ? 'Dibatalkan' 
                                : member.payment_proof
                                ? (member.payment_proof === 'CASH_PAYMENT' ? 'Cash (Menunggu Verifikasi)' : 'Menunggu Verifikasi')
                                : 'Belum Bayar'}
                            </span>
                            {member.payment_status === 'revision' && member.additional_amount && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 transition-colors duration-300">
                                +Rp {member.additional_amount.toLocaleString('id-ID')} perlu dibayar
                              </p>
                            )}
                            {member.payment_proof && member.payment_proof !== 'CASH_PAYMENT' && member.payment_status === 'pending' && (
                              <button
                                onClick={() => setSelectedProof({
                                  type: 'match',
                                  id: member.id,
                                  matchId: match.id,
                                  memberName: member.member_name,
                                  amount: member.total_amount,
                                  proofUrl: member.payment_proof || '',
                                })}
                                onClickCapture={() => setShowProofModal(true)}
                                className="block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1 underline cursor-pointer transition-colors duration-300"
                              >
                                Lihat Bukti
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {!isEditing && (member.payment_status === 'pending' || member.payment_status === 'revision') && (
                              <div className="flex gap-2 justify-end">
                                {member.payment_proof ? (
                                  <button
                                    onClick={() => {
                                      if (member.payment_proof !== 'CASH_PAYMENT') {
                                        setSelectedProof({
                                          type: 'match',
                                          id: member.id,
                                          matchId: match.id,
                                          memberName: member.member_name,
                                          amount: member.total_amount,
                                          proofUrl: member.payment_proof || '',
                                        });
                                        setShowProofModal(true);
                                      } else {
                                        if (confirm(`Konfirmasi pembayaran cash dari ${member.member_name}?`)) {
                                          updatePaymentStatus(match.id, member.id, 'paid');
                                        }
                                      }
                                    }}
                                    className="p-1 bg-green-600 hover:bg-green-700 rounded text-white transition-colors flex items-center gap-1"
                                    title={member.payment_proof === 'CASH_PAYMENT' ? 'Tandai Lunas (Cash)' : 'Lihat & Konfirmasi'}
                                  >
                                    {member.payment_proof === 'CASH_PAYMENT' ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      <>
                                        <Eye className="w-4 h-4" />
                                        <Check className="w-4 h-4" />
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Tandai pembayaran dari ${member.member_name} sebagai lunas?`)) {
                                        updatePaymentStatus(match.id, member.id, 'paid');
                                      }
                                    }}
                                    className="p-1 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"
                                    title="Tandai Lunas"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => updatePaymentStatus(match.id, member.id, 'cancelled')}
                                  className="p-1 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                                  title="Batalkan"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteMatchMember(match.id, member.id, member.member_name)}
                                  className="p-1 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded text-gray-900 dark:text-white transition-colors"
                                  title="Hapus Entri"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
                </>
                )}
              </div>
              );
            })}

            {filteredMatches.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-zinc-400 transition-colors duration-300">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Belum ada data pertandingan</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors duration-300">
            {searchTerm && (
              <div className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-white/10 p-3 transition-colors duration-300">
                <p className="text-sm text-gray-700 dark:text-zinc-300 transition-colors duration-300">
                  Menampilkan <span className="font-semibold text-gray-900 dark:text-white transition-colors duration-300">{filteredMemberships.length}</span> membership 
                  yang cocok dengan "{searchTerm}"
                  {filteredMemberships.length === 0 && (
                    <span className="text-yellow-400 ml-2">- Tidak ada hasil</span>
                  )}
                </p>
              </div>
            )}
            <div className="lg:hidden text-center py-2 text-xs text-gray-500 dark:text-zinc-500 border-t border-gray-200 dark:border-white/10 transition-colors duration-300">
              ← Geser tabel untuk melihat semua kolom →
            </div>
            <div className="overflow-x-auto -mx-6 px-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full min-w-175">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-800/50 transition-colors duration-300">
                    <th className="text-center py-3 sm:py-4 px-2 w-12">
                      <CheckSquare className="w-4 h-4 text-gray-500 dark:text-zinc-500 mx-auto transition-colors duration-300" />
                    </th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300">Nama Anggota</th>
                    <th className="text-center py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300">Bulan</th>
                    <th className="text-center py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300">Minggu</th>
                    <th className="text-right py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300">Jumlah</th>
                    <th className="text-center py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300">Status</th>
                    <th className="text-right py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap transition-colors duration-300">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMemberships.map((membership) => {
                    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    const monthName = monthNames[membership.month - 1];
                    const canSelect = membership.payment_status === 'pending' && membership.payment_proof && membership.payment_proof !== 'CASH_PAYMENT';
                    const isSelected = isPaymentSelected(membership.id, 'membership');
                    
                    return (
                    <tr key={membership.id} className="border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 sm:py-4 px-2 text-center">
                        {canSelect && (
                          <button
                            onClick={() => togglePaymentSelection({
                              id: membership.id,
                              type: 'membership',
                              memberName: membership.member_name,
                              amount: membership.amount,
                              proofUrl: membership.payment_proof || undefined
                            })}
                            className="text-gray-500 dark:text-zinc-400 hover:text-green-500 dark:hover:text-green-400 transition-colors mx-auto"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-green-400" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 font-medium text-sm sm:text-base whitespace-nowrap text-gray-900 dark:text-white transition-colors duration-300">{membership.member_name}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center text-xs sm:text-sm text-gray-600 dark:text-zinc-300 whitespace-nowrap transition-colors duration-300">{monthName} {membership.year}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center text-sm whitespace-nowrap text-gray-900 dark:text-white transition-colors duration-300">{membership.weeks_in_month} minggu</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-right font-semibold text-sm sm:text-base whitespace-nowrap text-gray-900 dark:text-white transition-colors duration-300">Rp {membership.amount.toLocaleString('id-ID')}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                        <span
                          className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-300 ${
                            membership.payment_status === 'paid'
                              ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30'
                              : membership.payment_status === 'rejected'
                              ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30'
                              : membership.payment_status === 'cancelled'
                              ? 'bg-gray-200 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-500/30'
                              : membership.payment_proof
                              ? 'bg-amber-100 dark:bg-yellow-500/20 text-amber-700 dark:text-yellow-400 border border-amber-300 dark:border-yellow-500/30'
                              : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/30'
                          }`}
                        >
                          {membership.payment_status === 'paid' 
                            ? 'Lunas' 
                            : membership.payment_status === 'rejected'
                            ? 'Ditolak'
                            : membership.payment_status === 'cancelled' 
                            ? 'Dibatalkan' 
                            : membership.payment_proof
                            ? (membership.payment_proof === 'CASH_PAYMENT' ? 'Cash (Menunggu Verifikasi)' : 'Menunggu Verifikasi')
                            : 'Belum Bayar'}
                        </span>
                        {membership.payment_proof && membership.payment_proof !== 'CASH_PAYMENT' && membership.payment_status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedProof({
                                type: 'membership',
                                id: membership.id,
                                memberName: membership.member_name,
                                amount: membership.amount,
                                proofUrl: membership.payment_proof || '',
                              });
                              setShowProofModal(true);
                            }}
                            className="block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1 underline cursor-pointer transition-colors duration-300"
                          >
                            Lihat Bukti
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {membership.payment_status === 'pending' && (
                          <div className="flex gap-2 justify-end">
                            {membership.payment_proof ? (
                              <button
                                onClick={() => {
                                  if (membership.payment_proof !== 'CASH_PAYMENT') {
                                    setSelectedProof({
                                      type: 'membership',
                                      id: membership.id,
                                      memberName: membership.member_name,
                                      amount: membership.amount,
                                      proofUrl: membership.payment_proof || '',
                                    });
                                    setShowProofModal(true);
                                  } else {
                                    if (confirm(`Konfirmasi pembayaran cash membership dari ${membership.member_name}?`)) {
                                      updateMembershipStatus(membership.id, 'paid');
                                    }
                                  }
                                }}
                                className="p-1 bg-green-600 hover:bg-green-700 rounded text-white transition-colors flex items-center gap-1"
                                title={membership.payment_proof === 'CASH_PAYMENT' ? 'Tandai Lunas (Cash)' : 'Lihat & Konfirmasi'}
                              >
                                {membership.payment_proof === 'CASH_PAYMENT' ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4" />
                                    <Check className="w-4 h-4" />
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (confirm(`Tandai pembayaran membership dari ${membership.member_name} sebagai lunas?`)) {
                                    updateMembershipStatus(membership.id, 'paid');
                                  }
                                }}
                                className="p-1 bg-green-600 hover:bg-green-700 rounded text-white transition-colors"
                                title="Tandai Lunas"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => updateMembershipStatus(membership.id, 'cancelled')}
                              className="p-1 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                              title="Batalkan"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {membership.payment_status === 'paid' && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openRollbackModal(membership)}
                              className="p-1 bg-orange-600 hover:bg-orange-700 rounded text-white transition-colors flex items-center gap-1"
                              title="Rollback Membership (Kembalikan ke Non-Member)"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredMemberships.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-zinc-400 transition-colors duration-300">
                <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Belum ada data membership</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Match Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Buat Pertandingan Baru</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Image Extraction Option */}
            <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-400/30 rounded-lg transition-colors duration-300">
              <div className="flex items-start gap-3">
                <ImageIcon className="text-blue-600 dark:text-blue-400 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-1 transition-colors duration-300">Ekstraksi dari Gambar</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3 transition-colors duration-300">
                    Upload gambar jadwal pertandingan dan ekstrak data otomatis dengan AI (15-20 pertandingan sekaligus)
                  </p>
                  <a
                    href="/admin/match-image-extraction"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
                  >
                    <ImageIcon size={18} />
                    Gunakan Ekstraksi Gambar
                  </a>
                </div>
              </div>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-white/10 transition-colors duration-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-500 transition-colors duration-300">atau input manual</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-zinc-400 mb-2 transition-colors duration-300">
                  Tanggal Pertandingan (Sabtu)
                </label>
                <input
                  type="date"
                  value={newMatch.match_date}
                  onChange={(e) => {
                    setNewMatch({ ...newMatch, match_date: e.target.value });
                  }}
                  min={(() => {
                    const minDate = new Date();
                    minDate.setMonth(minDate.getMonth() - 2);
                    minDate.setDate(1);
                    return minDate.toISOString().split('T')[0];
                  })()}
                  max={(() => {
                    const maxDate = new Date();
                    maxDate.setMonth(maxDate.getMonth() + 2);
                    maxDate.setDate(0); // Last day of next month
                    return maxDate.toISOString().split('T')[0];
                  })()}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors duration-300"
                />
                {newMatch.match_date && (
                  <p className="text-xs text-green-400 mt-1">
                    {new Date(newMatch.match_date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-zinc-400 mb-2 transition-colors duration-300">
                  Jumlah Shuttlecock
                </label>
                <input
                  type="number"
                  min="1"
                  value={newMatch.shuttlecock_count}
                  onChange={(e) => setNewMatch({ ...newMatch, shuttlecock_count: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors duration-300"
                />
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 transition-colors duration-300">
                  @ Rp 12.000 per shuttlecock = Rp {((newMatch.shuttlecock_count * 12000) / 4).toLocaleString('id-ID')} per orang
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-white/10 pt-4 transition-colors duration-300">
                <label className="block text-sm font-medium text-gray-600 dark:text-zinc-400 mb-2 transition-colors duration-300">
                  4 Anggota
                </label>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((num) => {
                    const memberKey = `member${num}` as keyof typeof newMatch;
                    const memberName = newMatch[memberKey] as string;
                    
                    // Check if member is payment exempt (VIP)
                    const isPaymentExempt = memberName ? paymentExemptMembers.has(memberName.toLowerCase()) : false;
                    
                    // Check membership for the match date's month, not the selected month
                    const memberMembership = memberName ? matchDateMembershipMap[memberName.toLowerCase().trim()] : null;
                    const hasMembershipStatus = isPaymentExempt || !!memberMembership; // Exempt or has PAID membership
                    
                    const willPayMembership = memberName ? createMatchMembershipPayers.has(memberName) : false;
                    const membershipFeeForMatch = (() => {
                      if (!newMatch.match_date) return 40000;
                      const d = new Date(newMatch.match_date);
                      const year = d.getFullYear(), month = d.getMonth();
                      const lastDay = new Date(year, month + 1, 0).getDate();
                      let sats = 0;
                      for (let day = 1; day <= lastDay; day++) { if (new Date(year, month, day).getDay() === 6) sats++; }
                      return sats >= 5 ? 45000 : 40000;
                    })();
                    const costBreakdown = {
                      shuttlecock: isPaymentExempt ? 0 : (newMatch.shuttlecock_count * 12000) / 4,
                      attendance: (isPaymentExempt || memberMembership || willPayMembership) ? 0 : 18000,
                    };
                    const total = costBreakdown.shuttlecock + costBreakdown.attendance + (willPayMembership ? membershipFeeForMatch : 0);

                    return (
                      <div key={num}>
                        <select
                          value={memberName === '__new__' ? '__new__' : memberName}
                          onChange={(e) => {
                            if (e.target.value === '__new__') {
                              setNewMatch({ ...newMatch, [memberKey]: '__new__' });
                              setNewMemberInputs(prev => ({ ...prev, [memberKey]: '' }));
                            } else {
                              setNewMatch({ ...newMatch, [memberKey]: e.target.value });
                              setNewMemberInputs(prev => ({ ...prev, [memberKey]: '' }));
                            }
                          }}
                          className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors duration-300"
                        >
                          <option value="">Pilih Anggota {num}</option>
                          {allMembers.map((member) => (
                            <option key={member.id} value={member.name}>
                              {member.name}
                            </option>
                          ))}
                          <option value="__new__">+ Buat Anggota Baru...</option>
                        </select>
                        {memberName === '__new__' && (
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              placeholder="Ketik nama anggota baru"
                              value={newMemberInputs[memberKey] || ''}
                              onChange={(e) => setNewMemberInputs(prev => ({ ...prev, [memberKey]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') createTempMemberInline(memberKey); }}
                              className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-blue-400 dark:border-blue-400/50 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => createTempMemberInline(memberKey)}
                              disabled={creatingMember[memberKey] || !newMemberInputs[memberKey]?.trim()}
                              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              {creatingMember[memberKey] ? '...' : 'Buat'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setNewMatch({ ...newMatch, [memberKey]: '' }); setNewMemberInputs(prev => ({ ...prev, [memberKey]: '' })); }}
                              className="px-3 py-1.5 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-white rounded-lg text-sm transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        {memberName && (
                          <div className="mt-1 text-xs space-y-1">
                            {isPaymentExempt ? (
                              <>
                                <p className="text-pink-400 flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  VIP - Gratis (Bebas Biaya)
                                </p>
                                <p className="text-white font-semibold">
                                  Total: Rp 0
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-gray-600 dark:text-zinc-400 transition-colors duration-300">
                                  Shuttlecock: Rp {costBreakdown.shuttlecock.toLocaleString('id-ID')}
                                </p>
                                {!memberMembership && !isPaymentExempt && !willPayMembership ? (
                                  <>
                                    <p className="text-yellow-400">
                                      + Kehadiran: Rp {(18000).toLocaleString('id-ID')} (Belum Member {new Date(newMatch.match_date).toLocaleDateString('id-ID', { month: 'long' })})
                                    </p>
                                    <label className="flex items-center gap-2 mt-1 cursor-pointer group">
                                      <input
                                        type="checkbox"
                                        checked={false}
                                        onChange={() => {
                                          setCreateMatchMembershipPayers(prev => {
                                            const next = new Set(prev);
                                            next.add(memberName);
                                            return next;
                                          });
                                        }}
                                        className="w-3.5 h-3.5 rounded accent-amber-400"
                                      />
                                      <span className="text-xs text-amber-300 group-hover:text-amber-200">
                                        Bayar membership sekarang (+Rp {membershipFeeForMatch.toLocaleString('id-ID')})
                                      </span>
                                    </label>
                                    <p className="text-white dark:text-white font-semibold transition-colors duration-300">
                                      Total: Rp {total.toLocaleString('id-ID')}
                                    </p>
                                  </>
                                ) : willPayMembership ? (
                                  <>
                                    <p className="text-amber-300 flex items-center gap-1">
                                      <Award className="w-3 h-3" />
                                      Membership dibayar (+Rp {membershipFeeForMatch.toLocaleString('id-ID')})
                                    </p>
                                    <label className="flex items-center gap-2 mt-1 cursor-pointer group">
                                      <input
                                        type="checkbox"
                                        checked={true}
                                        onChange={() => {
                                          setCreateMatchMembershipPayers(prev => {
                                            const next = new Set(prev);
                                            next.delete(memberName);
                                            return next;
                                          });
                                        }}
                                        className="w-3.5 h-3.5 rounded accent-amber-400"
                                      />
                                      <span className="text-xs text-amber-300 group-hover:text-amber-200">Batal membership</span>
                                    </label>
                                    <p className="text-white dark:text-white font-semibold transition-colors duration-300">
                                      Total: Rp {total.toLocaleString('id-ID')} (termasuk membership)
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-purple-400 flex items-center gap-1">
                                    <Award className="w-3 h-3" />
                                    Member {new Date(newMatch.match_date).toLocaleDateString('id-ID', { month: 'long' })} - Total: Rp {total.toLocaleString('id-ID')}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={createMatch}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Buat Pertandingan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Membership Modal */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl max-w-md w-full p-6 transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Tambah Membership Baru</h2>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1 transition-colors duration-300">
                  <Sparkles className="w-3 h-3" />
                  AI Smart Detection menganalisis jumlah Sabtu bulan ini
                </p>
              </div>
              <button
                onClick={() => setShowMembershipModal(false)}
                className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-zinc-400 mb-2 transition-colors duration-300">
                  Nama Anggota
                </label>
                <select
                  value={newMembership.member_name}
                  onChange={(e) => setNewMembership({ ...newMembership, member_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors duration-300"
                >
                  <option value="">Pilih Anggota</option>
                  {allMembers.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-600 dark:text-zinc-400 transition-colors duration-300">
                    Jumlah Minggu dalam Bulan Ini
                  </label>
                  {weeksAutoDetected && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-linear-to-r from-blue-100 to-cyan-100 dark:from-blue-500/20 dark:to-cyan-500/20 border border-blue-300 dark:border-blue-500/30 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300 transition-colors duration-300">
                      <Sparkles className="w-3 h-3" />
                      Smart Detection
                    </span>
                  )}
                </div>
                <select
                  value={newMembership.weeks_in_month}
                  onChange={(e) => {
                    setNewMembership({ ...newMembership, weeks_in_month: parseInt(e.target.value) });
                    setWeeksAutoDetected(false);
                  }}
                  className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors duration-300"
                >
                  <option value="4">4 Minggu - Rp 40.000</option>
                  <option value="5">5 Minggu - Rp 45.000</option>
                </select>
                {weeksAutoDetected && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1 transition-colors duration-300">
                    <Check className="w-3 h-3" />
                    Terdeteksi otomatis berdasarkan jumlah Sabtu bulan ini
                  </p>
                )}
              </div>

              <div className="bg-purple-100 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/20 rounded-lg p-4 transition-colors duration-300">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 transition-colors duration-300">
                      Total: <span className="font-bold text-lg">{(newMembership.weeks_in_month === 4 ? 40000 : 45000).toLocaleString('id-ID')}</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 transition-colors duration-300">
                      {newMembership.weeks_in_month} minggu × Rp {(newMembership.weeks_in_month === 4 ? 10000 : 9000).toLocaleString('id-ID')}/minggu
                    </p>
                  </div>
                  {weeksAutoDetected && (
                    <div className="bg-blue-200 dark:bg-blue-500/20 border border-blue-400 dark:border-blue-500/30 rounded px-2 py-1 transition-colors duration-300">
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold transition-colors duration-300">✓ Otomatis</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-zinc-400 mt-2 transition-colors duration-300">
                  Member tidak perlu bayar biaya kehadiran Rp 18.000 saat pertandingan
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMembershipModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={createMembership}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Tambah Membership
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-500/5 border border-blue-300 dark:border-blue-500/20 rounded-lg transition-colors duration-300">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2 transition-colors duration-300">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Smart Detection:</strong> Sistem otomatis menghitung jumlah Sabtu dalam bulan untuk menentukan jumlah minggu (4 atau 5 minggu). Setiap sesi badminton adalah Sabtu pukul 20:00.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {/* Bulk Confirmation Modal */}
      {showBulkConfirmModal && selectedPayments.length > 0 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-green-300 dark:border-green-500/30 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                {isConfirmingRevisions ? 'Konfirmasi Revisi (Bulk)' : 'Konfirmasi Pembayaran (Bulk)'}
              </h3>
              <button
                onClick={closeBulkConfirmModal}
                className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-300 p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Selected Payments Summary */}
            <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-green-400 font-medium">
                  {isConfirmingRevisions 
                    ? `${selectedPayments.length} Revisi akan dikonfirmasi:` 
                    : `${selectedPayments.length} Pembayaran akan dikonfirmasi:`
                  }
                </p>
                {!isConfirmingRevisions && (() => {
                  const withProof = selectedPayments.filter(p => p.proofUrl).length;
                  const withoutProof = selectedPayments.length - withProof;
                  if (withoutProof > 0) {
                    return (
                      <div className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded">
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-400">{withoutProof} tanpa bukti</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedPayments.map((payment, index) => (
                  <div key={`${payment.type}-${payment.id}`} className="flex items-center justify-between bg-zinc-800/50 rounded px-3 py-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-zinc-500">{index + 1}.</span>
                      {isConfirmingRevisions ? (
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 font-medium">
                          Revisi
                        </span>
                      ) : (
                        <>
                          {payment.proofUrl ? (
                            <span title="Ada bukti">
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            </span>
                          ) : (
                            <span title="Tanpa bukti">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                            </span>
                          )}
                        </>
                      )}
                      <div className="flex-1">
                        <span className="text-sm text-white font-medium">
                          {payment.memberName}
                        </span>
                        <span className="text-xs text-zinc-400 ml-2">
                          ({payment.type === 'match' ? 'Pertandingan' : 'Membership'})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!isConfirmingRevisions && payment.proofUrl && (
                        <a
                          href={payment.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors p-1.5 hover:bg-blue-500/10 rounded"
                          title="Lihat Bukti Pembayaran"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                      <span className="text-sm font-semibold text-green-400">
                        Rp {payment.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-green-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-green-400">
                    {isConfirmingRevisions ? 'Total Tambahan:' : 'Total Pendapatan:'}
                  </span>
                  <span className="text-2xl font-bold text-white">
                    Rp {selectedPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmation Warning */}
            <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-sm text-amber-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <strong>Perhatian:</strong> {isConfirmingRevisions 
                    ? 'Tindakan ini akan mengkonfirmasi pembayaran revisi dan menandai semua pembayaran terpilih sebagai LUNAS. Status revisi akan dihapus.'
                    : 'Tindakan ini akan menandai semua pembayaran terpilih sebagai LUNAS dan mengupdate status pembayaran. Pastikan semua bukti pembayaran sudah diverifikasi.'
                  }
                </span>
              </p>
            </div>

            {/* Irreversible Action Confirmation - Only show if there are payments without proof and not confirming revisions */}
            {!isConfirmingRevisions && (() => {
              const paymentsWithoutProof = selectedPayments.filter(p => !p.proofUrl).length;
              if (paymentsWithoutProof > 0) {
                return (
                  <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-sm text-red-400 font-semibold mb-3 flex items-center gap-2">
                      <Ban className="w-4 h-4" />
                      Verifikasi Ganda Diperlukan
                    </p>
                    <p className="text-xs text-red-300 mb-4">
                      {paymentsWithoutProof} pembayaran TANPA bukti transfer akan dikonfirmasi. Tindakan ini <strong>TIDAK DAPAT DIBATALKAN</strong>. Pastikan Anda sudah menerima konfirmasi pembayaran melalui cara lain (cash, confirm langsung, dll).
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={confirmIrreversible}
                        onChange={(e) => setConfirmIrreversible(e.target.checked)}
                        className="mt-0.5 w-5 h-5 rounded border-2 border-red-500/50 bg-zinc-800 checked:bg-red-600 checked:border-red-600 focus:ring-2 focus:ring-red-500/50 transition-all cursor-pointer"
                      />
                      <span className="text-xs text-red-200 group-hover:text-red-100 transition-colors">
                        Saya memahami bahwa tindakan ini <strong>TIDAK DAPAT DIBATALKAN</strong> dan sudah memverifikasi pembayaran melalui cara lain.
                      </span>
                    </label>
                  </div>
                );
              }
              return null;
            })()}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeBulkConfirmModal}
                className="flex-1 bg-zinc-800 text-zinc-300 px-6 py-3 rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-white/10"
              >
                Batal
              </button>
              <button
                onClick={isConfirmingRevisions ? handleBulkConfirmRevisions : handleBulkConfirmPayments}
                disabled={bulkConfirming}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
              >
                {bulkConfirming ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {isConfirmingRevisions 
                      ? `Konfirmasi ${selectedPayments.length} Revisi`
                      : `Konfirmasi ${selectedPayments.length} Pembayaran`
                    }
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Revision Modal */}
      {showBulkRevisionModal && selectedPayments.length > 0 && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-amber-500/30 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                <Edit className="w-6 h-6 text-amber-400" />
                Buat Revisi Pembayaran (Bulk)
              </h3>
              <button
                onClick={closeBulkRevisionModal}
                className="text-zinc-400 hover:text-zinc-300 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Selected Members Summary */}
            <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-sm text-amber-400 font-medium mb-3">
                {selectedPayments.length} Member akan dibuatkan revisi pembayaran:
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedPayments.map((payment, index) => (
                  <div key={`${payment.type}-${payment.id}`} className="flex items-center justify-between bg-zinc-800/50 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{index + 1}.</span>
                      <div>
                        <span className="text-sm text-white font-medium">
                          {payment.memberName}
                        </span>
                        <span className="text-xs text-zinc-400 ml-2">
                          ({payment.type === 'match' ? 'Pertandingan' : 'Membership'})
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-amber-400">
                      Sudah lunas: Rp {payment.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revision Details Form */}
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Jumlah Revisi (Additional Amount) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={bulkRevisionAmount}
                  onChange={(e) => setBulkRevisionAmount(e.target.value)}
                  placeholder="Contoh: 30000"
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Jumlah tambahan yang perlu dibayar oleh member
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Alasan Revisi <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={bulkRevisionReason}
                  onChange={(e) => setBulkRevisionReason(e.target.value)}
                  placeholder="Contoh: Penambahan shuttlecock, perubahan biaya venue, dll"
                  rows={3}
                  className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Jelaskan mengapa revisi diperlukan
                </p>
              </div>
            </div>

            {/* Warning */}
            <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <strong>Info:</strong> Revisi akan mengubah status pembayaran menjadi <strong>REVISION</strong> dan menambahkan tagihan tambahan sebesar jumlah yang diinput. Member perlu melakukan pembayaran tambahan.
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeBulkRevisionModal}
                className="flex-1 bg-zinc-800 text-zinc-300 px-6 py-3 rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-white/10"
              >
                Batal
              </button>
              <button
                onClick={handleBulkCreateRevisions}
                disabled={bulkRevising || !bulkRevisionAmount || !bulkRevisionReason}
                className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {bulkRevising ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <Edit className="w-5 h-5" />
                    Buat Revisi untuk {selectedPayments.length} Member
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Modal */}
      {showProofModal && selectedProof && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">Bukti Pembayaran</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {selectedProof.memberName} • Rp {selectedProof.amount.toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowProofModal(false);
                    setSelectedProof(null);
                  }}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Image Preview */}
              <div className="bg-zinc-800 rounded-lg overflow-hidden mb-6">
                <img
                    src={selectedProof.proofUrl ?? ''}
                    alt="Bukti Pembayaran"
                    className="w-full h-auto max-h-[60vh] object-contain"
                    onError={(e) => {
                      // If image fails to load, show PDF or file link
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="p-12 text-center">
                            <p class="text-zinc-400 mb-4">Tidak dapat menampilkan preview. File mungkin berupa PDF atau format lain.</p>
                            <a href="${selectedProof.proofUrl ?? ''}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                              </svg>
                              Buka File
                            </a>
                          </div>
                        `;
                      }
                    }}
                  />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProofModal(false);
                    setSelectedProof(null);
                  }}
                  className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-300 rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-white/10"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setPaymentToReject({
                      type: selectedProof.type,
                      id: selectedProof.id,
                      matchId: selectedProof.matchId,
                      memberName: selectedProof.memberName,
                    });
                    setShowRejectModal(true);
                  }}
                  className="px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Tolak
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Konfirmasi pembayaran dari ${selectedProof.memberName}?`)) {
                      if (selectedProof.type === 'match' && selectedProof.matchId) {
                        updatePaymentStatus(selectedProof.matchId, selectedProof.id, 'paid');
                      } else if (selectedProof.type === 'membership') {
                        updateMembershipStatus(selectedProof.id, 'paid');
                      }
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Konfirmasi Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && paymentToReject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-xl max-w-lg w-full shadow-2xl">
            <div className="bg-red-500/10 border-b border-red-500/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    Tolak Bukti Pembayaran
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    {paymentToReject.memberName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setPaymentToReject(null);
                    setRejectionReason('');
                    setCustomRejectionReason('');
                  }}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-zinc-300 mb-4">
                Pilih alasan penolakan. Member akan dapat mengupload ulang bukti pembayaran yang benar.
              </p>

              {/* Rejection Reasons */}
              <div className="space-y-2 mb-4">
                {[
                  { value: 'Foto tidak jelas/buram', label: 'Foto tidak jelas/buram' },
                  { value: 'Jumlah transfer tidak sesuai', label: 'Jumlah transfer tidak sesuai' },
                  { value: 'Rekening tujuan salah', label: 'Rekening tujuan salah' },
                  { value: 'Tanggal transfer tidak sesuai periode', label: 'Tanggal transfer tidak sesuai periode' },
                  { value: 'Bukti palsu/di-edit', label: 'Bukti palsu/di-edit' },
                  { value: 'other', label: 'Lainnya (tulis alasan)' },
                ].map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      rejectionReason === reason.value
                        ? 'bg-red-500/10 border-red-500/50'
                        : 'bg-zinc-800/50 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejection-reason"
                      value={reason.value}
                      checked={rejectionReason === reason.value}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-zinc-200">{reason.label}</span>
                  </label>
                ))}
              </div>

              {/* Custom Reason Input */}
              {rejectionReason === 'other' && (
                <div className="mb-4">
                  <textarea
                    value={customRejectionReason}
                    onChange={(e) => setCustomRejectionReason(e.target.value)}
                    placeholder="Tulis alasan penolakan..."
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              )}

              {/* Warning */}
              <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-sm text-amber-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Member akan menerima notifikasi dan dapat mengupload ulang bukti pembayaran yang benar.
                  </span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setPaymentToReject(null);
                    setRejectionReason('');
                    setCustomRejectionReason('');
                  }}
                  disabled={rejecting}
                  className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-300 rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-white/10 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleRejectPayment}
                  disabled={rejecting || (!rejectionReason || (rejectionReason === 'other' && !customRejectionReason.trim()))}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {rejecting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Menolak...
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5" />
                      Tolak Bukti
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Fee Info Modal */}
      {showAttendanceInfoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Status Biaya Kehadiran</h3>
              </div>
              <button
                onClick={() => setShowAttendanceInfoModal(false)}
                className="p-1 hover:bg-zinc-800 rounded transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-zinc-400 mb-4">
                Biaya kehadiran Rp 18.000 dibayar <span className="text-white font-semibold">sekali per hari</span> (bukan per pertandingan):
              </p>

              <div className="space-y-3">
                {/* Rp 18.000 */}
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400 font-mono font-semibold">Rp 18.000</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Member <span className="text-white">bayar biaya kehadiran</span> di pertandingan ini (pertama kali hari itu)
                  </p>
                </div>

                {/* Dash - */}
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-zinc-500 font-mono font-semibold text-lg">-</span>
                    <span className="text-xs text-zinc-500">(dash)</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Member <span className="text-white">sudah bayar</span> di pertandingan lain hari ini (tidak dikenakan lagi)
                  </p>
                </div>

                {/* Gratis */}
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-purple-400 font-semibold">Gratis</span>
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <p className="text-xs text-zinc-400">
                    Member <span className="text-white">punya membership</span> bulan ini (tidak perlu bayar kehadiran)
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-zinc-500 italic">
                  💡 Contoh: Peno main 3 pertandingan → hanya bayar kehadiran Rp 18.000 di pertandingan pertama
                </p>
              </div>

              <button
                onClick={() => setShowAttendanceInfoModal(false)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Membership Rollback Confirmation Modal */}
      {showRollbackModal && rollbackMembership && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl border border-orange-500/30 max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-semibold text-white">Rollback Membership?</h3>
              </div>
              <button
                onClick={() => {
                  setShowRollbackModal(false);
                  setRollbackMembership(null);
                  setRollbackPreview(null);
                }}
                className="p-1 hover:bg-zinc-800 rounded transition-colors"
                disabled={isLoadingRollback}
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <p className="text-sm text-orange-200 font-medium mb-2">⚠️ Peringatan:</p>
                <p className="text-xs text-zinc-300">
                  Tindakan ini akan menghapus membership dan mengembalikan member ke status non-membership. 
                  Member akan dikenakan biaya kehadiran Rp 18.000 per hari untuk pertandingan yang belum dibayar.
                </p>
              </div>

              <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Member:</span>
                  <span className="text-white font-medium">{rollbackMembership.member_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Bulan:</span>
                  <span className="text-white">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][rollbackMembership.month - 1]} {rollbackMembership.year}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Status:</span>
                  <span className="text-green-400 font-medium">Lunas</span>
                </div>
              </div>

              {isLoadingRollback ? (
                <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-2"></div>
                  <p className="text-sm text-zinc-400">Memuat preview...</p>
                </div>
              ) : rollbackPreview ? (
                <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-white mb-2">Dampak Rollback:</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Pertandingan pending:</span>
                    <span className="text-white font-medium">{rollbackPreview.total_pending_matches} match</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Hari yang terpengaruh:</span>
                    <span className="text-white font-medium">{rollbackPreview.matches_will_get_attendance_fee} hari</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-2">
                    <span className="text-zinc-400">Total biaya kehadiran ditambahkan:</span>
                    <span className="text-orange-400 font-bold">+ Rp {rollbackPreview.total_attendance_fees_to_add.toLocaleString('id-ID')}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2 italic">
                    * Biaya kehadiran akan dikenakan sekali per hari pertandingan
                  </p>
                </div>
              ) : null}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRollbackModal(false);
                    setRollbackMembership(null);
                    setRollbackPreview(null);
                  }}
                  disabled={isLoadingRollback}
                  className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={executeRollback}
                  disabled={isLoadingRollback || !rollbackPreview}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoadingRollback ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Rollback Membership
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Month Creation Confirmation Modal */}
      {showNextMonthConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Konfirmasi Pembuatan</h3>
            </div>
            <p className="text-zinc-300 mb-6">
              Anda akan membuat {pendingCreateAction === 'match' ? 'pertandingan' : 'membership'} untuk{' '}
              <span className="font-semibold text-white">
                {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </span>{' '}
              (bulan depan). Apakah Anda yakin?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNextMonthConfirm(false);
                  setPendingCreateAction(null);
                }}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmNextMonthCreation}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay
        steps={tutorialSteps}
        isActive={isTutorialActive}
        onClose={closeTutorial}
        tutorialKey="admin-pembayaran"
      />

      {/* WA + Email Notification Result Modal */}
      {waNotificationResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl w-full max-w-lg p-6 transition-colors duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                <span className="text-xl">🔔</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Hasil Notifikasi</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">WhatsApp &amp; Email telah dikirim ke anggota</p>
              </div>
            </div>

            {/* WA Section */}
            {waNotificationResult.wa && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📱</span>
                  <span className="font-semibold text-gray-800 dark:text-zinc-200 text-sm">WhatsApp</span>
                  <div className="flex gap-1.5 ml-auto">
                    <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">{waNotificationResult.wa.summary.sent} terkirim</span>
                    {waNotificationResult.wa.summary.failed > 0 && <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">{waNotificationResult.wa.summary.failed} gagal</span>}
                    {waNotificationResult.wa.summary.skipped > 0 && <span className="text-xs bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">{waNotificationResult.wa.summary.skipped} dilewati</span>}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg divide-y divide-gray-100 dark:divide-white/5">
                  {waNotificationResult.wa.results.map((r, i) => (
                    <div key={i} className="flex items-start justify-between text-sm px-3 py-2 gap-2">
                      <span className="font-medium text-gray-800 dark:text-zinc-200 shrink-0">{r.name}</span>
                      <div className="flex flex-col items-end text-right">
                        {r.status === 'sent' && <span className="text-green-600 dark:text-green-400">✓ Terkirim</span>}
                        {r.status === 'failed' && <><span className="text-red-500">✗ Gagal</span>{r.error && <span className="text-xs text-red-400 mt-0.5">{r.error}</span>}</>}
                        {r.status === 'skipped' && <span className="text-gray-400">— No HP kosong</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email Section */}
            {waNotificationResult.email && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">✉️</span>
                  <span className="font-semibold text-gray-800 dark:text-zinc-200 text-sm">Email</span>
                  <div className="flex gap-1.5 ml-auto">
                    <span className="text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">{waNotificationResult.email.summary.sent} terkirim</span>
                    {waNotificationResult.email.summary.failed > 0 && <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">{waNotificationResult.email.summary.failed} gagal</span>}
                    {waNotificationResult.email.summary.skipped > 0 && <span className="text-xs bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">{waNotificationResult.email.summary.skipped} dilewati</span>}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg divide-y divide-gray-100 dark:divide-white/5">
                  {waNotificationResult.email.results.map((r, i) => (
                    <div key={i} className="flex items-start justify-between text-sm px-3 py-2 gap-2">
                      <span className="font-medium text-gray-800 dark:text-zinc-200 shrink-0">{r.name}</span>
                      <div className="flex flex-col items-end text-right">
                        {r.status === 'sent' && <span className="text-green-600 dark:text-green-400">✓ Terkirim</span>}
                        {r.status === 'failed' && <><span className="text-red-500">✗ Gagal</span>{r.error && <span className="text-xs text-red-400 mt-0.5">{r.error}</span>}</>}
                        {r.status === 'skipped' && <span className="text-gray-400">— Email kosong</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setWaNotificationResult(null)}
              className="w-full py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-zinc-200 text-white dark:text-gray-900 rounded-lg font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Custom Period Report Modal */}
      {showCustomPeriodModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Laporan Periode Custom</h3>
              </div>
              <button
                onClick={() => setShowCustomPeriodModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={customPeriodData.startDate}
                  onChange={(e) => setCustomPeriodData({
                    ...customPeriodData,
                    startDate: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={customPeriodData.endDate}
                  onChange={(e) => setCustomPeriodData({
                    ...customPeriodData,
                    endDate: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white transition-colors"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Laporan akan dihasilkan untuk periode: <span className="font-semibold">{new Date(customPeriodData.startDate).toLocaleDateString('id-ID')} - {new Date(customPeriodData.endDate).toLocaleDateString('id-ID')}</span>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCustomPeriodModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-900 dark:text-white rounded-lg transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleGenerateCustomPeriodReport(false)}
                  disabled={isGeneratingReport}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isGeneratingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Sedang dibuat...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Buat Laporan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
