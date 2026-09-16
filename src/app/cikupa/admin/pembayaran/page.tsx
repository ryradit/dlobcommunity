'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { StatCardSkeleton, MatchCardSkeleton } from '@/components/LoadingSkeletons';
import { getSaturdaysInMonth } from '@/lib/weeksCalculation';
import BranchBadge from '@/components/BranchBadge';
import DlbcSessionSheetPrintModal from '@/components/DlbcSessionSheetPrintModal';

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
  rejection_reason?: string | null;
  branch_id?: string;
}

interface Membership {
  id: string;
  member_name: string;
  month: number;
  year: number;
  weeks_in_month: number;
  amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled' | 'rejected' | 'revision';
  paid_at: string | null;
  payment_proof: string | null;
  created_at: string;
  rejection_reason?: string | null;
  branch_id?: string;
}

export default function CikupaAdminPembayaranPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchMembers, setMatchMembers] = useState<Record<string, MatchMember[]>>({});
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [membershipMap, setMembershipMap] = useState<Record<string, Membership>>({});
  const [allMembers, setAllMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [newMemberInputs, setNewMemberInputs] = useState<Record<string, string>>({});
  const [creatingMember, setCreatingMember] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'proof'>('all');
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});
  
  const [activeTab, setActiveTab] = useState<'matches' | 'memberships'>('matches');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

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
  const [createMatchMembershipPayers, setCreateMatchMembershipPayers] = useState<Set<string>>(new Set());

  // Membership creation form
  const [newMembership, setNewMembership] = useState({
    member_name: '',
    weeks_in_month: 4,
  });
  const [creatingMembership, setCreatingMembership] = useState(false);

  // Proof Modal state with Zoom & Pan
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{
    type: 'match' | 'membership';
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

  // Rollback modal state
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [membershipToRollback, setMembershipToRollback] = useState<Membership | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');
  const [rollingBack, setRollingBack] = useState(false);

  // Bulk Selection state
  const [selectedPayments, setSelectedPayments] = useState<Array<{ id: string; type: 'match' | 'membership'; memberName: string; amount: number; matchId?: string }>>([]);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkConfirming, setBulkConfirming] = useState(false);

  // Auto-detect Saturdays for membership modal
  useEffect(() => {
    if (showMembershipModal) {
      const detected = getSaturdaysInMonth(selectedMonth);
      setNewMembership(prev => ({ ...prev, weeks_in_month: detected }));
    }
  }, [showMembershipModal, selectedMonth]);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const targetYear = selectedMonth.getFullYear();
      const targetMonth = selectedMonth.getMonth() + 1;
      const monthStart = new Date(targetYear, targetMonth - 1, 1);
      const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      const [matchesRes, membershipsRes, profilesRes] = await Promise.all([
        supabase
          .from('matches')
          .select('*')
          .eq('branch_id', BRANCH_ID)
          .gte('match_date', monthStart.toISOString())
          .lte('match_date', monthEnd.toISOString())
          .order('match_date', { ascending: false }),

        supabase
          .from('memberships')
          .select('*')
          .eq('branch_id', BRANCH_ID)
          .eq('month', targetMonth)
          .eq('year', targetYear)
          .neq('payment_status', 'cancelled')
          .order('created_at', { ascending: false }),

        supabase
          .from('profiles')
          .select('id, full_name, email, is_payment_exempt, branch_id')
          .or(`branch_id.eq.${BRANCH_ID},branch_id.is.null`)
          .order('full_name', { ascending: true }),
      ]);

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

      if (membershipsRes.error) console.error('Error fetching memberships:', membershipsRes.error);
      const fetchedMemberships: Membership[] = membershipsRes.data || [];
      setMemberships(fetchedMemberships);

      const map: Record<string, Membership> = {};
      fetchedMemberships.forEach(m => {
        map[m.member_name.toLowerCase()] = m;
      });
      setMembershipMap(map);

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
      const matchMonth = matchDateObj.getMonth() + 1;
      const matchYear = matchDateObj.getFullYear();

      // DLBC currently does not have monthly membership packages. All non-exempt players pay attendance fee Rp 12.000 (1x/day).
      const monthMembershipSet = new Set<string>();

      // Insert match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          shuttlecock_count: newMatch.shuttlecock_count,
          status: 'active',
          created_by: user?.id,
          match_date: matchDateObj.toISOString(),
          branch_id: BRANCH_ID,
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // For DLBC: Rp 2.500 per shuttlecock per player (accumulative)
      const costPerCockPerMember = 2500;
      const costPerMember = newMatch.shuttlecock_count * costPerCockPerMember;

      // Check same-day attendance fee
      const dayStart = new Date(newMatch.match_date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(newMatch.match_date);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: sameDayMatches } = await supabase
        .from('matches')
        .select('id')
        .eq('branch_id', BRANCH_ID)
        .gte('match_date', dayStart.toISOString())
        .lte('match_date', dayEnd.toISOString());

      const sameDayMatchIds = (sameDayMatches || []).map(m => m.id);
      const sameDayFeeCharged = new Set<string>();

      if (sameDayMatchIds.length > 0) {
        const { data: sameDayMm } = await supabase
          .from('match_members')
          .select('member_name')
          .in('match_id', sameDayMatchIds)
          .gt('attendance_fee', 0);
        (sameDayMm || []).forEach(mm => sameDayFeeCharged.add(mm.member_name.toLowerCase()));
      }

      const membersData = players.map(name => {
        const isExempt = paymentExemptMembers.has(name.toLowerCase());
        const hasMember = monthMembershipSet.has(name.toLowerCase()) || createMatchMembershipPayers.has(name);
        const alreadyChargedToday = sameDayFeeCharged.has(name.toLowerCase());
        const shouldChargeAttendance = !hasMember && !alreadyChargedToday && !isExempt;

        if (shouldChargeAttendance) {
          sameDayFeeCharged.add(name.toLowerCase());
        }

        return {
          match_id: match.id,
          member_name: name,
          amount_due: isExempt ? 0 : costPerMember,
          attendance_fee: shouldChargeAttendance ? 12000 : 0,
          has_membership: hasMember || isExempt,
          payment_status: isExempt ? 'paid' : 'pending',
          paid_at: isExempt ? new Date().toISOString() : null,
          branch_id: BRANCH_ID,
        };
      });

      const { error: mmError } = await supabase
        .from('match_members')
        .insert(membersData);

      if (mmError) throw mmError;

      setShowCreateModal(false);
      setNewMatch({
        shuttlecock_count: 1,
        member1: '',
        member2: '',
        member3: '',
        member4: '',
        match_date: new Date().toISOString().split('T')[0],
      });
      setCreateMatchMembershipPayers(new Set());
      await loadData();
    } catch (e: any) {
      console.error('Error creating match:', e);
      alert(e?.message || 'Gagal membuat pertandingan');
    } finally {
      setCreatingMatch(false);
    }
  }

  // Create membership handler
  async function handleCreateMembership(e: React.FormEvent) {
    e.preventDefault();
    if (!newMembership.member_name.trim()) {
      alert('Pilih member terlebih dahulu.');
      return;
    }

    try {
      setCreatingMembership(true);
      const targetMonth = selectedMonth.getMonth() + 1;
      const targetYear = selectedMonth.getFullYear();
      const feePerWeek = 25000;
      const totalAmount = newMembership.weeks_in_month * feePerWeek;

      const { error } = await supabase
        .from('memberships')
        .insert({
          member_name: newMembership.member_name.trim(),
          month: targetMonth,
          year: targetYear,
          weeks_in_month: newMembership.weeks_in_month,
          amount: totalAmount,
          payment_status: 'pending',
          branch_id: BRANCH_ID,
        });

      if (error) throw error;

      setShowMembershipModal(false);
      setNewMembership({ member_name: '', weeks_in_month: 4 });
      await loadData();
    } catch (e: any) {
      console.error('Error creating membership:', e);
      alert(e?.message || 'Gagal menambahkan membership');
    } finally {
      setCreatingMembership(false);
    }
  }

  // Verify Single Payment
  async function handleVerifyPayment(type: 'match' | 'membership', id: string) {
    try {
      if (type === 'match') {
        const { error } = await supabase
          .from('match_members')
          .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('memberships')
          .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (error) throw error;
      }

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
      if (selectedProof.type === 'match') {
        const { error } = await supabase
          .from('match_members')
          .update({
            payment_status: 'rejected',
            rejection_reason: finalReason,
          })
          .eq('id', selectedProof.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('memberships')
          .update({
            payment_status: 'rejected',
            rejection_reason: finalReason,
          })
          .eq('id', selectedProof.id);
        if (error) throw error;
      }

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

  // Rollback Membership
  async function handleConfirmRollback() {
    if (!membershipToRollback) return;
    try {
      setRollingBack(true);
      const res = await fetch('/api/admin/membership-rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: membershipToRollback.id,
          reason: rollbackReason.trim() || 'Rollback verifikasi oleh admin DLBC',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal rollback');

      setShowRollbackModal(false);
      setMembershipToRollback(null);
      setRollbackReason('');
      await loadData();
    } catch (e: any) {
      alert(e?.message || 'Gagal melakukan rollback');
    } finally {
      setRollingBack(false);
    }
  }

  // Delete Match
  async function handleDeleteMatch(matchId: string) {
    if (!confirm('Yakin ingin menghapus pertandingan ini beserta seluruh catatan pembayarannya?')) return;
    try {
      await supabase.from('match_members').delete().eq('match_id', matchId);
      const { error } = await supabase.from('matches').delete().eq('id', matchId);
      if (error) throw error;
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
      const matchIds = selectedPayments.filter(p => p.type === 'match').map(p => p.id);
      const membershipIds = selectedPayments.filter(p => p.type === 'membership').map(p => p.id);

      if (matchIds.length > 0) {
        await supabase
          .from('match_members')
          .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
          .in('id', matchIds);
      }
      if (membershipIds.length > 0) {
        await supabase
          .from('memberships')
          .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
          .in('id', membershipIds);
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

  const filteredMemberships = memberships.filter(m => {
    const matchesSearch = m.member_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === 'pending') return m.payment_status === 'pending';
    if (filterStatus === 'paid') return m.payment_status === 'paid';
    if (filterStatus === 'proof') return !!m.payment_proof;
    return true;
  });

  // Calculate Stat Cards
  const totalMatchIncome = allMatchMemberList
    .filter(mm => mm.payment_status === 'paid')
    .reduce((sum, mm) => sum + (mm.total_amount || (mm.amount_due + mm.attendance_fee) || 0), 0);

  const totalMembershipIncome = memberships
    .filter(m => m.payment_status === 'paid')
    .reduce((sum, m) => sum + (m.amount || 0), 0);

  const totalRevenue = totalMatchIncome + totalMembershipIncome;

  const pendingMatchPaymentsCount = allMatchMemberList.filter(mm => mm.payment_status === 'pending').length;
  const pendingMembershipPaymentsCount = memberships.filter(m => m.payment_status === 'pending').length;
  const totalPendingCount = pendingMatchPaymentsCount + pendingMembershipPaymentsCount;

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-400" />
              Kelola Pembayaran DLBC
            </h1>
            <BranchBadge branchId={BRANCH_ID} />
          </div>
          <p className="text-sm text-zinc-400">
            Pusat validasi bukti bayar pertandingan & membership bulanan Cikupa
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-zinc-800/80 border border-white/10 rounded-xl p-1.5 self-start md:self-auto">
          <button
            onClick={() => {
              const d = new Date(selectedMonth);
              d.setMonth(d.getMonth() - 1);
              setSelectedMonth(d);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 transition-colors"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 py-1 text-xs font-bold text-emerald-400 tracking-wide">
            {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
          </div>
          <button
            onClick={() => {
              const d = new Date(selectedMonth);
              d.setMonth(d.getMonth() + 1);
              setSelectedMonth(d);
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 transition-colors"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedMonth(new Date())}
            className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition-colors ml-1"
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* 4 Glassmorphism Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4.5 relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Total Pendapatan</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Pertandingan + Membership
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4.5 relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Menunggu Konfirmasi</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-400">
            {totalPendingCount} Transaksi
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {pendingMatchPaymentsCount} match · {pendingMembershipPaymentsCount} member
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4.5 relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Pertandingan Selesai</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white">
            {matches.length} Match
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {allMatchMemberList.filter(mm => mm.payment_status === 'paid').length} slot lunas
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4.5 relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Membership Bulan Ini</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white">
            {memberships.filter(m => m.payment_status === 'paid').length} Lunas
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Dari {memberships.length} terdaftar
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Dual Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-white/10 rounded-xl">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'matches'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Pertandingan ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('memberships')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'memberships'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Membership Bulanan ({memberships.length})
          </button>
        </div>

        {/* Buttons: Add Match, Add Membership, Print Sheet, Image Extraction */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/cikupa/admin/match-image-extraction"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 hover:border-emerald-500/50 transition-colors shadow-sm"
            title="Ekstraksi data pertandingan dari foto jadwal AI"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Ekstraksi Foto AI
          </Link>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold rounded-xl transition-colors shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Input Match
          </button>



          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Lembar Sesi
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/60 border border-white/10 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'matches' ? 'Cari no match atau nama pemain...' : 'Cari nama member membership...'}
            className="w-full pl-9 pr-4 py-2 bg-zinc-800/80 border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'pending', 'paid', 'proof'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-white/5'
              }`}
            >
              {status === 'all' && 'Semua'}
              {status === 'pending' && 'Menunggu'}
              {status === 'paid' && 'Lunas'}
              {status === 'proof' && 'Ada Bukti'}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar (when selected) */}
      {selectedPayments.length > 0 && (
        <div className="flex items-center justify-between bg-emerald-950/60 border border-emerald-500/40 p-3.5 rounded-xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">
              {selectedPayments.length} pembayaran terpilih
            </span>
            <span className="text-xs text-zinc-400">
              (Total: Rp {selectedPayments.reduce((s, p) => s + p.amount, 0).toLocaleString('id-ID')})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPayments([])}
              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => setShowBulkConfirmModal(true)}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-colors shadow-md shadow-emerald-500/20"
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
      ) : activeTab === 'matches' ? (
        /* MATCHES TAB */
        <div className="space-y-3">
          {filteredMatches.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/40 border border-white/10 rounded-2xl">
              <Award className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-300">Belum ada pertandingan di bulan ini</p>
              <p className="text-xs text-zinc-500 mt-1">Klik &quot;Input Match&quot; untuk menambahkan sesi pertandingan DLBC baru.</p>
            </div>
          ) : (
            filteredMatches.map(match => {
              const members = matchMembers[match.id] || [];
              const isExpanded = expandedMatches[match.id] ?? true;
              const allPaid = members.length > 0 && members.every(m => m.payment_status === 'paid');
              const hasPending = members.some(m => m.payment_status === 'pending');

              return (
                <div
                  key={match.id}
                  className="bg-zinc-900/70 border border-white/10 rounded-2xl overflow-hidden transition-all"
                >
                  {/* Match Header */}
                  <div className="flex flex-wrap items-center justify-between p-4 bg-zinc-800/40 border-b border-white/5 gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedMatches(prev => ({ ...prev, [match.id]: !isExpanded }))}
                        className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">
                            Match #{match.match_number}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                            {match.shuttlecock_count} Kock
                          </span>
                          {allPaid ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Lunas
                            </span>
                          ) : hasPending ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Ada Pending
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {match.match_date ? new Date(match.match_date).toLocaleDateString('id-ID', {
                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                          }) : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-300 mr-2">
                        Total: Rp {(match.total_cost || (match.shuttlecock_count * 2500)).toLocaleString('id-ID')}
                      </span>
                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Hapus Pertandingan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Match Members List */}
                  {isExpanded && (
                    <div className="p-3 divide-y divide-white/5">
                      {members.map(member => {
                        const isPaid = member.payment_status === 'paid';
                        const isRejected = member.payment_status === 'rejected';
                        const isRevision = member.payment_status === 'revision';
                        const totalFee = member.total_amount || (member.amount_due + member.attendance_fee);

                        return (
                          <div
                            key={member.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 gap-2 hover:bg-white/[0.02] rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {/* Bulk select checkbox */}
                              {!isPaid && (
                                <input
                                  type="checkbox"
                                  checked={selectedPayments.some(p => p.id === member.id)}
                                  onChange={e => {
                                    if (e.target.checked) {
                                      setSelectedPayments(prev => [...prev, {
                                        id: member.id,
                                        type: 'match',
                                        memberName: member.member_name,
                                        amount: totalFee,
                                        matchId: match.id,
                                      }]);
                                    } else {
                                      setSelectedPayments(prev => prev.filter(p => p.id !== member.id));
                                    }
                                  }}
                                  className="w-4 h-4 rounded bg-zinc-800 border-white/20 text-emerald-500 focus:ring-emerald-500"
                                />
                              )}

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">
                                    {member.member_name}
                                  </span>
                                  {member.has_membership && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-semibold">
                                      Member
                                    </span>
                                  )}
                                  {paymentExemptMembers.has(member.member_name.toLowerCase()) && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                                      VIP
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-zinc-400 mt-0.5">
                                  Kock: Rp {(member.amount_due || 0).toLocaleString('id-ID')}
                                  {member.attendance_fee > 0 && ` + Lapangan: Rp ${member.attendance_fee.toLocaleString('id-ID')}`}
                                  <span className="font-bold text-zinc-200 ml-1">
                                    = Rp {totalFee.toLocaleString('id-ID')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status & Actions */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              {/* Proof preview button */}
                              {member.payment_proof ? (
                                <button
                                  onClick={() => {
                                    setSelectedProof({
                                      type: 'match',
                                      id: member.id,
                                      matchId: match.id,
                                      memberName: member.member_name,
                                      amount: totalFee,
                                      proofUrl: member.payment_proof,
                                    });
                                    setShowProofModal(true);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                                >
                                  <Eye className="w-3 h-3" />
                                  Bukti Bayar
                                </button>
                              ) : (
                                <span className="text-[10px] text-zinc-500 italic">
                                  Belum upload bukti
                                </span>
                              )}

                              {/* Status badge */}
                              {isPaid ? (
                                <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Lunas
                                </span>
                              ) : isRejected ? (
                                <span className="text-xs font-bold text-rose-400 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-1">
                                  <X className="w-3 h-3" /> Ditolak
                                </span>
                              ) : isRevision ? (
                                <span className="text-xs font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Revisi
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleVerifyPayment('match', member.id)}
                                  className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black text-xs font-bold rounded-lg border border-emerald-500/30 transition-all"
                                >
                                  <Check className="w-3 h-3" /> Verifikasi
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* MEMBERSHIPS TAB */
        <div className="space-y-3">
          {filteredMemberships.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/40 border border-white/10 rounded-2xl">
              <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-zinc-300">Belum ada membership di bulan ini</p>
              <p className="text-xs text-zinc-500 mt-1">Klik &quot;Input Membership&quot; untuk menambahkan member bulanan DLBC.</p>
            </div>
          ) : (
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
              {filteredMemberships.map(membership => {
                const isPaid = membership.payment_status === 'paid';
                const isRejected = membership.payment_status === 'rejected';

                return (
                  <div
                    key={membership.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {!isPaid && (
                        <input
                          type="checkbox"
                          checked={selectedPayments.some(p => p.id === membership.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedPayments(prev => [...prev, {
                                id: membership.id,
                                type: 'membership',
                                memberName: membership.member_name,
                                amount: membership.amount,
                              }]);
                            } else {
                              setSelectedPayments(prev => prev.filter(p => p.id !== membership.id));
                            }
                          }}
                          className="w-4 h-4 rounded bg-zinc-800 border-white/20 text-emerald-500 focus:ring-emerald-500"
                        />
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {membership.member_name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                            {membership.weeks_in_month} Pertemuan (Sabtu)
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Biaya: <span className="font-bold text-emerald-400">Rp {(membership.amount || 0).toLocaleString('id-ID')}</span> · {monthNames[membership.month - 1]} {membership.year}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {/* Proof Button */}
                      {membership.payment_proof ? (
                        <button
                          onClick={() => {
                            setSelectedProof({
                              type: 'membership',
                              id: membership.id,
                              memberName: membership.member_name,
                              amount: membership.amount,
                              proofUrl: membership.payment_proof,
                            });
                            setShowProofModal(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Bukti Bayar
                        </button>
                      ) : (
                        <span className="text-[10px] text-zinc-500 italic">
                          Belum upload bukti
                        </span>
                      )}

                      {/* Status & Rollback */}
                      {isPaid ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Lunas
                          </span>
                          <button
                            onClick={() => {
                              setMembershipToRollback(membership);
                              setShowRollbackModal(true);
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Rollback Pembayaran"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : isRejected ? (
                        <span className="text-xs font-bold text-rose-400 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-1">
                          <X className="w-3 h-3" /> Ditolak
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerifyPayment('membership', membership.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black text-xs font-bold rounded-lg border border-emerald-500/30 transition-all"
                        >
                          <Check className="w-3 h-3" /> Verifikasi
                        </button>
                      )}
                    </div>
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
                  <span>Biaya Kock per Pemain (Rp 2.500 × {newMatch.shuttlecock_count} kock)</span>
                  <span className="font-bold text-emerald-400 text-xs">Rp {(newMatch.shuttlecock_count * 2500).toLocaleString('id-ID')}</span>
                </div>
                <div className="text-[10px] text-zinc-500 pt-1 border-t border-white/5">
                  *Member bulanan bebas iuran lapangan. Non-member otomatis dikenakan iuran lapangan Rp 12.000 (1x sehari).
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
      {/* MODAL 2: CREATE MEMBERSHIP */}
      {/* ========================================================================= */}
      {showMembershipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Input Membership DLBC</h3>
                  <p className="text-xs text-zinc-400">
                    {monthNames[selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMembershipModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMembership} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Pilih Member</label>
                <select
                  required
                  value={newMembership.member_name}
                  onChange={e => setNewMembership({ ...newMembership, member_name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Pilih Member DLBC --</option>
                  {allMembers.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Jumlah Pertemuan Sabtu Bulan Ini
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  required
                  value={newMembership.weeks_in_month}
                  onChange={e => setNewMembership({ ...newMembership, weeks_in_month: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-zinc-800/60 p-3 rounded-xl border border-white/5 text-[11px] text-zinc-400 space-y-1">
                <div className="flex justify-between">
                  <span>Tarif per Pertemuan</span>
                  <span className="font-bold text-white">Rp 25.000</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tagihan Membership</span>
                  <span className="font-bold text-emerald-400">
                    Rp {(newMembership.weeks_in_month * 25000).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowMembershipModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingMembership}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {creatingMembership ? 'Menyimpan...' : 'Simpan Membership'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PROOF VIEWER WITH ZOOM & PAN */}
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
                  Tagihan: <span className="font-bold text-emerald-400">Rp {selectedProof.amount.toLocaleString('id-ID')}</span> · {selectedProof.type === 'match' ? 'Pertandingan' : 'Membership'}
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
                  onClick={() => handleVerifyPayment(selectedProof.type, selectedProof.id)}
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
      {/* MODAL 4: REJECTION REASON */}
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
      {/* MODAL 5: ROLLBACK MEMBERSHIP */}
      {/* ========================================================================= */}
      {showRollbackModal && membershipToRollback && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              Rollback Verifikasi Membership
            </h3>
            <p className="text-xs text-zinc-400">
              Yakin ingin membatalkan status lunas untuk <strong className="text-white">{membershipToRollback.member_name}</strong>? Status akan kembali menjadi pending.
            </p>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">Alasan Rollback</label>
              <input
                type="text"
                placeholder="cth. Salah konfirmasi / komplain transfer batal"
                value={rollbackReason}
                onChange={e => setRollbackReason(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRollbackModal(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmRollback}
                disabled={rollingBack}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {rollingBack ? 'Proses...' : 'Lakukan Rollback'}
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
