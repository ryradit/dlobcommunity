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
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Keuangan</h1>
              <div className="flex items-center gap-3 mt-2">
                {/* Month Navigator */}
                <div className="keuangan-month-navigator flex items-center gap-2">
                  <button
                    onClick={() => {
                      const prevMonth = new Date(selectedMonth);
                      prevMonth.setMonth(prevMonth.getMonth() - 1);
                      setSelectedMonth(prevMonth);
                    }}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-300"
                    title="Bulan sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-zinc-400 transition-colors duration-300" />
                  </button>
                  
                  <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-35 text-center transition-colors duration-300">
                    {selectedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </span>
                  
                  <button
                    onClick={() => {
                      const nextMonth = new Date(selectedMonth);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      setSelectedMonth(nextMonth);
                    }}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-300"
                    title="Bulan berikutnya"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-zinc-400 transition-colors duration-300" />
                  </button>
                </div>

                {/* Current Month Button */}
                {(selectedMonth.getMonth() !== new Date().getMonth() || 
                  selectedMonth.getFullYear() !== new Date().getFullYear()) && (
                  <button
                    onClick={() => setSelectedMonth(new Date())}
                    className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-lg transition-colors duration-300 font-medium border border-gray-300 dark:border-white/10"
                  >
                    Bulan Ini
                  </button>
                )}
              </div>
            </div>
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
              className="keuangan-add-button px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-100 transition-colors duration-300 font-semibold flex items-center gap-2 border border-gray-900 dark:border-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Pengeluaran
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pendapatan */}
          <div className="keuangan-card-pendapatan bg-white dark:bg-zinc-900 border-2 border-green-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm transition-colors duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Pendapatan</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                  {formatCurrency(summary?.total_pendapatan || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-500/10 rounded-lg transition-colors duration-300">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-500 transition-colors duration-300" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 mt-4 transition-colors duration-300">Dari pembayaran terkonfirmasi</p>
          </div>

          {/* Pengeluaran */}
          <div className="keuangan-card-pengeluaran bg-white dark:bg-zinc-900 border-2 border-red-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm transition-colors duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Pengeluaran</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                  {formatCurrency(summary?.total_pengeluaran || 0)}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-500/10 rounded-lg transition-colors duration-300">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-500 transition-colors duration-300" />
              </div>
            </div>
            <div className="flex gap-2 mt-4 text-xs font-medium text-gray-500 dark:text-zinc-500 transition-colors duration-300">
              <span>Sewa: {formatCurrency(summary?.pengeluaran_sewa || 0)}</span>
              <span>•</span>
              <span>Shuttle: {formatCurrency(summary?.pengeluaran_shuttlecock || 0)}</span>
            </div>
          </div>

          {/* Keuntungan */}
          <div className="keuangan-card-keuntungan bg-white dark:bg-zinc-900 border-2 border-blue-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm transition-colors duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-zinc-400 mb-1 transition-colors duration-300">Keuntungan</p>
                <p className={`text-2xl font-bold ${(summary?.keuntungan || 0) >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'} transition-colors duration-300`}>
                  {formatCurrency(summary?.keuntungan || 0)}
                </p>
              </div>
              <div className={`p-3 ${(summary?.keuntungan || 0) >= 0 ? 'bg-green-100 dark:bg-green-500/10' : 'bg-red-100 dark:bg-red-500/10'} rounded-lg transition-colors duration-300`}>
                <DollarSign className={`w-5 h-5 ${(summary?.keuntungan || 0) >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'} transition-colors duration-300`} />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 mt-4 transition-colors duration-300">
              {summary && summary.total_pendapatan > 0
                ? `${((summary.keuntungan / summary.total_pendapatan) * 100).toFixed(1)}% margin`
                : 'Belum ada data'}
            </p>
          </div>
        </div>

        {/* Pengeluaran List */}
        <div className="keuangan-expense-table bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm transition-colors duration-300">
          <div className="p-6 border-b-2 border-gray-300 dark:border-zinc-800 transition-colors duration-300">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-300">Rincian Pengeluaran</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-zinc-900/50 border-b-2 border-gray-300 dark:border-zinc-800 transition-colors duration-300">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">Tanggal</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">Kategori</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-700 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">Nama</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-gray-700 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">Jumlah</th>
                  <th className="text-center px-6 py-3 text-xs font-bold text-gray-700 dark:text-zinc-400 uppercase tracking-wider transition-colors duration-300">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200 dark:divide-zinc-800 transition-colors duration-300">
                {pengeluaranList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-zinc-500 font-medium transition-colors duration-300">
                      Belum ada pengeluaran bulan ini
                    </td>
                  </tr>
                ) : (
                  pengeluaranList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors duration-300">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-zinc-300 transition-colors duration-300">
                        {new Date(item.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors duration-300 ${
                          item.category === 'court_rent' 
                            ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/20'
                            : item.category === 'shuttlecock'
                            ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-500/20'
                            : 'bg-gray-200 dark:bg-zinc-700/50 text-gray-700 dark:text-zinc-400 border-gray-300 dark:border-zinc-600/20'
                        }`}>
                          {categories.find(c => c.value === item.category)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium transition-colors duration-300">
                        {item.nama}
                        {item.catatan && (
                          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5 transition-colors duration-300">{item.catatan}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-right font-bold transition-colors duration-300">
                        {formatCurrency(item.jumlah)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors duration-300"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors duration-300"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4 text-gray-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-300" />
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border-2 border-gray-300 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                {editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors duration-300"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-zinc-400 transition-colors duration-300" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 transition-colors duration-300">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-gray-400 dark:focus:ring-white/20 focus:border-transparent transition-colors duration-300"
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
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 transition-colors duration-300">
                  Nama Pengeluaran
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Sewa Lapangan Februari"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 font-medium focus:ring-2 focus:ring-gray-400 dark:focus:ring-white/20 focus:border-transparent transition-colors duration-300"
                  required
                />
              </div>

              {/* Jumlah */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 transition-colors duration-300">
                  Jumlah
                </label>
                <input
                  type="number"
                  value={formData.jumlah}
                  onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 font-medium focus:ring-2 focus:ring-gray-400 dark:focus:ring-white/20 focus:border-transparent transition-colors duration-300"
                  required
                />
                {formData.jumlah && (
                  <p className="text-sm font-medium text-gray-600 dark:text-zinc-400 mt-1 transition-colors duration-300">
                    {formatCurrency(parseFloat(formData.jumlah))}
                  </p>
                )}
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 transition-colors duration-300">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-gray-400 dark:focus:ring-white/20 focus:border-transparent transition-colors duration-300"
                  required
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 mb-2 transition-colors duration-300">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Catatan tambahan..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 font-medium focus:ring-2 focus:ring-gray-400 dark:focus:ring-white/20 focus:border-transparent resize-none transition-colors duration-300"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-zinc-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors duration-300 font-semibold border-2 border-gray-300 dark:border-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-100 transition-colors duration-300 font-semibold flex items-center justify-center gap-2 border-2 border-gray-900 dark:border-white"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Perbarui' : 'Simpan'}
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
