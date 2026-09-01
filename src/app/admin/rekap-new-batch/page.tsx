'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';
import {
  ShoppingBag,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Download,
  Copy,
  Trash2,
  MessageCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ShieldAlert,
  Layers,
  Users,
  Edit2,
  Plus,
  X,
  Check,
  FileSpreadsheet
} from 'lucide-react';

export type SizeCategory = 'dewasa' | 'kids' | 'balita';

interface OrderItem {
  id: string;
  order_id: string;
  warna: 'biru' | 'kuning' | 'merah';
  ukuran: string;
  lengan: 'pendek' | 'panjang';
  nama_punggung: string | null;
  tanpa_nama_punggung: boolean;
  harga: number;
  created_at: string;
}

interface Order {
  id: string;
  created_at: string;
  order_number?: string | null;
  nama: string;
  no_wa: string;
  email?: string | null;
  total_harga: number;
  jumlah_item: number;
  status: 'pending' | 'confirmed' | 'paid' | 'produced' | 'delivered' | 'cancelled';
  new_batch_order_items?: OrderItem[];
}

export const ALL_SIZES_OPTIONS = [
  // Dewasa
  { id: 'XS', label: 'XS', category: 'dewasa', tinggi: 65, lebar: 45, defaultPrice: 110000 },
  { id: 'S', label: 'S', category: 'dewasa', tinggi: 68, lebar: 48, defaultPrice: 110000 },
  { id: 'M', label: 'M', category: 'dewasa', tinggi: 71, lebar: 51, defaultPrice: 110000 },
  { id: 'L', label: 'L', category: 'dewasa', tinggi: 74, lebar: 54, defaultPrice: 110000 },
  { id: 'XL', label: 'XL', category: 'dewasa', tinggi: 77, lebar: 57, defaultPrice: 110000 },
  { id: 'XXL', label: 'XXL', category: 'dewasa', tinggi: 80, lebar: 62, defaultPrice: 120000 },
  { id: '3XL', label: '3XL', category: 'dewasa', tinggi: 83, lebar: 65, defaultPrice: 130000 },
  // Kids
  { id: 'Kids S', label: 'Kids S (7-8 Thn)', category: 'kids', tinggi: 57, lebar: 43, defaultPrice: 100000 },
  { id: 'Kids M', label: 'Kids M (8-9 Thn)', category: 'kids', tinggi: 59, lebar: 44, defaultPrice: 100000 },
  { id: 'Kids L', label: 'Kids L (10-11 Thn)', category: 'kids', tinggi: 62, lebar: 46, defaultPrice: 100000 },
  { id: 'Kids XL', label: 'Kids XL (12-13 Thn)', category: 'kids', tinggi: 65, lebar: 48, defaultPrice: 100000 },
  // Balita
  { id: 'Balita XS', label: 'Balita XS (1-2 Thn)', category: 'balita', tinggi: 36, lebar: 28, defaultPrice: 100000 },
  { id: 'Balita S', label: 'Balita S (2-3 Thn)', category: 'balita', tinggi: 40, lebar: 31, defaultPrice: 100000 },
  { id: 'Balita M', label: 'Balita M (3-4 Thn)', category: 'balita', tinggi: 43, lebar: 34, defaultPrice: 100000 },
  { id: 'Balita L', label: 'Balita L (4-5 Thn)', category: 'balita', tinggi: 45, lebar: 36, defaultPrice: 100000 },
  { id: 'Balita XL', label: 'Balita XL (5-6 Thn)', category: 'balita', tinggi: 47, lebar: 38, defaultPrice: 100000 },
];

export function isSuperAdminOwner(user: any): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const fullName = (user.user_metadata?.full_name || user.user_metadata?.name || '').toLowerCase().trim();

  return (
    email === 'ryradit@gmail.com' ||
    email.includes('ryradit') ||
    fullName.includes('ryan radityatama') ||
    fullName === 'ryan'
  );
}

const statusBadges: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:   { label: 'Menunggu', bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/30' },
  confirmed: { label: 'Dikonfirmasi', bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/30' },
  paid:      { label: 'Lunas', bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/30' },
  produced:  { label: 'Produksi', bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/30' },
  delivered: { label: 'Terkirim', bg: 'bg-teal-500/10 dark:bg-teal-500/20', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-500/30' },
  cancelled: { label: 'Batal', bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-500/30' },
};

export default function RekapNewBatchPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedWA, setCopiedWA] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // ── Edit & Add Modal State ──
  const [editingItem, setEditingItem] = useState<{
    orderId: string;
    item: OrderItem;
  } | null>(null);

  const [addingToOrderId, setAddingToOrderId] = useState<string | null>(null);

  // Form states for modal
  const [modalWarna, setModalWarna] = useState<'biru' | 'kuning' | 'merah'>('biru');
  const [modalCategory, setModalCategory] = useState<SizeCategory>('dewasa');
  const [modalUkuran, setModalUkuran] = useState<string>('M');
  const [modalLengan, setModalLengan] = useState<'pendek' | 'panjang'>('pendek');
  const [modalNamaPunggung, setModalNamaPunggung] = useState<string>('');
  const [modalTanpaNama, setModalTanpaNama] = useState<boolean>(false);
  const [modalHarga, setModalHarga] = useState<number>(110000);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  const isOwner = isSuperAdminOwner(user);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/new-batch-pre-orders', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchOrders();
    }
  }, [isOwner]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o.id === orderId);
    try {
      setIsUpdatingStatus(orderId);
      const res = await fetch('/api/new-batch-pre-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
        );
        // If just marked paid and no email — remind admin to ask for email via WA
        if (newStatus === 'paid' && order && !order.email) {
          console.info(`[Rekap] Order ${orderId} marked paid but has no email — wa.me link available in table.`);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleDeleteOrder = async (orderId: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus seluruh pesanan atas nama "${name}"?`)) return;
    try {
      const res = await fetch(`/api/new-batch-pre-orders?id=${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  // ── DELETE / ABORT SINGLE JERSEY ITEM ──
  const handleDeleteItem = async (orderId: string, itemId: string, itemDesc: string) => {
    if (!window.confirm(`Batalkan / hapus jersey "${itemDesc}" dari pesanan ini? Total pembayaran akan dihitung ulang secara otomatis.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/new-batch-pre-orders/items?itemId=${itemId}&orderId=${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.id === orderId) {
              const updatedItems = (o.new_batch_order_items || []).filter((it) => it.id !== itemId);
              return {
                ...o,
                new_batch_order_items: updatedItems,
                total_harga: data.totalHarga,
                jumlah_item: data.jumlahItem,
              };
            }
            return o;
          })
        );
      } else {
        alert(`Gagal menghapus item: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    }
  };

  // ── OPEN EDIT MODAL ──
  const openEditModal = (orderId: string, item: OrderItem) => {
    setEditingItem({ orderId, item });
    setModalWarna(item.warna);
    const isBalita = item.ukuran.startsWith('Balita');
    const isKids = item.ukuran.startsWith('Kids');
    const cat: SizeCategory = isBalita ? 'balita' : isKids ? 'kids' : 'dewasa';
    setModalCategory(cat);
    setModalUkuran(item.ukuran);
    setModalLengan(item.lengan);
    setModalNamaPunggung(item.nama_punggung || '');
    setModalTanpaNama(item.tanpa_nama_punggung || false);
    setModalHarga(item.harga);
  };

  // ── OPEN ADD MODAL ──
  const openAddModal = (orderId: string) => {
    setAddingToOrderId(orderId);
    setModalWarna('biru');
    setModalCategory('dewasa');
    setModalUkuran('M');
    setModalLengan('pendek');
    setModalNamaPunggung('');
    setModalTanpaNama(false);
    setModalHarga(110000);
  };

  const handleSaveEditedItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmittingItem(true);
    try {
      const res = await fetch('/api/new-batch-pre-orders/items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: editingItem.item.id,
          orderId: editingItem.orderId,
          warna: modalWarna,
          ukuran: modalUkuran,
          lengan: modalLengan,
          namaPunggung: modalTanpaNama ? null : modalNamaPunggung.trim().toUpperCase(),
          tanpaNamaPunggung: modalTanpaNama,
          customHarga: modalHarga,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan perubahan');
      }

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === editingItem.orderId) {
            const updatedItems = (o.new_batch_order_items || []).map((it) =>
              it.id === editingItem.item.id ? data.updatedItem : it
            );
            return {
              ...o,
              new_batch_order_items: updatedItems,
              total_harga: data.totalHarga,
              jumlah_item: data.jumlahItem,
            };
          }
          return o;
        })
      );

      setEditingItem(null);
    } catch (err: any) {
      alert(`Terjadi error: ${err.message}`);
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleSaveNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingToOrderId) return;
    setIsSubmittingItem(true);
    try {
      const res = await fetch('/api/new-batch-pre-orders/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: addingToOrderId,
          warna: modalWarna,
          ukuran: modalUkuran,
          lengan: modalLengan,
          namaPunggung: modalTanpaNama ? null : modalNamaPunggung.trim().toUpperCase(),
          tanpaNamaPunggung: modalTanpaNama,
          customHarga: modalHarga,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menambahkan jersey');
      }

      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === addingToOrderId) {
            const updatedItems = [...(o.new_batch_order_items || []), data.item];
            return {
              ...o,
              new_batch_order_items: updatedItems,
              total_harga: data.totalHarga,
              jumlah_item: data.jumlahItem,
            };
          }
          return o;
        })
      );

      setAddingToOrderId(null);
    } catch (err: any) {
      alert(`Terjadi error: ${err.message}`);
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ── Metrics & Calculations ──
  const activeOrders = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders]);

  const totalJersey = useMemo(() => {
    return activeOrders.reduce((sum, o) => sum + (o.new_batch_order_items?.length || o.jumlah_item || 1), 0);
  }, [activeOrders]);

  const totalOmset = useMemo(() => {
    return activeOrders.reduce((sum, o) => sum + (o.total_harga || 0), 0);
  }, [activeOrders]);

  const quotaTarget = 15;
  const quotaProgress = Math.min(100, Math.round((totalJersey / quotaTarget) * 100));

  // Flattened all items for vendor recap
  const allItems = useMemo(() => {
    const list: (OrderItem & { orderName: string; orderWA: string; orderStatus: string })[] = [];
    activeOrders.forEach((o) => {
      if (o.new_batch_order_items) {
        o.new_batch_order_items.forEach((item) => {
          list.push({
            ...item,
            orderName: o.nama,
            orderWA: o.no_wa,
            orderStatus: o.status,
          });
        });
      }
    });
    return list;
  }, [activeOrders]);

  // Color breakdown
  const colorCount = useMemo(() => {
    const map = { biru: 0, kuning: 0, merah: 0 };
    allItems.forEach((it) => {
      if (it.warna in map) map[it.warna]++;
    });
    return map;
  }, [allItems]);

  // Category breakdown
  const categoryCount = useMemo(() => {
    const map = { dewasa: 0, kids: 0, balita: 0 };
    allItems.forEach((it) => {
      if (it.ukuran.startsWith('Balita')) map.balita++;
      else if (it.ukuran.startsWith('Kids')) map.kids++;
      else map.dewasa++;
    });
    return map;
  }, [allItems]);

  // Size details count
  const sizeCountMap = useMemo(() => {
    const map: Record<string, { pendek: number; panjang: number }> = {};
    allItems.forEach((it) => {
      if (!map[it.ukuran]) map[it.ukuran] = { pendek: 0, panjang: 0 };
      if (it.lengan === 'panjang') map[it.ukuran].panjang++;
      else map[it.ukuran].pendek++;
    });
    return map;
  }, [allItems]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.no_wa.includes(searchQuery) ||
        o.new_batch_order_items?.some((it) =>
          (it.nama_punggung || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchStatus = statusFilter === 'all' || o.status === statusFilter;

      const matchColor =
        colorFilter === 'all' ||
        o.new_batch_order_items?.some((it) => it.warna === colorFilter);

      const matchCategory =
        categoryFilter === 'all' ||
        o.new_batch_order_items?.some((it) => {
          if (categoryFilter === 'balita') return it.ukuran.startsWith('Balita');
          if (categoryFilter === 'kids') return it.ukuran.startsWith('Kids');
          return !it.ukuran.startsWith('Balita') && !it.ukuran.startsWith('Kids');
        });

      return matchSearch && matchStatus && matchColor && matchCategory;
    });
  }, [orders, searchQuery, statusFilter, colorFilter, categoryFilter]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID Order', 'Tanggal', 'Nama Pemesan', 'No WhatsApp', 'Warna', 'Ukuran', 'Lengan', 'Nama Punggung', 'Harga', 'Status Order'];
    const rows: string[][] = [];

    orders.forEach((o) => {
      if (o.new_batch_order_items && o.new_batch_order_items.length > 0) {
        o.new_batch_order_items.forEach((it) => {
          rows.push([
            o.id,
            formatDate(o.created_at),
            `"${o.nama}"`,
            `'${o.no_wa}`,
            it.warna.toUpperCase(),
            it.ukuran,
            it.lengan === 'panjang' ? 'LENGAN PANJANG' : 'LENGAN PENDEK',
            `"${it.tanpa_nama_punggung ? '(Tanpa Nama)' : it.nama_punggung || '-'}"`,
            it.harga.toString(),
            o.status.toUpperCase(),
          ]);
        });
      } else {
        rows.push([
          o.id,
          formatDate(o.created_at),
          `"${o.nama}"`,
          `'${o.no_wa}`,
          '-',
          '-',
          '-',
          '-',
          o.total_harga.toString(),
          o.status.toUpperCase(),
        ]);
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap-preorder-new-batch-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Excel (.xlsx / .xls)
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // ── Sheet 1: Daftar Pesanan Lengkap ──
      const ordersData: any[] = [];
      orders.forEach((o) => {
        if (o.new_batch_order_items && o.new_batch_order_items.length > 0) {
          o.new_batch_order_items.forEach((it) => {
            const isBalita = it.ukuran.startsWith('Balita');
            const isKids = it.ukuran.startsWith('Kids');
            const cat = isBalita ? 'Balita' : isKids ? 'Kids' : 'Dewasa';

            ordersData.push({
              'No': ordersData.length + 1,
              'ID Order': o.id,
              'Tanggal Pesan': formatDate(o.created_at),
              'Nama Pemesan': o.nama,
              'No WhatsApp': o.no_wa,
              'Warna Jersey': it.warna.toUpperCase(),
              'Kategori': cat,
              'Ukuran Size': it.ukuran,
              'Tipe Lengan': it.lengan === 'panjang' ? 'Lengan Panjang (+10k)' : 'Lengan Pendek',
              'Nama Punggung': it.tanpa_nama_punggung ? '(Tanpa Nama)' : (it.nama_punggung || '-'),
              'Harga Item (Rp)': it.harga,
              'Status Order': statusBadges[o.status]?.label || o.status,
              'Total Bayar (Rp)': o.total_harga,
            });
          });
        } else {
          ordersData.push({
            'No': ordersData.length + 1,
            'ID Order': o.id,
            'Tanggal Pesan': formatDate(o.created_at),
            'Nama Pemesan': o.nama,
            'No WhatsApp': o.no_wa,
            'Warna Jersey': '-',
            'Kategori': '-',
            'Ukuran Size': '-',
            'Tipe Lengan': '-',
            'Nama Punggung': '-',
            'Harga Item (Rp)': o.total_harga,
            'Status Order': statusBadges[o.status]?.label || o.status,
            'Total Bayar (Rp)': o.total_harga,
          });
        }
      });

      const wsOrders = XLSX.utils.json_to_sheet(ordersData);
      XLSX.utils.book_append_sheet(wb, wsOrders, 'Daftar Pesanan Lengkap');

      // ── Sheet 2: Matriks Produksi Vendor ──
      const matrixData: any[] = [];
      Object.entries(sizeCountMap).forEach(([size, counts]) => {
        const isBalita = size.startsWith('Balita');
        const isKids = size.startsWith('Kids');
        const cat = isBalita ? 'Balita 👶' : isKids ? 'Kids 👦' : 'Dewasa 👤';

        matrixData.push({
          'Kategori': cat,
          'Ukuran Size': size,
          'Lengan Pendek (pcs)': counts.pendek,
          'Lengan Panjang (pcs)': counts.panjang,
          'Subtotal Pcs': counts.pendek + counts.panjang,
        });
      });

      // Total row for Matrix
      const totalPendek = Object.values(sizeCountMap).reduce((sum, c) => sum + c.pendek, 0);
      const totalPanjang = Object.values(sizeCountMap).reduce((sum, c) => sum + c.panjang, 0);
      matrixData.push({
        'Kategori': 'TOTAL KESELURUHAN',
        'Ukuran Size': 'SEMUA UKURAN',
        'Lengan Pendek (pcs)': totalPendek,
        'Lengan Panjang (pcs)': totalPanjang,
        'Subtotal Pcs': totalJersey,
      });

      const wsMatrix = XLSX.utils.json_to_sheet(matrixData);
      XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matriks Produksi Vendor');

      // ── Sheet 3: Ringkasan Eksekutif ──
      const summaryData = [
        { 'Indikator': 'Tanggal Rekapitulasi', 'Keterangan': new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }) },
        { 'Indikator': 'Total Jersey Dipesan', 'Keterangan': `${totalJersey} pcs` },
        { 'Indikator': 'Target Kuota Produksi', 'Keterangan': `${quotaTarget} pcs (${quotaProgress}%)` },
        { 'Indikator': 'Jumlah Pemesan Aktif', 'Keterangan': `${activeOrders.length} orang` },
        { 'Indikator': 'Total Estimasi Omset', 'Keterangan': formatRp(totalOmset) },
        { 'Indikator': 'Jumlah Jersey Biru Navy', 'Keterangan': `${colorCount.biru} pcs` },
        { 'Indikator': 'Jumlah Jersey Kuning', 'Keterangan': `${colorCount.kuning} pcs` },
        { 'Indikator': 'Jumlah Jersey Merah', 'Keterangan': `${colorCount.merah} pcs` },
        { 'Indikator': 'Jumlah Kategori Dewasa', 'Keterangan': `${categoryCount.dewasa} pcs` },
        { 'Indikator': 'Jumlah Kategori Kids', 'Keterangan': `${categoryCount.kids} pcs` },
        { 'Indikator': 'Jumlah Kategori Balita', 'Keterangan': `${categoryCount.balita} pcs` },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan & Finansial');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Rekap_PreOrder_Jersey_DLOB_New_Batch_${dateStr}.xlsx`);
    } catch (err: any) {
      alert(`Gagal mengekspor file Excel: ${err.message}`);
    }
  };

  // Copy WhatsApp Vendor Summary
  const handleCopyWASummary = () => {
    let text = `*REKAP PESANAN JERSEY DLOB NEW BATCH 2026*\n`;
    text += `Tanggal Rekap: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}\n\n`;
    text += `📊 *TOTAL PRODUKSI:*\n`;
    text += `• Total Jersey: *${totalJersey} pcs*\n`;
    text += `• Total Order: *${activeOrders.length} pemesan*\n`;
    text += `• Total Nilai: *${formatRp(totalOmset)}*\n\n`;

    text += `🎨 *REKAP WARNA:*\n`;
    text += `• Biru: ${colorCount.biru} pcs\n`;
    text += `• Kuning: ${colorCount.kuning} pcs\n`;
    text += `• Merah: ${colorCount.merah} pcs\n\n`;

    text += `📐 *REKAP UKURAN & LENGAN:*\n`;
    Object.entries(sizeCountMap).forEach(([size, data]) => {
      text += `• Size ${size}: ${data.pendek + data.panjang} pcs (${data.pendek} Lengan Pendek, ${data.panjang} Lengan Panjang)\n`;
    });

    text += `\n📝 *RINCIAN NAMA PUNGGUNG PER JERSEY:*\n`;
    allItems.forEach((it, idx) => {
      const np = it.tanpa_nama_punggung ? '(Tanpa Nama)' : it.nama_punggung ? `"${it.nama_punggung}"` : '(Polos)';
      const lenganLabel = it.lengan === 'panjang' ? 'Lengan Panjang' : 'Lengan Pendek';
      text += `${idx + 1}. [${it.warna.toUpperCase()}] Size ${it.ukuran} (${lenganLabel}) | Nama: ${np} | a.n ${it.orderName}\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  // ── Access Denied Screen ──
  if (!authLoading && !isOwner) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-md w-full text-center p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto text-2xl">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Akses Terbatas</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
            Halaman Rekapitulasi Pre-Order New Batch ini bersifat privat dan hanya dapat diakses secara eksklusif oleh Pemilik Sistem: <strong className="text-gray-900 dark:text-white">Ryan Radityatama (ryradit@gmail.com)</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">

      {/* ── EDIT / MODIFY JERSEY ITEM MODAL ── */}
      {(editingItem || addingToOrderId) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/15 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-500" />
                <span>{editingItem ? 'Edit / Modifikasi Jersey' : 'Tambah Jersey ke Pesanan'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setAddingToOrderId(null);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-zinc-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingItem ? handleSaveEditedItem : handleSaveNewItem} className="space-y-4">
              {/* 1. Warna */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Warna Jersey
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'biru', label: 'Biru Navy', color: '#0b244c' },
                    { value: 'kuning', label: 'Kuning', color: '#FFC000' },
                    { value: 'merah', label: 'Merah', color: '#ff0000' },
                  ].map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => setModalWarna(w.value as any)}
                      className={`p-2.5 rounded-2xl border-2 flex items-center gap-2 text-xs font-bold transition-all ${
                        modalWarna === w.value
                          ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                          : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: w.color }} />
                      <span>{w.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Kategori Ukuran */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Kategori Ukuran
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 dark:bg-zinc-800 rounded-full">
                  {(['dewasa', 'kids', 'balita'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setModalCategory(cat);
                        const first = ALL_SIZES_OPTIONS.find((s) => s.category === cat);
                        if (first) {
                          setModalUkuran(first.id);
                          setModalHarga(first.defaultPrice + (modalLengan === 'panjang' ? 10000 : 0));
                        }
                      }}
                      className={`py-1.5 px-2 rounded-full text-xs font-bold uppercase transition-all ${
                        modalCategory === cat
                          ? 'bg-black dark:bg-white text-white dark:text-black shadow-xs'
                          : 'text-gray-600 dark:text-zinc-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Pilihan Size */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Pilih Size ({modalCategory})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ALL_SIZES_OPTIONS.filter((s) => s.category === modalCategory).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setModalUkuran(s.id);
                        setModalHarga(s.defaultPrice + (modalLengan === 'panjang' ? 10000 : 0));
                      }}
                      className={`p-2 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                        modalUkuran === s.id
                          ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-sm'
                          : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300'
                      }`}
                    >
                      <div>{s.label}</div>
                      <div className="text-[10px] font-mono opacity-80">{s.tinggi}x{s.lebar}cm</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Pilihan Lengan */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Tipe Lengan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'pendek', label: 'Lengan Pendek (Standar)' },
                    { value: 'panjang', label: 'Lengan Panjang (+10k)' },
                  ].map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => {
                        setModalLengan(l.value as any);
                        const spec = ALL_SIZES_OPTIONS.find((s) => s.id === modalUkuran);
                        const base = spec?.defaultPrice || 110000;
                        setModalHarga(base + (l.value === 'panjang' ? 10000 : 0));
                      }}
                      className={`p-2.5 rounded-2xl border-2 text-xs font-bold text-center transition-all ${
                        modalLengan === l.value
                          ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-xs'
                          : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-zinc-300'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Nama Punggung */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                    Nama Punggung
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalTanpaNama}
                      onChange={(e) => setModalTanpaNama(e.target.checked)}
                      className="rounded text-black"
                    />
                    <span>Tanpa nama</span>
                  </label>
                </div>
                {!modalTanpaNama && (
                  <input
                    type="text"
                    value={modalNamaPunggung}
                    onChange={(e) => setModalNamaPunggung(e.target.value.toUpperCase())}
                    placeholder="Contoh: RYAN"
                    maxLength={20}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-mono uppercase text-xs font-bold focus:outline-none focus:border-black dark:focus:border-white"
                  />
                )}
              </div>

              {/* 6. Harga Item */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Harga Jersey (Rp)
                </label>
                <input
                  type="number"
                  value={modalHarga}
                  onChange={(e) => setModalHarga(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-mono text-sm font-bold focus:outline-none focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingItem}
                  className="flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black shadow-md transition-all disabled:opacity-50"
                >
                  {isSubmittingItem ? 'Menyimpan...' : 'Simpan & Hitung Ulang Total'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setAddingToOrderId(null);
                  }}
                  className="px-5 py-3 rounded-full text-xs font-bold bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Super Admin Exclusive
            </span>
            <span className="text-xs text-gray-500 dark:text-zinc-400">• Ryan Radityatama</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-emerald-500" />
            <span>Rekap Pre-Order New Batch</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Pantau, rekapitulasi, dan modifikasi satuan jersey pesanan customer secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2.5 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportExcel}
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
            title="Download file spreadsheet Excel lengkap (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* ── Metric Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Jersey */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 font-semibold">
            <span>Total Jersey Dipesan</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono">{totalJersey}</span>
            <span className="text-xs text-gray-400">pcs</span>
          </div>
          <div className="pt-2">
            <div className="flex justify-between text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-1">
              <span>Target Kuota ({quotaTarget} pcs)</span>
              <span className="text-emerald-500">{quotaProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${quotaProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 font-semibold">
            <span>Jumlah Pemesan</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white font-mono">{activeOrders.length}</span>
            <span className="text-xs text-gray-400">order aktif</span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 pt-2">
            Rata-rata {(totalJersey / (activeOrders.length || 1)).toFixed(1)} jersey / pemesan
          </p>
        </div>

        {/* Card 3: Total Omset */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 font-semibold">
            <span>Total Nilai Omset</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {formatRp(totalOmset)}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-zinc-400 pt-2">
            Termasuk opsi lengan panjang (+10k)
          </p>
        </div>

        {/* Card 4: Breakdown by Category */}
        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 font-semibold">
            <span>Proporsi Kategori</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1 text-center">
            <div className="p-1.5 rounded-xl bg-gray-50 dark:bg-zinc-800">
              <p className="text-[10px] text-gray-500 dark:text-zinc-400">Dewasa</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{categoryCount.dewasa}</p>
            </div>
            <div className="p-1.5 rounded-xl bg-gray-50 dark:bg-zinc-800">
              <p className="text-[10px] text-gray-500 dark:text-zinc-400">Kids</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{categoryCount.kids}</p>
            </div>
            <div className="p-1.5 rounded-xl bg-gray-50 dark:bg-zinc-800">
              <p className="text-[10px] text-gray-500 dark:text-zinc-400">Balita 👶</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{categoryCount.balita}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Vendor Production Matrix Module ── */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-900/60 border border-gray-200 dark:border-white/10 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🏭 Rekapitulasi Produksi Konveksi / Vendor</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400">Rincian warna, size, dan spesifikasi lengan untuk tim pabrik</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              🔵 Biru: {colorCount.biru}
            </span>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              🟡 Kuning: {colorCount.kuning}
            </span>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800">
              🔴 Merah: {colorCount.merah}
            </span>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-white/10">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-bold">
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4 text-center">Lengan Pendek</th>
                <th className="py-3 px-4 text-center">Lengan Panjang</th>
                <th className="py-3 px-4 text-right">Subtotal Pcs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-800 dark:text-zinc-200">
              {Object.keys(sizeCountMap).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">Belum ada pesanan masuk</td>
                </tr>
              ) : (
                Object.entries(sizeCountMap).map(([size, counts]) => {
                  const isBalita = size.startsWith('Balita');
                  const isKids = size.startsWith('Kids');
                  const catLabel = isBalita ? '👶 Balita' : isKids ? '👦 Kids' : '👤 Dewasa';

                  return (
                    <tr key={size} className="hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="py-2.5 px-4 font-semibold text-gray-500 dark:text-zinc-400">{catLabel}</td>
                      <td className="py-2.5 px-4 font-bold text-gray-900 dark:text-white font-mono">{size}</td>
                      <td className="py-2.5 px-4 text-center font-mono">{counts.pendek}</td>
                      <td className="py-2.5 px-4 text-center font-mono">{counts.panjang}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {counts.pendek + counts.panjang} pcs
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, WhatsApp, atau nama punggung..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-all shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none shadow-xs"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="confirmed">Dikonfirmasi</option>
            <option value="paid">Lunas</option>
            <option value="produced">Produksi</option>
            <option value="delivered">Terkirim</option>
            <option value="cancelled">Batal</option>
          </select>

          {/* Color filter */}
          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none shadow-xs"
          >
            <option value="all">Semua Warna</option>
            <option value="biru">Biru</option>
            <option value="kuning">Kuning</option>
            <option value="merah">Merah</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 focus:outline-none shadow-xs"
          >
            <option value="all">Semua Tipe</option>
            <option value="dewasa">Dewasa</option>
            <option value="kids">Kids</option>
            <option value="balita">Balita</option>
          </select>
        </div>
      </div>

      {/* ── Orders Table List ── */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Daftar Pesanan ({filteredOrders.length})
          </h3>
          <span className="text-xs text-gray-400">Kelola dan modifikasi satuan jersey di tiap pesanan</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-zinc-950 text-gray-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">No &amp; Waktu</th>
                <th className="py-3.5 px-4">Pemesan</th>
                <th className="py-3.5 px-4">Rincian Jersey (Bisa Di-Edit / Batal Per Item)</th>
                <th className="py-3.5 px-4 text-right">Total Bayar</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-800 dark:text-zinc-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 space-y-2">
                    <p className="text-sm font-semibold">Tidak ada pesanan yang sesuai filter</p>
                    <p className="text-xs">Ubah kata kunci pencarian atau status filter Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const badge = statusBadges[order.status] || statusBadges.pending;
                  const waNumber = order.no_wa.replace(/\D/g, '');
                  const waLink = `https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}?text=${encodeURIComponent(`Halo kak ${order.nama}, konfirmasi pesanan Pre-Order Jersey DLOB New Batch (Total: ${formatRp(order.total_harga)})...`)}`;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                      {/* 1. No & Date */}
                      <td className="py-4 px-4 align-top">
                        <span className="font-bold text-gray-900 dark:text-white">#{idx + 1}</span>
                        {order.order_number && (
                          <p className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-md px-1.5 py-0.5 mt-1 w-fit">
                            {order.order_number}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                          {formatDate(order.created_at)}
                        </p>
                      </td>

                      {/* 2. Customer Info */}
                      <td className="py-4 px-4 align-top">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{order.nama}</p>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-mono text-xs mt-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{order.no_wa}</span>
                        </a>
                        {/* Email — show if exists, or wa.me nudge to ask for it */}
                        {order.email ? (
                          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium truncate max-w-[160px]">
                            ✉️ {order.email}
                          </p>
                        ) : (
                          <a
                            href={`https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}?text=${encodeURIComponent(`Halo kak ${order.nama}! 👋 Pesanan jersey kamu sudah kami konfirmasi ✅\n\nBoleh minta alamat email kamu? Kami ingin mengirimkan kwitansi digital ke email kamu.\n\nTerima kasih! 🏸\n— DLOB Community`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-500 hover:text-amber-700 hover:underline text-[11px] mt-1 font-semibold"
                          >
                            <span>⚠️ Tanya email via WA</span>
                          </a>
                        )}
                      </td>

                      {/* 3. Jersey Line Items with Individual Edit / Delete Buttons */}
                      <td className="py-4 px-4 align-top space-y-2 max-w-md">
                        {order.new_batch_order_items && order.new_batch_order_items.length > 0 ? (
                          order.new_batch_order_items.map((item, itemIdx) => (
                            <div
                              key={item.id || itemIdx}
                              className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-white/5 text-xs space-y-1.5 shadow-xs"
                            >
                              <div className="flex items-center justify-between font-semibold">
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor:
                                        item.warna === 'biru' ? '#0b244c' : item.warna === 'kuning' ? '#FFC000' : '#ff0000',
                                    }}
                                  />
                                  <strong className="text-gray-900 dark:text-white uppercase">{item.warna}</strong> — {item.ukuran}
                                </span>

                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] text-gray-500 font-medium mr-1">
                                    {item.lengan === 'panjang' ? 'Lengan Panjang (+10k)' : 'Lengan Pendek'}
                                  </span>

                                  {/* Edit button */}
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(order.id, item)}
                                    className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 transition-colors"
                                    title="Edit warna / ukuran / nama punggung jersey ini"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete / Abort Item button */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(order.id, item.id, `${item.warna.toUpperCase()} ${item.ukuran}`)}
                                    className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/60 text-red-500 hover:text-red-700 transition-colors"
                                    title="Batalkan / Hapus hanya jersey ini (cth: batal bayar)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400">
                                <span>
                                  Nama:{' '}
                                  {item.tanpa_nama_punggung ? (
                                    <em className="text-gray-400">Tanpa nama</em>
                                  ) : item.nama_punggung ? (
                                    <strong className="text-gray-800 dark:text-zinc-200 font-mono uppercase bg-white/40 dark:bg-white/10 px-1.5 py-0.5 rounded">
                                      {item.nama_punggung}
                                    </strong>
                                  ) : (
                                    '-'
                                  )}
                                </span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                  {formatRp(item.harga)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs">
                            Tidak ada jersey aktif (semua dibatalkan)
                          </div>
                        )}

                        {/* Add extra jersey to this order */}
                        <button
                          type="button"
                          onClick={() => openAddModal(order.id)}
                          className="w-full py-1.5 border border-dashed border-gray-300 dark:border-white/20 hover:border-black dark:hover:border-white rounded-xl text-[11px] font-bold text-gray-600 dark:text-zinc-300 hover:text-black dark:hover:text-white flex items-center justify-center gap-1 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Jersey Lain ke Order Ini</span>
                        </button>
                      </td>

                      {/* 4. Total Price */}
                      <td className="py-4 px-4 align-top text-right font-mono font-extrabold text-sm text-gray-900 dark:text-white">
                        {formatRp(order.total_harga)}
                      </td>

                      {/* 5. Status Selector */}
                      <td className="py-4 px-4 align-top text-center">
                        <select
                          value={order.status}
                          disabled={isUpdatingStatus === order.id}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <option value="pending">Menunggu</option>
                          <option value="confirmed">Dikonfirmasi</option>
                          <option value="paid">Lunas</option>
                          <option value="produced">Produksi</option>
                          <option value="delivered">Terkirim</option>
                          <option value="cancelled">Batal</option>
                        </select>
                      </td>

                      {/* 6. Action */}
                      <td className="py-4 px-4 align-top text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id, order.nama)}
                          className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-600 transition-colors"
                          title="Hapus seluruh pesanan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
