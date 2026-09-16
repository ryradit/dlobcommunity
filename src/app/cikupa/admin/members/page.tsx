'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, Search, UserCog, Trash2, Shield, User, Mail, Calendar, CheckCircle, 
  XCircle, AlertCircle, Phone, Eye, Award, Target, Hand, Clock, Instagram, 
  Crown, HelpCircle, Ban, X, FlaskConical, Info, MoreVertical, ArrowRight, 
  Plus, Edit, Download, MessageSquare, SlidersHorizontal, ChevronLeft, 
  ChevronRight, RefreshCw, Sparkles, Building2 
} from 'lucide-react';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/LoadingSkeletons';
import Image from 'next/image';
import TutorialOverlay from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';
import BranchBadge from '@/components/BranchBadge';

const BRANCH_ID = 'dlob-cikupa';
const ACCENT = '#10B981';

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
  is_test_account?: boolean;
  branch_id?: string;
}

export default function CikupaAdminMembersPage() {
  const pathname = usePathname();
  const { user, isSuperAdmin, isBranchAdmin } = useAuth();

  // Hierarchy check: determines if current user can delete target member
  const canDeleteMember = (target: Member) => {
    if (!user) return false;
    if (user.id === target.id) return false;

    const targetEmail = (target.email || '').toLowerCase().trim();
    const callerEmail = (user.email || '').toLowerCase().trim();
    const isCallerSuperAdmin = isSuperAdmin || callerEmail.includes('ryradit');

    // Wahyu is Admin for both DLOB & DLBC — protected from deletion
    if (targetEmail === 'dlob.official.tng@gmail.com') return false;

    // Super Admin is protected
    if (targetEmail.includes('ryradit') || targetEmail === 'ryradit@gmail.com') return false;

    // Branch Admin (e.g. Edi) cannot delete Admin or Branch Admin
    if (!isCallerSuperAdmin && (isBranchAdmin || callerEmail === 'edi@temp.dlob.local')) {
      if (target.role === 'admin' || target.role === 'branch_admin') return false;
    }

    return true;
  };

  const userEmail = (user?.email || '').toLowerCase().trim();
  // Only Super Admin (Adit) and Dual Admin (Wahyu) are granted permission to view all branches
  const canViewAllBranches = isSuperAdmin || userEmail.includes('ryradit') || userEmail === 'dlob.official.tng@gmail.com';

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
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('cikupa-admin-members', tutorialSteps);

  // Photo zoom modal
  const [zoomPhoto, setZoomPhoto] = useState<{ url: string; name: string } | null>(null);

  // Label info modal
  const [showLabelInfo, setShowLabelInfo] = useState(false);

  // Migration states
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationSource, setMigrationSource] = useState<Member | null>(null);
  const [migrationTarget, setMigrationTarget] = useState<string>('');
  const [migratingMember, setMigratingMember] = useState(false);

  // Dropdown menu state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Test account filter
  const [hideTestAccounts, setHideTestAccounts] = useState(false);

  // Duplicate detection states
  const [duplicates, setDuplicates] = useState<Array<{
    member1: Member;
    member2: Member;
    similarityScore: number;
    reason: string;
    aiConfidence?: string;
  }>>([]);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(true);
  const [detectingDuplicates, setDetectingDuplicates] = useState(false);

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

  // Filter & Sorting & Pagination states (default branch: 'dlob-cikupa')
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'branch_admin' | 'member'>('all');
  const [filterBranch, setFilterBranch] = useState<'all' | 'dlob-pusat' | 'dlob-cikupa'>('dlob-cikupa');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterMembership, setFilterMembership] = useState<'all' | 'paid' | 'unpaid' | 'vip'>('all');
  const [filterType, setFilterType] = useState<'all' | 'real' | 'temp'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'date_desc' | 'date_asc'>('name_asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Add Member modal state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    full_name: '',
    phone: '',
    role: 'member' as 'member' | 'admin' | 'branch_admin',
    branch_id: 'dlob-cikupa' as 'dlob-pusat' | 'dlob-cikupa',
    playing_level: 'intermediate' as string,
    is_test_account: false,
  });
  const [creatingMemberLoading, setCreatingMemberLoading] = useState(false);

  // Edit Member Profile modal state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editMemberForm, setEditMemberForm] = useState({
    id: '',
    full_name: '',
    phone: '',
    playing_level: '',
    dominant_hand: 'right',
    years_playing: '',
    partner_preferences: '',
  });
  const [savingEditProfile, setSavingEditProfile] = useState(false);

  // WhatsApp link helper
  const getWhatsAppUrl = (phone?: string) => {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    if (!clean.startsWith('62')) clean = '62' + clean;
    return `https://wa.me/${clean}`;
  };

  // Open Edit Profile modal
  const handleOpenEditProfile = (member: Member) => {
    setEditMemberForm({
      id: member.id,
      full_name: member.full_name || '',
      phone: member.phone || '',
      playing_level: member.playing_level || '',
      dominant_hand: member.dominant_hand || 'right',
      years_playing: member.years_playing || '',
      partner_preferences: member.partner_preferences || '',
    });
    setShowEditProfileModal(true);
  };

  // Save Edit Profile
  const handleSaveEditProfile = async () => {
    if (!editMemberForm.full_name.trim()) {
      alert('Nama lengkap tidak boleh kosong');
      return;
    }
    setSavingEditProfile(true);
    try {
      const updates = {
        full_name: editMemberForm.full_name.trim(),
        phone: editMemberForm.phone.trim() || null,
        playing_level: editMemberForm.playing_level || null,
        dominant_hand: editMemberForm.dominant_hand || null,
        years_playing: editMemberForm.years_playing || null,
        partner_preferences: editMemberForm.partner_preferences || null,
      };
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', editMemberForm.id);

      if (error) throw error;

      // Update state locally
      setMembers(prev => prev.map(m => m.id === editMemberForm.id ? ({
        ...m,
        full_name: updates.full_name,
        phone: updates.phone || undefined,
        playing_level: updates.playing_level || undefined,
        dominant_hand: updates.dominant_hand || undefined,
        years_playing: updates.years_playing || undefined,
        partner_preferences: updates.partner_preferences || undefined,
      } as Member) : m));
      setShowEditProfileModal(false);
      alert('✅ Profil anggota berhasil diperbarui');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert('Gagal menyimpan profil: ' + (err?.message || 'Error'));
    } finally {
      setSavingEditProfile(false);
    }
  };

  // Create New Member / Temp Member
  const handleCreateNewMember = async () => {
    if (!newMemberForm.full_name.trim()) {
      alert('Nama anggota harus diisi');
      return;
    }
    setCreatingMemberLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/create-temp-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          full_name: newMemberForm.full_name.trim(),
          phone: newMemberForm.phone.trim() || null,
          role: newMemberForm.role,
          branch_id: newMemberForm.branch_id,
          playing_level: newMemberForm.playing_level,
          is_test_account: newMemberForm.is_test_account,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal membuat anggota');
      }

      setNewMemberForm({
        full_name: '',
        phone: '',
        role: 'member',
        branch_id: 'dlob-cikupa',
        playing_level: 'intermediate',
        is_test_account: false,
      });
      setShowAddMemberModal(false);
      queryCache.clear();
      await fetchMembers();
      alert(`✅ Berhasil menambahkan anggota "${data.full_name}"${newMemberForm.is_test_account ? ' (sebagai Akun Tes)' : ''}!`);
    } catch (err: any) {
      console.error('Error creating member:', err);
      alert('Gagal membuat anggota: ' + (err?.message || 'Unknown error'));
    } finally {
      setCreatingMemberLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = (list: Member[]) => {
    if (!list || list.length === 0) {
      alert('Tidak ada data anggota untuk diexport');
      return;
    }
    const headers = ['Nama', 'Email', 'No Telepon', 'Cabang', 'Peran', 'Status', 'Membership Bulan Ini', 'VIP Gratis', 'Level', 'Tanggal Bergabung'];
    const rows = list.map(m => [
      `"${(m.full_name || '').replace(/"/g, '""')}"`,
      `"${(m.email || '').replace(/"/g, '""')}"`,
      `"${(m.phone || '').replace(/"/g, '""')}"`,
      m.branch_id === 'dlob-cikupa' ? 'DLBC Cikupa' : 'DLOB Pusat',
      m.role === 'admin' ? 'Admin DLOB' : m.role === 'branch_admin' ? 'Admin DLBC' : 'Member',
      m.is_active ? 'Aktif' : 'Nonaktif',
      m.has_membership ? 'Ya' : 'Tidak',
      m.is_payment_exempt ? 'Ya' : 'Tidak',
      m.playing_level || '-',
      new Date(m.created_at).toLocaleDateString('id-ID'),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dlbc-members-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchMembers();
  }, [pathname, canViewAllBranches]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-menu')) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  async function fetchMembers() {
    try {
      setLoading(true);
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      setCurrentMonthYear({ month: currentMonth, year: currentYear });
      
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      queryCache.invalidate(`admin-active-memberships-${previousMonth}-${previousYear}`);
      queryCache.invalidate(`admin-active-memberships-${currentMonth}-${currentYear}`);
      
      const [profilesResult, membershipsResult] = await Promise.allSettled([
        cachedQuery(
          canViewAllBranches ? 'admin-profiles-list-all' : 'admin-profiles-list-cikupa',
          async () => {
            let query = supabase
              .from('profiles')
              .select('*')
              .order('created_at', { ascending: false });

            if (!canViewAllBranches) {
              query = query.eq('branch_id', BRANCH_ID);
            }

            const result = await query;
            return result;
          },
          30000
        ),
        supabase
          .from('memberships')
          .select('member_name, payment_status, branch_id')
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .eq('payment_status', 'paid'),
      ]);
      
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
            res.data.map((m: any) => (m.member_name || '').toLowerCase().trim())
          );
        }
      }
      
      if (profilesData.length > 0) {
        const mergedData = profilesData.map(profile => {
          const hasMembership = membershipNames.has((profile.full_name || '').toLowerCase().trim());
          return {
            ...profile,
            has_membership: hasMembership,
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

  // Detect duplicate members using AI
  async function detectDuplicates(showToast = false) {
    try {
      setDetectingDuplicates(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        if (showToast) alert('Sesi login tidak valid');
        return;
      }

      const response = await fetch('/api/admin/detect-duplicate-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const found = data.duplicates || [];
        setDuplicates(found);
        setShowDuplicateAlert(found.length > 0);
        if (showToast) {
          if (found.length > 0) {
            alert(`⚠️ Ditemukan ${found.length} potensi pasangan akun duplikat.`);
          } else {
            alert('✅ Tidak ditemukan akun member yang duplikat.');
          }
        }
      } else {
        console.error('Duplicate detection failed:', data.error);
        if (showToast) alert('Gagal memindai: ' + (data.error || 'Error'));
      }
    } catch (error) {
      console.error('Error detecting duplicates:', error);
      if (showToast) alert('Gagal memindai duplikat');
    } finally {
      setDetectingDuplicates(false);
    }
  }

  async function handleToggleStatus(member: Member) {
    const targetEmail = (member.email || '').toLowerCase().trim();
    if (targetEmail === 'dlob.official.tng@gmail.com') {
      alert('⚠️ Hirarki Akses: Akun Wahyu adalah Admin DLOB & DLBC dan tidak dapat dinonaktifkan.');
      return;
    }
    if (targetEmail.includes('ryradit') || targetEmail === 'ryradit@gmail.com') {
      alert('⚠️ Hirarki Akses: Akun Super Admin tidak dapat dinonaktifkan.');
      return;
    }

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

  async function handleAssignRoleAndBranch(
    member: Member,
    newRole: 'admin' | 'branch_admin' | 'member',
    newBranchId: 'dlob-pusat' | 'dlob-cikupa'
  ) {
    if (!isSuperAdmin) {
      alert('Hanya Super Admin yang berhak mengatur peran admin global dan cabang.');
      return;
    }

    const roleLabel = newRole === 'admin'
      ? 'Admin (DLOB Pusat)'
      : newRole === 'branch_admin'
        ? 'Admin Cabang DLBC (Cikupa)'
        : `Member (${newBranchId === 'dlob-cikupa' ? 'DLBC Cikupa' : 'DLOB Pusat'})`;

    const confirmMsg = `Ubah peran "${member.full_name || member.email}" menjadi:\n\n👉 ${roleLabel}\n\nLanjutkan?`;
    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sesi autentikasi tidak ditemukan. Silakan login kembali.');
      }

      const res = await fetch('/api/admin/members/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          memberId: member.id,
          role: newRole,
          branch_id: newBranchId,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal mengubah peran anggota');
      }

      queryCache.clear();
      await fetchMembers();

      if (selectedMember && selectedMember.id === member.id) {
        setSelectedMember({
          ...selectedMember,
          role: newRole,
          branch_id: newBranchId,
        });
      }

      setShowManageModal(false);
      alert(`✅ Sukses! ${member.full_name || member.email} sekarang adalah ${roleLabel}.`);
    } catch (error: any) {
      console.error('Error updating role & branch:', error);
      alert('Gagal mengubah peran: ' + (error?.message || 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteMember() {
    if (!selectedMember) return;
    
    // Front-line hierarchy guard
    const targetEmail = (selectedMember.email || '').toLowerCase().trim();
    if (targetEmail === 'dlob.official.tng@gmail.com') {
      alert('⚠️ Hirarki Akses: Akun Wahyu adalah Admin DLOB & DLBC dan tidak dapat dihapus oleh Admin Cabang (Edi).');
      setShowDeleteModal(false);
      return;
    }
    if (targetEmail.includes('ryradit') || targetEmail === 'ryradit@gmail.com') {
      alert('⚠️ Hirarki Akses: Akun Super Admin tidak dapat dihapus.');
      setShowDeleteModal(false);
      return;
    }

    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/members/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ memberId: selectedMember.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        queryCache.clear();
        await fetchMembers();
        setShowDeleteModal(false);
        setSelectedMember(null);
        alert('✅ Anggota berhasil dihapus.');
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

    const expectedText = exemptionMember.currentStatus ? 'BAYAR' : 'GRATIS';
    if (confirmExemptionText !== expectedText) {
      alert(`Ketik "${expectedText}" untuk konfirmasi`);
      return;
    }

    try {
      setIsProcessingExemption(true);
      const newStatus = !exemptionMember.currentStatus;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (!adminProfile) throw new Error('Admin profile not found');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_payment_exempt: newStatus })
        .eq('id', exemptionMember.id);

      if (updateError) throw updateError;

      if (newStatus) {
        const { error: matchError } = await supabase
          .from('match_members')
          .update({
            amount_due: 0,
            attendance_fee: 0,
          })
          .eq('member_name', exemptionMember.name)
          .eq('payment_status', 'pending');

        if (matchError) throw matchError;

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

        alert(`⚠️ ${exemptionMember.name} kembali ke status REGULAR MEMBER\n\n` +
          `- Pending matches perlu direcalculate manual\n` +
          `- Pertandingan baru akan dikenakan biaya normal\n` +
          `- Silakan refresh dan buat pertandingan baru untuk test\n` +
          `- Perubahan dicatat oleh: ${adminProfile.full_name}`);
      }

      setShowExemptionModal(false);
      setExemptionMember(null);
      setConfirmExemptionText('');

      queryCache.clear();
      await fetchMembers();
    } catch (error) {
      console.error('Error toggling exemption:', error);
      alert('Gagal mengubah status exemption: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessingExemption(false);
    }
  }

  // Toggle test label for a member
  async function handleToggleTestLabel(member: Member) {
    const newValue = !member.is_test_account;
    const confirmMsg = newValue
      ? `Tandai "${member.full_name}" sebagai akun tes?\n\nAkun tes akan disembunyikan dari leaderboard dan analitik publik.`
      : `Hapus label tes dari "${member.full_name}"?`;
    if (!confirm(confirmMsg)) return;
    try {
      setActionLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/members/toggle-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ memberId: member.id, is_test_account: newValue }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal mengubah label tes');
      }

      queryCache.clear();
      await fetchMembers();

      if (selectedMember && selectedMember.id === member.id) {
        setSelectedMember({ ...selectedMember, is_test_account: newValue });
      }

      alert(`✅ Berhasil ${newValue ? 'menandai' : 'menghapus label'} akun tes untuk "${member.full_name}".`);
    } catch (error) {
      console.error('Error toggling test label:', error);
      alert('Gagal mengubah label tes: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setActionLoading(false);
    }
  }

  // Fetch exemption history for a member
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

  // Migrate member data handler
  async function handleMigrateMember() {
    if (!migrationSource || !migrationTarget) {
      alert('Pilih member sumber dan target');
      return;
    }

    if (migrationSource.id === migrationTarget) {
      alert('Member sumber dan target tidak bisa sama');
      return;
    }

    if (!confirm(
      `Transfer SEMUA data pertandingan dari ${migrationSource.full_name} ke member target?\n\n` +
      `⚠️ PERINGATAN: Operasi ini tidak bisa dibatalkan!\n` +
      `Semua pertandingan ${migrationSource.full_name} akan pindah ke member target.`
    )) {
      return;
    }

    setMigratingMember(true);
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.access_token) {
        throw new Error('Session token tidak ditemukan. Silakan login kembali.');
      }

      const response = await fetch('/api/admin/migrate-member-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sourceMemberId: migrationSource.id,
          sourceMemberName: migrationSource.full_name,
          targetMemberId: migrationTarget,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(
          `✅ Migrasi berhasil!\n\n` +
          `- ${data.migratedCount} pertandingan dipindahkan\n` +
          `- Dari: ${migrationSource.full_name}\n` +
          `- Ke: Member target\n` +
          `- Member sumber sekarang tidak punya pertandingan lagi`
        );
        setShowMigrationModal(false);
        setMigrationSource(null);
        setMigrationTarget('');
        setOpenDropdownId(null);
        queryCache.clear();
        await fetchMembers();
      } else {
        alert('Gagal melakukan migrasi: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error migrating member:', error);
      alert('Gagal melakukan migrasi: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setMigratingMember(false);
    }
  }

  // Filtered and sorted members calculation
  const filteredAndSortedMembers = React.useMemo(() => {
    return members
      .filter(member => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch = !query ||
          member.email?.toLowerCase().includes(query) ||
          member.full_name?.toLowerCase().includes(query) ||
          (member.phone && member.phone.includes(query));

        if (hideTestAccounts && member.is_test_account) return false;

        // Role filter
        if (filterRole === 'admin' && member.role !== 'admin') return false;
        if (filterRole === 'branch_admin' && member.role !== 'branch_admin') return false;
        if (filterRole === 'member' && (member.role === 'admin' || member.role === 'branch_admin')) return false;

        // Branch filter: DLBC admin can ONLY see DLBC members
        const mBranch = member.branch_id || 'dlob-pusat';
        if (!canViewAllBranches) {
          if (mBranch !== BRANCH_ID) return false;
        } else if (filterBranch !== 'all') {
          if (mBranch !== filterBranch) return false;
        }

        // Status filter
        if (filterStatus === 'active' && !member.is_active) return false;
        if (filterStatus === 'inactive' && member.is_active) return false;

        // Membership filter
        if (filterMembership === 'paid' && !member.has_membership) return false;
        if (filterMembership === 'unpaid' && member.has_membership) return false;
        if (filterMembership === 'vip' && !member.is_payment_exempt) return false;

        // Temp account filter
        const isTemp = Boolean(member.email?.endsWith('@temp.dlob.local'));
        if (filterType === 'temp' && !isTemp) return false;
        if (filterType === 'real' && isTemp) return false;

        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return (a.full_name || '').localeCompare(b.full_name || '');
        if (sortBy === 'name_desc') return (b.full_name || '').localeCompare(a.full_name || '');
        if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return 0;
      });
  }, [members, searchTerm, hideTestAccounts, filterRole, filterBranch, filterStatus, filterMembership, filterType, sortBy, canViewAllBranches]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedMembers.length / pageSize));
  const paginatedMembers = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedMembers.slice(start, start + pageSize);
  }, [filteredAndSortedMembers, currentPage, pageSize]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterBranch, filterStatus, filterMembership, filterType, sortBy, pageSize]);

  const realMembers = members.filter(m => !m.is_test_account);

  // Scoped stats based on filterBranch
  const scopedMembers = !canViewAllBranches
    ? realMembers.filter(m => (m.branch_id || 'dlob-pusat') === BRANCH_ID)
    : filterBranch === 'all'
    ? realMembers
    : realMembers.filter(m => (m.branch_id || 'dlob-pusat') === filterBranch);

  const stats = {
    total: scopedMembers.length,
    active: scopedMembers.filter(m => m.is_active).length,
    admins: scopedMembers.filter(m => m.role === 'admin' || m.role === 'branch_admin').length,
    branchAdmins: scopedMembers.filter(m => m.role === 'branch_admin').length,
    tempCount: members.filter(m => {
      const mBranch = m.branch_id || 'dlob-pusat';
      const matchBranch = !canViewAllBranches ? mBranch === BRANCH_ID : (filterBranch === 'all' || mBranch === filterBranch);
      return matchBranch && m.email?.endsWith('@temp.dlob.local');
    }).length,
  };

  const activeMembershipCount = members.filter(m => {
    const mBranch = m.branch_id || 'dlob-pusat';
    const matchBranch = !canViewAllBranches ? mBranch === BRANCH_ID : (filterBranch === 'all' || mBranch === filterBranch);
    return matchBranch && m.has_membership && !m.is_test_account;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      {/* Top Header & Actions */}
      <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Kelola Anggota</h1>
            <BranchBadge branchId="dlob-cikupa" size="sm" />
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Manajemen profil, hak akses, dan status membership komunitas DLBC Cikupa.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Member Button */}
          <button
            type="button"
            onClick={() => setShowAddMemberModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} />
            Tambah Anggota
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={() => handleExportCSV(filteredAndSortedMembers)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 text-xs sm:text-sm transition-colors cursor-pointer shadow-sm"
            title="Download CSV data anggota yang difilter"
          >
            <Download size={15} />
            Export CSV
          </button>

          {/* AI Duplicate Scan Button */}
          <button
            type="button"
            onClick={() => detectDuplicates(true)}
            disabled={detectingDuplicates}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 text-xs sm:text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            title="Pindai potensi akun ganda dengan AI"
          >
            <Sparkles size={15} className={detectingDuplicates ? 'animate-spin text-amber-500 dark:text-amber-400' : 'text-amber-500 dark:text-amber-400'} />
            {detectingDuplicates ? 'Memindai...' : 'Pindai Duplikat'}
          </button>

          {fixTempResult && (
            <span className="text-xs text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-lg shadow-sm">{fixTempResult}</span>
          )}
          <button
            type="button"
            onClick={handleFixTempAccounts}
            disabled={fixingTemp}
            className="p-2 rounded-xl bg-white dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-white/10 text-amber-500 dark:text-yellow-400 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            title="Perbaiki flag warning akun temp (@temp.dlob.local)"
          >
            {fixingTemp ? <span className="text-xs px-1">...</span> : <AlertCircle className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={toggleTutorial}
            className="p-2 rounded-xl bg-white dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer shadow-sm"
            title="Tampilkan panduan fitur"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Duplicate Detection Alert */}
      {showDuplicateAlert && duplicates.length > 0 && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className="font-semibold text-amber-200">
                  ⚠️ Kemungkinan Duplikat Ditemukan ({duplicates.length})
                </h3>
              </div>
              <p className="text-sm text-amber-300/90 mb-3">
                Sistem AI telah mendeteksi {duplicates.length} pasangan member dengan nama yang sangat mirip. Periksa apakah mereka adalah akun duplikat dari orang yang sama.
              </p>
              
              {/* Duplicate List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {duplicates.slice(0, 5).map((dup, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 bg-zinc-900/80 p-3 rounded-xl border border-white/10">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        &quot;{dup.member1.full_name}&quot; ↔ &quot;{dup.member2.full_name}&quot;
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {dup.reason} • {dup.similarityScore}% kesamaan
                      </p>
                      {dup.aiConfidence && (
                        <span className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${
                          dup.aiConfidence === 'LIKELY_DUPLICATE'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {dup.aiConfidence === 'LIKELY_DUPLICATE' ? 'Kemungkinan Tinggi' : 'Kemungkinan Sedang'}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMigrationSource(dup.member1);
                        setMigrationTarget(dup.member2.id);
                        setShowMigrationModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium whitespace-nowrap transition-colors cursor-pointer"
                    >
                      Periksa
                    </button>
                  </div>
                ))}
                {duplicates.length > 5 && (
                  <p className="text-xs text-amber-400 text-center py-2">
                    +{duplicates.length - 5} pasangan lainnya
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDuplicateAlert(false)}
              className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards - Glassmorphism */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="stat-card-total-members bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Total Anggota</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="stat-card-active-members bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Anggota Aktif</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{stats.active}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="stat-card-admin-members bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Administrator</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 tracking-tight">{stats.admins}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Akun Temp</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-yellow-400 tracking-tight">{stats.tempCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-amber-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Membership Month Indicator */}
      <div className="mb-6 bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Crown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Status Membership: {new Date(currentMonthYear.year, currentMonthYear.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              ({activeMembershipCount} member aktif bulan ini)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Badge membership otomatis aktif setelah pembayaran bulan berjalan dikonfirmasi.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="members-search bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-4 mb-6 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau nomor WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-slate-300 dark:focus:border-white/20"
            >
              <option value="all">Semua Peran</option>
              <option value="branch_admin">Admin Cabang DLBC</option>
              <option value="admin">Admin DLOB Pusat</option>
              <option value="member">Member</option>
            </select>

            {/* Branch Filter - Only visible to Super Admin (Adit) and Dual Admin (Wahyu) */}
            {canViewAllBranches ? (
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-slate-300 dark:focus:border-white/20"
              >
                <option value="dlob-cikupa">DLBC (Cikupa)</option>
                <option value="dlob-pusat">DLOB Pusat</option>
                <option value="all">Semua Cabang</option>
              </select>
            ) : (
              <div className="px-3 py-2 bg-emerald-50 dark:bg-zinc-900/80 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 cursor-default select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                DLBC (Cikupa)
              </div>
            )}

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-slate-300 dark:focus:border-white/20"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>

            {/* Membership Filter */}
            <select
              value={filterMembership}
              onChange={(e) => setFilterMembership(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-slate-300 dark:focus:border-white/20"
            >
              <option value="all">Semua Membership</option>
              <option value="paid">Membership Aktif</option>
              <option value="unpaid">Belum Membership</option>
              <option value="vip">VIP (Gratis)</option>
            </select>

            {/* Account Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-slate-300 dark:focus:border-white/20"
            >
              <option value="all">Semua Tipe Akun</option>
              <option value="real">Akun Reguler</option>
              <option value="temp">Akun Temp</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-slate-300 dark:focus:border-white/20"
            >
              <option value="name_asc">Nama (A - Z)</option>
              <option value="name_desc">Nama (Z - A)</option>
              <option value="date_desc">Bergabung Terbaru</option>
              <option value="date_asc">Bergabung Terlama</option>
            </select>
          </div>
        </div>

        {/* Bottom Filter Info Row */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            <span>Ditemukan: <strong className="text-slate-900 dark:text-white">{filteredAndSortedMembers.length}</strong> anggota</span>
            {(searchTerm || filterRole !== 'all' || filterBranch !== 'dlob-cikupa' || filterStatus !== 'all' || filterMembership !== 'all' || filterType !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('all');
                  setFilterBranch('dlob-cikupa');
                  setFilterStatus('all');
                  setFilterMembership('all');
                  setFilterType('all');
                }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {members.some(m => m.is_test_account) && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideTestAccounts}
                onChange={e => setHideTestAccounts(e.target.checked)}
                className="rounded accent-orange-500"
              />
              <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5 text-orange-500" />
                Sembunyikan akun tes ({members.filter(m => m.is_test_account).length})
              </span>
            </label>
          )}
        </div>
      </div>

      {/* Members List Table */}
      <div className="members-table bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden mb-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-200">
            <thead className="bg-slate-100/80 dark:bg-zinc-900/90 border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 sm:px-6 py-3.5 text-left">Anggota</th>
                <th className="px-4 sm:px-6 py-3.5 text-left">Kontak</th>
                <th className="px-4 sm:px-6 py-3.5 text-left">
                  <button
                    onClick={() => setShowLabelInfo(true)}
                    className="flex items-center gap-1.5 group cursor-pointer"
                    title="Lihat penjelasan label & status"
                  >
                    <span>Peran &amp; Label</span>
                    <Info className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                  </button>
                </th>
                <th className="px-4 sm:px-6 py-3.5 text-left">Status</th>
                <th className="px-4 sm:px-6 py-3.5 text-left">Bergabung</th>
                <th className="px-4 sm:px-6 py-3.5 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm text-slate-800 dark:text-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-zinc-400">
                      <div className="w-5 h-5 border-2 border-zinc-600 border-t-emerald-400 rounded-full animate-spin"></div>
                      <span>Memuat data anggota...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <Users className="w-12 h-12 mx-auto mb-2 text-zinc-600" />
                    <p>Tidak ada anggota ditemukan.</p>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 sm:px-6 py-3.5">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-800 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-white font-bold text-xs sm:text-sm shrink-0 ${member.avatar_url ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all' : ''}`}
                          onClick={member.avatar_url ? (e) => { e.stopPropagation(); setZoomPhoto({ url: member.avatar_url!, name: member.full_name || 'Member' }); } : undefined}
                          title={member.avatar_url ? 'Klik untuk perbesar foto' : undefined}
                        >
                          {member.avatar_url ? (
                            <Image
                              src={member.avatar_url}
                              alt={member.full_name || 'Profile'}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{member.full_name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-slate-900 dark:text-white font-medium text-sm truncate">
                            {member.full_name || 'Tidak Diketahui'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                            {member.playing_level && (
                              <span className="capitalize">{member.playing_level}</span>
                            )}
                            {member.dominant_hand && (
                              <span>• {member.dominant_hand === 'right' ? 'Tangan Kanan' : 'Kiri'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5">
                      <div className="space-y-1 min-w-0 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300">
                          <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={getWhatsAppUrl(member.phone)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline transition-colors font-medium"
                              title="Klik untuk membuka chat WhatsApp"
                            >
                              <MessageSquare size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{member.phone}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {member.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
                            <Shield size={11} className="text-purple-600 dark:text-purple-400 shrink-0" />
                            Admin
                          </span>
                        ) : member.role === 'branch_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <Shield size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            Admin DLBC
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                            Member
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${
                          member.branch_id === 'dlob-cikupa'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-white/10'
                        }`} title={member.branch_id === 'dlob-cikupa' ? 'Cabang DLBC (Cikupa)' : 'Cabang DLOB Pusat'}>
                          {member.branch_id === 'dlob-cikupa' ? 'DLBC' : 'Pusat'}
                        </span>
                        {member.has_membership && (
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20"
                            title={`Membership aktif untuk ${new Date(currentMonthYear.year, currentMonthYear.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`}
                          >
                            Membership
                          </span>
                        )}
                        {member.is_payment_exempt && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-pink-500/10 text-pink-700 dark:text-pink-400 border border-pink-500/20">
                            VIP Gratis
                          </span>
                        )}
                        {member.email?.endsWith('@temp.dlob.local') && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-amber-700 dark:text-yellow-400 border border-yellow-500/20">
                            Akun Temp
                          </span>
                        )}
                        {member.is_test_account && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20">
                            Tes
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        member.is_active 
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' 
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-white/10'
                      }`}>
                        {member.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5">
                      <div className="text-slate-500 dark:text-zinc-400 text-xs whitespace-nowrap">
                        {new Date(member.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {/* Detail View Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowDetailModal(true);
                            fetchExemptionHistory(member.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
                          title="Lihat Detail Profil"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Profile Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditProfile(member)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
                          title="Edit Profil &amp; Nomor WA"
                        >
                          <Edit className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>

                        {/* Dropdown Menu for Additional Actions */}
                        <div className="relative dropdown-menu">
                          <button
                            type="button"
                            onClick={() => setOpenDropdownId(openDropdownId === member.id ? null : member.id)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
                            title="Opsi Lainnya"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Dropdown Menu Items */}
                          {openDropdownId === member.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/15 rounded-xl shadow-xl z-40 py-1 backdrop-blur-xl">
                              {/* Toggle Account Status */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleStatus(member);
                                  setOpenDropdownId(null);
                                }}
                                disabled={actionLoading}
                                className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 cursor-pointer disabled:opacity-50"
                              >
                                <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                {member.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                              </button>

                              {/* Test Account Toggle */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleToggleTestLabel(member);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 cursor-pointer"
                              >
                                <FlaskConical className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                                {member.is_test_account ? 'Hapus Label Tes' : 'Tandai Akun Tes'}
                              </button>

                              {/* VIP Access */}
                              <button
                                type="button"
                                onClick={() => {
                                  openExemptionModal(member);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 cursor-pointer"
                              >
                                <Award className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
                                {member.is_payment_exempt ? 'Hapus Akses VIP' : 'Berikan Akses VIP'}
                              </button>

                              {/* Migrate Data */}
                              <button
                                type="button"
                                onClick={() => {
                                  setMigrationSource(member);
                                  setShowMigrationModal(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-zinc-300 cursor-pointer"
                              >
                                <ArrowRight className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
                                Migrasi Data Pertandingan
                              </button>

                              {/* Delete Account */}
                              {canDeleteMember(member) ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setShowDeleteModal(true);
                                    setOpenDropdownId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 cursor-pointer border-t border-slate-200 dark:border-white/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Hapus Akun
                                </button>
                              ) : (
                                <div
                                  className="w-full px-3 py-2 text-left text-[11px] flex items-center gap-2 text-slate-400 dark:text-zinc-500 border-t border-slate-200 dark:border-white/10 cursor-not-allowed select-none bg-slate-50 dark:bg-zinc-950/40"
                                  title={
                                    (member.email || '').toLowerCase().trim() === 'dlob.official.tng@gmail.com'
                                      ? 'Akun Wahyu (Admin DLOB & DLBC) dilindungi dari penghapusan'
                                      : (member.email || '').toLowerCase().trim().includes('ryradit')
                                      ? 'Akun Super Admin dilindungi'
                                      : user?.id === member.id
                                      ? 'Tidak dapat menghapus akun Anda sendiri'
                                      : 'Hirarki: Anda tidak memiliki wewenang untuk menghapus akun ini'
                                  }
                                >
                                  <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                                  <span className="truncate">
                                    {(member.email || '').toLowerCase().trim() === 'dlob.official.tng@gmail.com'
                                      ? 'Terlindungi (Admin DLOB/DLBC)'
                                      : user?.id === member.id
                                      ? 'Akun Anda'
                                      : 'Akses Dibatasi (Hirarki)'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
          <div>
            Menampilkan <strong className="text-slate-900 dark:text-white">{filteredAndSortedMembers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> - <strong className="text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, filteredAndSortedMembers.length)}</strong> dari <strong className="text-slate-900 dark:text-white">{filteredAndSortedMembers.length}</strong> anggota
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-30 text-slate-800 dark:text-white transition-colors cursor-pointer border border-slate-200 dark:border-white/10"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-medium text-slate-900 dark:text-white">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-30 text-slate-800 dark:text-white transition-colors cursor-pointer border border-slate-200 dark:border-white/10"
              title="Halaman Selanjutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Label Info Modal */}
      {showLabelInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLabelInfo(false)}>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Info className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Penjelasan Label &amp; Status</h3>
              </div>
              <button onClick={() => setShowLabelInfo(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Role */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wide mb-2">Peran Akun</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Admin DLBC</span>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Pengelola cabang DLBC Cikupa: kelola anggota, pertandingan, keuangan, dan pengaturan cabang DLBC.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <Shield className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">Admin DLOB</span>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Super administrator dengan akses penuh ke seluruh cabang komunitas.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <User className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">Member</span>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Anggota reguler yang mengakses dashboard pribadi anggota.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Labels */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wide mb-2">Label Khusus</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <Crown className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">Membership</span>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Anggota telah membayar iuran membership untuk bulan berjalan. Badge ini otomatis muncul setelah pembayaran dikonfirmasi.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-pink-500/5 border border-pink-500/20">
                    <Award className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-400 border border-pink-500/30">VIP - Gratis</span>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Anggota dikecualikan dari semua biaya pertandingan. Semua tagihan otomatis diset ke Rp 0.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/20">
                    <FlaskConical className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">Tes</span>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Akun dummy yang digunakan untuk keperluan pengujian fitur.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wide mb-2">Status Akun</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">Aktif</span>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Akun aktif dan dapat login ke platform.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-500/5 border border-gray-500/20">
                    <XCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-zinc-500/20 text-gray-600 dark:text-zinc-400 border border-gray-300 dark:border-zinc-500/30">Nonaktif</span>
                      <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Akun dinonaktifkan oleh admin. Member tidak dapat login hingga diaktifkan kembali.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowLabelInfo(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Manage Modal */}
      {showManageModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
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
                    <User className="w-5 h-5 text-emerald-400" />
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

              {/* Akun Tes Toggle */}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-orange-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Akun Percobaan (Test)</span>
                      <p className="text-[11px] text-zinc-400">Sembunyikan dari leaderboard & analitik statistik</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedMember.is_test_account
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-white/10'
                  }`}>
                    {selectedMember.is_test_account ? 'Akun Tes' : 'Akun Asli'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleToggleTestLabel(selectedMember)}
                  className={`w-full px-4 py-2.5 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 ${
                    selectedMember.is_test_account
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10'
                      : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30'
                  } disabled:opacity-50`}
                >
                  <FlaskConical className="w-4 h-4 text-orange-400" />
                  {actionLoading ? 'Memproses...' : selectedMember.is_test_account ? 'Hapus Status Akun Tes' : 'Jadikan Akun Tes (Dummy)'}
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">Hak Akses & Cabang</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      selectedMember.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : selectedMember.role === 'branch_admin'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {selectedMember.role === 'admin'
                        ? 'Admin DLOB'
                        : selectedMember.role === 'branch_admin'
                        ? 'Admin DLBC'
                        : 'Member'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-white/10">
                      {selectedMember.branch_id === 'dlob-cikupa' ? 'DLBC Cikupa' : 'DLOB Pusat'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mb-3">
                  Anda dapat memberikan hak akses admin atau mengatur anggota sebagai member reguler.
                </p>

                <div className="space-y-2">
                  {/* Option 1: Admin Cabang DLBC (Cikupa) */}
                  <button
                    type="button"
                    disabled={actionLoading || (selectedMember.role === 'branch_admin' && selectedMember.branch_id === 'dlob-cikupa')}
                    onClick={() => handleAssignRoleAndBranch(selectedMember, 'branch_admin', 'dlob-cikupa')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedMember.role === 'branch_admin' && selectedMember.branch_id === 'dlob-cikupa'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 cursor-default ring-1 ring-emerald-500/30'
                        : 'bg-zinc-800/60 hover:bg-emerald-950/40 border-white/10 hover:border-emerald-500/40 text-zinc-200'
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          Admin Cabang DLBC (Cikupa)
                          {selectedMember.role === 'branch_admin' && selectedMember.branch_id === 'dlob-cikupa' && (
                            <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded">Aktif</span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400">Akses admin portal DLBC Cikupa (/cikupa/admin)</div>
                      </div>
                    </div>
                    {!(selectedMember.role === 'branch_admin' && selectedMember.branch_id === 'dlob-cikupa') && (
                      <span className="text-xs font-medium text-emerald-400 hover:underline shrink-0 ml-2">Jadikan Admin</span>
                    )}
                  </button>

                  {/* Option 2: Member DLBC Cikupa */}
                  <button
                    type="button"
                    disabled={actionLoading || (selectedMember.role === 'member' && selectedMember.branch_id === 'dlob-cikupa')}
                    onClick={() => handleAssignRoleAndBranch(selectedMember, 'member', 'dlob-cikupa')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedMember.role === 'member' && selectedMember.branch_id === 'dlob-cikupa'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 cursor-default ring-1 ring-emerald-500/30'
                        : 'bg-zinc-800/60 hover:bg-emerald-950/40 border-white/10 hover:border-emerald-500/40 text-zinc-200'
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          Member Reguler (DLBC Cikupa)
                          {selectedMember.role === 'member' && selectedMember.branch_id === 'dlob-cikupa' && (
                            <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded">Aktif</span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400">Anggota biasa di DLBC Cikupa (/cikupa/dashboard)</div>
                      </div>
                    </div>
                    {!(selectedMember.role === 'member' && selectedMember.branch_id === 'dlob-cikupa') && (
                      <span className="text-xs font-medium text-emerald-400 hover:underline shrink-0 ml-2">Set Member</span>
                    )}
                  </button>

                  {/* Option 3: Admin (DLOB Pusat) - Only visible to multi-branch admins */}
                  {canViewAllBranches && (
                    <button
                      type="button"
                      disabled={actionLoading || selectedMember.role === 'admin'}
                      onClick={() => handleAssignRoleAndBranch(selectedMember, 'admin', 'dlob-pusat')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedMember.role === 'admin'
                          ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 cursor-default ring-1 ring-purple-500/30'
                          : 'bg-zinc-800/60 hover:bg-purple-950/40 border-white/10 hover:border-purple-500/40 text-zinc-200'
                      } disabled:opacity-60`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            Admin (DLOB Pusat)
                            {selectedMember.role === 'admin' && (
                              <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded">Aktif</span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400">Akses admin DLOB Pusat</div>
                        </div>
                      </div>
                      {selectedMember.role !== 'admin' && (
                        <span className="text-xs font-medium text-purple-400 hover:underline shrink-0 ml-2">Jadikan Admin</span>
                      )}
                    </button>
                  )}

                  {/* Option 4: Member DLOB Pusat - Only visible to multi-branch admins */}
                  {canViewAllBranches && (
                    <button
                      type="button"
                      disabled={actionLoading || (selectedMember.role === 'member' && (!selectedMember.branch_id || selectedMember.branch_id === 'dlob-pusat'))}
                      onClick={() => handleAssignRoleAndBranch(selectedMember, 'member', 'dlob-pusat')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedMember.role === 'member' && (!selectedMember.branch_id || selectedMember.branch_id === 'dlob-pusat')
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 cursor-default ring-1 ring-blue-500/30'
                          : 'bg-zinc-800/60 hover:bg-blue-950/40 border-white/10 hover:border-blue-500/40 text-zinc-200'
                      } disabled:opacity-60`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            Member Reguler (DLOB Pusat)
                            {selectedMember.role === 'member' && (!selectedMember.branch_id || selectedMember.branch_id === 'dlob-pusat') && (
                              <span className="text-[10px] bg-blue-500/30 text-blue-200 px-1.5 py-0.2 rounded">Aktif</span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400">Anggota biasa di DLOB Pusat (/dashboard)</div>
                        </div>
                      </div>
                      {!(selectedMember.role === 'member' && (!selectedMember.branch_id || selectedMember.branch_id === 'dlob-pusat')) && (
                        <span className="text-xs font-medium text-blue-400 hover:underline shrink-0 ml-2">Set Member</span>
                      )}
                    </button>
                  )}
                </div>
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

            {!canDeleteMember(selectedMember) ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-400 font-medium">
                  ⚠️ Akun ini ({selectedMember.full_name || selectedMember.email}) dilindungi oleh aturan hirarki dan tidak dapat dihapus oleh peran Anda.
                </p>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-400 mb-2">
                  Anda akan menghapus anggota:
                </p>
                <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold transition-colors duration-300">
                  <User className="w-4 h-4" />
                  {selectedMember.full_name || selectedMember.email}
                </div>
              </div>
            )}

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
                disabled={actionLoading || !canDeleteMember(selectedMember)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Migration Modal */}
      {showMigrationModal && migrationSource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-500/30 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl transition-colors duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Migrasi Data Member</h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400 transition-colors duration-300">Pindahkan data pertandingan</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Source Member */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Dari Member (Sumber):
                </label>
                <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-3 border border-gray-200 dark:border-white/10">
                  <p className="text-gray-900 dark:text-white font-medium">{migrationSource.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">{migrationSource.email}</p>
                </div>
              </div>

              {/* Target Member */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  Ke Member (Target):
                </label>
                <select
                  value={migrationTarget}
                  onChange={(e) => setMigrationTarget(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-colors"
                >
                  <option value="">Pilih member target...</option>
                  {members
                    .filter(m => m.id !== migrationSource.id)
                    .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
                    .map(member => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} ({member.email})
                      </option>
                    ))}
                </select>
              </div>

              {/* Warning */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-2">
                  ⚠️ Perhatian:
                </p>
                <ul className="text-xs text-orange-600 dark:text-orange-400 space-y-1">
                  <li>• Semua pertandingan {migrationSource.full_name} akan dipindahkan</li>
                  <li>• Data tidak bisa dikembalikan setelah migrasi</li>
                  <li>• Jumlah pertandingan akan bertambah untuk member target</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMigrationModal(false);
                  setMigrationSource(null);
                  setMigrationTarget('');
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-white/15 transition-colors duration-300 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleMigrateMember}
                disabled={migratingMember || !migrationTarget}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-medium disabled:opacity-50"
              >
                {migratingMember ? 'Memproses...' : 'Migrasi'}
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
                  <div
                    className="relative w-full h-full cursor-pointer group"
                    onClick={() => setZoomPhoto({ url: selectedMember.avatar_url!, name: selectedMember.full_name || 'Member' })}
                    title="Klik untuk perbesar foto"
                  >
                    <Image
                      src={selectedMember.avatar_url}
                      alt={selectedMember.full_name || 'Member'}
                      fill
                      className="rounded-full object-cover border-4 border-gray-200 dark:border-white/10 transition-colors duration-300 group-hover:brightness-90"
                    />
                    <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-200">
                      <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-4xl shadow-lg border-4 border-gray-200 dark:border-white/10 transition-colors duration-300">
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
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
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
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mb-0.5 transition-colors duration-300">Nomor Telepon</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium transition-colors duration-300">{selectedMember.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Role & Branch */}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1 transition-colors duration-300">Peran & Cabang</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedMember.role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                          : selectedMember.role === 'branch_admin'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {selectedMember.role === 'admin' ? (
                          <>
                            <Shield className="w-3.5 h-3.5 text-purple-400" />
                            Admin DLOB
                          </>
                        ) : selectedMember.role === 'branch_admin' ? (
                          <>
                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                            Admin Cabang DLBC
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-blue-400" />
                            Anggota
                          </>
                        )}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-white/10">
                        {selectedMember.branch_id === 'dlob-cikupa' ? 'DLBC Cikupa' : 'DLOB Pusat'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/10 transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
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
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
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
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
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
                          <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
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
                          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
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
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
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
                                      let bgColor = 'bg-zinc-700/50';
                                      let borderColor = 'border-zinc-600/50';
                                      let iconBg = 'bg-zinc-600/50';
                                      let iconColor = 'text-zinc-400';
                                      let textColor = 'text-white';
                                      
                                      if (achievement.place === 'Juara 1') {
                                        bgColor = 'bg-linear-to-r from-amber-500/10 to-yellow-500/10';
                                        borderColor = 'border-amber-500/30';
                                        iconBg = 'bg-linear-to-br from-amber-400 to-yellow-500';
                                        iconColor = 'text-white';
                                        textColor = 'text-amber-400';
                                      } else if (achievement.place === 'Juara 2') {
                                        bgColor = 'bg-linear-to-r from-gray-400/10 to-zinc-300/10';
                                        borderColor = 'border-gray-400/30';
                                        iconBg = 'bg-linear-to-br from-gray-300 to-gray-400';
                                        iconColor = 'text-white';
                                        textColor = 'text-gray-300';
                                      } else if (achievement.place === 'Juara 3') {
                                        bgColor = 'bg-linear-to-r from-orange-600/10 to-amber-700/10';
                                        borderColor = 'border-orange-600/30';
                                        iconBg = 'bg-linear-to-br from-orange-500 to-amber-600';
                                        iconColor = 'text-white';
                                        textColor = 'text-orange-400';
                                      }
                                      
                                      return (
                                        <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${bgColor} ${borderColor}`}>
                                          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 shadow-lg`}>
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
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
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
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shrink-0">
                          <Instagram className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-zinc-500 mb-0.5 transition-colors duration-300">Instagram</p>
                          <a 
                            href={selectedMember.instagram_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-emerald-400 hover:text-emerald-300 font-medium truncate block transition-colors duration-300"
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
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${
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
                                        <span className="text-pink-600 dark:text-pink-400 font-semibold ml-1">{record.pending_matches_affected}</span>
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
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-emerald-500/30 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto transition-colors duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-emerald-400" />
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
                  : 'bg-emerald-500/10 border-emerald-500/30'
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
                    exemptionMember.currentStatus ? 'text-emerald-400' : 'text-gray-900 dark:text-white'
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
                        <span className="text-emerald-400 mt-0.5">✓</span>
                        <span><strong>SEMUA</strong> biaya akan Rp 0 (shuttlecock + kehadiran + membership)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">✓</span>
                        <span>{exemptionMember.pendingMatches} pending match akan diupdate ke <strong>Rp 0</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">✓</span>
                        <span>Pertandingan baru akan <strong>otomatis gratis</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">✓</span>
                        <span>Member <strong>tidak akan muncul</strong> di daftar pembayaran admin</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">✓</span>
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
                  Ketik <strong className={exemptionMember.currentStatus ? 'text-orange-500 dark:text-orange-400' : 'text-emerald-400'}>
                    {exemptionMember.currentStatus ? 'BAYAR' : 'GRATIS'}
                  </strong> untuk konfirmasi:
                </p>
                <input
                  type="text"
                  value={confirmExemptionText}
                  onChange={(e) => setConfirmExemptionText(e.target.value.toUpperCase())}
                  placeholder={exemptionMember.currentStatus ? 'BAYAR' : 'GRATIS'}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors duration-300"
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
                      : 'bg-emerald-600 hover:bg-emerald-700'
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

      {/* Photo Zoom Modal */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setZoomPhoto(null)}
        >
          <div
            className="relative max-w-sm w-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setZoomPhoto(null)}
              className="absolute -top-3 -right-3 z-10 bg-white dark:bg-zinc-800 text-gray-700 dark:text-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Photo */}
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-2xl relative">
              <Image
                src={zoomPhoto.url}
                alt={zoomPhoto.name}
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>

            {/* Name label */}
            <p className="text-white font-semibold text-lg text-center drop-shadow">
              {zoomPhoto.name}
            </p>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowAddMemberModal(false)}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-white">Tambah Anggota Baru</h3>
                <p className="text-xs text-zinc-400">Buat data profil akun anggota baru / sementara DLBC</p>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={newMemberForm.full_name}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nomor WhatsApp (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789 atau +628123456789"
                  value={newMemberForm.phone}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-400 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Peran (Role)</label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => {
                      const r = e.target.value as 'admin' | 'branch_admin' | 'member';
                      setNewMemberForm({
                        ...newMemberForm,
                        role: r,
                        branch_id: r === 'branch_admin' ? 'dlob-cikupa' : newMemberForm.branch_id,
                      });
                    }}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-white/10 rounded-xl text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-400 text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="branch_admin">Admin DLBC</option>
                    {canViewAllBranches && <option value="admin">Admin DLOB</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Cabang</label>
                  {canViewAllBranches ? (
                    <select
                      value={newMemberForm.branch_id}
                      onChange={(e) => setNewMemberForm({ ...newMemberForm, branch_id: e.target.value as 'dlob-pusat' | 'dlob-cikupa' })}
                      className="w-full px-3 py-2 bg-zinc-800/80 border border-white/10 rounded-xl text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-400 text-sm"
                    >
                      <option value="dlob-cikupa">DLBC (Cikupa)</option>
                      <option value="dlob-pusat">DLOB Pusat</option>
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 bg-zinc-800/40 border border-white/10 rounded-xl text-zinc-400 text-sm flex items-center gap-1.5 cursor-not-allowed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      DLBC (Cikupa)
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Skill Level</label>
                  <select
                    value={newMemberForm.playing_level}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, playing_level: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-white/10 rounded-xl text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-400 text-sm"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Akun Tes Checkbox */}
              <div className="p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMemberForm.is_test_account}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, is_test_account: e.target.checked })}
                    className="w-4 h-4 rounded bg-zinc-800 border-white/20 text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-zinc-200">Tandai sebagai Akun Percobaan / Tes (Dummy)</span>
                </label>
                <p className="text-[11px] text-zinc-400 mt-1 pl-6">
                  Akun tes otomatis disembunyikan dari leaderboard dan rekap analitik publik.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={creatingMemberLoading || !newMemberForm.full_name.trim()}
                onClick={handleCreateNewMember}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
              >
                {creatingMemberLoading ? 'Menyimpan...' : 'Tambah Anggota'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowEditProfileModal(false)}
        >
          <div
            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-white">Edit Profil Anggota</h3>
                <p className="text-xs text-zinc-400">Ubah data anggota langsung dari admin</p>
              </div>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={editMemberForm.full_name}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nomor WhatsApp</label>
                <input
                  type="text"
                  placeholder="0812..."
                  value={editMemberForm.phone}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-400 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Skill Level</label>
                  <select
                    value={editMemberForm.playing_level}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, playing_level: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-white/10 rounded-xl text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-400 text-sm"
                  >
                    <option value="">(Belum diisi)</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Tangan Dominan</label>
                  <select
                    value={editMemberForm.dominant_hand}
                    onChange={(e) => setEditMemberForm({ ...editMemberForm, dominant_hand: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800/80 border border-white/10 rounded-xl text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-400 text-sm"
                  >
                    <option value="">(Belum diisi)</option>
                    <option value="Right">Kanan (Right)</option>
                    <option value="Left">Kiri (Left)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Preferensi Partner</label>
                <input
                  type="text"
                  placeholder="Contoh: Suka smash, rotasi cepat..."
                  value={editMemberForm.partner_preferences}
                  onChange={(e) => setEditMemberForm({ ...editMemberForm, partner_preferences: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-400 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingEditProfile || !editMemberForm.full_name.trim()}
                onClick={handleSaveEditProfile}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
              >
                {savingEditProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
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
        tutorialKey="cikupa-admin-members"
      />
    </div>
  );
}
