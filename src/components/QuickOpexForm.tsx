/**
 * OPEX MANAGEMENT - SIMPLE ADMIN FORM
 * 
 * Quick form for adminsistrators to add manual expenses
 * This shows the simplest implementation approach
 */

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function QuickOpexForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'maintenance',
    name: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const categories = [
    { value: 'maintenance', label: '🔧 Maintenance & Perbaikan' },
    { value: 'marketing', label: '📢 Marketing & Promosi' },
    { value: 'equipment', label: '🏸 Peralatan & Perlengkapan' },
    { value: 'utilities', label: '💡 Listrik & Utilities Tambahan' },
    { value: 'staff', label: '👥 Staff & Tenaga Kerja' },
    { value: 'misc', label: '📦 Lain-lain' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('User not authenticated');
        return;
      }

      // Insert manual OPEX entry
      const { error } = await supabase
        .from('opex_manual')
        .insert({
          category: formData.category,
          name: formData.name,
          amount: parseFloat(formData.amount),
          expense_date: formData.expense_date,
          notes: formData.notes,
          created_by: user.id
        });

      if (error) throw error;

      alert(`✅ Pengeluaran berhasil dicatat: ${formData.name} - Rp ${formData.amount}`);
      
      // Reset form
      setFormData({
        category: 'maintenance',
        name: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: ''
      });

    } catch (error) {
      console.error('Error adding OPEX:', error);
      alert('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        💰 Tambah Pengeluaran (OPEX)
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategori
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deskripsi Pengeluaran
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: Perbaikan Net Court B"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jumlah (Rp)
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="350000"
            min="0"
            step="1000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {formData.amount && (
            <p className="text-sm text-gray-500 mt-1">
              = Rp {parseInt(formData.amount).toLocaleString('id-ID')}
            </p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tanggal Pengeluaran
          </label>
          <input
            type="date"
            value={formData.expense_date}
            onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catatan (Opsional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Informasi tambahan tentang pengeluaran ini..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? 'Menyimpan...' : '💾 Simpan Pengeluaran'}
        </button>
      </form>

      {/* Quick Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Biaya tetap (sewa, gaji) sudah otomatis ter-hitung</li>
          <li>• Biaya shuttlecock otomatis dari jumlah pertandingan</li>
          <li>• Form ini untuk pengeluaran ad-hoc (perbaikan, marketing, dll)</li>
          <li>• Simpan struk/invoice untuk audit (coming soon: upload feature)</li>
        </ul>
      </div>
    </div>
  );
}
