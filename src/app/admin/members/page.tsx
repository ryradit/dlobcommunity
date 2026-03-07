'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { usePathname } from 'next/navigation';
import { Users, Search, UserCog, Trash2, Shield, User, Mail, Calendar, CheckCircle, XCircle, AlertCircle, Phone, Eye, Award, Target, Hand, Clock, Instagram, Crown, HelpCircle, Ban, X } from 'lucide-react';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/LoadingSkeletons';
import Image from 'next/image';
import TutorialOverlay from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';

interface Member {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  is_active: boolean;
  phone?: string;
  avatar_url?: string;
  playing_level?: string;
  dominant_hand?: string;
  years_playing?: string;
  achievements?: string;
  partner_preferences?: string;
  instagram_url?: string;
  has_membership?: boolean;
  is_payment_exempt?: boolean;
}

export default function AdminMembersPage() {
  const pathname = usePathname();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentMonthYear, setCurrentMonthYear] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  // Payment exemption states
  const [showExemptionModal, setShowExemptionModal] = useState(false);
  const [exemptionMember, setExemptionMember] = useState<{
    id: string;
    name: string;
    currentStatus: boolean;
    pendingMatches: number;
  } | null>(null);
  const [isProcessingExemption, setIsProcessingExemption] = useState(false);
  const [confirmExemptionText, setConfirmExemptionText] = useState('');
  const [exemptionHistory, setExemptionHistory] = useState<Array<{
    action: string;
    granted_by_name: string;
    granted_by_email: string;
    pending_matches_affected: number;
    created_at: string;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Tutorial for members page
  const tutorialSteps = getTutorialSteps('members');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('admin-members', tutorialSteps);

  // Fix temp accounts
  const [fixingTemp, setFixingTemp] = useState(false);
  const [fixTempResult, setFixTempResult] = useState<string | null>(null);

  const handleFixTempAccounts = async () => {
    if (!confirm('Reset semua akun temp (@temp.dlob.local) agar menampilkan warning ganti email & password?')) return;
    setFixingTemp(true);
    setFixTempResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/fix-temp-accounts', {
        method: 'POST',
        headers: { authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFixTempResult(`✅ ${data.updated} akun temp diperbarui`);
    } catch (e) {
      setFixTempResult(`❌ ${String(e)}`);
    } finally {
      setFixingTemp(false);
      setTimeout(() => setFixTempResult(null), 5000);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [pathname]);

  async function fetchMembers() {
    try {
      setLoading(true);
      
      // Get current month/year for membership check (always use fresh date)
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      // Update state to track current month
      setCurrentMonthYear({ month: currentMonth, year: currentYear });
      
      // Clear cache for previous months to ensure fresh data
      // This ensures when a new month starts, old membership data is not shown
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      queryCache.invalidate(`admin-active-memberships-${previousMonth}-${previousYear}`);
      
      // Fetch profiles and memberships in parallel (skip slow auth.admin call)
      const [profilesResult, membershipsResult] = await Promise.allSettled([
        // Fetch profiles with caching
        cachedQuery(
          'admin-profiles-list',
          async () => {
            const result = await supabase
              .from('profiles')
              .select('*')
              .order('created_at', { ascending: false });
            return result;
          },
          30000 // 30 seconds cache
        ),
        // Fetch active memberships
        cachedQuery(
          `admin-active-memberships-${currentMonth}-${currentYear}`,
          async () => {
            const result = await supabase
              .from('memberships')
              .select('member_name, payment_status')
              .eq('month', currentMonth)
              .eq('year', currentYear)
              .eq('payment_status', 'paid');
            return result;
          },
          30000
        ),
      ]);
      
      // Process results
      let profilesData: any[] = [];
      let membershipNames = new Set<string>();
      
      if (profilesResult.status === 'fulfilled') {
        const res = profilesResult.value as { data: any[] | null; error: any };
        if (!res.error && res.data) {
          profilesData = res.data;
        }
      }
      
      if (membershipsResult.status === 'fulfilled') {
        const res = membershipsResult.value as { data: any[] | null; error: any };
        if (!res.error && res.data) {
          membershipNames = new Set(
            res.data.map((m: any) => m.member_name.toLowerCase())
          );
        }
      }
      
      // Merge membership status with profiles
      // IMPORTANT: has_membership is based on CURRENT MONTH only
      // When a new month starts, members without paid membership for the new month
      // will NOT have the membership badge, even if they had it last month
      if (profilesData.length > 0) {
        const mergedData = profilesData.map(profile => {
          const hasMembership = membershipNames.has((profile.full_name || '').toLowerCase());
          return {
            ...profile,
            has_membership: hasMembership, // Only true if member has PAID membership for current month
          };
        });
        setMembers(mergedData);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(member: Member) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !member.is_active })
        .eq('id', member.id);

      if (!error) {
        await fetchMembers();
        setShowManageModal(false);
        setSelectedMember(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleRole(member: Member) {
    setActionLoading(true);
    try {
      const newRole = member.role === 'admin' ? 'member' : 'admin';
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', member.id);

      if (!error) {
        await fetchMembers();
        setShowManageModal(false);
        setSelectedMember(null);
      }
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteMember() {
    if (!selectedMember) return;
    
    setActionLoading(true);
    try {
      const response = await fetch('/api/members/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memberId: selectedMember.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Clear cache and refetch
        queryCache.clear();
        await fetchMembers();
        setShowDeleteModal(false);
        setSelectedMember(null);
      } else {
        console.error('Error deleting member:', data.error);
        alert(data.error || 'Gagal menghapus anggota');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Gagal menghapus anggota. Silakan coba lagi.');
    } finally {
      setActionLoading(false);
    }
  }

  // Open exemption modal
  async function openExemptionModal(member: Member) {
    try {
      const isCurrentlyExempt = member.is_payment_exempt === true;

      // Count pending matches
      const { count, error: countError } = await supabase
        .from('match_members')
        .select('*', { count: 'exact', head: true })
        .eq('member_name', member.full_name)
        .eq('payment_status', 'pending');

      if (countError) throw countError;

      setExemptionMember({
        id: member.id,
        name: member.full_name,
        currentStatus: isCurrentlyExempt,
        pendingMatches: count || 0,
      });
      setConfirmExemptionText('');
      setShowExemptionModal(true);
    } catch (error) {
      console.error('Error fetching exemption data:', error);
      alert('Gagal mengambil data member: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Execute exemption toggle
  async function executeExemption() {
    if (!exemptionMember) return;

    // Require confirmation text
    const expectedText = exemptionMember.currentStatus ? 'BAYAR' : 'GRATIS';
    if (confirmExemptionText !== expectedText) {
      alert(`Ketik "${expectedText}" untuk konfirmasi`);
      return;
    }

    try {
      setIsProcessingExemption(true);

      const newStatus = !exemptionMember.currentStatus;

      // Get current admin's info for audit log
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (!adminProfile) throw new Error('Admin profile not found');

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_payment_exempt: newStatus })
        .eq('id', exemptionMember.id);

      if (updateError) throw updateError;

      // If setting to exempt (free), set all pending matches to 0
      if (newStatus) {
        const { error: matchError } = await supabase
          .from('match_members')
          .update({
            amount_due: 0,
            attendance_fee: 0,
            // Note: total_amount is GENERATED column, will auto-update to 0
          })
          .eq('member_name', exemptionMember.name)
          .eq('payment_status', 'pending');

        if (matchError) throw matchError;

        // Log exemption grant in audit table
        const { error: auditError } = await supabase
          .from('payment_exemption_audit')
          .insert({
            member_id: exemptionMember.id,
            member_name: exemptionMember.name,
            action: 'granted',
            granted_by_id: user.id,
            granted_by_name: adminProfile.full_name,
            granted_by_email: adminProfile.email,
            pending_matches_affected: exemptionMember.pendingMatches,
          });

        if (auditError) console.error('Failed to log exemption grant:', auditError);

        alert(`✅ ${exemptionMember.name} sekarang memiliki AKSES GRATIS!\n\n` +
          `- Status: VIP/Payment Exempt\n` +
          `- ${exemptionMember.pendingMatches} pending matches diupdate ke Rp 0\n` +
          `- Semua pertandingan baru akan otomatis gratis\n` +
          `- Member akan melihat VIP card di dashboard mereka\n` +
          `- Perubahan dicatat oleh: ${adminProfile.full_name}`);
      } else {
        // Log exemption removal in audit table
        const { error: auditError } = await supabase
          .from('payment_exemption_audit')
          .insert({
            member_id: exemptionMember.id,
            member_name: exemptionMember.name,
            action: 'removed',
            granted_by_id: user.id,
            granted_by_name: adminProfile.full_name,
            granted_by_email: adminProfile.email,
            pending_matches_affected: 0,
          });

        if (auditError) console.error('Failed to log exemption removal:', auditError);

        // Removing exemption - need to recalculate amounts
        alert(`⚠️ ${exemptionMember.name} kembali ke status REGULAR MEMBER\n\n` +
          `- Pending matches perlu direcalculate manual\n` +
          `- Pertandingan baru akan dikenakan biaya normal\n` +
          `- Silakan refresh dan buat pertandingan baru untuk test\n` +
          `- Perubahan dicatat oleh: ${adminProfile.full_name}`);
      }

      setShowExemptionModal(false);
      setExemptionMember(null);
      setConfirmExemptionText('');

      // Refresh data
      queryCache.clear();
      await fetchMembers();
    } catch (error) {
      console.error('Error toggling exemption:', error);
      alert('Gagal mengubah status exemption: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessingExemption(false);
    }
  }

  // Fetch exemption history for a member (admin only)
  async function fetchExemptionHistory(memberId: string) {
    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('payment_exemption_audit')
        .select('action, granted_by_name, granted_by_email, pending_matches_affected, created_at')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExemptionHistory(data || []);
    } catch (error) {
      console.error('Error fetching exemption history:', error);
      setExemptionHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  const filteredMembers = members.filter(member =>
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: members.length,
    active: members.filter(m => m.is_active).length,
    admins: members.filter(m => m.role === 'admin').length,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">
      <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Kelola Anggota</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 transition-colors duration-300">Kelola semua anggota komunitas badminton.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {fixTempResult && (
            <span className="text-xs text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">{fixTempResult}</span>
          )}
          <button
            onClick={handleFixTempAccounts}
            disabled={fixingTemp}
            className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 transition-colors disabled:opacity-50"
            title="Fix warning akun temp"
          >
            {fixingTemp ? <span className="text-xs px-1">...</span> : <AlertCircle className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleTutorial}
            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
            title="Tampilkan panduan fitur"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="stat-card-total-members bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-5 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Total Anggota</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="stat-card-active-members bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-5 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Anggota Aktif</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.active}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="stat-card-admin-members bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl p-5 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Administrator</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{stats.admins}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Membership Month Indicator */}
      <div className="mb-4 sm:mb-6 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-xl p-3 sm:p-4 transition-colors duration-300">
        <div className="flex items-center gap-2 sm:gap-3">
          <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 transition-colors duration-300" />
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-700 dark:text-purple-300 transition-colors duration-300">
              Status Membership: {new Date(currentMonthYear.year, currentMonthYear.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400/70 mt-0.5 transition-colors duration-300">
              Badge membership hanya ditampilkan untuk member yang sudah membayar membership bulan ini
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="members-search mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-zinc-400 transition-colors duration-300" />
          <input
            type="text"
            placeholder="Cari nama atau email anggota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors duration-300"
          />
        </div>
      </div>

      {/* Members List */}
      <div className="members-table bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300">Anggota</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300">Email</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300">Peran</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300">Status</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300">Bergabung</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/10 transition-colors duration-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-zinc-400 transition-colors duration-300">
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-zinc-600 border-t-blue-400 rounded-full animate-spin transition-colors duration-300"></div>
                      <span>Memuat data anggota...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-600 dark:text-zinc-400 transition-colors duration-300">
                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-zinc-600 transition-colors duration-300" />
                    <p>Tidak ada anggota ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors duration-300">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg flex-shrink-0">
                          {member.avatar_url ? (
                            <Image
                              src={member.avatar_url}
                              alt={member.full_name || 'Profile'}
                              width={44}
                              height={44}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{member.full_name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base truncate transition-colors duration-300">
                            {member.full_name || 'Tidak Diketahui'}
                          </div>
                          {member.phone && (
                            <div className="text-xs text-gray-500 dark:text-zinc-500 truncate transition-colors duration-300">{member.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-700 dark:text-zinc-300 text-xs sm:text-sm transition-colors duration-300">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-zinc-500 flex-shrink-0 transition-colors duration-300" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {member.role === 'admin' ? (
                            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 flex-shrink-0" />
                          ) : (
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                          )}
                          <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                            member.role === 'admin' 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {member.role === 'admin' ? 'Admin' : 'Member'}
                          </span>
                        </div>
                        {member.has_membership && (
                          <div 
                            className="flex items-center gap-1 sm:gap-1.5"
                            title={`Membership aktif untuk ${new Date(currentMonthYear.year, currentMonthYear.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`}
                          >
                            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Membership
                            </span>
                          </div>
                        )}
                        {member.is_payment_exempt && (
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400 flex-shrink-0" />
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-400 border border-pink-500/30">
                              VIP - Gratis
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold transition-colors duration-300 ${
                        member.is_active 
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30' 
                          : 'bg-gray-200 dark:bg-zinc-500/20 text-gray-600 dark:text-zinc-400 border border-gray-300 dark:border-zinc-500/30'
                      }`}>
                        {member.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span className="hidden sm:inline">Nonaktif</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-zinc-400 text-xs sm:text-sm transition-colors duration-300">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-zinc-500 flex-shrink-0 transition-colors duration-300" />
                        <span className="whitespace-nowrap">
                          {new Date(member.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* VIP/Payment Exemption Button */}
                        <button
                          onClick={() => openExemptionModal(member)}
                          className={`p-1 sm:p-1.5 rounded-lg transition-colors border ${
                            member.is_payment_exempt
                              ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30'
                              : 'bg-purple-500/10 text-purple-400/50 hover:bg-purple-500/20 border-purple-500/20'
                          }`}
                          title={member.is_payment_exempt ? 'VIP - Hapus Akses Gratis' : 'Berikan Akses Gratis (VIP)'}
                        >
                          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowDetailModal(true);
                            // Fetch exemption history if member has VIP or might have history
                            fetchExemptionHistory(member.id);
                          }}
                          className="p-1 sm:p-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors border border-purple-500/30"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowManageModal(true);
                          }}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-xs sm:text-sm font-medium border border-blue-500/30 flex items-center gap-1 sm:gap-1.5"
                        >
                          <UserCog className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Kelola</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 sm:p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Modal */}
      {showManageModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {selectedMember.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{selectedMember.full_name}</h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">{selectedMember.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">Status Akun</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors duration-300 ${
                    selectedMember.is_active 
                      ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30' 
                      : 'bg-gray-200 dark:bg-zinc-500/20 text-gray-600 dark:text-zinc-400 border border-gray-300 dark:border-zinc-500/30'
                  }`}>
                    {selectedMember.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleStatus(selectedMember)}
                  disabled={actionLoading}
                  className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    selectedMember.is_active
                      ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 border border-red-300 dark:border-red-500/30'
                      : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30 border border-green-300 dark:border-green-500/30'
                  } disabled:opacity-50`}
                >
                  {actionLoading ? 'Memproses...' : selectedMember.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">Peran</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedMember.role === 'admin'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {selectedMember.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleRole(selectedMember)}
                  disabled={actionLoading}
                  className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    selectedMember.role === 'admin'
                      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                      : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30'
                  } disabled:opacity-50`}
                >
                  {actionLoading ? 'Memproses...' : selectedMember.role === 'admin' ? 'Jadikan Member' : 'Jadikan Admin'}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setShowManageModal(false);
                setSelectedMember(null);
              }}
              className="w-full mt-6 px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-white/15 transition-colors duration-300 font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-500/30 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Hapus Anggota?</h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-400 mb-2">
                Anda akan menghapus anggota:
              </p>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold transition-colors duration-300">
                <User className="w-4 h-4" />
                {selectedMember.full_name || selectedMember.email}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedMember(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-white/15 transition-colors duration-300 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto transition-colors duration-300">
            {/* Header with Avatar */}
            <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
              <div className="relative w-28 h-28 mb-4">
                {selectedMember.avatar_url ? (
                  <Image
                    src={selectedMember.avatar_url}
                    alt={selectedMember.full_name || 'Member'}
                    fill
                    className="rounded-full object-cover border-4 border-gray-200 dark:border-white/10 transition-colors duration-300"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl shadow-lg border-4 border-gray-200 dark:border-white/10 transition-colors duration-300">
                    {selectedMember.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 transition-colors duration-300">
                {selectedMember.full_name || 'Nama tidak tersedia'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">{selectedMember.email}</p>
            </div>

            {/* Member Information */}
            <div className="space-y-4">
              {/* Email */}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mb-0.5 transition-colors duration-300">Email</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium truncate transition-colors duration-300">{selectedMember.email}</p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              {selectedMember.phone && (
                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mb-0.5 transition-colors duration-300">Nomor Telepon</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium transition-colors duration-300">{selectedMember.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Role */}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mb-0.5 transition-colors duration-300">Peran</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedMember.role === 'admin' 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {selectedMember.role === 'admin' ? (
                        <>
                          <Shield className="w-3.5 h-3.5" />
                          Admin
                        </>
                      ) : (
                        <>
                          <User className="w-3.5 h-3.5" />
                          Anggota
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedMember.is_active ? 'bg-green-500/20' : 'bg-gray-200 dark:bg-zinc-500/20'
                  }`}>
                    {selectedMember.is_active ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400 dark:text-zinc-400 transition-colors duration-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mb-0.5 transition-colors duration-300">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedMember.is_active 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-gray-200 dark:bg-zinc-500/20 text-gray-600 dark:text-zinc-400 border border-gray-300 dark:border-zinc-500/30'
                    }`}>
                      {selectedMember.is_active ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          Nonaktif
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Join Date */}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mb-0.5 transition-colors duration-300">Bergabung Sejak</p>
                    <p className="text-sm text-gray-900 dark:text-white font-medium transition-colors duration-300">
                      {new Date(selectedMember.created_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Badminton Profile Section */}
              {(selectedMember.playing_level || selectedMember.dominant_hand || selectedMember.years_playing || selectedMember.achievements || selectedMember.partner_preferences || selectedMember.instagram_url) && (
                <>
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-lg font-bold text-white mb-4">Profil Badminton</h4>
                  </div>

                  {/* Playing Level */}
                  {selectedMember.playing_level && (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-zinc-500 mb-0.5 transition-colors duration-300">Level Bermain</p>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            {selectedMember.playing_level === 'beginner' && 'Pemula'}
                            {selectedMember.playing_level === 'intermediate' && 'Menengah'}
                            {selectedMember.playing_level === 'advanced' && 'Mahir'}
                            {selectedMember.playing_level === 'professional' && 'Profesional'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dominant Hand & Years Playing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedMember.dominant_hand && (
                      <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                            <Hand className="w-5 h-5 text-pink-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-zinc-500 mb-0.5 transition-colors duration-300">Tangan Dominan</p>
                            <p className="text-sm text-gray-900 dark:text-white font-medium transition-colors duration-300">
                              {selectedMember.dominant_hand === 'right' ? 'Kanan' : 'Kiri'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedMember.years_playing && (
                      <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 dark:text-zinc-500 mb-0.5 transition-colors duration-300">Lama Bermain</p>
                            <p className="text-sm text-gray-900 dark:text-white font-medium transition-colors duration-300">{selectedMember.years_playing} Tahun</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Achievements */}
                  {selectedMember.achievements && (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <Award className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-zinc-500 mb-2 transition-colors duration-300">Pencapaian</p>
                          {(() => {
                            try {
                              const achievements = JSON.parse(selectedMember.achievements);
                              if (Array.isArray(achievements) && achievements.length > 0) {
                                return (
                                  <div className="space-y-2">
                                    {achievements.map((achievement: any, index: number) => {
                                      // Determine styling based on placement
                                      let bgColor = 'bg-zinc-700/50';
                                      let borderColor = 'border-zinc-600/50';
                                      let iconBg = 'bg-zinc-600/50';
                                      let iconColor = 'text-zinc-400';
                                      let textColor = 'text-white';
                                      
                                      if (achievement.place === 'Juara 1') {
                                        bgColor = 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10';
                                        borderColor = 'border-amber-500/30';
                                        iconBg = 'bg-gradient-to-br from-amber-400 to-yellow-500';
                                        iconColor = 'text-white';
                                        textColor = 'text-amber-400';
                                      } else if (achievement.place === 'Juara 2') {
                                        bgColor = 'bg-gradient-to-r from-gray-400/10 to-zinc-300/10';
                                        borderColor = 'border-gray-400/30';
                                        iconBg = 'bg-gradient-to-br from-gray-300 to-gray-400';
                                        iconColor = 'text-white';
                                        textColor = 'text-gray-300';
                                      } else if (achievement.place === 'Juara 3') {
                                        bgColor = 'bg-gradient-to-r from-orange-600/10 to-amber-700/10';
                                        borderColor = 'border-orange-600/30';
                                        iconBg = 'bg-gradient-to-br from-orange-500 to-amber-600';
                                        iconColor = 'text-white';
                                        textColor = 'text-orange-400';
                                      }
                                      
                                      return (
                                        <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${bgColor} ${borderColor}`}>
                                          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                            <span className={`text-lg ${iconColor}`}>🏆</span>
                                          </div>
                                          <div className="flex-1">
                                            <div className={`font-bold ${textColor}`}>{achievement.place}</div>
                                            <div className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">{achievement.tournament}</div>
                                            <div className="text-xs text-gray-500 dark:text-zinc-500 transition-colors duration-300">Tahun {achievement.year}</div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              return <p className="text-sm text-gray-500 dark:text-zinc-500 transition-colors duration-300">Belum ada pencapaian</p>;
                            } catch {
                              return <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap transition-colors duration-300">{selectedMember.achievements}</p>;
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Partner Preferences */}
                  {selectedMember.partner_preferences && (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1 transition-colors duration-300">Preferensi Partner</p>
                          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap transition-colors duration-300">{selectedMember.partner_preferences}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Instagram */}
                  {selectedMember.instagram_url && (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <Instagram className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-zinc-500 mb-0.5 transition-colors duration-300">Instagram</p>
                          <a 
                            href={selectedMember.instagram_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium truncate block transition-colors duration-300"
                          >
                            {selectedMember.instagram_url.replace('https://', '').replace('http://', '')}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* VIP/Payment Exemption History */}
              {(selectedMember.is_payment_exempt || exemptionHistory.length > 0) && (
                <>
                  <div className="pt-4 border-t border-gray-200 dark:border-white/10 transition-colors duration-300">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
                      <Award className="w-5 h-5 text-pink-500 dark:text-pink-400" />
                      Riwayat VIP/Akses Gratis
                    </h4>
                  </div>

                  {loadingHistory ? (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-8 border border-gray-200 dark:border-white/10 flex items-center justify-center transition-colors duration-300">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 dark:border-pink-400 mb-3"></div>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 transition-colors duration-300">Memuat riwayat...</p>
                      </div>
                    </div>
                  ) : exemptionHistory.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-6 border border-gray-200 dark:border-white/10 text-center transition-colors duration-300">
                      <Award className="w-12 h-12 text-gray-400 dark:text-zinc-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-zinc-500 transition-colors duration-300">Tidak ada riwayat perubahan VIP</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {exemptionHistory.map((record, index) => {
                        const isGranted = record.action === 'granted';
                        const date = new Date(record.created_at);
                        const formattedDate = date.toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        });
                        const formattedTime = date.toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div key={index} className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                                isGranted ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20'
                              }`}>
                                {isGranted ? (
                                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors duration-300 ${
                                    isGranted 
                                      ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30' 
                                      : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30'
                                  }`}>
                                    {isGranted ? '✅ Akses VIP Diberikan' : '❌ Akses VIP Dihapus'}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-zinc-500 whitespace-nowrap transition-colors duration-300">{formattedDate}</span>
                                </div>
                                
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-500" />
                                    <div className="text-xs">
                                      <span className="text-gray-500 dark:text-zinc-500 transition-colors duration-300">Oleh:</span>
                                      <span className="text-gray-900 dark:text-white font-medium ml-1 transition-colors duration-300">{record.granted_by_name || 'Admin'}</span>
                                    </div>
                                  </div>
                                  
                                  {record.granted_by_email && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-500" />
                                      <div className="text-xs">
                                        <span className="text-gray-600 dark:text-zinc-400 transition-colors duration-300">{record.granted_by_email}</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-500" />
                                    <div className="text-xs text-gray-600 dark:text-zinc-400 transition-colors duration-300">{formattedTime}</div>
                                  </div>

                                  {record.pending_matches_affected > 0 && (
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-white/5 transition-colors duration-300">
                                      <div className="text-xs">
                                        <span className="text-gray-500 dark:text-zinc-500 transition-colors duration-300">Pertandingan terpengaruh:</span>
                                        <span className="text-pink-600 dark:text-pink-400 font-semibold ml-1">{ record.pending_matches_affected}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10 transition-colors duration-300">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedMember(null);
                }}
                className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/15 transition-colors font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Exemption Modal */}
      {showExemptionModal && exemptionMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-purple-300 dark:border-purple-500/30 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white transition-colors duration-300">
                  {exemptionMember.currentStatus ? 'Hapus Akses Gratis (VIP)' : 'Berikan Akses Gratis (VIP)'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowExemptionModal(false);
                  setExemptionMember(null);
                  setConfirmExemptionText('');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
                disabled={isProcessingExemption}
              >
                <X className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Warning Section */}
              <div className={`border rounded-lg p-4 ${
                exemptionMember.currentStatus 
                  ? 'bg-orange-500/10 border-orange-500/30' 
                  : 'bg-purple-500/10 border-purple-500/30'
              }`}>
                <p className="text-sm font-medium mb-2 text-gray-900 dark:text-white transition-colors duration-300">
                  {exemptionMember.currentStatus ? '⚠️ Peringatan:' : '💎 Akses VIP/Gratis:'}
                </p>
                <p className="text-xs text-gray-700 dark:text-zinc-300 transition-colors duration-300">
                  {exemptionMember.currentStatus ? (
                    <>Member akan kembali ke status REGULAR dan harus membayar untuk pertandingan.</>
                  ) : (
                    <>Member akan mendapat akses GRATIS SELAMANYA - tidak perlu bayar apapun.</>
                  )}
                </p>
              </div>

              {/* Member Info */}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-2 transition-colors duration-300">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-zinc-400 transition-colors duration-300">Member:</span>
                  <span className="text-gray-900 dark:text-white font-medium transition-colors duration-300">{exemptionMember.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-zinc-400 transition-colors duration-300">Status saat ini:</span>
                  <span className={`font-medium ${
                    exemptionMember.currentStatus ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'
                  } transition-colors duration-300`}>
                    {exemptionMember.currentStatus ? '💎 VIP/Gratis' : 'Regular Member'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-zinc-400 transition-colors duration-300">Pending matches:</span>
                  <span className="text-gray-900 dark:text-white font-medium transition-colors duration-300">{exemptionMember.pendingMatches} match</span>
                </div>
              </div>

              {/* Considerations */}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 transition-colors duration-300">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                  {exemptionMember.currentStatus ? '📋 Yang Akan Terjadi:' : '📋 Pertimbangan Sebelum Memberikan:'}
                </p>
                <ul className="space-y-2 text-xs text-gray-700 dark:text-zinc-300 transition-colors duration-300">
                  {exemptionMember.currentStatus ? (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">•</span>
                        <span>Member kembali ke status <strong>REGULAR</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">•</span>
                        <span>Pertandingan baru akan dikenakan <strong>biaya normal</strong> (shuttlecock + kehadiran)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">•</span>
                        <span>Pending matches yang gratis akan tetap Rp 0 (tidak otomatis recalculate)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">•</span>
                        <span>Member akan melihat <strong>dashboard pembayaran normal</strong> (bukan VIP card)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">⚠️</span>
                        <span className="text-red-300"><strong>PENTING:</strong> Pastikan member sudah tidak berhak mendapat akses gratis!</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">✓</span>
                        <span><strong>SEMUA</strong> biaya akan Rp 0 (shuttlecock + kehadiran + membership)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">✓</span>
                        <span>{exemptionMember.pendingMatches} pending match akan diupdate ke <strong>Rp 0</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">✓</span>
                        <span>Pertandingan baru akan <strong>otomatis gratis</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">✓</span>
                        <span>Member <strong>tidak akan muncul</strong> di daftar pembayaran admin</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">✓</span>
                        <span>Member akan melihat <strong>VIP card khusus</strong> di dashboard mereka</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 mt-0.5">⚠️</span>
                        <span className="text-yellow-300">Gunakan untuk: <strong>Sponsor, Admin, atau Tamu Khusus</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">⚠️</span>
                        <span className="text-red-300"><strong>PERMANEN:</strong> Flag ini akan berlaku untuk semua waktu sampai dihapus manual</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Confirmation Input */}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 transition-colors duration-300">
                <p className="text-sm text-gray-700 dark:text-zinc-300 mb-2 transition-colors duration-300">
                  Ketik <strong className={exemptionMember.currentStatus ? 'text-orange-500 dark:text-orange-400' : 'text-purple-600 dark:text-purple-400'}>
                    {exemptionMember.currentStatus ? 'BAYAR' : 'GRATIS'}
                  </strong> untuk konfirmasi:
                </p>
                <input
                  type="text"
                  value={confirmExemptionText}
                  onChange={(e) => setConfirmExemptionText(e.target.value.toUpperCase())}
                  placeholder={exemptionMember.currentStatus ? 'BAYAR' : 'GRATIS'}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors duration-300"
                  disabled={isProcessingExemption}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowExemptionModal(false);
                    setExemptionMember(null);
                    setConfirmExemptionText('');
                  }}
                  disabled={isProcessingExemption}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-900 dark:text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={executeExemption}
                  disabled={isProcessingExemption || confirmExemptionText !== (exemptionMember.currentStatus ? 'BAYAR' : 'GRATIS')}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                    exemptionMember.currentStatus
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isProcessingExemption ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      {exemptionMember.currentStatus ? (
                        <>
                          <Ban className="w-4 h-4" />
                          Hapus Akses Gratis
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          Berikan Akses Gratis
                        </>
                      )}
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
        tutorialKey="admin-members"
      />
    </div>
  );
}
