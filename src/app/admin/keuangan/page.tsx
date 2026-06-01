'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, TrendingDown, DollarSign, Plus, Edit2, Trash2, X, Save, Calendar, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 px-4 lg:px-8 py-6 lg:py-8 transition-colors duration-300">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors duration-300">Keuangan Komunitas</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {/* Month Navigator */}
              <div className="keuangan-month-navigator flex items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800/80 rounded-xl px-2 py-1 shadow-2xs">
                <button
                  onClick={() => {
                    const prevMonth = new Date(selectedMonth);
                    prevMonth.setMonth(prevMonth.getMonth() - 1);
                    setSelectedMonth(prevMonth);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-850 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors"
                  title="Bulan sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 min-w-32 text-center select-none uppercase tracking-wider">
                  {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
                
                <button
                  onClick={() => {
                    const nextMonth = new Date(selectedMonth);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    setSelectedMonth(nextMonth);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-850 rounded-lg text-gray-500 dark:text-zinc-400 transition-colors"
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
                  className="px-3 py-1.5 text-[10px] bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-850 text-gray-700 dark:text-zinc-300 rounded-xl transition-colors font-extrabold uppercase tracking-wider border border-gray-200 dark:border-zinc-800/80 shadow-2xs"
                >
                  Bulan Ini
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTutorial}
              className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-500 transition-colors"
              title="Tampilkan panduan fitur"
            >
              <HelpCircle className="w-5 h-5" />
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
              className="keuangan-add-button px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors font-black uppercase tracking-wider text-xs flex items-center gap-1.5 shadow-xs border border-transparent"
            >
              <Plus className="w-4 h-4" />
              Tambah Transaksi
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pendapatan */}
          <div className="keuangan-card-pendapatan bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-2xs hover:shadow-xs transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Total Pendapatan</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {formatCurrency(summary?.total_pendapatan || 0)}
                </p>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 mt-4 uppercase tracking-wider">Dari iuran & uang kok anggota</p>
          </div>

          {/* Pengeluaran */}
          <div className="keuangan-card-pengeluaran bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-2xs hover:shadow-xs transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Total Pengeluaran</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {formatCurrency(summary?.total_pengeluaran || 0)}
                </p>
              </div>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
                <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            <div className="flex gap-2 mt-4 text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-zinc-500">
              <span>Sewa: {formatCurrency(summary?.pengeluaran_sewa || 0)}</span>
              <span>•</span>
              <span>Kok: {formatCurrency(summary?.pengeluaran_shuttlecock || 0)}</span>
            </div>
          </div>

          {/* Keuntungan */}
          <div className="keuangan-card-keuntungan bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-2xs hover:shadow-xs transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1 font-bold">Saldo / Keuntungan</p>
                <p className={`text-2xl font-black tracking-tight ${(summary?.keuntungan || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'}`}>
                  {formatCurrency(summary?.keuntungan || 0)}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${(summary?.keuntungan || 0) >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}`}>
                <DollarSign className={`w-5 h-5 ${(summary?.keuntungan || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'}`} />
              </div>
            </div>
            <p className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 mt-4 uppercase tracking-wider">
              {summary && summary.total_pendapatan > 0
                ? `${((summary.keuntungan / summary.total_pendapatan) * 100).toFixed(1)}% margin operasional`
                : 'Belum ada data bulanan'}
            </p>
          </div>
        </div>

        {/* Pengeluaran List */}
        <div className="keuangan-expense-table bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xs transition-colors duration-300">
          <div className="p-5 border-b border-gray-150 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">Rincian Pengeluaran Bulanan</h2>
            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
              {pengeluaranList.length} Transaksi
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-150 dark:border-zinc-800">
                  <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 dark:text-zinc-400 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 dark:text-zinc-400 uppercase tracking-wider">Kategori</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 dark:text-zinc-400 uppercase tracking-wider">Nama Transaksi</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 dark:text-zinc-400 uppercase tracking-wider text-right">Jumlah</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-gray-400 dark:text-zinc-400 uppercase tracking-wider text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-zinc-800">
                {pengeluaranList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">
                      Belum ada transaksi pengeluaran tercatat
                    </td>
                  </tr>
                ) : (
                  pengeluaranList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-zinc-850/20 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-gray-700 dark:text-zinc-350">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                          item.category === 'court_rent' 
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'
                            : item.category === 'shuttlecock'
                            ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }`}>
                          {categories.find(c => c.value === item.category)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-extrabold text-gray-900 dark:text-white">{item.nama}</div>
                        {item.catatan && (
                          <div className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 leading-relaxed font-semibold">{item.catatan}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-900 dark:text-white text-right font-black">
                        {formatCurrency(item.jumlah)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 hover:bg-gray-250 dark:hover:bg-zinc-800 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 hover:bg-gray-250 dark:hover:bg-zinc-800 rounded-lg text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl transition-colors duration-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                {editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                }}
                className="p-1 hover:bg-gray-105 dark:hover:bg-zinc-850 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-zinc-450 mb-1.5 uppercase tracking-wider">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-250 dark:border-zinc-800 rounded-xl text-xs text-gray-950 dark:text-white font-semibold focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value} className="bg-white dark:bg-zinc-900">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-zinc-450 mb-1.5 uppercase tracking-wider">
                  Nama Pengeluaran
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Sewa Lapangan Lapangan 3"
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-250 dark:border-zinc-800 rounded-xl text-xs text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 font-semibold focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>

              {/* Jumlah */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-zinc-450 mb-1.5 uppercase tracking-wider">
                  Jumlah (IDR)
                </label>
                <input
                  type="number"
                  value={formData.jumlah}
                  onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="1000"
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-250 dark:border-zinc-800 rounded-xl text-xs text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 font-semibold focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  required
                />
                {formData.jumlah && (
                  <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 uppercase tracking-wider">
                    {formatCurrency(parseFloat(formData.jumlah))}
                  </p>
                )}
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-zinc-450 mb-1.5 uppercase tracking-wider">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-250 dark:border-zinc-800 rounded-xl text-xs text-gray-950 dark:text-white font-semibold focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-zinc-450 mb-1.5 uppercase tracking-wider">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Keterangan tambahan..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-zinc-800/40 border border-gray-250 dark:border-zinc-800 rounded-xl text-xs text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 font-semibold focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-zinc-850 hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-black uppercase tracking-wider rounded-xl transition-colors border border-gray-200 dark:border-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  {editingId ? 'Simpan' : 'Tambah'}
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
