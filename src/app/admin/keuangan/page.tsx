'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, Plus, Edit2, Trash2, X, Save, Calendar, ChevronLeft, ChevronRight, HelpCircle, Download } from 'lucide-react';
import TutorialOverlay from '@/components/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { getTutorialSteps } from '@/lib/tutorialSteps';

interface Pengeluaran {
  id: string;
  category: 'court_rent' | 'shuttlecock' | 'others';
  nama: string;
  jumlah: number;
  tanggal: string;
  catatan: string | null;
  created_at: string;
}

interface MonthlySummary {
  total_pendapatan: number;
  total_pengeluaran: number;
  keuntungan: number;
  pengeluaran_sewa: number;
  pengeluaran_shuttlecock: number;
  pengeluaran_lainnya: number;
}

export default function KeuanganPage() {
  const tutorialSteps = getTutorialSteps('keuangan');
  const { isActive: isTutorialActive, closeTutorial, toggleTutorial } = useTutorial('admin-keuangan', tutorialSteps);
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
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

  useEffect(() => {
    fetchData(selectedMonth);
  }, [selectedMonth]);

  const fetchData = async (targetDate: Date) => {
    try {
      setLoading(true);

      // Get monthly summary using RPC function
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_monthly_keuangan', { target_month: targetDate.toISOString().split('T')[0] });

      if (summaryError) {
        console.error('Error fetching summary:', JSON.stringify(summaryError, null, 2));
        
        // Check if function doesn't exist
        const errorMsg = summaryError.message || summaryError.toString() || '';
        const errorCode = (summaryError as any).code;
        
        if (errorMsg.includes('function') || errorMsg.includes('does not exist') || errorCode === '42883' || errorCode === 'PGRST202') {
          alert('⚠️ Database Setup Required\n\nFunction "get_monthly_keuangan" tidak ditemukan.\n\n📝 Cara fix:\n1. Buka Supabase Dashboard\n2. SQL Editor → New Query\n3. Copy paste dari: supabase-keuangan.sql\n4. Run\n5. Refresh halaman ini');
          setLoading(false);
          return;
        }
        throw summaryError;
      }
      
      if (summaryData && summaryData.length > 0) {
        setSummary(summaryData[0]);
      }

      // Get all expenses for selected month
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const { data: pengeluaranData, error: pengeluaranError } = await supabase
        .from('pengeluaran')
        .select('*')
        .gte('tanggal', monthStart.toISOString().split('T')[0])
        .lte('tanggal', monthEnd.toISOString().split('T')[0])
        .order('tanggal', { ascending: false });

      if (pengeluaranError) {
        console.error('Error fetching expenses:', JSON.stringify(pengeluaranError, null, 2));
        
        // Check if table doesn't exist
        const errorMsg = pengeluaranError.message || pengeluaranError.toString() || '';
        const errorCode = (pengeluaranError as any).code;
        
        if (errorMsg.includes('relation') || errorMsg.includes('does not exist') || errorCode === '42P01' || errorCode === 'PGRST116') {
          alert('⚠️ Database Setup Required\n\nTable "pengeluaran" tidak ditemukan.\n\n📝 Cara fix:\n1. Buka Supabase Dashboard\n2. SQL Editor → New Query\n3. Copy paste dari: supabase-keuangan.sql\n4. Run\n5. Refresh halaman ini');
          setLoading(false);
          return;
        }
        throw pengeluaranError;
      }
      
      setPengeluaranList(pengeluaranData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      alert('❌ Error loading data:\n\n' + errorMessage + '\n\nCheck console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const pengeluaranData = {
        category: formData.category,
        nama: formData.nama,
        jumlah: parseFloat(formData.jumlah),
        tanggal: formData.tanggal,
        catatan: formData.catatan || null,
        created_by: user.id
      };

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('pengeluaran')
          .update({ ...pengeluaranData, updated_at: new Date().toISOString() })
          .eq('id', editingId);

        if (error) throw error;
        alert('Pengeluaran berhasil diperbarui');
      } else {
        // Create new
        const { error } = await supabase
          .from('pengeluaran')
          .insert(pengeluaranData);

        if (error) throw error;
        alert('Pengeluaran berhasil ditambahkan');
      }

      // Reset form and refresh
      setFormData({
        category: 'court_rent',
        nama: '',
        jumlah: '',
        tanggal: new Date().toISOString().split('T')[0],
        catatan: ''
      });
      setEditingId(null);
      setShowAddModal(false);
      fetchData(selectedMonth);

    } catch (error) {
      console.error('Error saving:', error);
      alert('Error: ' + (error as Error).message);
    }
  };

  const handleEdit = (item: Pengeluaran) => {
    setFormData({
      category: item.category,
      nama: item.nama,
      jumlah: item.jumlah.toString(),
      tanggal: item.tanggal,
      catatan: item.catatan || ''
    });
    setEditingId(item.id);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return;

    try {
      const { error } = await supabase
        .from('pengeluaran')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Pengeluaran berhasil dihapus');
      fetchData(selectedMonth);
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error: ' + (error as Error).message);
    }
  };

  const handleExportCSV = () => {
    if (pengeluaranList.length === 0) {
      alert('Tidak ada data pengeluaran untuk diekspor.');
      return;
    }

    const monthStr = selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const headers = ['Tanggal', 'Kategori', 'Nama Pengeluaran', 'Catatan', 'Jumlah (IDR)'];
    const rows = pengeluaranList.map(item => [
      item.tanggal,
      categories.find(c => c.value === item.category)?.label || item.category,
      `"${item.nama.replace(/"/g, '""')}"`,
      `"${(item.catatan || '').replace(/"/g, '""')}"`,
      item.jumlah,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pengeluaran_${selectedMonth.getFullYear()}_${selectedMonth.getMonth() + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-700 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Keuangan & Pembukuan</h1>
            <div className="flex items-center gap-3 mt-2">
              {/* Month Navigator */}
              <div className="keuangan-month-navigator flex items-center bg-zinc-900/60 border border-white/10 rounded-xl p-1 backdrop-blur-md">
                <button
                  onClick={() => {
                    const prevMonth = new Date(selectedMonth);
                    prevMonth.setMonth(prevMonth.getMonth() - 1);
                    setSelectedMonth(prevMonth);
                  }}
                  className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-xs font-semibold text-white px-3 min-w-32 text-center">
                  {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
                
                <button
                  onClick={() => {
                    const nextMonth = new Date(selectedMonth);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    setSelectedMonth(nextMonth);
                  }}
                  className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Bulan berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Current Month Button */}
              {(selectedMonth.getMonth() !== new Date().getMonth() || 
                selectedMonth.getFullYear() !== new Date().getFullYear()) && (
                <button
                  onClick={() => setSelectedMonth(new Date())}
                  className="px-2.5 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl transition-colors font-medium border border-white/10 cursor-pointer"
                >
                  Bulan Ini
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-zinc-900/60 hover:bg-white/5 border border-white/10 text-zinc-300 hover:text-white text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Ekspor CSV Data Pengeluaran"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={toggleTutorial}
              className="p-2 rounded-xl bg-zinc-900/60 hover:bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Tampilkan panduan fitur"
            >
              <HelpCircle className="w-4 h-4" />
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
              className="keuangan-add-button px-4 py-2 bg-white text-zinc-900 rounded-xl hover:bg-zinc-200 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Pengeluaran</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pendapatan */}
          <div className="keuangan-card-pendapatan bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400 mb-1">Total Pendapatan</p>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {formatCurrency(summary?.total_pendapatan || 0)}
                </p>
              </div>
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-3">Dari pembayaran terkonfirmasi</p>
          </div>

          {/* Pengeluaran */}
          <div className="keuangan-card-pengeluaran bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400 mb-1">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-white tracking-tight">
                  {formatCurrency(summary?.total_pengeluaran || 0)}
                </p>
              </div>
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <TrendingDown className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div className="flex gap-2 mt-3 text-[11px] text-zinc-400">
              <span>Sewa: {formatCurrency(summary?.pengeluaran_sewa || 0)}</span>
              <span>•</span>
              <span>Shuttle: {formatCurrency(summary?.pengeluaran_shuttlecock || 0)}</span>
            </div>
          </div>

          {/* Keuntungan */}
          <div className="keuangan-card-keuntungan bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400 mb-1">Margin / Laba Bersih</p>
                <p className={`text-2xl font-bold tracking-tight ${(summary?.keuntungan || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(summary?.keuntungan || 0)}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                (summary?.keuntungan || 0) >= 0 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-3">
              {summary && summary.total_pendapatan > 0
                ? `${((summary.keuntungan / summary.total_pendapatan) * 100).toFixed(1)}% margin`
                : 'Belum ada data'}
            </p>
          </div>
        </div>

        {/* Pengeluaran List Table */}
        <div className="keuangan-expense-table bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Rincian Pengeluaran</h2>
            <span className="text-xs text-zinc-400">{pengeluaranList.length} transaksi</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-160">
              <thead className="bg-zinc-900/90 border-b border-white/10 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-6 py-3.5">Tanggal</th>
                  <th className="text-left px-6 py-3.5">Kategori</th>
                  <th className="text-left px-6 py-3.5">Nama Pengeluaran</th>
                  <th className="text-right px-6 py-3.5">Jumlah</th>
                  <th className="text-center px-6 py-3.5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pengeluaranList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                      Belum ada pengeluaran bulan ini
                    </td>
                  </tr>
                ) : (
                  pengeluaranList.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-zinc-300">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          item.category === 'court_rent' 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : item.category === 'shuttlecock'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-zinc-800 text-zinc-300 border-white/10'
                        }`}>
                          {categories.find(c => c.value === item.category)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {item.nama}
                        {item.catatan && (
                          <p className="text-xs text-zinc-400 mt-0.5">{item.catatan}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-white text-right font-semibold font-mono">
                        {formatCurrency(item.jumlah)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 hover:bg-rose-500/10 rounded-lg text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">
                {editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                }}
                className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Nama Pengeluaran
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Sewa Lapangan Februari"
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
                  required
                />
              </div>

              {/* Jumlah */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Jumlah (IDR)
                </label>
                <input
                  type="number"
                  value={formData.jumlah}
                  onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
                  required
                />
                {formData.jumlah && (
                  <p className="text-xs text-zinc-400 mt-1 font-mono">
                    {formatCurrency(parseFloat(formData.jumlah))}
                  </p>
                )}
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-white text-sm focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
                  required
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Catatan tambahan..."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-hidden focus:ring-1 focus:ring-zinc-400 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2 border-t border-white/10 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-zinc-700 hover:bg-zinc-600 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingId ? 'Perbarui' : 'Simpan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      <TutorialOverlay
        steps={tutorialSteps}
        isActive={isTutorialActive}
        onClose={closeTutorial}
        tutorialKey="admin-keuangan"
      />
      </div>
    </div>
  );
}
