'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  CreditCard, TrendingUp, AlertCircle, Users, Award, Plus, X, Search, Check, 
  Ban, Eye, Trash2, ChevronDown, ChevronUp, Edit, Save, Image as ImageIcon, 
  CheckSquare, Square, Sparkles, Send, Zap, HelpCircle, ChevronLeft, ChevronRight,
  Printer, ZoomIn, ZoomOut, RotateCw, RefreshCw, RotateCcw, Download, UserPlus,
  Clock, CheckCircle2, XCircle, UserCheck, LayoutList, Layers, FileText, CheckCheck,
  Calendar
} from 'lucide-react';
import { StatCardSkeleton, MatchCardSkeleton } from '@/components/LoadingSkeletons';
import BranchBadge from '@/components/BranchBadge';
import DlbcSessionSheetPrintModal from '@/components/DlbcSessionSheetPrintModal';
import { getBranchPricing, DEFAULT_DLBC_PRICING, BranchPricing } from '@/lib/pricingSettings';

const BRANCH_ID = 'dlob-cikupa';
const ACCENT = '#10B981';

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
  branch_id?: string;
  team1_score?: number | null;
  team2_score?: number | null;
  winner?: string | null;
}

interface MatchMember {
  id: string;
  match_id: string;
  member_name: string;
  amount_due: number;
  attendance_fee: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled' | 'revision' | 'rejected';
  paid_at: string | null;
  payment_proof: string | null;
  additional_amount?: number;
  rejection_reason?: string | null;
  branch_id?: string;
}

interface MemberMatchDetail {
  matchId: string;
  matchNumber: number;
  matchDate?: string;
  memberId: string;
  amountDue: number;
  attendanceFee: number;
  totalAmount: number;
  paymentStatus: string;
  paymentProof: string | null;
}

interface MemberSummaryItem {
  name: string;
  isExempt: boolean;
  matchCount: number;
  amountDue: number;
  attendanceFee: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  pendingCount: number;
  paidCount: number;
  pendingMemberIds: string[];
  matches: MemberMatchDetail[];
}

const AVATAR_GRADIENTS = [
  'bg-gradient-to-br from-blue-500/30 to-cyan-500/20 text-cyan-300 border-cyan-500/40',
  'bg-gradient-to-br from-indigo-500/30 to-purple-500/20 text-indigo-300 border-indigo-500/40',
  'bg-gradient-to-br from-rose-500/30 to-pink-500/20 text-rose-300 border-rose-500/40',
  'bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-amber-300 border-amber-500/40',
];

export default function CikupaAdminPembayaranPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchMembers, setMatchMembers] = useState<Record<string, MatchMember[]>>({});
  const [allMembers, setAllMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [newMemberInputs, setNewMemberInputs] = useState<Record<string, string>>({});
  const [creatingMember, setCreatingMember] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'proof'>('all');
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Helper to format date cleanly as YYYY-MM-DD for HTML date inputs
  const formatDateForInput = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Match creation form
  const [newMatch, setNewMatch] = useState({
    shuttlecock_count: 1,
    member1: '',
    member2: '',
    member3: '',
    member4: '',
    match_date: new Date().toISOString().split('T')[0],
  });
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [paymentExemptMembers, setPaymentExemptMembers] = useState<Set<string>>(new Set());
  const [branchPricing, setBranchPricing] = useState<BranchPricing>(DEFAULT_DLBC_PRICING);

  // Match edit state
  const [editingMatch, setEditingMatch] = useState<{
    matchId: string;
    match_date: string;
    shuttlecock_count: number;
    team1_score?: number | null;
    team2_score?: number | null;
    members: Record<string, { name: string; memberId: string }>;
  } | null>(null);
  const [isSavingMatch, setIsSavingMatch] = useState(false);

  // Proof Modal state with Zoom & Pan
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{
    id: string;
    matchId?: string;
    memberName: string;
    amount: number;
    proofUrl: string | null;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Nominal transfer tidak sesuai');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Bulk Selection state
  const [selectedPayments, setSelectedPayments] = useState<Array<{ id: string; memberName: string; amount: number; matchId?: string }>>([]);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkConfirming, setBulkConfirming] = useState(false);

  // View Mode: 'matches' (Tabel Pertandingan) or 'members' (Rekap per Member)
  const [viewMode, setViewMode] = useState<'matches' | 'members'>('matches');
  const [expandedMemberRows, setExpandedMemberRows] = useState<Record<string, boolean>>({});

  // Fast verify all matches for a member
  async function handleVerifyAllForMember(memberIdList: string[], memberName: string) {
    if (memberIdList.length === 0) return;
    if (!confirm(`Konfirmasi pelunasan untuk ${memberIdList.length} pertandingan member "${memberName}"?`)) return;
    try {
      const { error } = await supabase
        .from('match_members')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .in('id', memberIdList);

      if (error) throw error;
      alert(`Berhasil memverifikasi ${memberIdList.length} tagihan untuk ${memberName}!`);
      await loadData();
    } catch (e: any) {
      alert('Gagal memverifikasi: ' + (e?.message || ''));
    }
  }

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const targetYear = selectedMonth.getFullYear();
      const targetMonth = selectedMonth.getMonth() + 1;
      const monthStart = new Date(targetYear, targetMonth - 1, 1);
      const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      const [matchesRes, profilesRes, pricingRes] = await Promise.all([
        supabase
          .from('matches')
          .select('*')
          .eq('branch_id', BRANCH_ID)
          .gte('match_date', monthStart.toISOString())
          .lte('match_date', monthEnd.toISOString())
          .order('match_date', { ascending: false }),

        supabase
          .from('profiles')
          .select('id, full_name, email, is_payment_exempt, branch_id')
          .or(`branch_id.eq.${BRANCH_ID},branch_id.is.null`)
          .order('full_name', { ascending: true }),

        getBranchPricing(supabase, BRANCH_ID),
      ]);

      if (pricingRes) {
        setBranchPricing(pricingRes);
      }

      if (matchesRes.error) console.error('Error fetching matches:', matchesRes.error);
      const fetchedMatches: Match[] = matchesRes.data || [];
      setMatches(fetchedMatches);

      if (fetchedMatches.length > 0) {
        const matchIds = fetchedMatches.map(m => m.id);
        const { data: membersData, error: mmError } = await supabase
          .from('match_members')
          .select('*')
          .in('match_id', matchIds);

        if (!mmError && membersData) {
          const membersMap: Record<string, MatchMember[]> = {};
          membersData.forEach((mm: MatchMember) => {
            if (!membersMap[mm.match_id]) membersMap[mm.match_id] = [];
            membersMap[mm.match_id].push(mm);
          });
          setMatchMembers(membersMap);
        }
      } else {
        setMatchMembers({});
      }

      if (!profilesRes.error && profilesRes.data) {
        setAllMembers(
          profilesRes.data
            .map(p => ({ id: p.id, name: p.full_name || p.email?.split('@')[0] || 'Member' }))
            .filter(m => m.name.trim() !== '')
        );
        const exemptSet = new Set<string>();
        profilesRes.data.forEach(p => {
          if (p.is_payment_exempt) exemptSet.add((p.full_name || '').toLowerCase());
        });
        setPaymentExemptMembers(exemptSet);
      }

    } catch (err) {
      console.error('Error in loadData:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData, pathname]);

  // Inline member creation for quick input
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
        body: JSON.stringify({ full_name: name, branch_id: BRANCH_ID }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }
      if (!data.existed) {
        setAllMembers(prev => [...prev, { id: data.id, name: data.full_name }].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setNewMatch(prev => ({ ...prev, [memberKey]: data.full_name }));
      setNewMemberInputs(prev => ({ ...prev, [memberKey]: '' }));
    } catch (e: any) {
      alert(e?.message || 'Gagal membuat member baru');
    } finally {
      setCreatingMember(prev => ({ ...prev, [memberKey]: false }));
    }
  }

  // Create match handler
  async function handleCreateMatch(e: React.FormEvent) {
    e.preventDefault();
    const players = [newMatch.member1, newMatch.member2, newMatch.member3, newMatch.member4].map(s => s.trim()).filter(Boolean);
    if (players.length !== 4) {
      alert('Pilih tepat 4 pemain untuk pertandingan ganda.');
      return;
    }

    try {
      setCreatingMatch(true);
      const matchDateObj = new Date(newMatch.match_date);

      // Create match via server API to bypass client RLS restrictions safely
      const response = await fetch('/api/matches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: BRANCH_ID,
          match_date: matchDateObj.toISOString(),
          shuttlecock_count: newMatch.shuttlecock_count,
          players,
          created_by: user?.id,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.details || resData.error || 'Gagal membuat pertandingan');
      }

      setShowCreateModal(false);
      setNewMatch({
        shuttlecock_count: 1,
        member1: '',
        member2: '',
        member3: '',
        member4: '',
        match_date: formatDateForInput(matchDateObj.toISOString()),
      });
      await loadData();
    } catch (e: any) {
      console.error('Error creating match:', e);
      alert(e?.message || 'Gagal membuat pertandingan');
    } finally {
      setCreatingMatch(false);
    }
  }

  // Verify Single Payment
  async function handleVerifyPayment(id: string) {
    try {
      const { error } = await supabase
        .from('match_members')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;

      setShowProofModal(false);
      setSelectedProof(null);
      await loadData();
    } catch (e: any) {
      console.error('Error verifying payment:', e);
      alert('Gagal memverifikasi pembayaran: ' + (e?.message || ''));
    }
  }

  // Reject Single Payment
  async function handleConfirmReject() {
    if (!selectedProof) return;
    const finalReason = customRejectReason.trim() || rejectReason;

    try {
      setRejecting(true);
      const { error } = await supabase
        .from('match_members')
        .update({
          payment_status: 'rejected',
          rejection_reason: finalReason,
        })
        .eq('id', selectedProof.id);
      if (error) throw error;

      setShowRejectModal(false);
      setShowProofModal(false);
      setSelectedProof(null);
      setCustomRejectReason('');
      await loadData();
    } catch (e: any) {
      console.error('Error rejecting payment:', e);
      alert('Gagal menolak pembayaran');
    } finally {
      setRejecting(false);
    }
  }

  // Start Editing Match
  function startEditingMatch(match: Match) {
    const members: Record<string, { name: string; memberId: string }> = {};
    matchMembers[match.id]?.forEach(member => {
      members[member.id] = { name: member.member_name, memberId: member.id };
    });

    // Follow previous match date (or created_at if match_date is missing) formatted as YYYY-MM-DD
    const previousDate = formatDateForInput(match.match_date || match.created_at) || new Date().toISOString().split('T')[0];

    setEditingMatch({
      matchId: match.id,
      match_date: previousDate,
      shuttlecock_count: match.shuttlecock_count,
      team1_score: match.team1_score ?? null,
      team2_score: match.team2_score ?? null,
      members,
    });
    setExpandedMatches(prev => ({ ...prev, [match.id]: true }));
  }

  // Save Match Changes
  async function saveMatchChanges() {
    if (!editingMatch) return;
    try {
      setIsSavingMatch(true);
      const originalMatch = matches.find(m => m.id === editingMatch.matchId);
      const costPerCockPerMember = branchPricing?.costPerMemberPerCock || 3000;
      const newShuttlecockCount = editingMatch.shuttlecock_count;
      const newCostPerMember = newShuttlecockCount * costPerCockPerMember;
      const matchDateObj = editingMatch.match_date ? new Date(editingMatch.match_date) : (originalMatch?.match_date ? new Date(originalMatch.match_date) : new Date());

      const matchUpdatePayload: any = {
        shuttlecock_count: newShuttlecockCount,
        match_date: matchDateObj.toISOString(),
        cost_per_shuttlecock: branchPricing.shuttlecockFee,
      };
      if (editingMatch.team1_score !== undefined) {
        matchUpdatePayload.team1_score = editingMatch.team1_score;
      }
      if (editingMatch.team2_score !== undefined) {
        matchUpdatePayload.team2_score = editingMatch.team2_score;
      }
      const t1 = editingMatch.team1_score;
      const t2 = editingMatch.team2_score;
      if (typeof t1 === 'number' && typeof t2 === 'number' && (t1 > 0 || t2 > 0)) {
        if (t1 > t2) {
          matchUpdatePayload.winner = 'team1';
          matchUpdatePayload.status = 'completed';
        } else if (t2 > t1) {
          matchUpdatePayload.winner = 'team2';
          matchUpdatePayload.status = 'completed';
        }
      }

      const memberNames = Object.values(editingMatch.members).map(m => m.name.trim()).filter(Boolean);
      if (memberNames.length >= 4) {
        matchUpdatePayload.team1_player1 = memberNames[0];
        matchUpdatePayload.team1_player2 = memberNames[1];
        matchUpdatePayload.team2_player1 = memberNames[2];
        matchUpdatePayload.team2_player2 = memberNames[3];
      }

      // 1. Check attendance fee paid on this day in other matches
      const dayStart = new Date(matchDateObj);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(matchDateObj);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: sameDayMatches } = await supabase
        .from('matches')
        .select('id')
        .eq('branch_id', BRANCH_ID)
        .gte('match_date', dayStart.toISOString())
        .lte('match_date', dayEnd.toISOString())
        .neq('id', editingMatch.matchId);

      const sameDayMatchIds = (sameDayMatches || []).map(m => m.id);
      let sameDayPaidAttendance = new Set<string>();
      if (sameDayMatchIds.length > 0) {
        const { data: sameDayMM } = await supabase
          .from('match_members')
          .select('member_name')
          .in('match_id', sameDayMatchIds)
          .gt('attendance_fee', 0);
        sameDayPaidAttendance = new Set((sameDayMM || []).map(m => m.member_name.toLowerCase()));
      }

      // 2. Prepare member updates
      const membersUpdates = [];
      for (const [memberId, memberData] of Object.entries(editingMatch.members)) {
        const cleanName = memberData.name.trim();
        const isExempt = paymentExemptMembers.has(cleanName.toLowerCase());
        const alreadyPaidAttendance = sameDayPaidAttendance.has(cleanName.toLowerCase());
        const attendanceFee = isExempt || alreadyPaidAttendance ? 0 : (branchPricing?.attendanceFee || 18000);
        const amountDue = isExempt ? 0 : newCostPerMember;

        membersUpdates.push({
          id: memberId,
          member_name: cleanName,
          amount_due: amountDue,
          attendance_fee: attendanceFee,
        });
      }

      // 3. Update match and members via server API
      const res = await fetch('/api/matches/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: editingMatch.matchId,
          matchUpdatePayload,
          membersUpdates,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.details || resData.error || 'Gagal memperbarui pertandingan');
      }

      alert('Pertandingan berhasil diperbarui!');
      setEditingMatch(null);
      await loadData();
    } catch (e: any) {
      console.error('Error saving match changes:', e);
      alert('Gagal menyimpan perubahan: ' + (e?.message || ''));
    } finally {
      setIsSavingMatch(false);
    }
  }

  // Delete Match
  async function handleDeleteMatch(matchId: string) {
    if (!confirm('Yakin ingin menghapus pertandingan ini beserta seluruh catatan pembayarannya?')) return;
    try {
      const res = await fetch('/api/matches/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Gagal menghapus pertandingan');
      await loadData();
    } catch (e: any) {
      alert('Gagal menghapus pertandingan: ' + (e?.message || ''));
    }
  }

  // Bulk confirmation
  async function handleBulkConfirm() {
    if (selectedPayments.length === 0) return;
    try {
      setBulkConfirming(true);
      const matchIds = selectedPayments.map(p => p.id);

      if (matchIds.length > 0) {
        await supabase
          .from('match_members')
          .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
          .in('id', matchIds);
      }

      setShowBulkConfirmModal(false);
      setSelectedPayments([]);
      await loadData();
    } catch (e: any) {
      alert('Gagal konfirmasi massal: ' + (e?.message || ''));
    } finally {
      setBulkConfirming(false);
    }
  }

  // Filter & Search Logic
  const allMatchMemberList = Object.values(matchMembers).flat();
  const filteredMatches = matches.filter(m => {
    const mMembers = matchMembers[m.id] || [];
    const matchMatchesSearch = 
      `Match #${m.match_number}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mMembers.some(mm => mm.member_name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchMatchesSearch) return false;

    if (filterStatus === 'pending') {
      return mMembers.some(mm => mm.payment_status === 'pending');
    }
    if (filterStatus === 'paid') {
      return mMembers.length > 0 && mMembers.every(mm => mm.payment_status === 'paid');
    }
    if (filterStatus === 'proof') {
      return mMembers.some(mm => !!mm.payment_proof);
    }
    return true;
  });

  // Member Summary Aggregation (Rekap per Member)
  const memberSummaryList: MemberSummaryItem[] = useMemo(() => {
    const map = new Map<string, MemberSummaryItem>();

    matches.forEach(m => {
      const mMembers = matchMembers[m.id] || [];
      mMembers.forEach(mm => {
        const key = (mm.member_name || '').toLowerCase().trim();
        if (!key) return;
        if (!map.has(key)) {
          map.set(key, {
            name: mm.member_name,
            isExempt: paymentExemptMembers.has(key),
            matchCount: 0,
            amountDue: 0,
            attendanceFee: 0,
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            pendingCount: 0,
            paidCount: 0,
            pendingMemberIds: [],
            matches: [],
          });
        }
        const entry = map.get(key)!;
        entry.matchCount++;
        const itemTotal = mm.total_amount || (mm.amount_due + mm.attendance_fee);
        entry.amountDue += mm.amount_due || 0;
        entry.attendanceFee += mm.attendance_fee || 0;
        entry.totalAmount += itemTotal;
        if (mm.payment_status === 'paid') {
          entry.paidAmount += itemTotal;
          entry.paidCount++;
        } else {
          entry.pendingAmount += itemTotal;
          entry.pendingCount++;
          entry.pendingMemberIds.push(mm.id);
        }
        entry.matches.push({
          matchId: m.id,
          matchNumber: m.match_number,
          matchDate: m.match_date,
          memberId: mm.id,
          amountDue: mm.amount_due || 0,
          attendanceFee: mm.attendance_fee || 0,
          totalAmount: itemTotal,
          paymentStatus: mm.payment_status,
          paymentProof: mm.payment_proof,
        });
      });
    });

    let list = Array.from(map.values());
    if (searchTerm) {
      list = list.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterStatus === 'pending') {
      list = list.filter(m => m.pendingCount > 0);
    } else if (filterStatus === 'paid') {
      list = list.filter(m => m.pendingCount === 0 && m.paidCount > 0);
    } else if (filterStatus === 'proof') {
      list = list.filter(m => m.matches.some(match => !!match.paymentProof));
    }
    return list.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [matches, matchMembers, paymentExemptMembers, searchTerm, filterStatus]);

  // Toggle expand all matches
  const allAreExpanded = filteredMatches.length > 0 && filteredMatches.every(m => expandedMatches[m.id] !== false);
  const toggleAllExpanded = () => {
    const nextState: Record<string, boolean> = {};
    filteredMatches.forEach(m => {
      nextState[m.id] = !allAreExpanded;
    });
    setExpandedMatches(nextState);
  };

  // Calculate Stat Cards
  const totalRevenue = allMatchMemberList
    .filter(mm => mm.payment_status === 'paid')
    .reduce((sum, mm) => sum + (mm.total_amount || (mm.amount_due + mm.attendance_fee) || 0), 0);

  const totalAttendancePaid = allMatchMemberList
    .filter(mm => mm.payment_status === 'paid')
    .reduce((sum, mm) => sum + (mm.attendance_fee || 0), 0);

  const totalPendingCount = allMatchMemberList.filter(mm => mm.payment_status === 'pending').length;

  // Proof Zoom & Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };
  const handleMouseUp = () => setIsDragging(false);
  const resetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
    setPanPosition({ x: 0, y: 0 });
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-premium p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              Kelola Pembayaran DLBC
            </h1>
            <BranchBadge branchId={BRANCH_ID} />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Pusat validasi bukti bayar pertandingan & biaya kehadiran Cikupa
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-800/80 border border-gray-200 dark:border-white/10 rounded-xl p-1.5 self-start md:self-auto">
          <button
            onClick={() => {
              const d = new Date(selectedMonth);
              d.setMonth(d.getMonth() - 1);
              setSelectedMonth(d);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 transition-colors"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 tracking-wide">
            {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </div>
          <button
            onClick={() => {
              const d = new Date(selectedMonth);
              d.setMonth(d.getMonth() + 1);
              setSelectedMonth(d);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 transition-colors"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedMonth(new Date())}
            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-colors ml-1"
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* 4 Linear / 21st.dev Precision Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0B0D0E] border border-white/[0.08] hover:border-emerald-500/30 rounded-2xl p-4 relative overflow-hidden transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.3)] group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total Pendapatan</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-white group-hover:text-emerald-400 transition-colors">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-1">
            Biaya Kok + Kehadiran
          </p>
        </div>

        <div className="bg-[#0B0D0E] border border-white/[0.08] hover:border-amber-500/30 rounded-2xl p-4 relative overflow-hidden transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.3)] group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Menunggu Konfirmasi</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-amber-400">
            {totalPendingCount} Slot
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-1">
            Menunggu verifikasi admin
          </p>
        </div>

        <div className="bg-[#0B0D0E] border border-white/[0.08] hover:border-blue-500/30 rounded-2xl p-4 relative overflow-hidden transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.3)] group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Pertandingan</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-white group-hover:text-blue-400 transition-colors">
            {matches.length} Match
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-1">
            {allMatchMemberList.filter(mm => mm.payment_status === 'paid').length} slot telah lunas
          </p>
        </div>

        <div className="bg-[#0B0D0E] border border-white/[0.08] hover:border-purple-500/30 rounded-2xl p-4 relative overflow-hidden transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.3)] group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 truncate pr-1">
              {branchPricing.attendanceLabel || 'Biaya Hadir'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono tracking-tight text-white group-hover:text-purple-400 transition-colors">
            Rp {totalAttendancePaid.toLocaleString('id-ID')}
          </div>
          <p className="text-[10px] font-mono text-zinc-500 mt-1">
            Tarif: Rp {(branchPricing.singleMatchAttendanceFee || 5000).toLocaleString('id-ID')} (1x) / Rp {(branchPricing.attendanceFee || 12000).toLocaleString('id-ID')} (&gt;1x)
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented View Mode Switcher (Linear / 21st.dev Style) */}
          <div className="flex items-center p-1 bg-zinc-900/90 border border-white/[0.08] rounded-xl shadow-inner backdrop-blur-md">
            <button
              onClick={() => setViewMode('matches')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 ${
                viewMode === 'matches'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-bold'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Tabel Pertandingan</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-300">
                {matches.length}
              </span>
            </button>
            <button
              onClick={() => setViewMode('members')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 ${
                viewMode === 'members'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-bold'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Rekap per Member</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-300">
                {memberSummaryList.length}
              </span>
            </button>
          </div>
        </div>

        {/* Buttons: Add Match, Print Sheet, Image Extraction */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/cikupa/admin/match-image-extraction"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/30 hover:border-emerald-500/50 transition-all shadow-sm"
            title="Ekstraksi data pertandingan dari foto jadwal AI"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Ekstraksi AI</span>
          </Link>

          <button
            onClick={() => {
              if (matches.length > 0 && matches[0]?.match_date) {
                setNewMatch(prev => ({ ...prev, match_date: formatDateForInput(matches[0].match_date) }));
              }
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-all shadow-[0_0_16px_rgba(16,185,129,0.25)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Input Match</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl border border-white/[0.08] hover:border-white/20 transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Sesi</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#0B0D0E] border border-white/[0.08] p-2.5 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={viewMode === 'matches' ? "Cari no match atau nama pemain..." : "Cari nama member..."}
            className="w-full pl-9 pr-4 py-1.5 bg-black/40 border border-white/[0.06] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        {/* Filter Status Pills & Action */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'pending', 'paid', 'proof'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filterStatus === status
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                  : 'bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              {status === 'all' && 'Semua'}
              {status === 'pending' && 'Menunggu'}
              {status === 'paid' && 'Lunas'}
              {status === 'proof' && 'Ada Bukti'}
            </button>
          ))}

          {viewMode === 'matches' && filteredMatches.length > 0 && (
            <button
              onClick={toggleAllExpanded}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] whitespace-nowrap transition-colors flex items-center gap-1"
              title={allAreExpanded ? "Tutup Semua Detail" : "Buka Semua Detail"}
            >
              {allAreExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>{allAreExpanded ? 'Ringkas' : 'Detail'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar (when selected) */}
      {selectedPayments.length > 0 && (
        <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl animate-in fade-in backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white">
              {selectedPayments.length} tagihan terpilih
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              (Total: Rp {selectedPayments.reduce((s, p) => s + p.amount, 0).toLocaleString('id-ID')})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPayments([])}
              className="px-3 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => setShowBulkConfirmModal(true)}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Konfirmasi Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="space-y-3">
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </div>
      ) : viewMode === 'members' ? (
        /* ========================================================================= */
        /* VIEW MODE 2: REKAP TAGIHAN PER MEMBER (Elite Tabular Ledger)               */
        /* ========================================================================= */
        <div className="bg-[#0B0D0E] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] tracking-wider uppercase font-mono">
                  <th className="py-3 px-4 font-semibold text-zinc-400">Member</th>
                  <th className="py-3 px-3 font-semibold text-center text-zinc-300">Main</th>
                  <th className="py-3 px-3 font-bold text-right font-mono text-sky-400">Biaya Kok</th>
                  <th className="py-3 px-3 font-bold text-right font-mono text-amber-400">Lapangan</th>
                  <th className="py-3 px-4 font-bold text-right font-mono text-emerald-400">Total Tagihan</th>
                  <th className="py-3 px-3 font-semibold text-center text-zinc-400">Status</th>
                  <th className="py-3 px-4 font-semibold text-right text-zinc-400">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {memberSummaryList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-zinc-500 font-mono text-xs">
                      Tidak ada data member yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  memberSummaryList.map((mem: MemberSummaryItem, idx: number) => {
                    const isAllPaid = mem.pendingCount === 0 && mem.paidCount > 0;
                    const hasProof = mem.matches.some((m: MemberMatchDetail) => !!m.paymentProof);
                    const isExpanded = !!expandedMemberRows[mem.name];

                    return (
                      <React.Fragment key={mem.name}>
                        <tr className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full border font-bold flex items-center justify-center text-[11px] font-mono shrink-0 shadow-xs ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]}`}>
                                {mem.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 font-bold text-white tracking-tight text-sm">
                                  <span>{mem.name}</span>
                                  {mem.isExempt && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-mono font-bold border border-amber-500/30">
                                      VIP
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                                  {mem.paidCount}/{mem.matchCount} match lunas
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-white/10 text-white border border-white/15">
                              {mem.matchCount}x
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-mono font-bold text-xs text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20 inline-block">
                              Rp {mem.amountDue.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="font-mono font-bold text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block">
                              Rp {mem.attendanceFee.toLocaleString('id-ID')}
                            </span>
                            <span className="block text-[9px] text-zinc-400 font-mono mt-0.5">
                              {mem.matchCount === 1 ? '1x main (5k)' : '>1x main (12k)'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-mono text-sm font-black text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-lg border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] inline-block">
                              Rp {mem.totalAmount.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isAllPaid ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <span>Lunas</span>
                              </span>
                            ) : (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                  <span>{mem.pendingCount} Pending</span>
                                </span>
                                {hasProof && (
                                  <span className="text-[10px] text-cyan-300 font-mono font-bold flex items-center gap-1 mt-0.5">
                                    <Eye className="w-3 h-3" /> Ada Bukti
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isAllPaid && mem.pendingMemberIds.length > 0 && (
                                <button
                                  onClick={() => handleVerifyAllForMember(mem.pendingMemberIds, mem.name)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                                  title="Verifikasi semua tagihan member ini"
                                >
                                  <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Verifikasi</span>
                                </button>
                              )}
                              <button
                                onClick={() => setExpandedMemberRows(prev => ({ ...prev, [mem.name]: !isExpanded }))}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                                title="Lihat rincian pertandingan member"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inset Sub-Row: Matches for this member (Tabular Ledger) */}
                        {isExpanded && (
                          <tr className="bg-black/40 border-b border-white/[0.05]">
                            <td colSpan={7} className="p-0">
                              <div className="px-6 py-3 border-t border-white/[0.04]">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b border-white/[0.04] text-[9px] uppercase font-mono tracking-wider">
                                      <th className="py-2 px-3 font-semibold text-zinc-400">Pertandingan</th>
                                      <th className="py-2 px-3 font-bold text-right font-mono text-sky-400">Biaya Kok</th>
                                      <th className="py-2 px-3 font-bold text-right font-mono text-amber-400">Lapangan</th>
                                      <th className="py-2 px-3 font-bold text-right font-mono text-emerald-400">Total Tagihan</th>
                                      <th className="py-2 px-3 font-semibold text-center text-zinc-400">Bukti Bayar</th>
                                      <th className="py-2 px-3 font-semibold text-right text-zinc-400">Status / Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/[0.03]">
                                    {mem.matches.map((item: MemberMatchDetail, mIdx: number) => (
                                      <tr key={`${item.matchId}-${mIdx}`} className="hover:bg-white/[0.02]">
                                        <td className="py-2 px-3">
                                          <div className="flex items-center gap-1.5 font-mono text-xs">
                                            <span className="font-black text-emerald-300">Match #{item.matchNumber}</span>
                                            <span className="text-[10px] text-zinc-400">
                                              ({item.matchDate ? formatDateForInput(item.matchDate) : '-'})
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                          <span className="font-mono font-bold text-xs text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                                            Rp {item.amountDue.toLocaleString('id-ID')}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                          {item.attendanceFee > 0 ? (
                                            <span className="font-mono font-bold text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                              Rp {item.attendanceFee.toLocaleString('id-ID')}
                                            </span>
                                          ) : (
                                            <span className="font-mono font-semibold text-xs text-zinc-600">
                                              Rp 0
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                          <span className="font-mono font-black text-xs text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                                            Rp {item.totalAmount.toLocaleString('id-ID')}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          {item.paymentProof ? (
                                            <button
                                              onClick={() => {
                                                setSelectedProof({
                                                  id: item.memberId,
                                                  matchId: item.matchId,
                                                  memberName: mem.name,
                                                  amount: item.totalAmount,
                                                  proofUrl: item.paymentProof,
                                                });
                                                setShowProofModal(true);
                                              }}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors"
                                            >
                                              <Eye className="w-3 h-3 stroke-[2.5]" />
                                              <span>Lihat Bukti</span>
                                            </button>
                                          ) : (
                                            <span className="text-xs text-zinc-600 font-mono">-</span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-right">
                                          {item.paymentStatus === 'paid' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                              <Check className="w-3 h-3 stroke-[2.5]" /> Lunas
                                            </span>
                                          ) : (
                                            <button
                                              onClick={() => handleVerifyPayment(item.memberId)}
                                              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold rounded transition-colors"
                                            >
                                              <Check className="w-3 h-3 stroke-[2.5]" /> Verifikasi
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW MODE 1: TABEL PERTANDINGAN (Linear / 21st.dev Fixture Ledger)         */
        /* ========================================================================= */
        <div className="space-y-3">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-20 bg-[#0B0D0E] border border-white/[0.08] rounded-2xl shadow-sm">
              <Award className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-300">Belum ada pertandingan di bulan ini</p>
              <p className="text-xs text-zinc-500 mt-1">Klik &quot;Input Match&quot; untuk menambahkan sesi pertandingan DLBC baru.</p>
            </div>
          ) : (
            <div className="bg-[#0B0D0E] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
              {filteredMatches.map(match => {
                const members = matchMembers[match.id] || [];
                const isExpanded = expandedMatches[match.id] ?? true;
                const isEditing = editingMatch?.matchId === match.id;
                const paidCount = members.filter(m => m.payment_status === 'paid').length;
                const allPaid = members.length > 0 && paidCount === members.length;
                const matchTotalCost = match.total_cost || (match.shuttlecock_count * (branchPricing?.costPerMemberPerCock || 3000) * 4);

                const team1Members = members.slice(0, 2);
                const team2Members = members.slice(2, 4);

                const hasScores = match.team1_score !== null && match.team1_score !== undefined && match.team2_score !== null && match.team2_score !== undefined;
                const team1Won = hasScores && (match.team1_score! > match.team2_score!);
                const team2Won = hasScores && (match.team2_score! > match.team1_score!);

                return (
                  <div key={match.id} className="transition-colors group/match">
                    {/* Fixture Master Header Bar */}
                    <div className="flex flex-wrap items-center justify-between p-3.5 sm:px-5 gap-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                        {/* Expand toggle */}
                        <button
                          onClick={() => setExpandedMatches(prev => ({ ...prev, [match.id]: !isExpanded }))}
                          className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-colors"
                          title={isExpanded ? "Ringkas pertandingan" : "Lihat detail pemain"}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isEditing ? (
                          <div className="flex flex-wrap items-center gap-2.5 py-1">
                            {/* Match Number Badge */}
                            <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 tracking-tight shadow-sm">
                              #{match.match_number}
                            </span>

                            {/* Calendar Date Picker Trigger Button */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  const el = document.getElementById(`edit-match-date-${match.id}`) as HTMLInputElement;
                                  if (el && typeof el.showPicker === 'function') {
                                    el.showPicker();
                                  } else {
                                    el?.focus();
                                  }
                                }}
                                className="flex items-center gap-2 px-3 py-1 bg-black/60 hover:bg-black/90 border border-white/20 hover:border-emerald-500/50 rounded-lg text-xs font-mono text-white transition-all shadow-inner group cursor-pointer"
                                title="Klik untuk membuka kalender"
                              >
                                <Calendar className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                <span>
                                  {editingMatch.match_date
                                    ? new Date(editingMatch.match_date).toLocaleDateString('id-ID', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : 'Pilih Tanggal'}
                                </span>
                              </button>
                              <input
                                id={`edit-match-date-${match.id}`}
                                type="date"
                                value={formatDateForInput(editingMatch.match_date)}
                                onChange={(e) => setEditingMatch({ ...editingMatch, match_date: e.target.value })}
                                className="sr-only"
                                tabIndex={-1}
                              />
                            </div>

                            {/* Shuttlecock Stepper Control */}
                            <div className="flex items-center bg-black/60 border border-white/20 rounded-lg p-0.5 shadow-inner">
                              <button
                                type="button"
                                onClick={() => setEditingMatch({
                                  ...editingMatch,
                                  shuttlecock_count: Math.max(1, (editingMatch.shuttlecock_count || 1) - 1),
                                })}
                                className="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-mono font-bold"
                                title="Kurangi 1 Kok"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-mono font-bold text-emerald-400 select-none">
                                {editingMatch.shuttlecock_count} Kok
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingMatch({
                                  ...editingMatch,
                                  shuttlecock_count: Math.min(10, (editingMatch.shuttlecock_count || 1) + 1),
                                })}
                                className="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-mono font-bold"
                                title="Tambah 1 Kok"
                              >
                                +
                              </button>
                            </div>

                            {/* Badminton Scoreboard Inputs */}
                            <div className="flex items-center gap-1.5 bg-black/70 border border-white/20 px-2 py-0.5 rounded-lg shadow-inner">
                              <span className="text-[10px] uppercase font-mono text-zinc-500">Skor</span>
                              <input
                                type="number"
                                min="0"
                                value={editingMatch.team1_score ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                  setEditingMatch({ ...editingMatch, team1_score: val });
                                }}
                                placeholder="0"
                                className="w-10 px-1 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-center text-xs font-mono font-bold text-blue-300 focus:outline-none focus:border-blue-400"
                              />
                              <span className="text-zinc-600 font-mono font-bold text-xs">:</span>
                              <input
                                type="number"
                                min="0"
                                value={editingMatch.team2_score ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                  setEditingMatch({ ...editingMatch, team2_score: val });
                                }}
                                placeholder="0"
                                className="w-10 px-1 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded text-center text-xs font-mono font-bold text-rose-300 focus:outline-none focus:border-rose-400"
                              />
                            </div>
                          </div>
                        ) : (
                          /* Modern Fixture Matchup Line with Colorful Bold Numbers */
                          <div className="flex flex-col md:flex-row md:items-center gap-2.5 md:gap-4">
                            {/* Match & Cock tags */}
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-emerald-300 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 tracking-tight shadow-sm">
                                #{match.match_number}
                              </span>
                              <span className="text-[11px] font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 shadow-xs flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                {match.shuttlecock_count} KOK
                              </span>
                              <span className="text-[11px] font-mono font-semibold text-zinc-400 hidden sm:inline">
                                {match.match_date ? new Date(match.match_date).toLocaleDateString('id-ID', {
                                  day: 'numeric', month: 'short'
                                }) : '-'}
                              </span>
                            </div>

                            {/* Badminton Matchup Display with Scoreboard */}
                            <div className="flex items-center gap-2 text-xs">
                              {/* Pair 1 */}
                              <div className="flex items-center gap-1 font-bold text-white tracking-tight">
                                <span>{team1Members.map(m => m.member_name).join(' / ') || '-'}</span>
                              </div>

                              {/* Score Capsule */}
                              {hasScores ? (
                                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-black/80 border border-white/15 font-mono text-xs shadow-md mx-1.5">
                                  <span className={`px-2 py-0.5 rounded font-black text-sm ${team1Won ? "text-emerald-400 bg-emerald-500/20 border border-emerald-500/35" : "text-zinc-400 bg-white/[0.04]"}`}>
                                    {match.team1_score}
                                  </span>
                                  <span className="text-zinc-500 font-black text-xs">:</span>
                                  <span className={`px-2 py-0.5 rounded font-black text-sm ${team2Won ? "text-emerald-400 bg-emerald-500/20 border border-emerald-500/35" : "text-zinc-400 bg-white/[0.04]"}`}>
                                    {match.team2_score}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-zinc-600 font-mono text-[10px] mx-1.5">vs</span>
                              )}

                              {/* Pair 2 */}
                              <div className="flex items-center gap-1 font-bold text-white tracking-tight">
                                <span>{team2Members.map(m => m.member_name).join(' / ') || '-'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Meta & Actions */}
                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveMatchChanges}
                              disabled={isSavingMatch}
                              className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-black rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                              title="Simpan Perubahan"
                            >
                              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{isSavingMatch ? 'Menyimpan...' : 'Simpan'}</span>
                            </button>
                            <button
                              onClick={() => setEditingMatch(null)}
                              disabled={isSavingMatch}
                              className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-white/10 transition-colors text-xs font-semibold flex items-center gap-1"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Batal</span>
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Settlement Progress */}
                            {allPaid ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                <span>Lunas</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                <span>{paidCount}/{members.length} Bayar</span>
                              </span>
                            )}

                            {/* Total Match Cost */}
                            <span className="font-mono text-sm font-black text-white tracking-tight bg-white/[0.06] px-3 py-1 rounded-lg border border-white/10 shadow-xs">
                              Rp {matchTotalCost.toLocaleString('id-ID')}
                            </span>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 border-l border-white/[0.08] pl-2">
                              <button
                                onClick={() => startEditingMatch(match)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                title="Edit Pertandingan"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMatch(match.id)}
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Hapus Pertandingan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Master-Detail Tabular Ledger (ZERO nested cards!) */}
                    {isExpanded && (
                      <div className="border-t border-white/[0.05] bg-black/40 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-white/[0.06] text-[10px] uppercase font-mono tracking-wider bg-white/[0.02]">
                              <th className="py-2.5 px-4 font-semibold w-8 text-center text-zinc-400"></th>
                              <th className="py-2.5 px-3 font-semibold text-zinc-300">Pemain</th>
                              <th className="py-2.5 px-3 font-bold text-right font-mono text-sky-400">Biaya Kok</th>
                              <th className="py-2.5 px-3 font-bold text-right font-mono text-amber-400">Biaya Lapangan</th>
                              <th className="py-2.5 px-4 font-bold text-right font-mono text-emerald-400">Total Tagihan</th>
                              <th className="py-2.5 px-3 font-semibold text-center text-zinc-400">Bukti Bayar</th>
                              <th className="py-2.5 px-4 font-semibold text-right text-zinc-400">Status / Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.03]">
                            {members.map((member, mIdx) => {
                              const isPaid = member.payment_status === 'paid';
                              const isRejected = member.payment_status === 'rejected';
                              const isRevision = member.payment_status === 'revision';
                              const totalFee = member.total_amount || (member.amount_due + member.attendance_fee);

                              return (
                                <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group/row">
                                  {/* Checkbox for bulk select */}
                                  <td className="py-2.5 px-4 text-center">
                                    {!isPaid && (
                                      <input
                                        type="checkbox"
                                        checked={selectedPayments.some(p => p.id === member.id)}
                                        onChange={e => {
                                          if (e.target.checked) {
                                            setSelectedPayments(prev => [...prev, {
                                              id: member.id,
                                              memberName: member.member_name,
                                              amount: totalFee,
                                              matchId: match.id,
                                            }]);
                                          } else {
                                            setSelectedPayments(prev => prev.filter(p => p.id !== member.id));
                                          }
                                        }}
                                        className="w-3.5 h-3.5 rounded bg-zinc-800 border-white/20 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                      />
                                    )}
                                  </td>

                                  {/* Player Name & VIP Badge */}
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className={`w-7 h-7 rounded-full border font-bold flex items-center justify-center text-[10px] font-mono shrink-0 shadow-xs ${AVATAR_GRADIENTS[mIdx % AVATAR_GRADIENTS.length]}`}>
                                        {member.member_name.substring(0, 2).toUpperCase()}
                                      </div>
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={editingMatch.members[member.id]?.name ?? member.member_name}
                                          onChange={(e) => setEditingMatch({
                                            ...editingMatch,
                                            members: {
                                              ...editingMatch.members,
                                              [member.id]: {
                                                ...editingMatch.members[member.id],
                                                name: e.target.value,
                                              }
                                            }
                                          })}
                                          className="px-2 py-0.5 bg-black/50 border border-white/20 rounded text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
                                        />
                                      ) : (
                                        <span className="font-bold text-white tracking-tight text-xs">{member.member_name}</span>
                                      )}
                                      {paymentExemptMembers.has(member.member_name.toLowerCase()) && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-mono font-bold border border-amber-500/30">
                                          VIP
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Shuttlecock Fee */}
                                  <td className="py-2.5 px-3 text-right">
                                    <span className="font-mono font-bold text-xs text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20 inline-block">
                                      Rp {(member.amount_due || 0).toLocaleString('id-ID')}
                                    </span>
                                  </td>

                                  {/* Attendance / Court Fee */}
                                  <td className="py-2.5 px-3 text-right">
                                    {member.attendance_fee > 0 ? (
                                      <span className="font-mono font-bold text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block">
                                        Rp {member.attendance_fee.toLocaleString('id-ID')}
                                      </span>
                                    ) : (
                                      <span className="font-mono font-semibold text-xs text-zinc-600">
                                        Rp 0
                                      </span>
                                    )}
                                  </td>

                                  {/* Total Bill */}
                                  <td className="py-2.5 px-4 text-right">
                                    <span className="font-mono text-sm font-black text-emerald-400 tracking-tight bg-emerald-500/15 px-3 py-1 rounded-lg border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)] inline-block">
                                      Rp {totalFee.toLocaleString('id-ID')}
                                    </span>
                                  </td>

                                  {/* Payment Proof Button */}
                                  <td className="py-2.5 px-3 text-center">
                                    {member.payment_proof ? (
                                      <button
                                        onClick={() => {
                                          setSelectedProof({
                                            id: member.id,
                                            matchId: match.id,
                                            memberName: member.member_name,
                                            amount: totalFee,
                                            proofUrl: member.payment_proof,
                                          });
                                          setShowProofModal(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm"
                                        title="Lihat Bukti Bayar"
                                      >
                                        <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                                        <span>Lihat Bukti</span>
                                      </button>
                                    ) : (
                                      <span className="text-xs text-zinc-600 font-mono">-</span>
                                    )}
                                  </td>

                                  {/* Status & Verification Action */}
                                  <td className="py-2.5 px-4 text-right">
                                    {isPaid ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
                                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                        <span>Lunas</span>
                                      </span>
                                    ) : isRejected ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs">
                                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                        <span>Ditolak</span>
                                      </span>
                                    ) : isRevision ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs">
                                        <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                                        <span>Revisi</span>
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleVerifyPayment(member.id)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:shadow-[0_0_16px_rgba(16,185,129,0.5)]"
                                      >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        <span>Verifikasi</span>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE MATCH */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Input Match Baru DLBC</h3>
                  <p className="text-xs text-zinc-400">Pertandingan ganda 4 pemain (Cikupa)</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Image Extraction Option */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <ImageIcon className="text-emerald-400 mt-1 shrink-0" size={22} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-bold text-sm mb-1">Ekstraksi dari Foto / Gambar</h4>
                  <p className="text-xs text-zinc-400 mb-3">
                    Upload foto papan jadwal pertandingan DLBC dan ekstrak data pemain otomatis dengan AI (15-20 pertandingan sekaligus).
                  </p>
                  <Link
                    href="/cikupa/admin/match-image-extraction"
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
                  >
                    <ImageIcon size={16} />
                    Gunakan Ekstraksi Gambar AI
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-zinc-900 text-zinc-500">atau input manual</span>
              </div>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={newMatch.match_date}
                    onChange={e => setNewMatch({ ...newMatch, match_date: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Jumlah Kock</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={newMatch.shuttlecock_count}
                    onChange={e => setNewMatch({ ...newMatch, shuttlecock_count: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* 4 Players Selection */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-zinc-300 block">4 Pemain (Ganda)</label>
                {(['member1', 'member2', 'member3', 'member4'] as const).map((key, idx) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-xs font-bold text-zinc-500">{idx + 1}.</span>
                      <select
                        value={newMatch[key]}
                        onChange={e => setNewMatch({ ...newMatch, [key]: e.target.value })}
                        className="flex-1 px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Pilih Pemain --</option>
                        {allMembers.map(m => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Inline Add New Member */}
                    <div className="flex items-center gap-2 pl-7">
                      <input
                        type="text"
                        placeholder="Atau ketik nama baru..."
                        value={newMemberInputs[key] || ''}
                        onChange={e => setNewMemberInputs({ ...newMemberInputs, [key]: e.target.value })}
                        className="flex-1 px-2.5 py-1 bg-zinc-950 border border-white/10 rounded-lg text-[11px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        disabled={creatingMember[key] || !newMemberInputs[key]?.trim()}
                        onClick={() => createTempMemberInline(key)}
                        className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 disabled:opacity-50 text-[11px] font-bold rounded-lg border border-emerald-500/30 transition-colors"
                      >
                        {creatingMember[key] ? '...' : '+ Tambah'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-zinc-800/60 p-3 rounded-xl border border-white/5 text-[11px] text-zinc-400 space-y-1">
                <div className="flex justify-between items-center">
                  <span>Biaya Kock per Pemain (Rp {branchPricing.costPerMemberPerCock.toLocaleString('id-ID')} × {newMatch.shuttlecock_count} kock)</span>
                  <span className="font-bold text-emerald-400 text-xs">Rp {(newMatch.shuttlecock_count * branchPricing.costPerMemberPerCock).toLocaleString('id-ID')}</span>
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                  *Biaya kehadiran (lapangan): Rp {(branchPricing.singleMatchAttendanceFee || 5000).toLocaleString('id-ID')} jika main 1 kali, Rp {branchPricing.attendanceFee.toLocaleString('id-ID')} jika main lebih dari 1 kali.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingMatch}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {creatingMatch ? 'Menyimpan...' : 'Simpan Pertandingan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PROOF VIEWER WITH ZOOM & PAN */}
      {/* ========================================================================= */}
      {showProofModal && selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950/60">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  Bukti Pembayaran: {selectedProof.memberName}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tagihan: <span className="font-bold text-emerald-400">Rp {selectedProof.amount.toLocaleString('id-ID')}</span> · Pertandingan
                </p>
              </div>
              <div className="flex items-center gap-1">
                {/* Zoom tools */}
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.3, 3))}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.3, 1))}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={resetZoom}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  title="Reset"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowProofModal(false);
                    resetZoom();
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Proof Image Stage */}
            <div
              className="flex-1 bg-black/60 relative overflow-hidden flex items-center justify-center min-h-[350px] cursor-grab active:cursor-grabbing p-4 select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {selectedProof.proofUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedProof.proofUrl}
                  alt="Bukti Transfer"
                  style={{
                    transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                    maxHeight: '60vh',
                    maxWidth: '100%',
                    objectFit: 'contain',
                  }}
                  className="rounded-lg shadow-2xl pointer-events-none"
                />
              ) : (
                <div className="text-center text-zinc-500 py-12">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Gambar bukti tidak tersedia</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-zinc-950/80">
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/30 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                Tolak Bukti
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowProofModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl"
                >
                  Tutup
                </button>
                <button
                  onClick={() => handleVerifyPayment(selectedProof.id)}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  Terima Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REJECTION REASON */}
      {/* ========================================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400" />
              Alasan Penolakan Bukti
            </h3>

            <div className="space-y-2">
              {[
                'Nominal transfer tidak sesuai',
                'Bukti transfer buram / tidak terbaca',
                'Rekening tujuan tidak sesuai',
                'Bukti transfer terindikasi palsu / sudah dipakai',
              ].map(reason => (
                <label key={reason} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={rejectReason === reason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="text-rose-500 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Atau tulis alasan lainnya..."
                  value={customRejectReason}
                  onChange={e => setCustomRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={rejecting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {rejecting ? 'Menolak...' : 'Konfirmasi Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: BULK CONFIRM */}
      {/* ========================================================================= */}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              Konfirmasi Massal Pembayaran
            </h3>
            <p className="text-xs text-zinc-400">
              Anda akan menandai <strong className="text-white">{selectedPayments.length} transaksi</strong> sebagai Lunas dengan total Rp {selectedPayments.reduce((s, p) => s + p.amount, 0).toLocaleString('id-ID')}.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBulkConfirmModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleBulkConfirm}
                disabled={bulkConfirming}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {bulkConfirming ? 'Memproses...' : 'Ya, Konfirmasi Lunas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: PRINT SESSION SHEET MODAL */}
      {/* ========================================================================= */}
      <DlbcSessionSheetPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />
    </div>
  );
}
