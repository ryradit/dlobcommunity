'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  TrendingUp, TrendingDown, DollarSign, Plus, Edit2, Trash2, X, Save, 
  Calendar, ChevronLeft, ChevronRight, Download, Loader2, AlertCircle
} from 'lucide-react';
import BranchBadge from '@/components/BranchBadge';

const BRANCH_ID = 'dlob-cikupa';
const ACCENT = '#10B981';

interface Pengeluaran {
  id: string;
  category: 'court_rent' | 'shuttlecock' | 'others';
  nama: string;
  jumlah: number;
  tanggal: string;
  catatan: string | null;
  created_at: string;
  branch_id?: string;
}

interface MonthlySummary {
  total_pendapatan: number;
  total_pengeluaran: number;
  keuntungan: number;
  pengeluaran_sewa: number;
  pengeluaran_shuttlecock: number;
  pengeluaran_lainnya: number;
}

export default function CikupaAdminKeuanganPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category: 'court_rent' as 'court_rent' | 'shuttlecock' | 'others',
    nama: '',
    jumlah: '',
    tanggal: new Date().toISOString().split('T')[0],
    catatan: ''
  });

  const categories = [
    { value: 'court_rent', label: 'Sewa Lapangan' },
    { value: 'shuttlecock', label: 'Shuttlecock' },
    { value: 'others', label: 'Lainnya' }
  ];

  const fetchData = useCallback(async (targetDate: Date) => {
    try {
      setLoading(true);
      const targetMonthStr = targetDate.toISOString().split('T')[0];
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString().split('T')[0];

      // Try RPC get_monthly_keuangan_by_branch first
      let summaryResult: MonthlySummary | null = null;
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_monthly_keuangan_by_branch', {
          target_month: targetMonthStr,
          p_branch_id: BRANCH_ID,
        });

      if (!rpcError && rpcData && rpcData.length > 0) {
        summaryResult = rpcData[0];
      } else {
        // Fallback: Compute directly from tables for DLBC
        const [matchRes, memRes, expRes] = await Promise.all([
          supabase
            .from('match_members')
            .select('total_amount, paid_at')
            .eq('branch_id', BRANCH_ID)
            .eq('payment_status', 'paid')
            .gte('paid_at', `${monthStart}T00:00:00Z`)
            .lte('paid_at', `${monthEnd}T23:59:59Z`),
          supabase
            .from('memberships')
            .select('amount, paid_at')
            .eq('branch_id', BRANCH_ID)
            .eq('payment_status', 'paid')
            .gte('paid_at', `${monthStart}T00:00:00Z`)
            .lte('paid_at', `${monthEnd}T23:59:59Z`),
          supabase
            .from('pengeluaran')
            .select('category, jumlah')
            .eq('branch_id', BRANCH_ID)
            .gte('tanggal', monthStart)
            .lte('tanggal', monthEnd),
        ]);

        const pendapatanMatches = (matchRes.data || []).reduce((s, r) => s + (r.total_amount || 0), 0);
        const pendapatanMemberships = (memRes.data || []).reduce((s, r) => s + (r.amount || 0), 0);
        const totalPendapatan = pendapatanMatches + pendapatanMemberships;

        let sewa = 0;
        let kok = 0;
        let lainnya = 0;

        (expRes.data || []).forEach(e => {
          const val = Number(e.jumlah) || 0;
          if (e.category === 'court_rent') sewa += val;
          else if (e.category === 'shuttlecock') kok += val;
          else lainnya += val;
        });

        const totalExp = sewa + kok + lainnya;
        summaryResult = {
          total_pendapatan: totalPendapatan,
          total_pengeluaran: totalExp,
          keuntungan: totalPendapatan - totalExp,
          pengeluaran_sewa: sewa,
          pengeluaran_shuttlecock: kok,
          pengeluaran_lainnya: lainnya,
        };
      }

      setSummary(summaryResult);

      // Fetch pengeluaran entries for DLBC
      const { data: expList, error: expListError } = await supabase
        .from('pengeluaran')
        .select('*')
        .eq('branch_id', BRANCH_ID)
        .gte('tanggal', monthStart)
        .lte('tanggal', monthEnd)
        .order('tanggal', { ascending: false });

      if (!expListError && expList) {
        setPengeluaranList(expList as Pengeluaran[]);
      } else {
        setPengeluaranList([]);
      }
    } catch (err) {
      console.error('Error fetching DLBC keuangan:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedMonth);
  }, [selectedMonth, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.jumlah || !formData.tanggal) {
      alert('Nama, jumlah, dan tanggal wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const amount = parseFloat(formData.jumlah.replace(/[^0-9]/g, ''));

      if (editingId) {
        const { error } = await supabase
          .from('pengeluaran')
          .update({
            category: formData.category,
            nama: formData.nama,
            jumlah: amount,
            tanggal: formData.tanggal,
            catatan: formData.catatan || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pengeluaran')
          .insert({
            category: formData.category,
            nama: formData.nama,
            jumlah: amount,
            tanggal: formData.tanggal,
            catatan: formData.catatan || null,
            created_by: user?.id,
            branch_id: BRANCH_ID,
          });

        if (error) throw error;
      }

      setShowAddModal(false);
      setEditingId(null);
      setFormData({
        category: 'court_rent',
        nama: '',
        jumlah: '',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: ''
      });

      fetchData(selectedMonth);
    } catch (err: any) {
      alert(`Gagal menyimpan pengeluaran: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (p: Pengeluaran) => {
    setEditingId(p.id);
    setFormData({
      category: p.category,
      nama: p.nama,
      jumlah: String(p.jumlah),
      tanggal: p.tanggal,
      catatan: p.catatan || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) return;
    try {
      const { error } = await supabase
        .from('pengeluaran')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData(selectedMonth);
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const exportCSV = () => {
    if (pengeluaranList.length === 0) {
      alert('Tidak ada data pengeluaran untuk diexport');
      return;
    }

    const headers = ['Tanggal', 'Kategori', 'Nama/Deskripsi', 'Jumlah (Rp)', 'Catatan'];
    const rows = pengeluaranList.map(p => [
      p.tanggal,
      categories.find(c => c.value === p.category)?.label || p.category,
      `"${p.nama.replace(/"/g, '""')}"`,
      p.jumlah,
      `"${(p.catatan || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pengeluaran_dlbc_${selectedMonth.toISOString().slice(0,7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-6 h-6" style={{ color: ACCENT }} />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Laporan Keuangan DLBC</h1>
            <BranchBadge size="sm" />
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400">
            Kelola pengeluaran operasional (OPEX), hitung laba bersih, dan pantau arus kas cabang Cikupa
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                category: 'court_rent',
                nama: '',
                jumlah: '',
                tanggal: new Date().toISOString().split('T')[0],
                catatan: ''
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: ACCENT }}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-white/10">
        <button
          onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Bulan Sebelumnya</span>
        </button>
        <span className="text-sm font-black text-gray-900 dark:text-white">
          {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <span>Bulan Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-2xl border bg-white dark:bg-zinc-900 border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Total Pendapatan</p>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            Rp {(summary?.total_pendapatan || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Sesi match & iuran member DLBC</p>
        </div>

        <div className="p-5 rounded-2xl border bg-white dark:bg-zinc-900 border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Total Pengeluaran (OPEX)</p>
          </div>
          <p className="text-2xl font-black text-red-500">
            Rp {(summary?.total_pengeluaran || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Sewa lapangan, kok, dll</p>
        </div>

        <div className="p-5 rounded-2xl border bg-white dark:bg-zinc-900 border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Laba Bersih (Profit)</p>
          </div>
          <p className={`text-2xl font-black ${(summary?.keuntungan || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            Rp {(summary?.keuntungan || 0).toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-400 mt-1">Pendapatan dikurangi OPEX</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-white/5">
          <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Sewa Lapangan</p>
          <p className="text-lg font-black text-gray-900 dark:text-white">
            Rp {(summary?.pengeluaran_sewa || 0).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-white/5">
          <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Shuttlecock</p>
          <p className="text-lg font-black text-gray-900 dark:text-white">
            Rp {(summary?.pengeluaran_shuttlecock || 0).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-white/5">
          <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Lain-lain</p>
          <p className="text-lg font-black text-gray-900 dark:text-white">
            Rp {(summary?.pengeluaran_lainnya || 0).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* List of Pengeluaran */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-gray-900 dark:text-white">Daftar Pengeluaran DLBC</h2>
          <span className="text-xs text-gray-400 font-semibold">{pengeluaranList.length} Catatan</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-2xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />)}
          </div>
        ) : pengeluaranList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">Belum ada pengeluaran dicatat untuk bulan ini</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-500"
            >
              + Catat Pengeluaran Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 text-gray-400">
                  <th className="pb-3 font-bold">Tanggal</th>
                  <th className="pb-3 font-bold">Kategori</th>
                  <th className="pb-3 font-bold">Deskripsi</th>
                  <th className="pb-3 font-bold">Catatan</th>
                  <th className="pb-3 font-bold text-right">Jumlah</th>
                  <th className="pb-3 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {pengeluaranList.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="py-3 font-medium text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        {categories.find(c => c.value === p.category)?.label || p.category}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-gray-900 dark:text-white">
                      {p.nama}
                    </td>
                    <td className="py-3 text-gray-500 dark:text-zinc-400 max-w-xs truncate">
                      {p.catatan || '—'}
                    </td>
                    <td className="py-3 font-black text-gray-900 dark:text-white text-right whitespace-nowrap">
                      Rp {Number(p.jumlah).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/10 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  {editingId ? 'Edit Pengeluaran DLBC' : 'Tambah Pengeluaran DLBC'}
                </h3>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setEditingId(null); }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Kategori Pengeluaran
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Nama / Keterangan Pengeluaran
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sewa Lapangan 3 Jam Gor ABC"
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    Jumlah (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 150000"
                    value={formData.jumlah}
                    onChange={e => setFormData({ ...formData, jumlah: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  placeholder="Catatan kwitansi atau detail lainnya..."
                  value={formData.catatan}
                  onChange={e => setFormData({ ...formData, catatan: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingId(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50"
                  style={{ backgroundColor: ACCENT }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
