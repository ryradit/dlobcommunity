'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  Info,
  HelpCircle,
  Copy,
  Check,
  QrCode,
  Download,
  ChevronDown,
  X,
  Upload,
  Award,
  CheckSquare,
  Square,
  Building2,
} from 'lucide-react';
import { StatCardSkeleton, MatchCardSkeleton } from '@/components/LoadingSkeletons';
import BranchBadge from '@/components/BranchBadge';
import { generateBulkPaymentPDF, generatePaymentPDF } from '@/lib/pdfGenerator';

const BRANCH_ID = 'dlob-cikupa';

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
  rejection_date?: string | null;
  matches: {
    match_number: number;
    match_date: string | null;
    created_at: string;
    shuttlecock_count: number;
    team1_score: number | null;
    team2_score: number | null;
    winner: string | null;
    team1_player1: string | null;
    team1_player2: string | null;
    team2_player1: string | null;
    team2_player2: string | null;
  };
}

type BankAccount = { name: string; number: string };
type BankInfo = { holderName: string; banks: BankAccount[]; ewallets: BankAccount[] };

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function CikupaPembayaranPage() {
  const { user } = useAuth();
  const [allMatches, setAllMatches] = useState<MatchMember[]>([]);
  const [memberName, setMemberName] = useState('');
  const [loading, setLoading] = useState(true);

  // DLBC payment destination info
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Modals & UI states
  const [showPaymentHelpModal, setShowPaymentHelpModal] = useState(false);
  const [showStatusHelpModal, setShowStatusHelpModal] = useState(false);
  const [showAttendanceInfoModal, setShowAttendanceInfoModal] = useState(false);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);

  // Table filter tab
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'unconfirmed' | 'paid'>('all');

  // Single payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    id: string;
    amount: number;
    matchNumber?: number;
    matchDate?: string;
    match?: MatchMember;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'qris'>('bank_transfer');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Bulk selection & modal
  const [selectedPayments, setSelectedPayments] = useState<Array<{
    id: string;
    amount: number;
    matchNumber?: number;
    label: string;
  }>>([]);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<'bank_transfer' | 'qris'>('bank_transfer');
  const [bulkProofFile, setBulkProofFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  // PDF Receipts
  const [showReceiptDropdown, setShowReceiptDropdown] = useState(false);
  const [generatingReceiptPDF, setGeneratingReceiptPDF] = useState(false);
  const [generatingMatchPDF, setGeneratingMatchPDF] = useState<string | null>(null);

  // Fetch DLBC payment destination
  useEffect(() => {
    fetch('/api/payment-info?branch=dlob-cikupa')
      .then((res) => res.json())
      .then((data) => {
        if (data.bankInfo) setBankInfo(data.bankInfo);
        if (data.qrisImageUrl) setQrisImageUrl(data.qrisImageUrl);
      })
      .catch(() => {});
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ''));
    setCopiedAccount(text);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  // Fetch Member Matches
  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();

      const resolvedName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split('@')[0] ||
        '';
      setMemberName(resolvedName);

      if (!resolvedName) {
        setLoading(false);
        return;
      }

      // Fetch Matches scoped to DLBC
      const { data: matchesData, error: matchesError } = await supabase
        .from('match_members')
        .select(`
          id,
          match_id,
          member_name,
          amount_due,
          attendance_fee,
          total_amount,
          payment_status,
          paid_at,
          payment_proof,
          rejection_reason,
          matches!inner (
            match_number,
            match_date,
            created_at,
            shuttlecock_count,
            team1_score,
            team2_score,
            winner,
            team1_player1,
            team1_player2,
            team2_player1,
            team2_player2,
            branch_id
          )
        `)
        .eq('member_name', resolvedName)
        .eq('matches.branch_id', BRANCH_ID)
        .order('created_at', { ascending: false });

      if (matchesError) {
        console.error('Error fetching DLBC matches:', matchesError);
      } else {
        const parsed = (matchesData as unknown as MatchMember[]) || [];
        setAllMatches(parsed);
      }
    } catch (err) {
      console.error('Error loading DLBC payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Statistics (DLBC: Shuttlecock fee + Attendance fee)
  const totalPending = useMemo(() => {
    return allMatches
      .filter((m) => m.payment_status !== 'paid' && m.payment_status !== 'cancelled')
      .reduce((sum, m) => sum + (m.total_amount || 0), 0);
  }, [allMatches]);

  const unpaidCount = useMemo(() => {
    return allMatches.filter(
      (m) => (m.payment_status === 'pending' && !m.payment_proof) || m.payment_status === 'rejected'
    ).length;
  }, [allMatches]);

  const revisionCount = useMemo(() => {
    return allMatches.filter((m) => m.payment_status === 'revision').length;
  }, [allMatches]);

  const totalUnconfirmed = useMemo(() => {
    return allMatches.filter(
      (m) => !!m.payment_proof && (m.payment_status === 'pending' || m.payment_status === 'revision')
    ).length;
  }, [allMatches]);

  const totalPaid = useMemo(() => {
    return allMatches
      .filter((m) => m.payment_status === 'paid')
      .reduce((sum, m) => sum + (m.total_amount || 0), 0);
  }, [allMatches]);

  // Status helper function
  function getPaymentStatus(paymentStatus: string, paymentProof: string | null) {
    if (paymentStatus === 'paid') {
      return { label: 'Lunas', color: 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-500/30', icon: CheckCircle };
    } else if (paymentStatus === 'rejected') {
      return { label: 'Ditolak', color: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30', icon: X };
    } else if (paymentStatus === 'cancelled') {
      return { label: 'Dibatalkan', color: 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-300 dark:border-zinc-700', icon: X };
    } else if (paymentStatus === 'revision') {
      return { label: 'Revisi', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/30', icon: AlertCircle };
    } else if (paymentProof) {
      return { label: 'Menunggu Verifikasi', color: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/30', icon: Clock };
    } else {
      return { label: 'Belum Bayar', color: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/30', icon: AlertCircle };
    }
  }

  // Filter matches based on active tab
  const filteredMatches = useMemo(() => {
    if (activeTab === 'all') return allMatches;
    if (activeTab === 'pending') {
      return allMatches.filter((m) => (m.payment_status === 'pending' && !m.payment_proof) || m.payment_status === 'rejected');
    }
    if (activeTab === 'unconfirmed') {
      return allMatches.filter((m) => !!m.payment_proof && (m.payment_status === 'pending' || m.payment_status === 'revision'));
    }
    if (activeTab === 'paid') {
      return allMatches.filter((m) => m.payment_status === 'paid');
    }
    return allMatches;
  }, [allMatches, activeTab]);


  // Bulk Selection Handlers
  const isPaymentSelected = (id: string) => {
    return selectedPayments.some((p) => p.id === id);
  };

  const togglePaymentSelection = (item: {
    id: string;
    amount: number;
    matchNumber?: number;
    label: string;
  }) => {
    if (isPaymentSelected(item.id)) {
      setSelectedPayments((prev) => prev.filter((p) => p.id !== item.id));
    } else {
      setSelectedPayments((prev) => [...prev, item]);
    }
  };

  const clearBulkSelection = () => {
    setSelectedPayments([]);
  };

  const selectAllUnpaid = () => {
    const unpaids: Array<{
      id: string;
      amount: number;
      matchNumber?: number;
      label: string;
    }> = [];

    allMatches
      .filter((m) => m.payment_status === 'pending' && !m.payment_proof)
      .forEach((m) => {
        unpaids.push({
          id: m.id,
          amount: m.total_amount,
          matchNumber: m.matches.match_number,
          label: `Match #${m.matches.match_number}`,
        });
      });

    setSelectedPayments(unpaids);
  };

  // Open single payment modal
  const openPaymentModal = (
    id: string,
    amount: number,
    matchNumber?: number,
    matchDate?: string,
    match?: MatchMember
  ) => {
    setSelectedPayment({ id, amount, matchNumber, matchDate, match });
    setPaymentMethod('bank_transfer');
    setProofFile(null);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
    setProofFile(null);
  };

  // Submit Single Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    if (paymentMethod === 'cash') {
      try {
        setUploading(true);
        await supabase
          .from('match_members')
          .update({
            payment_proof: 'CASH_PAYMENT',
            payment_status: 'pending',
          })
          .eq('id', selectedPayment.id);

        alert('Permintaan pembayaran cash telah dicatat. Silakan bayar tunai ke koordinator DLBC.');
        closePaymentModal();
        await loadData();
      } catch (err) {
        console.error('Error updating cash payment:', err);
        alert('Gagal memproses pembayaran cash.');
      } finally {
        setUploading(false);
      }
      return;
    }

    if (!proofFile) {
      alert('Pilih file bukti transfer terlebih dahulu.');
      return;
    }

    try {
      setUploading(true);
      const ext = proofFile.name.split('.').pop();
      const filename = `dlbc_match_${selectedPayment.id}_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filename, proofFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(uploadData.path);

      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('match_members')
        .update({
          payment_proof: publicUrl,
          payment_status: 'pending',
          paid_at: new Date().toISOString(),
        })
        .eq('id', selectedPayment.id);
      if (updateError) throw updateError;

      alert('Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin DLBC.');
      closePaymentModal();
      await loadData();
    } catch (err: unknown) {
      console.error('Error submitting payment proof:', err);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat upload.';
      alert(`Gagal mengunggah bukti: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  // Submit Bulk Payment
  const handleSubmitBulkPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkProofFile || selectedPayments.length === 0) {
      alert('Pilih file bukti pembayaran terlebih dahulu.');
      return;
    }

    try {
      setBulkUploading(true);
      const ext = bulkProofFile.name.split('.').pop();
      const filename = `dlbc_bulk_${user?.id}_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filename, bulkProofFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(uploadData.path);

      const publicUrl = publicUrlData.publicUrl;
      const matchIds = selectedPayments.map((p) => p.id);

      if (matchIds.length > 0) {
        const { error: matchErr } = await supabase
          .from('match_members')
          .update({
            payment_proof: publicUrl,
            payment_status: 'pending',
            paid_at: new Date().toISOString(),
          })
          .in('id', matchIds);
        if (matchErr) throw matchErr;
      }

      alert(`Bukti pembayaran untuk ${selectedPayments.length} tagihan berhasil diunggah!`);
      setShowBulkUploadModal(false);
      setSelectedPayments([]);
      setBulkProofFile(null);
      await loadData();
    } catch (err: unknown) {
      console.error('Error submitting bulk payment:', err);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      alert(`Gagal upload bulk: ${msg}`);
    } finally {
      setBulkUploading(false);
    }
  };

  // PDF Receipts Download
  const handleDownloadAllPayments = async () => {
    const paidMatches = allMatches.filter((m) => m.payment_status === 'paid');

    if (paidMatches.length === 0) {
      alert('Belum ada pembayaran yang berstatus Lunas di cabang DLBC Cikupa untuk diunduh struknya.');
      setShowReceiptDropdown(false);
      return;
    }

    try {
      setGeneratingReceiptPDF(true);
      setShowReceiptDropdown(false);

      const bulkData = paidMatches.map((m) => ({
        matchNumber: m.matches.match_number,
        matchDate: m.matches.match_date || m.matches.created_at || new Date().toISOString(),
        shuttlecockFee: m.amount_due,
        attendanceFee: m.attendance_fee,
        totalAmount: m.total_amount,
        paymentStatus: m.payment_status,
        paidAt: m.paid_at ?? undefined,
      }));

      await generateBulkPaymentPDF(
        `${memberName || 'Member DLBC'} (DLBC Cikupa)`,
        bulkData,
        'all',
        undefined,
        undefined,
        undefined,
        null
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF struk. Silakan coba lagi.');
    } finally {
      setGeneratingReceiptPDF(false);
    }
  };

  const handleDownloadMonthPayments = async () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthMatches = allMatches.filter((m) => {
      const d = new Date(m.matches.match_date || m.matches.created_at);
      return (
        d.getMonth() + 1 === currentMonth &&
        d.getFullYear() === currentYear &&
        m.payment_status === 'paid'
      );
    });

    if (monthMatches.length === 0) {
      alert(`Belum ada pembayaran yang berstatus Lunas di bulan ${MONTHS[currentMonth - 1]} untuk diunduh struknya.`);
      setShowReceiptDropdown(false);
      return;
    }

    try {
      setGeneratingReceiptPDF(true);
      setShowReceiptDropdown(false);

      const bulkData = monthMatches.map((m) => ({
        matchNumber: m.matches.match_number,
        matchDate: m.matches.match_date || m.matches.created_at || new Date().toISOString(),
        shuttlecockFee: m.amount_due,
        attendanceFee: m.attendance_fee,
        totalAmount: m.total_amount,
        paymentStatus: m.payment_status,
        paidAt: m.paid_at ?? undefined,
      }));

      await generateBulkPaymentPDF(
        `${memberName || 'Member DLBC'} (DLBC Cikupa)`,
        bulkData,
        'month',
        currentMonth,
        currentYear,
        undefined,
        null
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF struk. Silakan coba lagi.');
    } finally {
      setGeneratingReceiptPDF(false);
    }
  };

  const handleDownloadMatchPDF = async (match: MatchMember) => {
    try {
      setGeneratingMatchPDF(match.id);
      await generatePaymentPDF({
        matchNumber: match.matches.match_number,
        matchDate: match.matches.match_date || match.matches.created_at || new Date().toISOString(),
        memberName: `${memberName || match.member_name || 'Member DLBC'} (DLBC Cikupa)`,
        shuttlecockFee: match.amount_due,
        attendanceFee: match.attendance_fee,
        totalAmount: match.total_amount,
        paymentStatus: match.payment_status,
        paidAt: match.paid_at ?? undefined,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF struk.');
    } finally {
      setGeneratingMatchPDF(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 lg:p-8 transition-colors duration-300">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                Pembayaran Saya
              </h1>
              <BranchBadge size="sm" />
            </div>
            <p className="text-gray-700 dark:text-zinc-300 mt-2 font-medium transition-colors duration-300">
              Kelola pembayaran sesi pertandingan Anda di cabang DLBC Cikupa
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Receipt Download Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReceiptDropdown(!showReceiptDropdown)}
                disabled={generatingReceiptPDF}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors font-bold border-2 border-transparent hover:border-emerald-400 shadow-sm text-white cursor-pointer"
                title="Download struk pembayaran resmi"
              >
                <Download className={`w-5 h-5 ${generatingReceiptPDF ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Struk Pembayaran</span>
                <span className="sm:hidden">Struk</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showReceiptDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showReceiptDropdown && !generatingReceiptPDF && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowReceiptDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={handleDownloadAllPayments}
                      className="w-full px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors border-b border-gray-200 dark:border-white/5 flex items-center gap-3 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">Semua Pembayaran</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Download semua struk lunas</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadMonthPayments}
                      className="w-full px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-colors border-b border-gray-200 dark:border-white/5 flex items-center gap-3 cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">Bulan Ini</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Download pembayaran bulan {MONTHS[new Date().getMonth()]}
                        </div>
                      </div>
                    </button>
                    <div className="px-4 py-2.5 bg-gray-50 dark:bg-zinc-800/60 text-[11px] text-gray-600 dark:text-gray-400 font-medium">
                      💡 Struk per sesi juga dapat diunduh pada kolom Aksi di tabel
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowPaymentHelpModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-bold border-2 border-transparent hover:border-emerald-400 shadow-sm text-white"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="hidden sm:inline">Panduan Pembayaran</span>
              <span className="sm:hidden">Panduan</span>
            </button>
          </div>
        </div>

        {/* Bulk Upload Info Banner */}
        {unpaidCount > 1 && (
          <div className="bg-linear-to-r from-emerald-100 to-teal-100 dark:from-emerald-500/10 dark:to-teal-500/10 border-2 border-emerald-300 dark:border-emerald-500/30 rounded-xl p-4 shadow-sm transition-colors duration-300">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 transition-colors duration-300" />
              <div>
                <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1 transition-colors duration-300">
                  💡 Fitur Baru: Upload Bukti Pembayaran Sekaligus (Bulk Upload)
                </h3>
                <p className="text-sm text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">
                  Hemat waktu! Centang beberapa tagihan sesi di tabel, transfer total keseluruhan dalam satu transaksi,
                  lalu upload bukti transfer untuk semua tagihan sekaligus.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4 Stats Cards */}
        <div className="member-payment-stats grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Tagihan */}
          <div className="glass-premium rounded-2xl p-6 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-700 dark:text-zinc-300 font-bold transition-colors duration-300">
                  Total Tagihan
                </p>
                <button
                  onClick={() => setShowStatusHelpModal(true)}
                  className="member-payment-status-help hover:bg-gray-200 dark:hover:bg-white/10 rounded p-1 transition-colors duration-300"
                  title="Info status pembayaran"
                >
                  <Info className="w-3.5 h-3.5 text-gray-600 dark:text-zinc-400 transition-colors duration-300" />
                </button>
              </div>
              <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400 transition-colors duration-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              Rp {totalPending.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 font-semibold transition-colors duration-300">
              {unpaidCount > 0 && `${unpaidCount} belum bayar`}
              {unpaidCount > 0 && revisionCount > 0 && ' • '}
              {revisionCount > 0 && `${revisionCount} revisi`}
              {unpaidCount === 0 && revisionCount === 0 && 'Tidak ada tagihan'}
            </p>
          </div>

          {/* Menunggu Konfirmasi */}
          <div className="glass-premium rounded-2xl p-6 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700 dark:text-zinc-300 font-bold transition-colors duration-300">
                Menunggu Konfirmasi
              </p>
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 transition-colors duration-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              {totalUnconfirmed}
            </p>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 font-semibold transition-colors duration-300">
              pembayaran
            </p>
          </div>

          {/* Total Terbayar */}
          <div className="glass-premium rounded-2xl p-6 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700 dark:text-zinc-300 font-bold transition-colors duration-300">
                Total Terbayar
              </p>
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-colors duration-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              Rp {totalPaid.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 font-semibold transition-colors duration-300">
              lunas
            </p>
          </div>

          {/* Total Pertandingan */}
          <div className="glass-premium rounded-2xl p-6 shadow-sm transition-colors duration-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700 dark:text-zinc-300 font-bold transition-colors duration-300">
                Total Sesi DLBC
              </p>
              <Users className="w-5 h-5 text-teal-600 dark:text-teal-400 transition-colors duration-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              {allMatches.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1 font-semibold transition-colors duration-300">
              pertandingan
            </p>
          </div>
        </div>



        {/* Payment History Table Section */}
        <div className="member-payment-matches glass-premium rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
          <div className="p-6 border-b-2 border-gray-200 dark:border-white/10 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                  Riwayat Pembayaran Pertandingan
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Daftar seluruh pertandingan badminton Anda di DLBC Cikupa
                </p>
              </div>

              {/* Bulk Upload Action Bar in Header */}
              {selectedPayments.length > 0 ? (
                <div className="flex items-center gap-3 bg-emerald-100 dark:bg-emerald-500/10 border-2 border-emerald-300 dark:border-emerald-500/30 rounded-lg px-4 py-2 shadow-sm transition-colors duration-300">
                  <span className="text-sm text-emerald-800 dark:text-emerald-300 font-bold transition-colors duration-300">
                    {selectedPayments.length} item dipilih (Rp{' '}
                    {selectedPayments.reduce((s, p) => s + p.amount, 0).toLocaleString('id-ID')})
                  </span>
                  <button
                    onClick={() => setShowBulkUploadModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors border-2 border-transparent hover:border-emerald-400 shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Bukti (Bulk)
                  </button>
                  <button
                    onClick={clearBulkSelection}
                    className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 p-1"
                    title="Batal pilih"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                unpaidCount > 0 && (
                  <button
                    onClick={selectAllUnpaid}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline self-start sm:self-auto"
                  >
                    Pilih Semua Tagihan Belum Bayar ({unpaidCount})
                  </button>
                )
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200'
                }`}
              >
                Semua ({allMatches.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'pending'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200'
                }`}
              >
                Belum Bayar ({unpaidCount})
              </button>
              <button
                onClick={() => setActiveTab('unconfirmed')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'unconfirmed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200'
                }`}
              >
                Menunggu Verifikasi ({totalUnconfirmed})
              </button>
              <button
                onClick={() => setActiveTab('paid')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200'
                }`}
              >
                Lunas ({allMatches.filter((m) => m.payment_status === 'paid').length})
              </button>
            </div>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 dark:text-zinc-600 mx-auto mb-4 transition-colors duration-300" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                Belum Ada Pertandingan
              </h3>
              <p className="text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">
                {activeTab === 'all'
                  ? 'Anda belum terdaftar dalam sesi pertandingan apapun di DLBC.'
                  : 'Tidak ada data untuk filter ini.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-zinc-800/50 transition-colors duration-300">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider w-12 transition-colors duration-300">
                      <CheckSquare className="w-4 h-4 text-gray-500 dark:text-zinc-500 transition-colors duration-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider transition-colors duration-300">
                      Pertandingan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider transition-colors duration-300">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider transition-colors duration-300">
                      Shuttlecock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider transition-colors duration-300">
                      <div className="flex items-center gap-1">
                        Kehadiran
                        <button
                          onClick={() => setShowAttendanceInfoModal(true)}
                          className="p-0.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition-colors duration-300"
                          title="Info Biaya Kehadiran"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-500 transition-colors duration-300" />
                        </button>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider transition-colors duration-300">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider transition-colors duration-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider transition-colors duration-300">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-white/5 transition-colors duration-300">
                  {filteredMatches.map((match) => {
                    const status = getPaymentStatus(match.payment_status, match.payment_proof);
                    const Icon = status.icon;
                    const canSelect = match.payment_status === 'pending' && !match.payment_proof;
                    const isSelected = isPaymentSelected(match.id);

                    return (
                      <React.Fragment key={match.id}>
                        <tr className="hover:bg-gray-100 dark:hover:bg-zinc-800/50 transition-colors duration-300">
                          {/* Checkbox column */}
                          <td className="px-3 py-4 whitespace-nowrap">
                            {canSelect ? (
                              <button
                                onClick={() =>
                                  togglePaymentSelection({
                                    id: match.id,
                                    amount: match.total_amount,
                                    matchNumber: match.matches.match_number,
                                    label: `Match #${match.matches.match_number}`,
                                  })
                                }
                                className="text-gray-600 dark:text-zinc-400 hover:text-emerald-600 transition-colors duration-300"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-colors duration-300" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>
                            ) : (
                              <span className="text-gray-300 dark:text-zinc-700 text-xs">-</span>
                            )}
                          </td>

                          {/* Pertandingan column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-colors duration-300 shrink-0" />
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white transition-colors duration-300 block">
                                  Match #{match.matches.match_number}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-zinc-500 font-medium">
                                  {new Date(match.matches.match_date || match.matches.created_at).toLocaleDateString(
                                    'id-ID',
                                    { month: 'short', year: 'numeric' }
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Tanggal column */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-zinc-300 font-medium transition-colors duration-300">
                            {new Date(match.matches.match_date || match.matches.created_at).toLocaleDateString(
                              'id-ID',
                              { day: 'numeric', month: 'short', year: 'numeric' }
                            )}
                          </td>

                          {/* Shuttlecock column */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium transition-colors duration-300">
                            Rp {(match.amount_due ?? 0).toLocaleString('id-ID')}
                            <span className="text-xs text-gray-600 dark:text-zinc-400 block font-semibold transition-colors duration-300">
                              {match.matches.shuttlecock_count} kok
                            </span>
                          </td>

                          {/* Kehadiran column */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium transition-colors duration-300">
                            {(match.attendance_fee ?? 0) === 0 ? (
                              <span className="text-gray-500 dark:text-zinc-500">-</span>
                            ) : (
                              <span className="text-gray-900 dark:text-white">
                                Rp {(match.attendance_fee ?? 0).toLocaleString('id-ID')}
                              </span>
                            )}
                          </td>

                          {/* Total column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-gray-900 dark:text-white transition-colors duration-300">
                              Rp {(match.total_amount ?? 0).toLocaleString('id-ID')}
                            </span>
                          </td>

                          {/* Status column */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-bold border-2 transition-colors duration-300 ${status.color}`}
                            >
                              <Icon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </td>

                          {/* Aksi column */}
                          <td className="member-payment-actions px-6 py-4 whitespace-nowrap text-sm font-bold">
                            {match.payment_status === 'rejected' && (
                              <button
                                onClick={() =>
                                  openPaymentModal(
                                    match.id,
                                    match.total_amount,
                                    match.matches.match_number,
                                    match.matches.match_date || match.matches.created_at,
                                    match
                                  )
                                }
                                className="text-red-600 hover:text-red-700 font-bold transition-colors duration-300"
                              >
                                Upload Ulang
                              </button>
                            )}

                            {match.payment_status === 'pending' && !match.payment_proof && (
                              <button
                                onClick={() =>
                                  openPaymentModal(
                                    match.id,
                                    match.total_amount,
                                    match.matches.match_number,
                                    match.matches.match_date || match.matches.created_at,
                                    match
                                  )
                                }
                                className="text-emerald-600 hover:text-emerald-700 font-bold"
                              >
                                Bayar
                              </button>
                            )}

                            {match.payment_proof && match.payment_status === 'pending' && (
                              <button
                                onClick={() => {
                                  if (match.payment_proof !== 'CASH_PAYMENT') {
                                    setViewingProofUrl(match.payment_proof);
                                  }
                                }}
                                className={`font-bold ${
                                  match.payment_proof === 'CASH_PAYMENT'
                                    ? 'text-yellow-600 cursor-default'
                                    : 'text-emerald-600 hover:text-emerald-700'
                                }`}
                              >
                                {match.payment_proof === 'CASH_PAYMENT' ? 'Cash' : 'Lihat Bukti'}
                              </button>
                            )}

                            {match.payment_status === 'paid' && (
                              <button
                                onClick={() => handleDownloadMatchPDF(match)}
                                disabled={generatingMatchPDF === match.id}
                                className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 font-bold transition-colors duration-300"
                              >
                                <Download
                                  className={`w-4 h-4 ${generatingMatchPDF === match.id ? 'animate-spin' : ''}`}
                                />
                                {generatingMatchPDF === match.id ? 'Membuat...' : 'Struk'}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Rejection Alert Row */}
                        {match.payment_status === 'rejected' && match.rejection_reason && (
                          <tr className="bg-red-100 dark:bg-red-500/10 border-l-4 border-red-500 transition-colors duration-300">
                            <td colSpan={8} className="px-6 py-4">
                              <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-1">
                                    Bukti Pembayaran Ditolak
                                  </p>
                                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                    <span className="font-medium">Alasan:</span> {match.rejection_reason}
                                  </p>
                                  <p className="text-sm text-red-800 dark:text-red-400 mt-2">
                                    Silakan upload ulang bukti transfer yang benar.
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

      {/* Single Payment Instructions Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Pembayaran Pertandingan DLBC
                </h3>
                {selectedPayment.matchNumber && (
                  <p className="text-xs text-zinc-400 mt-1">
                    Pertandingan #{selectedPayment.matchNumber} · {selectedPayment.matchDate ? new Date(selectedPayment.matchDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </p>
                )}
              </div>
              <button onClick={closePaymentModal} className="text-zinc-400 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Amount Box */}
            <div className="bg-linear-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white mb-6 flex items-center justify-between shadow-lg shadow-emerald-950/40">
              <div>
                <p className="text-xs text-emerald-100 uppercase tracking-wider font-bold mb-0.5">Total Tagihan</p>
                <p className="text-3xl font-black">
                  Rp {selectedPayment.amount.toLocaleString('id-ID')}
                </p>
              </div>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
                1 Pertandingan
              </span>
            </div>

            {/* STEP 1: Choose Payment Method & View Destination */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">1</span>
                <h4 className="font-bold text-white text-sm">Pilih Metode & Lakukan Pembayaran</h4>
              </div>

              <div className={`grid gap-3 ${qrisImageUrl ? 'grid-cols-3' : 'grid-cols-2'} mb-4`}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3.5 border-2 rounded-xl transition-all text-left ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                      : 'border-white/10 hover:border-white/20 bg-zinc-800'
                  }`}
                >
                  <Building2
                    className={`w-6 h-6 mb-2 ${
                      paymentMethod === 'bank_transfer' ? 'text-emerald-400' : 'text-zinc-400'
                    }`}
                  />
                  <p className={`font-bold text-xs ${
                    paymentMethod === 'bank_transfer' ? 'text-emerald-300' : 'text-zinc-200'
                  }`}>
                    Transfer Bank
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">BCA / Mandiri / E-Wallet</p>
                </button>

                {qrisImageUrl && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3.5 border-2 rounded-xl transition-all text-left ${
                      paymentMethod === 'qris'
                        ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                        : 'border-white/10 hover:border-white/20 bg-zinc-800'
                    }`}
                  >
                    <QrCode
                      className={`w-6 h-6 mb-2 ${
                        paymentMethod === 'qris' ? 'text-purple-400' : 'text-zinc-400'
                      }`}
                    />
                    <p className={`font-bold text-xs ${
                      paymentMethod === 'qris' ? 'text-purple-300' : 'text-zinc-200'
                    }`}>
                      QRIS DLBC
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Scan kode QR</p>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3.5 border-2 rounded-xl transition-all text-left ${
                    paymentMethod === 'cash'
                      ? 'border-teal-500 bg-teal-500/10 shadow-sm'
                      : 'border-white/10 hover:border-white/20 bg-zinc-800'
                  }`}
                >
                  <CreditCard
                    className={`w-6 h-6 mb-2 ${
                      paymentMethod === 'cash' ? 'text-teal-400' : 'text-zinc-400'
                    }`}
                  />
                  <p className={`font-bold text-xs ${
                    paymentMethod === 'cash' ? 'text-teal-300' : 'text-zinc-200'
                  }`}>
                    Tunai (Cash)
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Bayar di lapangan</p>
                </button>
              </div>

              {/* Payment Destination Details Box */}
              {paymentMethod === 'bank_transfer' && (
                <div className="bg-zinc-800/80 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 pb-2 border-b border-white/5">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Tujuan Rekening Resmi DLBC Cikupa
                    </span>
                    {bankInfo?.holderName && (
                      <span className="text-[11px] text-zinc-400">
                        a.n. <strong className="text-white">{bankInfo.holderName}</strong>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(bankInfo?.banks || []).filter((b) => b.number).map((acct) => (
                      <div
                        key={acct.name}
                        className="bg-zinc-900 border border-white/10 rounded-lg p-2.5 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase">{acct.name}</p>
                          <p className="font-mono font-bold text-white text-xs mt-0.5">{acct.number}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(acct.number)}
                          className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-emerald-400 transition-colors"
                          title="Salin nomor rekening"
                        >
                          {copiedAccount === acct.number ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                    {(bankInfo?.ewallets || []).filter((e) => e.number).map((acct) => (
                      <div
                        key={acct.name}
                        className="bg-zinc-900 border border-white/10 rounded-lg p-2.5 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-[10px] font-bold text-emerald-400 uppercase">{acct.name}</p>
                          <p className="font-mono font-bold text-white text-xs mt-0.5">{acct.number}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(acct.number)}
                          className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-emerald-400 transition-colors"
                          title="Salin nomor e-wallet"
                        >
                          {copiedAccount === acct.number ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {paymentMethod === 'qris' && qrisImageUrl && (
                <div className="bg-zinc-800/80 border border-purple-500/30 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <QrCode className="w-4 h-4 text-purple-400" />
                    <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                      QRIS Resmi Cabang DLBC Cikupa
                    </p>
                  </div>
                  <div className="relative w-56 h-56 mx-auto rounded-xl overflow-hidden border-2 border-white/20 bg-white p-2 mb-2">
                    <Image
                      src={qrisImageUrl}
                      alt="QRIS DLBC Cikupa"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Scan via BCA Mobile, Mandiri Livin, GoPay, OVO, ShopeePay, atau DANA. Masukkan nominal tagihan tepat: <strong className="text-emerald-400 font-mono">Rp {selectedPayment.amount.toLocaleString('id-ID')}</strong>
                  </p>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="bg-zinc-800/80 border border-teal-500/30 rounded-xl p-4">
                  <p className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-1">
                    Pembayaran Tunai di Lapangan
                  </p>
                  <p className="text-xs text-zinc-300">
                    Silakan serahkan uang tunai sebesar{' '}
                    <strong className="text-teal-400">
                      Rp {selectedPayment.amount.toLocaleString('id-ID')}
                    </strong>{' '}
                    langsung kepada pengurus/koordinator DLBC di lapangan.
                  </p>
                </div>
              )}
            </div>

            {/* STEP 2: Upload Proof After Payment */}
            <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
                <h4 className="font-bold text-white text-sm">
                  {paymentMethod === 'cash' ? 'Konfirmasi Pembayaran Cash' : 'Upload Bukti Pembayaran'}
                </h4>
              </div>

              {paymentMethod !== 'cash' ? (
                <div>
                  <p className="text-xs text-zinc-400 mb-2.5">
                    Setelah berhasil melakukan transfer atau scan QRIS, unggah screenshot / foto bukti pembayaran Anda:
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    required
                    className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer text-xs"
                  />
                </div>
              ) : (
                <p className="text-xs text-zinc-400">
                  Klik tombol konfirmasi di bawah ini untuk mencatat pembayaran tunai Anda.
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading || (paymentMethod !== 'cash' && !proofFile)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-emerald-600/20"
                >
                  {uploading ? 'Mengunggah...' : paymentMethod === 'cash' ? 'Konfirmasi Bayar Cash' : 'Kirim Bukti Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Pembayaran Sekaligus (Bulk)
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {selectedPayments.length} tagihan dipilih di cabang DLBC Cikupa
                </p>
              </div>
              <button
                onClick={() => setShowBulkUploadModal(false)}
                className="text-zinc-400 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Items Breakdown */}
            <div className="bg-zinc-800/60 rounded-xl p-4 mb-4 divide-y divide-white/5 max-h-40 overflow-y-auto">
              {selectedPayments.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 text-xs">
                  <span className="text-zinc-300 font-medium">{p.label}</span>
                  <span className="font-mono font-bold text-white">
                    Rp {p.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-linear-to-r from-emerald-600 to-teal-600 rounded-xl p-5 text-white mb-6 flex items-center justify-between shadow-lg shadow-emerald-950/40">
              <div>
                <p className="text-xs text-emerald-100 uppercase tracking-wider font-bold mb-0.5">Total Transfer Sekaligus</p>
                <p className="text-3xl font-black">
                  Rp {selectedPayments.reduce((s, p) => s + p.amount, 0).toLocaleString('id-ID')}
                </p>
              </div>
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
                {selectedPayments.length} Tagihan
              </span>
            </div>

            {/* STEP 1: Payment Method Selection */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">1</span>
                <h4 className="font-bold text-white text-xs">Pilih Opsi Pembayaran</h4>
              </div>

              <div className={`grid gap-3 ${qrisImageUrl ? 'grid-cols-2' : 'grid-cols-1'} mb-3`}>
                <button
                  type="button"
                  onClick={() => setBulkPaymentMethod('bank_transfer')}
                  className={`p-3 border-2 rounded-xl transition-all text-left flex items-center gap-3 ${
                    bulkPaymentMethod === 'bank_transfer'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                      : 'border-white/10 hover:border-white/20 bg-zinc-800'
                  }`}
                >
                  <Building2
                    className={`w-6 h-6 shrink-0 ${
                      bulkPaymentMethod === 'bank_transfer' ? 'text-emerald-400' : 'text-zinc-400'
                    }`}
                  />
                  <div>
                    <p className={`font-bold text-xs ${
                      bulkPaymentMethod === 'bank_transfer' ? 'text-emerald-300' : 'text-zinc-200'
                    }`}>
                      Transfer Bank
                    </p>
                    <p className="text-[10px] text-zinc-400">BCA, Mandiri, E-Wallet</p>
                  </div>
                </button>

                {qrisImageUrl && (
                  <button
                    type="button"
                    onClick={() => setBulkPaymentMethod('qris')}
                    className={`p-3 border-2 rounded-xl transition-all text-left flex items-center gap-3 ${
                      bulkPaymentMethod === 'qris'
                        ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                        : 'border-white/10 hover:border-white/20 bg-zinc-800'
                    }`}
                  >
                    <QrCode
                      className={`w-6 h-6 shrink-0 ${
                        bulkPaymentMethod === 'qris' ? 'text-purple-400' : 'text-zinc-400'
                      }`}
                    />
                    <div>
                      <p className={`font-bold text-xs ${
                        bulkPaymentMethod === 'qris' ? 'text-purple-300' : 'text-zinc-200'
                      }`}>
                        QRIS DLBC
                      </p>
                      <p className="text-[10px] text-zinc-400">Scan 1x untuk total transfer</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Destination Accounts / QRIS */}
              {bulkPaymentMethod === 'bank_transfer' && bankInfo && ((bankInfo.banks || []).some((b) => b.number) || (bankInfo.ewallets || []).some((e) => e.number)) && (
                <div className="bg-zinc-800/80 border border-emerald-500/30 rounded-xl p-3.5 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      Rekening Resmi DLBC Cikupa
                    </span>
                    {bankInfo.holderName && (
                      <span className="text-[10px] text-zinc-400">
                        a.n. <strong className="text-white">{bankInfo.holderName}</strong>
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(bankInfo.banks || []).filter((b) => b.number).map((b, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-white/10 text-xs text-white"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase text-emerald-400">{b.name}</span>
                          <p className="font-mono font-bold">{b.number}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(b.number)}
                          className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-emerald-400"
                          title="Salin"
                        >
                          {copiedAccount === b.number ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                    {(bankInfo.ewallets || []).filter((e) => e.number).map((e, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-white/10 text-xs text-white"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase text-emerald-400">{e.name}</span>
                          <p className="font-mono font-bold">{e.number}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(e.number)}
                          className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-emerald-400"
                          title="Salin"
                        >
                          {copiedAccount === e.number ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bulkPaymentMethod === 'qris' && qrisImageUrl && (
                <div className="bg-zinc-800/80 border border-purple-500/30 rounded-xl p-4 mb-4 text-center">
                  <p className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                    Scan QRIS Resmi DLBC
                  </p>
                  <div className="relative w-52 h-52 mx-auto rounded-xl overflow-hidden border-2 border-white/20 bg-white p-2 mb-2">
                    <Image
                      src={qrisImageUrl}
                      alt="QRIS DLBC Cikupa"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Scan via mobile banking / e-wallet dan masukkan nominal tepat: <strong className="text-emerald-400 font-mono">Rp {selectedPayments.reduce((s, p) => s + p.amount, 0).toLocaleString('id-ID')}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* STEP 2: Proof Upload */}
            <form onSubmit={handleSubmitBulkPayment} className="space-y-4 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
                <h4 className="font-bold text-white text-xs">Upload Bukti Transfer Sekaligus</h4>
              </div>
              <p className="text-xs text-zinc-400 mb-2">
                Setelah transfer/scan QRIS selesai, unggah 1 foto bukti transfer untuk seluruh {selectedPayments.length} tagihan:
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBulkProofFile(e.target.files?.[0] || null)}
                required
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer text-xs"
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkUploadModal(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bulkUploading || !bulkProofFile}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-emerald-600/20"
                >
                  {bulkUploading ? 'Mengunggah...' : 'Upload Bukti Sekaligus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Help Modal */}
      {showStatusHelpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-800 border-b border-zinc-500/30 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Info className="w-7 h-7 text-emerald-400" />
                  Status Pembayaran DLBC
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
                Berikut adalah penjelasan 5 status pembayaran yang berlaku di sistem DLBC:
              </p>

              {/* Belum Dibayar */}
              <div className="border border-red-500/30 rounded-lg p-4 bg-red-500/10">
                <div className="flex items-start gap-3 mb-2">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white">Belum Dibayar</h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      Tagihan masih belum dibayar. Klik tombol <strong>Bayar</strong> atau gunakan fitur centang untuk transfer sekaligus.
                    </p>
                  </div>
                </div>
              </div>

              {/* Menunggu Konfirmasi */}
              <div className="border border-yellow-500/30 rounded-lg p-4 bg-yellow-500/10">
                <div className="flex items-start gap-3 mb-2">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white">Menunggu Verifikasi</h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      Bukti pembayaran sudah diunggah dan sedang dalam proses verifikasi oleh admin cabang DLBC Cikupa.
                    </p>
                  </div>
                </div>
              </div>

              {/* Lunas */}
              <div className="border border-green-500/30 rounded-lg p-4 bg-green-500/10">
                <div className="flex items-start gap-3 mb-2">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white">Lunas</h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      Pembayaran telah diverifikasi oleh admin. Anda dapat mengunduh struk PDF resmi sebagai bukti.
                    </p>
                  </div>
                </div>
              </div>

              {/* Ditolak */}
              <div className="border border-red-600/30 rounded-lg p-4 bg-red-600/10">
                <div className="flex items-start gap-3 mb-2">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                    <X className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white">Ditolak</h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      Bukti transfer ditolak admin (misal bukti tidak terbaca atau nominal kurang). Silakan klik Upload Ulang.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowStatusHelpModal(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Fee Info Modal */}
      {showAttendanceInfoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Status Biaya Kehadiran DLBC</h3>
              </div>
              <button
                onClick={() => setShowAttendanceInfoModal(false)}
                className="p-1 hover:bg-zinc-800 rounded transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Biaya kehadiran dibayar <span className="text-white font-semibold">sekali per hari kehadiran</span> di DLBC Cikupa:
              </p>

              <div className="space-y-3">
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-white/5">
                  <span className="text-white font-mono font-semibold">Biaya Kehadiran Sesi</span>
                  <p className="text-xs text-zinc-400 mt-1">
                    Dikenakan pada sesi pertama Anda di hari pertandingan tersebut.
                  </p>
                </div>

                <div className="bg-zinc-800/50 rounded-lg p-3 border border-white/5">
                  <span className="text-zinc-500 font-mono font-semibold text-lg">- (dash)</span>
                  <p className="text-xs text-zinc-400 mt-1">
                    Anda sudah membayar biaya kehadiran di sesi lain pada hari yang sama.
                  </p>
                </div>


              </div>

              <button
                onClick={() => setShowAttendanceInfoModal(false)}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium mt-4"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Help Modal */}
      {showPaymentHelpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-emerald-400" />
                Panduan Pembayaran DLBC
              </h3>
              <button
                onClick={() => setShowPaymentHelpModal(false)}
                className="text-zinc-400 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-zinc-300">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-bold text-white mb-0.5">Cek Riwayat Tagihan Sesi</p>
                  <p className="text-xs text-zinc-400">
                    Periksa tagihan sesi yang berstatus <strong>Belum Bayar</strong> pada tabel di halaman ini.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-bold text-white mb-0.5">Pilih Cara Pembayaran</p>
                  <p className="text-xs text-zinc-400">
                    Anda dapat membayar satu pertandingan dengan tombol <strong>Bayar</strong>, atau centang beberapa sesi untuk <strong>Bayar Sekaligus</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-bold text-white mb-0.5">Transfer & Upload Bukti</p>
                  <p className="text-xs text-zinc-400">
                    Lakukan transfer ke rekening resmi atau scan QRIS DLBC Cikupa, lalu upload bukti transfer. Admin cabang akan memverifikasi pembayaran Anda.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <p className="font-bold text-white mb-0.5">Download Struk Pembayaran</p>
                  <p className="text-xs text-zinc-400">
                    Setelah berstatus Lunas, Anda dapat mendownload struk PDF per sesi atau struk gabungan lewat tombol <strong>Struk Pembayaran</strong> di pojok kanan atas.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPaymentHelpModal(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors text-sm mt-4"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QRIS Modal */}
      {showQrisModal && qrisImageUrl && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-sm w-full p-6 text-center">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                QRIS DLBC Cikupa
              </h3>
              <button
                onClick={() => setShowQrisModal(false)}
                className="text-zinc-400 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-64 h-64 mx-auto rounded-xl overflow-hidden border-2 border-white/20 bg-white p-2 mb-4">
              <Image
                src={qrisImageUrl}
                alt="QRIS DLBC Cikupa"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            <p className="text-xs text-zinc-400 mb-4">
              Scan melalui aplikasi mobile banking atau e-wallet apa saja (BCA, Mandiri, GoPay, OVO, ShopeePay, DANA).
            </p>

            <button
              onClick={() => setShowQrisModal(false)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* View Proof Image Modal */}
      {viewingProofUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-lg w-full p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Bukti Transfer</h3>
              <button
                onClick={() => setViewingProofUrl(null)}
                className="text-zinc-400 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full h-80 rounded-xl overflow-hidden bg-black/40 mb-4">
              <Image
                src={viewingProofUrl}
                alt="Bukti Transfer"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            <div className="flex justify-end gap-2">
              <a
                href={viewingProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-block"
              >
                Buka di Tab Baru
              </a>
              <button
                onClick={() => setViewingProofUrl(null)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
