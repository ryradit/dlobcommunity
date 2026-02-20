'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { cachedQuery, queryCache } from '@/lib/queryCache';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Building2, Award, Upload, X, CheckCircle, Clock, AlertCircle, CreditCard, Calendar, Users, Info, HelpCircle, CheckSquare, Square, Zap, Copy, Check } from 'lucide-react';
import { StatCardSkeleton, MatchCardSkeleton } from '@/components/LoadingSkeletons';
import TutorialOverlay from '@/components/TutorialOverlay';
import ProfileCompletionWarning from '@/components/ProfileCompletionWarning';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';

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
  rejection_date?: string | null;
  matches: {
    match_number: number;
    created_at: string;
    shuttlecock_count: number;
  };
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
  rejection_reason?: string | null;
  rejection_date?: string | null;
  created_at: string;
}

export default function PembayaranPage() {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [myMatches, setMyMatches] = useState<MatchMember[]>([]);
  const [allMatches, setAllMatches] = useState<MatchMember[]>([]);
  const [myMembership, setMyMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberName, setMemberName] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    id: string;
    type: 'match' | 'membership';
    amount: number;
    matchNumber?: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash'>('bank_transfer');
  const [showPaymentHelpModal, setShowPaymentHelpModal] = useState(false);
  const [showStatusHelpModal, setShowStatusHelpModal] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  
  // Bulk payment states
  const [selectedPayments, setSelectedPayments] = useState<Array<{ id: string; type: 'match' | 'membership'; amount: number; matchNumber?: number; label: string }>>([]);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkProofFile, setBulkProofFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  
  // Smart Actions states (REPLACING AI Helper)
  const [smartActions, setSmartActions] = useState<Array<{
    id: string;
    type: 'pay-all' | 'pay-revisions' | 'pay-pending' | 'pay-membership';
    title: string;
    description: string;
    count?: number;
    payments?: Array<{ id: string; type: 'match' | 'membership'; amount: number; label: string; isRevision?: boolean }>;
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

  // Tutorial for member pembayaran
  const tutorialSteps = getTutorialSteps('member-pembayaran');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('member-pembayaran', tutorialSteps);

  useEffect(() => {
    fetchPaymentData();
  }, [user, pathname]);

  // Fetch Smart Suggestions when data changes
  useEffect(() => {
    if (!loading && memberName && allMatches.length >= 0) {
      fetchSmartSuggestions();
    }
  }, [loading, memberName, allMatches.length, myMembership?.payment_status]);

  async function fetchPaymentData() {
    // Show loading while fetching
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get current month/year
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      // Fetch all data in parallel with caching
      const [profileResult, matchesResult, membershipResult] = await Promise.allSettled([
        // Fetch profile
        cachedQuery(
          `member-payment-profile-${user.id}`,
          async () => {
            const result = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', user.id)
              .single();
            return result;
          },
          60000 // 1 minute cache
        ),
        // Fetch all matches
        cachedQuery(
          `member-payment-matches-${user.id}`,
          async () => {
            // First get profile to get member name
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', user.id)
              .single();
            
            const name = profile?.full_name || profile?.email?.split('@')[0] || '';
            
            const result = await supabase
              .from('match_members')
              .select(`
                *,
                matches (
                  match_number,
                  created_at,
                  shuttlecock_count
                )
              `)
              .eq('member_name', name)
              .order('created_at', { ascending: false });
            return result;
          },
          30000 // 30 seconds cache
        ),
        // Fetch membership
        cachedQuery(
          `member-payment-membership-${user.id}-${currentMonth}-${currentYear}`,
          async () => {
            // Get profile first
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', user.id)
              .single();
            
            const name = profile?.full_name || profile?.email?.split('@')[0] || '';
            
            const result = await supabase
              .from('memberships')
              .select('*')
              .eq('member_name', name)
              .eq('month', currentMonth)
              .eq('year', currentYear)
              .maybeSingle();
            return result;
          },
          60000 // 1 minute cache
        ),
      ]);
      
      let name = '';
      
      // Process profile
      if (profileResult.status === 'fulfilled') {
        const res = profileResult.value as { data: { full_name: string; email: string } | null; error: any };
        if (!res.error && res.data) {
          name = res.data.full_name || res.data.email?.split('@')[0] || '';
          setMemberName(name);
        }
      }
      
      if (!name) {
        setLoading(false);
        return;
      }
      
      // Process matches
      if (matchesResult.status === 'fulfilled') {
        const res = matchesResult.value as { data: MatchMember[] | null; error: any };
        if (!res.error && res.data) {
          // Remove duplicates by match_id (prioritize entries with payment_proof)
          const uniqueAllMatches = res.data.reduce((acc: MatchMember[], current) => {
            const existingIndex = acc.findIndex(item => item.match_id === current.match_id);
            if (existingIndex === -1) {
              acc.push(current);
            } else {
              // Replace if current has payment_proof and existing doesn't
              if (current.payment_proof && !acc[existingIndex].payment_proof) {
                acc[existingIndex] = current;
              }
            }
            return acc;
          }, []);
          
          setAllMatches(uniqueAllMatches);
          
          // Filter matches (exclude only paid and cancelled)
          const myMatchesFiltered = uniqueAllMatches.filter(m => m.payment_status !== 'paid' && m.payment_status !== 'cancelled');
          setMyMatches(myMatchesFiltered);
        }
      }
      
      // Process membership
      if (membershipResult.status === 'fulfilled') {
        const res = membershipResult.value as { data: Membership | null; error: any };
        if (!res.error) {
          setMyMembership(res.data);
        }
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openPaymentModal(id: string, type: 'match' | 'membership', amount: number, matchNumber?: number) {
    setSelectedPayment({ id, type, amount, matchNumber });
    setPaymentMethod('bank_transfer');
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
    setSelectedPayment(null);
    setPaymentMethod('bank_transfer');
  }

  function copyToClipboard(accountNumber: string) {
    navigator.clipboard.writeText(accountNumber.replace(/\s/g, '')).then(() => {
      setCopiedAccount(accountNumber);
      setTimeout(() => setCopiedAccount(null), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  function openUploadModal() {
    setShowPaymentModal(false);
    setShowUploadModal(true);
  }

  function closeUploadModal() {
    setShowUploadModal(false);
    setProofFile(null);
    setSelectedPayment(null);
  }

  async function handleCashPayment() {
    if (!selectedPayment) return;

    const confirmMsg = `Konfirmasi pembayaran cash sebesar Rp ${selectedPayment.amount.toLocaleString('id-ID')}?\n\nPembayaran cash akan langsung tercatat dan menunggu konfirmasi admin.`;
    
    if (!confirm(confirmMsg)) return;

    try {
      setUploading(true);

      // Mark as cash payment (we'll store 'CASH_PAYMENT' as payment_proof)
      if (selectedPayment.type === 'match') {
        // First, get the match_id and member_name from the selected payment
        const { data: memberData } = await supabase
          .from('match_members')
          .select('match_id, member_name')
          .eq('id', selectedPayment.id)
          .single();

        if (!memberData) throw new Error('Payment record not found');

        // Update ALL entries for this member in this match (handles duplicates)
        const { error } = await supabase
          .from('match_members')
          .update({ payment_proof: 'CASH_PAYMENT' })
          .eq('match_id', memberData.match_id)
          .eq('member_name', memberData.member_name);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('memberships')
          .update({ payment_proof: 'CASH_PAYMENT' })
          .eq('id', selectedPayment.id);

        if (error) throw error;
      }

      alert('Pembayaran cash berhasil dicatat! Menunggu verifikasi admin.');
      closePaymentModal();
      fetchPaymentData();
    } catch (error) {
      console.error('Error recording cash payment:', error);
      alert('Gagal mencatat pembayaran cash');
    } finally {
      setUploading(false);
    }
  }

  // Bulk payment functions
  const togglePaymentSelection = (payment: { id: string; type: 'match' | 'membership'; amount: number; matchNumber?: number; label: string }) => {
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

  const openBulkUploadModal = () => {
    if (selectedPayments.length === 0) return;
    setShowBulkUploadModal(true);
  };

  const closeBulkUploadModal = () => {
    setShowBulkUploadModal(false);
    setBulkProofFile(null);
    setSelectedPayments([]);
  };

  async function handleBulkUploadProof() {
    if (!bulkProofFile || selectedPayments.length === 0) return;

    try {
      setBulkUploading(true);

      // Upload file to Supabase Storage
      const fileExt = bulkProofFile.name.split('.').pop();
      const fileName = `bulk-payment-${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, bulkProofFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      // Update all selected payments
      const updatePromises = selectedPayments.map(async (payment) => {
        if (payment.type === 'match') {
          // Get match_id and member_name
          const { data: memberData } = await supabase
            .from('match_members')
            .select('match_id, member_name')
            .eq('id', payment.id)
            .single();

          if (memberData) {
            // Update all matching records
            return supabase
              .from('match_members')
              .update({ payment_proof: publicUrl })
              .eq('match_id', memberData.match_id)
              .eq('member_name', memberData.member_name);
          }
        } else {
          // Update membership
          return supabase
            .from('memberships')
            .update({ payment_proof: publicUrl })
            .eq('id', payment.id);
        }
      });

      const results = await Promise.allSettled(updatePromises);
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (failedCount > 0) {
        alert(`${selectedPayments.length - failedCount} dari ${selectedPayments.length} pembayaran berhasil diupload. ${failedCount} gagal.`);
      } else {
        alert(`Bukti pembayaran berhasil diupload untuk ${selectedPayments.length} pembayaran! Menunggu verifikasi admin.`);
      }

      // Invalidate cache to force fresh data fetch
      queryCache.invalidatePattern('member-payment-');
      
      closeBulkUploadModal();
      clearBulkSelection();
      setBulkProofFile(null);
      
      // Fetch fresh data without cache
      await fetchPaymentData();
    } catch (error) {
      console.error('Error uploading bulk proof:', error);
      alert('Gagal upload bukti pembayaran');
    } finally {
      setBulkUploading(false);
    }
  }

  async function handleUploadProof() {
    if (!proofFile || !selectedPayment) return;

    try {
      setUploading(true);

      // Upload file to Supabase Storage
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${selectedPayment.type}-${selectedPayment.id}-${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, proofFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(filePath);

      // Update payment record - update ALL duplicate entries for this match
      if (selectedPayment.type === 'match') {
        // First, get the match_id and member_name from the selected payment
        const { data: memberData, error: fetchError } = await supabase
          .from('match_members')
          .select('match_id, member_name')
          .eq('id', selectedPayment.id)
          .single();

        if (fetchError || !memberData) {
          console.error('Error fetching member data:', fetchError);
          throw fetchError || new Error('Payment record not found');
        }

        // Get all matching records first to see what we're updating
        const { data: matchingRecords } = await supabase
          .from('match_members')
          .select('id, member_name, payment_proof')
          .eq('match_id', memberData.match_id)
          .eq('member_name', memberData.member_name);

        // If no records found, try updating just the original one
        if (!matchingRecords || matchingRecords.length === 0) {
          console.warn('No records found with match conditions, updating by ID only');
          const { data: updateData, error } = await supabase
            .from('match_members')
            .update({ payment_proof: publicUrl })
            .eq('id', selectedPayment.id)
            .select();

          if (error) throw error;
          if (!updateData || updateData.length === 0) {
            throw new Error('Failed to update payment proof - check RLS policies');
          }
        } else {
          // Update all matching records
          const { data: updateData, error } = await supabase
            .from('match_members')
            .update({ payment_proof: publicUrl })
            .eq('match_id', memberData.match_id)
            .eq('member_name', memberData.member_name)
            .select();

          if (error) throw error;
        }
      } else {
        const { data: updateData, error } = await supabase
          .from('memberships')
          .update({ payment_proof: publicUrl })
          .eq('id', selectedPayment.id)
          .select();

        if (error) {
          console.error('Database update error:', error);
          throw error;
        }
      }

      alert('Bukti pembayaran berhasil diupload! Menunggu verifikasi admin.');
      
      // Invalidate cache to force fresh data fetch
      queryCache.invalidatePattern('member-payment-');
      
      closeUploadModal();
      setProofFile(null);
      setSelectedPayment(null);
      
      // Fetch fresh data without cache
      await fetchPaymentData();
    } catch (error) {
      console.error('Error uploading proof:', error);
      alert('Gagal upload bukti pembayaran');
    } finally {
      setUploading(false);
    }
  }

  async function processAIQuery() {
    // REMOVED: AI Helper functionality replaced by Smart Actions
  }

  function executeAISuggestion() {
    // REMOVED: AI Helper functionality replaced by Smart Actions
  }

  // Fetch Smart Suggestions (REPLACES AI Helper)
  async function fetchSmartSuggestions() {
    if (loadingSuggestions || !memberName) return;
    
    setLoadingSuggestions(true);
    try {
      const now = new Date();
      const response = await fetch('/api/ai/member-payment-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberName,
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

  // Handle smart action execution
  async function executeSmartAction(action: typeof smartActions[0]) {
    if (action.payments && action.payments.length > 0) {
      setSelectedPayments(action.payments);
      setShowBulkUploadModal(true);
    }
  }

  // Handle suggestion card action
  async function executeSuggestionAction(card: typeof suggestionCards[0]) {
    if (!card.action) return;
    
    if (card.action.data?.payments) {
      setSelectedPayments(card.action.data.payments);
      setShowBulkUploadModal(true);
      dismissSuggestion(card.id);
    }
  }

  // Dismiss suggestion card
  function dismissSuggestion(id: string) {
    setDismissedSuggestions(prev => [...prev, id]);
  }

  // Calculate total bills (exclude only 'paid' and 'cancelled')
  const totalPending = myMatches
    .filter(m => m.payment_status !== 'paid' && m.payment_status !== 'cancelled')
    .reduce((sum, m) => {
      if (m.payment_status === 'revision' && m.additional_amount) {
        return sum + m.additional_amount;
      } else {
        return sum + m.total_amount;
      }
    }, 0) +
    (myMembership && myMembership.payment_status !== 'paid' && myMembership.payment_status !== 'cancelled' ? myMembership.amount : 0);

  const revisionCount = myMatches.filter(m => m.payment_status === 'revision').length;
  const revisionAmount = myMatches
    .filter(m => m.payment_status === 'revision')
    .reduce((sum, m) => sum + (m.additional_amount || 0), 0);

  const totalUnconfirmed = allMatches.filter(m => m.payment_proof && m.payment_status === 'pending').length +
    (myMembership?.payment_proof && myMembership.payment_status === 'pending' ? 1 : 0);

  const totalPaid = allMatches.filter(m => m.payment_status === 'paid').reduce((sum, m) => sum + m.total_amount, 0) +
    (myMembership?.payment_status === 'paid' ? myMembership.amount : 0);

  const unpaidCount = myMatches.filter(m => (m.payment_status === 'pending' && !m.payment_proof) || m.payment_status === 'rejected').length +
    ((myMembership?.payment_status === 'pending' && !myMembership.payment_proof) || myMembership?.payment_status === 'rejected' ? 1 : 0);

  function getPaymentStatus(paymentStatus: string, paymentProof: string | null) {
    if (paymentStatus === 'paid') {
      return { label: 'Lunas', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    } else if (paymentStatus === 'rejected') {
      return { label: 'Ditolak', color: 'bg-red-100 text-red-700', icon: X };
    } else if (paymentStatus === 'cancelled') {
      return { label: 'Dibatalkan', color: 'bg-gray-100 text-gray-700', icon: X };
    } else if (paymentStatus === 'revision') {
      return { label: 'Revisi', color: 'bg-blue-100 text-blue-700', icon: AlertCircle };
    } else if (paymentProof) {
      return { label: 'Menunggu Verifikasi', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
    } else {
      return { label: 'Belum Bayar', color: 'bg-red-100 text-red-700', icon: AlertCircle };
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6">
      <ProfileCompletionWarning />
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Pembayaran Saya</h1>
            <p className="text-zinc-300 mt-2">
              Kelola pembayaran pertandingan dan membership Anda
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTutorial}
              className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-colors"
              title="Tampilkan panduan fitur"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowPaymentHelpModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Panduan Pembayaran</span>
              <span className="sm:hidden">Panduan</span>
            </button>
          </div>
        </div>

        {/* Smart Actions Section */}
        {smartActions.length > 0 && (
          <div className="smart-actions-section mb-6 bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">Smart Actions</h2>
                <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  {smartActions.length} tersedia
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

        {/* Suggestion Cards Section */}
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

        {/* Bulk Upload Info Banner */}
        {(myMatches.some(m => (m.payment_status === 'pending' && !m.payment_proof) || m.payment_status === 'rejected') || 
          (myMembership && ((myMembership.payment_status === 'pending' && !myMembership.payment_proof) || myMembership.payment_status === 'rejected'))) && (
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-400 mb-1">💡 Fitur Baru: Upload Bukti Pembayaran Sekaligus (Bulk Upload)</h3>
                <p className="text-sm text-zinc-300">
                  Hemat waktu! Centang beberapa tagihan, transfer total keseluruhan dalam satu transaksi, lalu upload bukti pembayaran untuk semua tagihan sekaligus. 
                  Tidak perlu upload satu per satu lagi!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="member-payment-stats grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Due */}
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-zinc-300">Total Tagihan</p>
                <button
                  onClick={() => setShowStatusHelpModal(true)}
                  className="member-payment-status-help hover:bg-white/10 rounded p-1 transition-colors"
                  title="Info status pembayaran"
                >
                  <Info className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>
              <CreditCard className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              Rp {totalPending.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {unpaidCount > 0 && `${unpaidCount} belum bayar`}
              {unpaidCount > 0 && revisionCount > 0 && ' • '}
              {revisionCount > 0 && `${revisionCount} revisi`}
              {unpaidCount === 0 && revisionCount === 0 && 'Tidak ada tagihan'}
            </p>
          </div>

          {/* Menunggu Verifikasi */}
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-300">Menunggu Konfirmasi</p>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">{totalUnconfirmed}</p>
            <p className="text-xs text-zinc-400 mt-1">pembayaran</p>
          </div>

          {/* Total Paid */}
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-300">Total Terbayar</p>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">
              Rp {totalPaid.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-zinc-400 mt-1">lunas</p>
          </div>

          {/* Total Matches */}
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-300">Total Pertandingan</p>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{allMatches.length}</p>
            <p className="text-xs text-zinc-400 mt-1">pertandingan</p>
          </div>
        </div>

        {/* Membership Payment */}
        {myMembership && (
          <div className="member-payment-membership bg-zinc-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Membership Bulanan</h3>
                  <p className="text-sm text-zinc-300">
                    {new Date(myMembership.year, myMembership.month - 1).toLocaleDateString('id-ID', {
                      month: 'long',
                      year: 'numeric'
                    })} • {myMembership.weeks_in_month} minggu
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">
                  Rp {myMembership.amount.toLocaleString('id-ID')}
                </p>
                {(() => {
                  const status = getPaymentStatus(myMembership.payment_status, myMembership.payment_proof);
                  const Icon = status.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full mt-1 ${status.color}`}>
                      <Icon className="w-3 h-3" />
                      {status.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {myMembership.payment_status === 'pending' && !myMembership.payment_proof && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => togglePaymentSelection({
                    id: myMembership.id,
                    type: 'membership',
                    amount: myMembership.amount,
                    label: `Membership ${new Date(myMembership.year, myMembership.month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
                  })}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-purple-500/50 bg-zinc-800 hover:bg-zinc-800/70 transition-colors text-white"
                >
                  {isPaymentSelected(myMembership.id, 'membership') ? (
                    <>
                      <CheckSquare className="w-5 h-5 text-purple-400" />
                      <span className="text-sm font-medium">Dipilih untuk bulk upload</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-5 h-5 text-zinc-400" />
                      <span className="text-sm font-medium">Pilih untuk bulk upload</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => openPaymentModal(myMembership.id, 'membership', myMembership.amount)}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Bayar Sekarang
                </button>
              </div>
            )}

            {myMembership.payment_proof && myMembership.payment_status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {myMembership.payment_proof === 'CASH_PAYMENT' 
                    ? 'Pembayaran cash sedang diverifikasi oleh admin'
                    : 'Bukti pembayaran sedang diverifikasi oleh admin'
                  }
                </p>
                {myMembership.payment_proof !== 'CASH_PAYMENT' && (
                  <a
                    href={myMembership.payment_proof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Lihat bukti pembayaran
                  </a>
                )}
              </div>
            )}

            {myMembership.payment_status === 'paid' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Pembayaran telah dikonfirmasi pada {new Date(myMembership.paid_at!).toLocaleDateString('id-ID')}
                </p>
              </div>
            )}

            {myMembership.payment_status === 'rejected' && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      Bukti Pembayaran Ditolak
                    </p>
                    {myMembership.rejection_reason && (
                      <p className="text-sm text-red-700 mb-2">
                        <span className="font-medium">Alasan:</span> {myMembership.rejection_reason}
                      </p>
                    )}
                    {myMembership.rejection_date && (
                      <p className="text-xs text-red-600 mb-3">
                        Ditolak pada {new Date(myMembership.rejection_date).toLocaleString('id-ID')}
                      </p>
                    )}
                    <button
                      onClick={() => openPaymentModal(myMembership.id, 'membership', myMembership.amount)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Upload Ulang Bukti Pembayaran
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment List */}
        <div className="member-payment-matches bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Riwayat Pembayaran Pertandingan</h2>
              
              {/* Bulk Upload Banner */}
              {selectedPayments.length > 0 && (
                <div className="flex items-center gap-4 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2">
                  <span className="text-sm text-blue-400 font-medium">
                    {selectedPayments.length} item dipilih
                  </span>
                  <button
                    onClick={openBulkUploadModal}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Bukti (Bulk)
                  </button>
                  <button
                    onClick={clearBulkSelection}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {allMatches.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Belum Ada Pertandingan</h3>
              <p className="text-zinc-300">
                Anda belum terdaftar dalam pertandingan apapun
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider w-12">
                      <CheckSquare className="w-4 h-4 text-zinc-500" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Pertandingan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Shuttlecock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Kehadiran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-white/5">
                  {allMatches.map((match) => {
                    const status = getPaymentStatus(match.payment_status, match.payment_proof);
                    const Icon = status.icon;
                    const canSelect = match.payment_status === 'pending' && !match.payment_proof;
                    const isSelected = isPaymentSelected(match.id, 'match');

                    return (
                      <React.Fragment key={match.id}>
                      <tr className="hover:bg-zinc-800/50 transition-colors">
                        <td className="px-3 py-4 whitespace-nowrap">
                          {canSelect && (
                            <button
                              onClick={() => togglePaymentSelection({
                                id: match.id,
                                type: 'match',
                                amount: match.total_amount,
                                matchNumber: match.matches.match_number,
                                label: `Match #${match.matches.match_number}`
                              })}
                              className="text-zinc-400 hover:text-blue-400 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-blue-400" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-zinc-400" />
                            <span className="font-medium text-white">
                              Match #{match.matches.match_number}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                          {new Date(match.matches.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {match.payment_status === 'revision' && match.additional_amount ? (
                            <>
                              <span className="line-through text-zinc-500">Rp {match.amount_due.toLocaleString('id-ID')}</span>
                              <span className="block text-blue-400 font-semibold">+Rp {match.additional_amount.toLocaleString('id-ID')}</span>
                            </>
                          ) : (
                            <>
                              Rp {match.amount_due.toLocaleString('id-ID')}
                            </>
                          )}
                          <span className="text-xs text-zinc-400 block">
                            {match.matches.shuttlecock_count} kok
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {match.attendance_fee === 0 ? (
                            <span className="text-green-400 font-medium">GRATIS</span>
                          ) : (
                            <span className="text-white">
                              Rp {match.attendance_fee.toLocaleString('id-ID')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {match.payment_status === 'revision' && match.additional_amount ? (
                            <span className="font-bold text-blue-400">
                              Rp {match.additional_amount.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            <span className="font-bold text-white">
                              Rp {match.total_amount.toLocaleString('id-ID')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${status.color}`}>
                            <Icon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="member-payment-actions px-6 py-4 whitespace-nowrap text-sm">
                          {match.payment_status === 'rejected' && (
                            <button
                              onClick={() => openPaymentModal(match.id, 'match', match.total_amount, match.matches.match_number)}
                              className="text-red-600 hover:text-red-700 font-medium"
                            >
                              Upload Ulang
                            </button>
                          )}
                          {match.payment_status === 'revision' && (
                            <div className="space-y-1">
                              <button
                                onClick={() => openPaymentModal(match.id, 'match', match.additional_amount || match.total_amount, match.matches.match_number)}
                                className="text-blue-600 hover:text-blue-700 font-medium block"
                              >
                                Bayar Revisi
                              </button>
                              <p className="text-xs text-zinc-400">Pembayaran tambahan</p>
                            </div>
                          )}
                          {match.payment_status === 'pending' && !match.payment_proof && (
                            <button
                              onClick={() => openPaymentModal(match.id, 'match', match.total_amount, match.matches.match_number)}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Bayar
                            </button>
                          )}
                          {match.payment_proof && match.payment_status === 'pending' && (
                            <a
                              href={match.payment_proof === 'CASH_PAYMENT' ? '#' : match.payment_proof}
                              target={match.payment_proof === 'CASH_PAYMENT' ? '_self' : '_blank'}
                              rel="noopener noreferrer"
                              className={`font-medium ${match.payment_proof === 'CASH_PAYMENT' ? 'text-yellow-600 cursor-default' : 'text-blue-600 hover:text-blue-700'}`}
                              onClick={(e) => {
                                if (match.payment_proof === 'CASH_PAYMENT') {
                                  e.preventDefault();
                                }
                              }}
                            >
                              {match.payment_proof === 'CASH_PAYMENT' ? 'Cash' : 'Lihat Bukti'}
                            </a>
                          )}
                          {match.payment_status === 'paid' && (
                            <span className="text-green-600 font-medium">✓ Lunas</span>
                          )}
                        </td>
                      </tr>
                      {/* Rejection Alert Row */}
                      {match.payment_status === 'rejected' && match.rejection_reason && (
                        <tr className="bg-red-50 border-l-4 border-red-500">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-red-900 mb-1">
                                  Bukti Pembayaran Ditolak
                                </p>
                                <p className="text-sm text-red-700">
                                  <span className="font-medium">Alasan:</span> {match.rejection_reason}
                                </p>
                                {match.rejection_date && (
                                  <p className="text-xs text-red-600 mt-1">
                                    Ditolak pada {new Date(match.rejection_date).toLocaleString('id-ID')}
                                  </p>
                                )}
                                <p className="text-sm text-red-800 mt-2">
                                  Silakan upload ulang bukti pembayaran yang benar.
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Instructions Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-white">Cara Pembayaran</h3>
                {selectedPayment.type === 'match' && selectedPayment.matchNumber && (
                  <p className="text-sm text-zinc-400 mt-1">
                    Pertandingan #{selectedPayment.matchNumber}
                  </p>
                )}
              </div>
              <button
                onClick={closePaymentModal}
                className="text-zinc-400 hover:text-zinc-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Amount */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
              <p className="text-sm text-blue-100 mb-1">Total yang harus dibayar</p>
              <p className="text-4xl font-bold">
                Rp {selectedPayment.amount.toLocaleString('id-ID')}
              </p>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <h4 className="font-semibold text-white mb-3">Pilih Metode Pembayaran:</h4>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 hover:border-white/20 bg-zinc-800'
                  }`}
                >
                  <Building2 className={`w-8 h-8 mx-auto mb-2 ${
                    paymentMethod === 'bank_transfer' ? 'text-blue-400' : 'text-zinc-400'
                  }`} />
                  <p className={`font-semibold text-sm ${
                    paymentMethod === 'bank_transfer' ? 'text-blue-300' : 'text-zinc-300'
                  }`}>
                    Bank Transfer
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">Upload bukti transfer</p>
                </button>

                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    paymentMethod === 'cash'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-white/10 hover:border-white/20 bg-zinc-800'
                  }`}
                >
                  <CreditCard className={`w-8 h-8 mx-auto mb-2 ${
                    paymentMethod === 'cash' ? 'text-green-400' : 'text-zinc-400'
                  }`} />
                  <p className={`font-semibold text-sm ${
                    paymentMethod === 'cash' ? 'text-green-300' : 'text-zinc-300'
                  }`}>
                    Cash
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">Bayar langsung tunai</p>
                </button>
              </div>
            </div>

            {/* Bank Transfer Instructions */}
            {paymentMethod === 'bank_transfer' && (
              <>
                {/* Bank Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-600 p-3 rounded-full">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-2">Pilih Rekening Tujuan Transfer</h4>
                      <p className="text-xs text-blue-300 mb-1">Semua rekening a.n. <strong>Septian Dwiyo Rifalda</strong></p>
                      <p className="text-xs text-amber-300 mb-4">💡 Pilih salah satu rekening di bawah untuk melakukan transfer</p>
                      
                      {/* Bank Accounts Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="bg-white/5 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-xs text-blue-300 mb-1">Permata Bank</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono font-semibold text-white text-sm">9937 296 220</p>
                            <button
                              onClick={() => copyToClipboard('9937 296 220')}
                              className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                              title="Salin nomor rekening"
                            >
                              {copiedAccount === '9937 296 220' ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-blue-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="bg-white/5 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-xs text-blue-300 mb-1">Jenius</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono font-semibold text-white text-sm">90012823396</p>
                            <button
                              onClick={() => copyToClipboard('90012823396')}
                              className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                              title="Salin nomor rekening"
                            >
                              {copiedAccount === '90012823396' ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-blue-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="bg-white/5 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-xs text-blue-300 mb-1">Mandiri</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono font-semibold text-white text-sm">1700 1093 5998 56</p>
                            <button
                              onClick={() => copyToClipboard('1700 1093 5998 56')}
                              className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                              title="Salin nomor rekening"
                            >
                              {copiedAccount === '1700 1093 5998 56' ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-blue-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="bg-white/5 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-xs text-blue-300 mb-1">BNI</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono font-semibold text-white text-sm">0389 125635</p>
                            <button
                              onClick={() => copyToClipboard('0389 125635')}
                              className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                              title="Salin nomor rekening"
                            >
                              {copiedAccount === '0389 125635' ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-blue-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="bg-white/5 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-xs text-blue-300 mb-1">Blu (BCA Digital)</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono font-semibold text-white text-sm">0022 2208 9889</p>
                            <button
                              onClick={() => copyToClipboard('0022 2208 9889')}
                              className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                              title="Salin nomor rekening"
                            >
                              {copiedAccount === '0022 2208 9889' ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-blue-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="bg-white/5 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-xs text-blue-300 mb-1">BCA</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono font-semibold text-white text-sm">5871 788 087</p>
                            <button
                              onClick={() => copyToClipboard('5871 788 087')}
                              className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                              title="Salin nomor rekening"
                            >
                              {copiedAccount === '5871 788 087' ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-blue-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* E-Wallets */}
                      <div className="border-t border-blue-500/20 pt-4">
                        <p className="text-sm font-semibold text-white mb-3">E-Wallet (Transfer/QRIS)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-white/5 border border-blue-500/20 rounded-lg p-3">
                            <p className="text-xs text-blue-300 mb-1">DANA</p>
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-mono font-semibold text-white text-sm">0821 1113 4140</p>
                              <button
                                onClick={() => copyToClipboard('0821 1113 4140')}
                                className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                                title="Salin nomor"
                              >
                                {copiedAccount === '0821 1113 4140' ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-blue-400" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="bg-white/5 border border-blue-500/20 rounded-lg p-3">
                            <p className="text-xs text-blue-300 mb-1">Gopay</p>
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-mono font-semibold text-white text-sm">0812 7073 272</p>
                              <button
                                onClick={() => copyToClipboard('0812 7073 272')}
                                className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                                title="Salin nomor"
                              >
                                {copiedAccount === '0812 7073 272' ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-blue-400" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="bg-white/5 border border-blue-500/20 rounded-lg p-3">
                            <p className="text-xs text-blue-300 mb-1">ShopeePay</p>
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-mono font-semibold text-white text-sm">0821 1113 4140</p>
                              <button
                                onClick={() => copyToClipboard('08211113414')}
                                className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                                title="Salin nomor"
                              >
                                {copiedAccount === '08211113414' ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-blue-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mb-6">
                  <h4 className="font-semibold text-white mb-3">Langkah Pembayaran:</h4>
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        1
                      </span>
                      <span className="text-zinc-300">Transfer sejumlah <strong className="text-white">Rp {selectedPayment.amount.toLocaleString('id-ID')}</strong> ke rekening di atas</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        2
                      </span>
                      <span className="text-zinc-300">Simpan bukti transfer (screenshot atau foto)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        3
                      </span>
                      <span className="text-zinc-300">Klik tombol &quot;Upload Bukti Transfer&quot; di bawah</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        4
                      </span>
                      <span className="text-zinc-300">Tunggu verifikasi dari admin (maksimal 1x24 jam)</span>
                    </li>
                  </ol>
                </div>
              </>
            )}

            {/* Cash Payment Instructions */}
            {paymentMethod === 'cash' && (
              <>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-600 p-3 rounded-full">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-3">Pembayaran Cash</h4>
                      <p className="text-sm text-zinc-300">
                        Bayar langsung kepada admin atau bendahara DLOB Community saat pertandingan atau pertemuan.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-white mb-3">Langkah Pembayaran Cash:</h4>
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        1
                      </span>
                      <span className="text-zinc-300">Klik tombol &quot;Konfirmasi Pembayaran Cash&quot; di bawah</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        2
                      </span>
                      <span className="text-zinc-300">Pembayaran akan tercatat sebagai &quot;Menunggu Konfirmasi&quot;</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        3
                      </span>
                      <span className="text-zinc-300">Bayar sejumlah <strong className="text-white">Rp {selectedPayment.amount.toLocaleString('id-ID')}</strong> secara tunai kepada admin</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        4
                      </span>
                      <span className="text-zinc-300">Admin akan mengkonfirmasi pembayaran Anda</span>
                    </li>
                  </ol>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closePaymentModal}
                className="flex-1 bg-zinc-800 text-zinc-300 px-4 py-3 rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-white/10"
              >
                Batal
              </button>
              {paymentMethod === 'bank_transfer' ? (
                <button
                  onClick={openUploadModal}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload Bukti Transfer
                </button>
              ) : (
                <button
                  onClick={handleCashPayment}
                  disabled={uploading}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Konfirmasi Pembayaran Cash
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && selectedPayments.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Upload Bukti Pembayaran (Bulk)</h3>
              <button
                onClick={closeBulkUploadModal}
                className="text-zinc-400 hover:text-zinc-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Selected Payments Summary */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-400 font-medium mb-3">
                  {selectedPayments.length} Pembayaran Dipilih:
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedPayments.map((payment, index) => (
                    <div key={`${payment.type}-${payment.id}`} className="flex items-center justify-between bg-zinc-800/50 rounded px-3 py-2">
                      <span className="text-sm text-white">
                        {index + 1}. {payment.label}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        Rp {payment.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-400">Total:</span>
                    <span className="text-xl font-bold text-white">
                      Rp {selectedPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Alert */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <p className="text-sm text-amber-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Catatan:</strong> Pastikan Anda sudah mentransfer <strong>total keseluruhan</strong> sebesar Rp {selectedPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('id-ID')} dalam satu transaksi. Bukti transfer yang sama akan digunakan untuk semua pembayaran yang dipilih.
                  </span>
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Pilih file bukti transfer (JPG, PNG, atau PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setBulkProofFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-white border border-white/10 rounded-lg cursor-pointer bg-zinc-800 focus:outline-none p-2"
                />
                {bulkProofFile && (
                  <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    File dipilih: {bulkProofFile.name}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeBulkUploadModal}
                  className="flex-1 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-white/10"
                >
                  Batal
                </button>
                <button
                  onClick={handleBulkUploadProof}
                  disabled={!bulkProofFile || bulkUploading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {bulkUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload untuk {selectedPayments.length} Pembayaran
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Upload Bukti Pembayaran</h3>
              <button
                onClick={closeUploadModal}
                className="text-zinc-400 hover:text-zinc-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-800 rounded-lg p-4">
                <p className="text-sm text-zinc-300">Total yang harus dibayar:</p>
                <p className="text-2xl font-bold text-white">
                  Rp {selectedPayment.amount.toLocaleString('id-ID')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Pilih file bukti transfer (JPG, PNG, atau PDF)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-white border border-white/10 rounded-lg cursor-pointer bg-zinc-800 focus:outline-none p-2"
                />
                {proofFile && (
                  <p className="mt-2 text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    File dipilih: {proofFile.name}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeUploadModal}
                  className="flex-1 bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-white/10"
                >
                  Batal
                </button>
                <button
                  onClick={handleUploadProof}
                  disabled={!proofFile || uploading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Help Modal */}
      {showPaymentHelpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-blue-500/30 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border-b border-blue-500/30 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-7 h-7 text-blue-400" />
                  Panduan Pembayaran
                </h3>
                <button
                  onClick={() => setShowPaymentHelpModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Cara Pembayaran */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                  Cara Melakukan Pembayaran
                </h4>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold">1</span>
                    <div>
                      <p className="text-white font-medium mb-1">Cek Tagihan Anda</p>
                      <p className="text-zinc-300 text-sm">Lihat daftar pembayaran yang berstatus "Belum Dibayar" (merah) atau "Revisi" (kuning) di bagian bawah halaman</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold">2</span>
                    <div>
                      <p className="text-white font-medium mb-1">Lakukan Transfer</p>
                      <p className="text-zinc-300 text-sm">Transfer sejumlah tagihan ke rekening yang tertera. Pastikan nominal sesuai dengan jumlah yang tertera</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold">3</span>
                    <div>
                      <p className="text-white font-medium mb-1">Upload Bukti Pembayaran</p>
                      <p className="text-zinc-300 text-sm">Klik tombol "Upload Bukti" pada tagihan yang ingin Anda bayar, lalu pilih foto bukti transfer Anda (maksimal 5MB, format JPG/PNG)</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold">4</span>
                    <div>
                      <p className="text-white font-medium mb-1">Tunggu Konfirmasi</p>
                      <p className="text-zinc-300 text-sm">Status akan berubah menjadi "Menunggu Konfirmasi" (kuning). Admin akan memverifikasi dalam 1-2 hari kerja</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-semibold">5</span>
                    <div>
                      <p className="text-white font-medium mb-1">Pembayaran Lunas</p>
                      <p className="text-zinc-300 text-sm">Setelah diverifikasi, status akan berubah menjadi "Lunas" (hijau) dan Anda akan mendapat notifikasi</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Rekening Pembayaran */}
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-400" />
                  Rekening Pembayaran
                </h4>
                <p className="text-xs text-green-300 mb-2">Semua rekening a.n. <strong>Septian Dwiyo Rifalda</strong></p>
                <p className="text-xs text-amber-300 mb-3">💡 Pilih salah satu rekening untuk transfer</p>
                
                {/* Bank Accounts */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="bg-white/5 rounded p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">Permata Bank</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold font-mono">9937 296 220</span>
                        <button
                          onClick={() => copyToClipboard('9937 296 220')}
                          className="p-1 hover:bg-green-500/20 rounded transition-colors"
                          title="Salin nomor rekening"
                        >
                          {copiedAccount === '9937 296 220' ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-green-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">Jenius</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold font-mono">90012823396</span>
                        <button
                          onClick={() => copyToClipboard('90012823396')}
                          className="p-1 hover:bg-green-500/20 rounded transition-colors"
                          title="Salin nomor rekening"
                        >
                          {copiedAccount === '90012823396' ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-green-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">Mandiri</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold font-mono">1700 1093 5998 56</span>
                        <button
                          onClick={() => copyToClipboard('1700 1093 5998 56')}
                          className="p-1 hover:bg-green-500/20 rounded transition-colors"
                          title="Salin nomor rekening"
                        >
                          {copiedAccount === '1700 1093 5998 56' ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-green-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">BNI</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold font-mono">0389 125635</span>
                        <button
                          onClick={() => copyToClipboard('0389 125635')}
                          className="p-1 hover:bg-green-500/20 rounded transition-colors"
                          title="Salin nomor rekening"
                        >
                          {copiedAccount === '0389 125635' ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-green-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">Blu (BCA Digital)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold font-mono">0022 2208 9889</span>
                        <button
                          onClick={() => copyToClipboard('0022 2208 9889')}
                          className="p-1 hover:bg-green-500/20 rounded transition-colors"
                          title="Salin nomor rekening"
                        >
                          {copiedAccount === '0022 2208 9889' ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-green-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">BCA</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold font-mono">5871 788 087</span>
                        <button
                          onClick={() => copyToClipboard('5871 788 087')}
                          className="p-1 hover:bg-green-500/20 rounded transition-colors"
                          title="Salin nomor rekening"
                        >
                          {copiedAccount === '5871 788 087' ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-green-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* E-Wallets */}
                <div className="border-t border-green-500/30 pt-3 mt-3">
                  <p className="text-xs text-green-300 font-semibold mb-2">E-Wallet:</p>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white/5 rounded p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-300">DANA</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold font-mono">0821 1113 4140</span>
                          <button
                            onClick={() => copyToClipboard('0821 1113 4140')}
                            className="p-1 hover:bg-green-500/20 rounded transition-colors"
                            title="Salin nomor"
                          >
                            {copiedAccount === '0821 1113 4140' ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-green-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-300">Gopay</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold font-mono">0812 7073 272</span>
                          <button
                            onClick={() => copyToClipboard('0812 7073 272')}
                            className="p-1 hover:bg-green-500/20 rounded transition-colors"
                            title="Salin nomor"
                          >
                            {copiedAccount === '0812 7073 272' ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-green-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-300">ShopeePay</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold font-mono">0821 1113 4140</span>
                          <button
                            onClick={() => copyToClipboard('08211113414')}
                            className="p-1 hover:bg-green-500/20 rounded transition-colors"
                            title="Salin nomor"
                          >
                            {copiedAccount === '08211113414' ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-green-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Penting */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  Catatan Penting
                </h4>
                <ul className="space-y-1 text-sm text-zinc-300">
                  <li>• Upload bukti transfer yang jelas dan dapat dibaca</li>
                  <li>• Pastikan nominal transfer sesuai dengan tagihan</li>
                  <li>• Jika status menjadi "Revisi", segera upload ulang bukti yang benar</li>
                  <li>• Hubungi admin jika ada kendala pembayaran</li>
                  <li>• Pembayaran membership berlaku per bulan</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Help Modal */}
      {showStatusHelpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-800 border-b border-zinc-500/30 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Info className="w-7 h-7 text-zinc-400" />
                  Status Pembayaran
                </h3>
                <button
                  onClick={() => setShowStatusHelpModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <p className="text-zinc-300">
                Berikut adalah penjelasan 5 status pembayaran yang ada di sistem:
              </p>

              {/* Belum Dibayar */}
              <div className="border border-red-500/30 rounded-lg p-4 bg-red-500/10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">Belum Dibayar</h4>
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                      BELUM BAYAR
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-zinc-300 ml-13">
                  <p><strong className="text-white">Artinya:</strong> Tagihan masih belum dibayar dan menunggu Anda untuk melakukan pembayaran</p>
                  <p><strong className="text-white">Yang harus dilakukan:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Transfer ke rekening yang tertera</li>
                    <li>Klik tombol "Upload Bukti" untuk mengunggah bukti transfer</li>
                  </ul>
                </div>
              </div>

              {/* Menunggu Konfirmasi */}
              <div className="border border-yellow-500/30 rounded-lg p-4 bg-yellow-500/10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">Menunggu Konfirmasi / Revisi</h4>
                    <div className="flex gap-2">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        MENUNGGU VERIFIKASI
                      </span>
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        REVISI
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-zinc-300 ml-13">
                  <p><strong className="text-white">Artinya:</strong> Bukti pembayaran sudah diunggah dan sedang diverifikasi oleh admin, atau perlu revisi</p>
                  <p><strong className="text-white">Yang harus dilakukan:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Menunggu Verifikasi:</strong> Tunggu admin memverifikasi (1-2 hari kerja)</li>
                    <li><strong>Revisi:</strong> Upload ulang bukti pembayaran yang lebih jelas atau benar</li>
                  </ul>
                </div>
              </div>

              {/* Ditolak */}
              <div className="border border-red-600/30 rounded-lg p-4 bg-red-600/10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                    <X className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">Ditolak</h4>
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30">
                      DITOLAK
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-zinc-300 ml-13">
                  <p><strong className="text-white">Artinya:</strong> Bukti pembayaran ditolak oleh admin karena tidak sesuai atau tidak valid. Tagihan masih harus dibayar!</p>
                  <p><strong className="text-white">Yang harus dilakukan:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Baca alasan penolakan yang diberikan admin</li>
                    <li>Klik tombol "Upload Ulang" untuk mengunggah bukti yang benar</li>
                    <li>Pastikan bukti pembayaran jelas dan sesuai dengan jumlah tagihan</li>
                  </ul>
                </div>
              </div>

              {/* Lunas */}
              <div className="border border-green-500/30 rounded-lg p-4 bg-green-500/10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">Lunas</h4>
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      LUNAS
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-zinc-300 ml-13">
                  <p><strong className="text-white">Artinya:</strong> Pembayaran telah diverifikasi dan diterima oleh admin. Tagihan sudah lunas!</p>
                  <p><strong className="text-white">Yang harus dilakukan:</strong> Tidak ada - pembayaran sudah selesai ✓</p>
                </div>
              </div>

              {/* Dibatalkan */}
              <div className="border border-gray-500/30 rounded-lg p-4 bg-gray-500/10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center">
                    <X className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">Dibatalkan</h4>
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                      DIBATALKAN
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-zinc-300 ml-13">
                  <p><strong className="text-white">Artinya:</strong> Tagihan dibatalkan oleh admin. Anda tidak perlu membayar untuk tagihan ini.</p>
                  <p><strong className="text-white">Yang harus dilakukan:</strong> Tidak ada - tagihan sudah dibatalkan dan tidak perlu dibayar</p>
                </div>
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
        tutorialKey="member-pembayaran"
      />
    </div>
  );
}
