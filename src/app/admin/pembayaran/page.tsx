'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { CreditCard, TrendingUp, AlertCircle, Users, Award, Plus, X, Search, Check, Ban, Eye, Trash2, ChevronDown, ChevronUp, Edit, Save, Image as ImageIcon } from 'lucide-react';
import { StatCardSkeleton, TableRowSkeleton } from '@/components/LoadingSkeletons';

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
  payment_status: 'pending' | 'paid' | 'cancelled' | 'revision';
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
  payment_status: 'pending' | 'paid' | 'cancelled';
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
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{
    type: 'match' | 'membership';
    id: string;
    matchId?: string;
    memberName: string;
    amount: number;
    proofUrl: string | null;
  } | null>(null);

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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Pembayaran</h1>
          <p className="text-sm sm:text-base text-zinc-400">Kelola pembayaran pertandingan dan membership</p>
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

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-6 py-3 font-medium transition-colors relative ${
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
            className={`px-6 py-3 font-medium transition-colors relative ${
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
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari nama anggota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
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
          <div className="space-y-6">
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
                          <p className="text-sm text-zinc-400">Total: Rp {match.total_cost.toLocaleString('id-ID')}</p>
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
                        .map((member) => (
                        <tr key={member.id} className="border-b border-white/5 last:border-0">
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
                                  : member.payment_status === 'cancelled'
                                  ? 'bg-red-500/20 text-red-400'
                                  : member.payment_proof
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-orange-500/20 text-orange-400'
                              }`}
                            >
                              {member.payment_status === 'paid' 
                                ? 'Lunas' 
                                : member.payment_status === 'revision'
                                ? 'Revisi'
                                : member.payment_status === 'cancelled' 
                                ? 'Dibatalkan' 
                                : member.payment_proof
                                ? (member.payment_proof === 'CASH_PAYMENT' ? 'Cash (Unconfirmed)' : 'Unconfirmed')
                                : 'Unpaid'}
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
                      ))}
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
                    return (
                    <tr key={membership.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-3 sm:py-4 px-3 sm:px-6 font-medium text-sm sm:text-base whitespace-nowrap">{membership.member_name}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center text-xs sm:text-sm text-zinc-300 whitespace-nowrap">{monthName} {membership.year}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center text-sm whitespace-nowrap">{membership.weeks_in_month} minggu</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-right font-semibold text-sm sm:text-base whitespace-nowrap">Rp {membership.amount.toLocaleString('id-ID')}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center">
                        <span
                          className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            membership.payment_status === 'paid'
                              ? 'bg-green-500/20 text-green-400'
                              : membership.payment_status === 'cancelled'
                              ? 'bg-red-500/20 text-red-400'
                              : membership.payment_proof
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}
                        >
                          {membership.payment_status === 'paid' 
                            ? 'Lunas' 
                            : membership.payment_status === 'cancelled' 
                            ? 'Dibatalkan' 
                            : membership.payment_proof
                            ? (membership.payment_proof === 'CASH_PAYMENT' ? 'Cash (Unconfirmed)' : 'Unconfirmed')
                            : 'Unpaid'}
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
              <h2 className="text-2xl font-bold text-white">Tambah Membership Baru</h2>
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
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Jumlah Minggu dalam Bulan Ini
                </label>
                <select
                  value={newMembership.weeks_in_month}
                  onChange={(e) => setNewMembership({ ...newMembership, weeks_in_month: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="4">4 Minggu - Rp 40.000</option>
                  <option value="5">5 Minggu - Rp 45.000</option>
                </select>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <p className="text-sm text-purple-300">
                  Total: <span className="font-bold text-lg">Rp {(newMembership.weeks_in_month === 4 ? 40000 : 45000).toLocaleString('id-ID')}</span>
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Member tidak perlu bayar biaya kehadiran saat pertandingan
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
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
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
                <button
                  onClick={() => {
                    if (confirm(`Batalkan pembayaran dari ${selectedProof.memberName}?`)) {
                      if (selectedProof.type === 'match' && selectedProof.matchId) {
                        updatePaymentStatus(selectedProof.matchId, selectedProof.id, 'cancelled');
                      } else if (selectedProof.type === 'membership') {
                        updateMembershipStatus(selectedProof.id, 'cancelled');
                      }
                    }
                  }}
                  className="px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Ban className="w-5 h-5" />
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
