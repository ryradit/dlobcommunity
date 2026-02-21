'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { CreditCard, TrendingUp, AlertCircle, Users, Award, Plus, X, Search, Check, Ban, Eye, Trash2, ChevronDown, ChevronUp, Edit, Save, Image as ImageIcon, CheckSquare, Square, Sparkles, Send, Zap, HelpCircle } from 'lucide-react';
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
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchMembers, setMatchMembers] = useState<Record<string, MatchMember[]>>({});
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [membershipMap, setMembershipMap] = useState<Record<string, Membership>>({});
  const [allMembers, setAllMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});
  const [editingMatch, setEditingMatch] = useState<{
    matchId: string;
    match_date: string;
    shuttlecock_count: number;
    members: Record<string, { name: string; memberId: string }>;
  } | null>(null);
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
    type: 'auto-confirm' | 'confirm-all' | 'send-reminders' | 'flag-suspicious' | 'generate-report';
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

  // Tutorial for pembayaran page
  const tutorialSteps = getTutorialSteps('pembayaran');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('admin-pembayaran', tutorialSteps);
  
  // Report generation
  const { generateFinancialReport, isGenerating: isGeneratingReport } = useReportGenerator();

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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Fetch all data in parallel for faster loading
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const [matchesResult, membershipsResult, profilesResult] = await Promise.allSettled([
        // Fetch matches with caching
        cachedQuery(
          'admin-payment-matches',
          async () => {
            const result = await supabase
              .from('matches')
              .select('*')
              .order('match_number', { ascending: false });
            return result;
          },
          30000 // 30 seconds cache
        ),
        // Fetch memberships with caching
        cachedQuery(
          `admin-memberships-${currentMonth}-${currentYear}`,
          async () => {
            const result = await supabase
              .from('memberships')
              .select('*')
              .eq('month', currentMonth)
              .eq('year', currentYear)
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
    };
    loadData();
  }, [pathname]);

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
      // Get all paid memberships for current month
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const { data: paidMemberships, error: membershipError } = await supabase
        .from('memberships')
        .select('member_name')
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .eq('payment_status', 'paid');

      if (membershipError) throw membershipError;

      if (paidMemberships && paidMemberships.length > 0) {
        // Update all pending matches for members with paid membership
        const memberNames = paidMemberships.map(m => m.member_name);
        
        const { data: updated, error: updateError } = await supabase
          .from('match_members')
          .update({
            attendance_fee: 0,
            has_membership: true,
          })
          .in('member_name', memberNames)
          .eq('payment_status', 'pending')
          .select();

        if (updateError) {
          console.error('Error recalculating attendance fees:', updateError);
        }
      }
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

  function hasMembership(memberName: string): boolean {
    return membershipMap[memberName.toLowerCase()]?.payment_status === 'paid';
  }

  // Fetch Smart Suggestions (MVP Feature)
  async function fetchSmartSuggestions() {
    if (loadingSuggestions) return;
    
    setLoadingSuggestions(true);
    try {
      const now = new Date();
      const response = await fetch('/api/ai/payment-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: now.getMonth() + 1,
          year: now.getFullYear()
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

  // Load smart suggestions when data changes
  useEffect(() => {
    if (!loading && matches.length > 0) {
      fetchSmartSuggestions();
    }
  }, [loading, matches.length, memberships.length]);

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
    } else if (action.type === 'generate-report') {
      // Generate financial report
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
    matches.forEach(match => {
      const members = matchMembers[match.id] || [];
      members.forEach(member => {
        allPayments.push({
          memberName: member.member_name,
          type: `Match #${match.match_number}`,
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

      // Validate that selected date is a Saturday
      const selectedDate = new Date(newMatch.match_date);
      if (selectedDate.getDay() !== 6) {
        alert('Tanggal pertandingan harus hari Sabtu!');
        return;
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

      // Create match members
      const membersData = members.map(memberName => {
        const hasMembershipStatus = hasMembership(memberName);
        const attendanceFee = hasMembershipStatus ? 0 : 18000;
        
        return {
          match_id: match.id,
          member_name: memberName,
          amount_due: costPerMember,
          attendance_fee: attendanceFee,
          has_membership: hasMembershipStatus,
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
      fetchMatches();
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

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const amount = newMembership.weeks_in_month === 4 ? 40000 : 45000;

      const { error } = await supabase
        .from('memberships')
        .insert({
          member_name: newMembership.member_name,
          month: currentMonth,
          year: currentYear,
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
      // Validate date is Saturday if provided
      if (editingMatch.match_date) {
        const selectedDate = new Date(editingMatch.match_date);
        if (selectedDate.getDay() !== 6) {
          alert('Tanggal pertandingan harus hari Sabtu!');
          return;
        }
      }

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

      // Update members
      for (const [memberId, memberData] of Object.entries(editingMatch.members)) {
        const hasMembershipStatus = hasMembership(memberData.name);
        const attendanceFee = hasMembershipStatus ? 0 : 18000;
        
        // Get current member data
        const currentMember = matchMembers[editingMatch.matchId]?.find(m => m.id === memberId);
        
        // If shuttlecock increased and member already paid, set to revision
        if (shuttlecockIncreased && currentMember?.payment_status === 'paid') {
          // Try to update with revision status and additional_amount
          let updateData: any = {
            member_name: memberData.name,
            amount_due: newCostPerMember,
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
                amount_due: newCostPerMember,
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
              amount_due: newCostPerMember,
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
      fetchMatches();
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
      fetchMatches();
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
      fetchMatches();
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
      await Promise.all([fetchMatches(), fetchMemberships()]);
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
      await Promise.all([fetchMatches(), fetchMemberships()]);
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
      
      await Promise.all([fetchMatches(), fetchMemberships()]);
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
      await Promise.all([fetchMatches(), fetchMemberships()]);
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
      fetchMatches();
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
      await Promise.all([fetchMemberships(), fetchMatches()]);
      setShowProofModal(false);
      setSelectedProof(null);
    } catch (error) {
      console.error('Error updating membership status:', error);
      alert('Gagal mengupdate status membership');
    }
  }

  const filteredMatches = matches.filter(match =>
    matchMembers[match.id]?.some(member =>
      member.member_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Pembayaran</h1>
            <p className="text-sm sm:text-base text-zinc-400">Kelola pembayaran pertandingan dan membership</p>
          </div>
          
          <button
            onClick={toggleTutorial}
            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
            title="Tampilkan panduan fitur"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Monthly Recap */}
        <div className="mb-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Rekap Bulan Ini</h2>
              <p className="text-sm text-zinc-400">
                {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-400 mb-1">Tingkat Penagihan</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-zinc-800 rounded-full h-2 w-32">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
                <span className="text-lg font-bold text-white">{collectionRate}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-black/30 border border-white/10 rounded-lg p-4">
              <p className="text-xs text-zinc-400 mb-1">Total Pendapatan</p>
              <p className="text-xl font-bold text-green-400">
                Rp {monthlyRecap.totalRevenue.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-4">
              <p className="text-xs text-zinc-400 mb-1">Menunggu Pembayaran</p>
              <p className="text-xl font-bold text-yellow-400">
                Rp {monthlyRecap.totalPending.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-4">
              <p className="text-xs text-zinc-400 mb-1">Total Diharapkan</p>
              <p className="text-xl font-bold text-blue-400">
                Rp {monthlyRecap.totalExpected.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="bg-black/30 border border-white/10 rounded-lg p-4">
              <p className="text-xs text-zinc-400 mb-1">Selisih</p>
              <p className={`text-xl font-bold ${monthlyRecap.totalPending > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                Rp {(monthlyRecap.totalExpected - monthlyRecap.totalRevenue).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-400">Pertandingan</h3>
                <span className="text-xs text-zinc-500">{monthlyRecap.totalMatches} total</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Pendapatan</span>
                  <span className="text-sm font-semibold text-white">
                    Rp {monthlyRecap.matchesRevenue.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Lunas</span>
                  <span className="text-sm font-semibold text-green-400">
                    {monthlyRecap.paidMatchesCount} / {monthlyRecap.totalMatches}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-black/30 border border-purple-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-purple-400">Membership</h3>
                <span className="text-xs text-zinc-500">{monthlyRecap.totalMemberships} total</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Pendapatan</span>
                  <span className="text-sm font-semibold text-white">
                    Rp {monthlyRecap.membershipsRevenue.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Lunas</span>
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
          <div className="smart-actions-section mb-6 bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">Smart Actions</h2>
                <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  {smartActions.length} available
                </span>
              </div>
              {loadingSuggestions && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
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
                      ? 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20'
                      : action.priority === 'medium'
                      ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
                      : 'bg-blue-500/10 border-blue-500/40 hover:bg-blue-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{action.icon}</span>
                    {action.count && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        action.priority === 'high'
                          ? 'bg-emerald-500 text-white'
                          : action.priority === 'medium'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {action.count}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{action.title}</h3>
                  <p className="text-xs text-zinc-400">{action.description}</p>
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
                className={`p-4 rounded-lg border-l-4 flex items-start justify-between gap-4 ${
                  card.type === 'success'
                    ? 'bg-green-500/10 border-green-500'
                    : card.type === 'attention'
                    ? 'bg-red-500/10 border-red-500'
                    : card.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500'
                    : 'bg-blue-500/10 border-blue-500'
                }`}
              >
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">{card.title}</h3>
                  <p className="text-xs text-zinc-300 mb-3">{card.description}</p>
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
                    className="text-zinc-400 hover:text-white transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('matches')}
            className={`pembayaran-tab-matches px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'matches'
                ? 'text-blue-400'
                : 'text-zinc-400 hover:text-white'
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
                ? 'text-purple-400'
                : 'text-zinc-400 hover:text-white'
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
          <div className="bulk-actions mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CheckSquare className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-sm font-semibold text-green-400">
                    {selectedPayments.length} pembayaran dipilih
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
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
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Batalkan pilihan"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {activeTab === 'matches' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Total Pembayaran</p>
                  <p className="text-2xl font-bold">Rp {matchesStats.totalAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Sudah Dibayar</p>
                  <p className="text-2xl font-bold">Rp {matchesStats.paidAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Belum Dibayar</p>
                  <p className="text-2xl font-bold">Rp {matchesStats.pendingAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Total Membership</p>
                  <p className="text-2xl font-bold">Rp {membershipsStats.totalAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Sudah Dibayar</p>
                  <p className="text-2xl font-bold">Rp {membershipsStats.paidAmount.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Belum Dibayar</p>
                  <p className="text-2xl font-bold">Rp {membershipsStats.pendingAmount.toLocaleString('id-ID')}</p>
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
              className="pembayaran-search w-full pl-10 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {activeTab === 'matches' ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Buat Pertandingan
            </button>
          ) : (
            <button
              onClick={() => setShowMembershipModal(true)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Tambah Membership
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'matches' ? (
          <div className="payment-table space-y-6">
            {searchTerm && (
              <div className="bg-zinc-900 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-zinc-300">
                  Menampilkan <span className="font-semibold text-white">{filteredMatches.length}</span> pertandingan 
                  dengan anggota yang cocok dengan "{searchTerm}"
                  {filteredMatches.length === 0 && (
                    <span className="text-yellow-400 ml-2">- Tidak ada hasil</span>
                  )}
                </p>
              </div>
            )}
            {filteredMatches.map((match) => {
              const isExpanded = expandedMatches[match.id] ?? true;
              const isEditing = editingMatch?.matchId === match.id;
              return (
              <div key={match.id} className={`bg-zinc-900 border rounded-xl p-6 ${isEditing ? 'border-blue-500' : 'border-white/10'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedMatches(prev => ({ ...prev, [match.id]: !isExpanded }))}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        title={isExpanded ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-zinc-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold">Pertandingan #{match.match_number}</h3>
                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <div>
                              <label className="text-xs text-zinc-400">Tanggal (Sabtu)</label>
                              <input
                                type="date"
                                value={editingMatch.match_date}
                                onChange={(e) => {
                                  const selectedDate = new Date(e.target.value);
                                  if (selectedDate.getDay() === 6 || !e.target.value) {
                                    setEditingMatch({ ...editingMatch, match_date: e.target.value });
                                  } else {
                                    alert('Harap pilih hari Sabtu!');
                                  }
                                }}
                                className="w-full px-3 py-1 bg-zinc-800 border border-white/10 rounded text-white text-sm mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-400">Jumlah Shuttlecock</label>
                              <input
                                type="number"
                                min="1"
                                value={editingMatch.shuttlecock_count}
                                onChange={(e) => setEditingMatch({ ...editingMatch, shuttlecock_count: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-1 bg-zinc-800 border border-white/10 rounded text-white text-sm mt-1"
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                    {match.match_date ? (
                      <p className="text-sm text-zinc-400">
                        Jadwal: {new Date(match.match_date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-400">
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
                          onClick={() => setEditingMatch(null)}
                          className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm transition-colors flex items-center gap-1"
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
                          <p className="text-sm text-zinc-400">Shuttlecock: {match.shuttlecock_count}</p>
                          <p className="text-sm text-zinc-400">Total Per Orang: Rp {((match.shuttlecock_count * 12000) / 4).toLocaleString('id-ID')}</p>
                        </div>
                        <button
                          onClick={() => startEditingMatch(match)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          title="Edit Pertandingan"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMatch(match.id, match.match_number)}
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
                  <div className="lg:hidden text-center py-2 text-xs text-zinc-500 border-t border-white/10">
                    ← Geser tabel untuk melihat semua kolom →
                  </div>
                  <div className="overflow-x-auto -mx-6 px-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-center py-3 px-2 w-12">
                          <CheckSquare className="w-4 h-4 text-zinc-500 mx-auto" />
                        </th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Nama</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Shuttlecock</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Kehadiran</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Total</th>
                        <th className="text-center py-3 px-4 text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Status</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchMembers[match.id]
                        ?.filter(member => 
                          !searchTerm || member.member_name.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((member) => {
                        const canSelect = member.payment_status === 'pending' && member.payment_proof && member.payment_proof !== 'CASH_PAYMENT';
                        const isSelected = isPaymentSelected(member.id, 'match');
                        
                        return (
                        <tr key={member.id} className="border-b border-white/5 last:border-0">
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
                                className="text-zinc-400 hover:text-green-400 transition-colors mx-auto"
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
                                className="w-full px-3 py-1 bg-zinc-800 border border-white/10 rounded text-white text-sm"
                              >
                                {allMembers.map((m) => (
                                  <option key={m.id} value={m.name}>{m.name}</option>
                                ))}
                              </select>
                            ) : (
                            <div className="flex items-center gap-2">
                              <span>{member.member_name}</span>
                              {member.has_membership && (
                                <div title="Member aktif">
                                  <Award className="w-4 h-4 text-purple-400" />
                                </div>
                              )}
                            </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">Rp {member.amount_due.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 text-right">
                            {member.attendance_fee > 0 ? (
                              <span className="text-yellow-400">Rp {member.attendance_fee.toLocaleString('id-ID')}</span>
                            ) : (
                              <span className="text-purple-400">Gratis</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold">Rp {member.total_amount.toLocaleString('id-ID')}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                member.payment_status === 'paid'
                                  ? 'bg-green-500/20 text-green-400'
                                  : member.payment_status === 'revision'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : member.payment_status === 'rejected'
                                  ? 'bg-red-500/20 text-red-400'
                                  : member.payment_status === 'cancelled'
                                  ? 'bg-gray-500/20 text-gray-400'
                                  : member.payment_proof
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-orange-500/20 text-orange-400'
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
                              <p className="text-xs text-blue-400 mt-1">
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
                                className="block text-xs text-blue-400 hover:text-blue-300 mt-1 underline cursor-pointer"
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
                                  className="p-1 bg-zinc-700 hover:bg-zinc-600 rounded text-white transition-colors"
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
              <div className="text-center py-12 text-zinc-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Belum ada data pertandingan</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
            {searchTerm && (
              <div className="bg-zinc-800 border-b border-white/10 p-3">
                <p className="text-sm text-zinc-300">
                  Menampilkan <span className="font-semibold text-white">{filteredMemberships.length}</span> membership 
                  yang cocok dengan "{searchTerm}"
                  {filteredMemberships.length === 0 && (
                    <span className="text-yellow-400 ml-2">- Tidak ada hasil</span>
                  )}
                </p>
              </div>
            )}
            <div className="lg:hidden text-center py-2 text-xs text-zinc-500 border-t border-white/10">
              ← Geser tabel untuk melihat semua kolom →
            </div>
            <div className="overflow-x-auto -mx-6 px-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 bg-zinc-800/50">
                    <th className="text-center py-3 sm:py-4 px-2 w-12">
                      <CheckSquare className="w-4 h-4 text-zinc-500 mx-auto" />
                    </th>
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Nama Anggota</th>
                    <th className="text-center py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Bulan</th>
                    <th className="text-center py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Minggu</th>
                    <th className="text-right py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Jumlah</th>
                    <th className="text-center py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Status</th>
                    <th className="text-right py-3 sm:py-4 px-3 sm:px-6 text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMemberships.map((membership) => {
                    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    const monthName = monthNames[membership.month - 1];
                    const canSelect = membership.payment_status === 'pending' && membership.payment_proof && membership.payment_proof !== 'CASH_PAYMENT';
                    const isSelected = isPaymentSelected(membership.id, 'membership');
                    
                    return (
                    <tr key={membership.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
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
                            className="text-zinc-400 hover:text-green-400 transition-colors mx-auto"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-green-400" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 font-medium text-sm sm:text-base whitespace-nowrap">{membership.member_name}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center text-xs sm:text-sm text-zinc-300 whitespace-nowrap">{monthName} {membership.year}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center text-sm whitespace-nowrap">{membership.weeks_in_month} minggu</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-right font-semibold text-sm sm:text-base whitespace-nowrap">Rp {membership.amount.toLocaleString('id-ID')}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                        <span
                          className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            membership.payment_status === 'paid'
                              ? 'bg-green-500/20 text-green-400'
                              : membership.payment_status === 'rejected'
                              ? 'bg-red-500/20 text-red-400'
                              : membership.payment_status === 'cancelled'
                              ? 'bg-gray-500/20 text-gray-400'
                              : membership.payment_proof
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-orange-500/20 text-orange-400'
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
                            className="block text-xs text-blue-400 hover:text-blue-300 mt-1 underline cursor-pointer"
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
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredMemberships.length === 0 && (
              <div className="text-center py-12 text-zinc-400">
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
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Buat Pertandingan Baru</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Image Extraction Option */}
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
              <div className="flex items-start gap-3">
                <ImageIcon className="text-blue-400 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Ekstraksi dari Gambar</h3>
                  <p className="text-sm text-blue-200 mb-3">
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
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-900 text-zinc-500">atau input manual</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Tanggal Pertandingan (Sabtu)
                </label>
                <input
                  type="date"
                  value={newMatch.match_date}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    if (selectedDate.getDay() === 6 || !e.target.value) {
                      setNewMatch({ ...newMatch, match_date: e.target.value });
                    } else {
                      alert('Harap pilih hari Sabtu!');
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
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
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Jumlah Shuttlecock
                </label>
                <input
                  type="number"
                  min="1"
                  value={newMatch.shuttlecock_count}
                  onChange={(e) => setNewMatch({ ...newMatch, shuttlecock_count: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  @ Rp 12.000 per shuttlecock = Rp {((newMatch.shuttlecock_count * 12000) / 4).toLocaleString('id-ID')} per orang
                </p>
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  4 Anggota
                </label>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((num) => {
                    const memberKey = `member${num}` as keyof typeof newMatch;
                    const memberName = newMatch[memberKey] as string;
                    const hasMembershipStatus = memberName && hasMembership(memberName);
                    const costBreakdown = {
                      shuttlecock: (newMatch.shuttlecock_count * 12000) / 4,
                      attendance: hasMembershipStatus ? 0 : 18000,
                    };
                    const total = costBreakdown.shuttlecock + costBreakdown.attendance;

                    return (
                      <div key={num}>
                        <select
                          value={memberName}
                          onChange={(e) => setNewMatch({ ...newMatch, [memberKey]: e.target.value })}
                          className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Pilih Anggota {num}</option>
                          {allMembers.map((member) => (
                            <option key={member.id} value={member.name}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                        {memberName && (
                          <div className="mt-1 text-xs space-y-1">
                            <p className="text-zinc-400">
                              Shuttlecock: Rp {costBreakdown.shuttlecock.toLocaleString('id-ID')}
                            </p>
                            {costBreakdown.attendance > 0 ? (
                              <>
                                <p className="text-yellow-400">
                                  + Kehadiran: Rp {costBreakdown.attendance.toLocaleString('id-ID')} (Bukan Member)
                                </p>
                                <p className="text-white font-semibold">
                                  Total: Rp {total.toLocaleString('id-ID')}
                                </p>
                              </>
                            ) : (
                              <p className="text-purple-400 flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                Member - Total: Rp {total.toLocaleString('id-ID')}
                              </p>
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
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
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
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Tambah Membership Baru</h2>
                <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Smart Detection menganalisis jumlah Sabtu bulan ini
                </p>
              </div>
              <button
                onClick={() => setShowMembershipModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Nama Anggota
                </label>
                <select
                  value={newMembership.member_name}
                  onChange={(e) => setNewMembership({ ...newMembership, member_name: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
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
                  <label className="block text-sm font-medium text-zinc-400">
                    Jumlah Minggu dalam Bulan Ini
                  </label>
                  {weeksAutoDetected && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full text-xs font-medium text-blue-300">
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
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="4">4 Minggu - Rp 40.000</option>
                  <option value="5">5 Minggu - Rp 45.000</option>
                </select>
                {weeksAutoDetected && (
                  <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Terdeteksi otomatis berdasarkan jumlah Sabtu bulan ini
                  </p>
                )}
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-purple-300">
                      Total: <span className="font-bold text-lg">Rp {(newMembership.weeks_in_month === 4 ? 40000 : 45000).toLocaleString('id-ID')}</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {newMembership.weeks_in_month} minggu × Rp {(newMembership.weeks_in_month === 4 ? 10000 : 9000).toLocaleString('id-ID')}/minggu
                    </p>
                  </div>
                  {weeksAutoDetected && (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded px-2 py-1">
                      <p className="text-xs text-blue-300 font-semibold">✓ Otomatis</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  Member tidak perlu bayar biaya kehadiran Rp 18.000 saat pertandingan
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowMembershipModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
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

              <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
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
          <div className="bg-zinc-900 border border-green-500/30 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-green-400" />
                {isConfirmingRevisions ? 'Konfirmasi Revisi (Bulk)' : 'Konfirmasi Pembayaran (Bulk)'}
              </h3>
              <button
                onClick={closeBulkConfirmModal}
                className="text-zinc-400 hover:text-zinc-300 p-2 hover:bg-white/10 rounded-lg transition-colors"
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

      {/* Tutorial Overlay */}
      <TutorialOverlay
        steps={tutorialSteps}
        isActive={isTutorialActive}
        onClose={closeTutorial}
        tutorialKey="admin-pembayaran"
      />
    </div>
  );
}
