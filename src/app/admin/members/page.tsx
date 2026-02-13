'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { usePathname } from 'next/navigation';
import { Users, Search, UserCog, Trash2, Shield, User, Mail, Calendar, CheckCircle, XCircle, AlertCircle, Phone, Eye, Award, Target, Hand, Clock, Instagram, Crown, HelpCircle } from 'lucide-react';
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

  // Tutorial for members page
  const tutorialSteps = getTutorialSteps('members');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('admin-members', tutorialSteps);

  useEffect(() => {
    fetchMembers();
  }, [pathname]);

  async function fetchMembers() {
    try {
      setLoading(true);
      
      // Get current month/year for membership check
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
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
      
      // Merge membership status with profiles (avatar_url already in profiles table)
      if (profilesData.length > 0) {
        const mergedData = profilesData.map(profile => {
          const hasMembership = membershipNames.has((profile.full_name || '').toLowerCase());
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
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedMember.id);

      if (!error) {
        await fetchMembers();
        setShowDeleteModal(false);
        setSelectedMember(null);
      }
    } catch (error) {
      console.error('Error deleting member:', error);
    } finally {
      setActionLoading(false);
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
    <div className="min-h-screen bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Kelola Anggota</h1>
          <p className="text-sm sm:text-base text-zinc-400">Kelola semua anggota komunitas badminton.</p>
        </div>
        
        <button
          onClick={toggleTutorial}
          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
          title="Tampilkan panduan fitur"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="stat-card-total-members bg-zinc-900 border border-white/10 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Total Anggota</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="stat-card-active-members bg-zinc-900 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Anggota Aktif</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="stat-card-admin-members bg-zinc-900 border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Administrator</p>
              <p className="text-2xl font-bold text-white">{stats.admins}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="members-search mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Cari nama atau email anggota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Members List */}
      <div className="members-table bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-zinc-800/50 border-b border-white/10">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">Anggota</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">Email</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">Peran</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">Status</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">Bergabung</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-zinc-400">
                      <div className="w-5 h-5 border-2 border-zinc-600 border-t-blue-400 rounded-full animate-spin"></div>
                      <span>Memuat data anggota...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <Users className="w-12 h-12 mx-auto mb-2 text-zinc-600" />
                    <p>Tidak ada anggota ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-zinc-800/50 transition-colors">
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
                          <div className="text-white font-semibold text-sm sm:text-base truncate">
                            {member.full_name || 'Tidak Diketahui'}
                          </div>
                          {member.phone && (
                            <div className="text-xs text-zinc-500 truncate">{member.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-300 text-xs sm:text-sm">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 flex-shrink-0" />
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
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Membership
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                        member.is_active 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
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
                      <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400 text-xs sm:text-sm">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-500 flex-shrink-0" />
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
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowDetailModal(true);
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
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {selectedMember.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedMember.full_name}</h3>
                <p className="text-sm text-zinc-400">{selectedMember.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-white">Status Akun</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedMember.is_active 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-zinc-500/20 text-zinc-400'
                  }`}>
                    {selectedMember.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleStatus(selectedMember)}
                  disabled={actionLoading}
                  className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    selectedMember.is_active
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                  } disabled:opacity-50`}
                >
                  {actionLoading ? 'Memproses...' : selectedMember.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                </button>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-medium text-white">Peran</span>
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
              className="w-full mt-6 px-4 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Hapus Anggota?</h3>
                <p className="text-sm text-zinc-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-400 mb-2">
                Anda akan menghapus anggota:
              </p>
              <div className="flex items-center gap-2 text-white font-semibold">
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
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors font-medium"
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
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header with Avatar */}
            <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-white/10">
              <div className="relative w-28 h-28 mb-4">
                {selectedMember.avatar_url ? (
                  <Image
                    src={selectedMember.avatar_url}
                    alt={selectedMember.full_name || 'Member'}
                    fill
                    className="rounded-full object-cover border-4 border-white/10"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl shadow-lg border-4 border-white/10">
                    {selectedMember.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {selectedMember.full_name || 'Nama tidak tersedia'}
              </h3>
              <p className="text-sm text-zinc-400">{selectedMember.email}</p>
            </div>

            {/* Member Information */}
            <div className="space-y-4">
              {/* Email */}
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 mb-0.5">Email</p>
                    <p className="text-sm text-white font-medium truncate">{selectedMember.email}</p>
                  </div>
                </div>
              </div>

              {/* Phone */}
              {selectedMember.phone && (
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500 mb-0.5">Nomor Telepon</p>
                      <p className="text-sm text-white font-medium">{selectedMember.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Role */}
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 mb-0.5">Peran</p>
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
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedMember.is_active ? 'bg-green-500/20' : 'bg-zinc-500/20'
                  }`}>
                    {selectedMember.is_active ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 mb-0.5">Status</p>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedMember.is_active 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
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
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 mb-0.5">Bergabung Sejak</p>
                    <p className="text-sm text-white font-medium">
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
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                          <Target className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-500 mb-0.5">Level Bermain</p>
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
                      <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                            <Hand className="w-5 h-5 text-pink-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-500 mb-0.5">Tangan Dominan</p>
                            <p className="text-sm text-white font-medium">
                              {selectedMember.dominant_hand === 'right' ? 'Kanan' : 'Kiri'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedMember.years_playing && (
                      <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-500 mb-0.5">Lama Bermain</p>
                            <p className="text-sm text-white font-medium">{selectedMember.years_playing} Tahun</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Achievements */}
                  {selectedMember.achievements && (
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <Award className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-500 mb-2">Pencapaian</p>
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
                                            <div className="text-sm text-zinc-400">{achievement.tournament}</div>
                                            <div className="text-xs text-zinc-500">Tahun {achievement.year}</div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                              return <p className="text-sm text-zinc-500">Belum ada pencapaian</p>;
                            } catch {
                              return <p className="text-sm text-white whitespace-pre-wrap">{selectedMember.achievements}</p>;
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Partner Preferences */}
                  {selectedMember.partner_preferences && (
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-500 mb-1">Preferensi Partner</p>
                          <p className="text-sm text-white whitespace-pre-wrap">{selectedMember.partner_preferences}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Instagram */}
                  {selectedMember.instagram_url && (
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                          <Instagram className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-500 mb-0.5">Instagram</p>
                          <a 
                            href={selectedMember.instagram_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 font-medium truncate block"
                          >
                            {selectedMember.instagram_url.replace('https://', '').replace('http://', '')}
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Close Button */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedMember(null);
                }}
                className="w-full px-4 py-3 rounded-lg bg-white/10 text-white hover:bg-white/15 transition-colors font-medium"
              >
                Tutup
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
        tutorialKey="admin-members"
      />
    </div>
  );
}
