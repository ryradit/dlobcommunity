'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Unlock,
  AlertCircle,
  ShieldAlert,
  Save,
  Loader2,
  X,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { JerseyBatch, DEFAULT_JERSEY_BATCHES } from '@/lib/jerseyBatches';
import { isSuperAdminOwner } from '@/app/admin/rekap-new-batch/page';

export default function AdminJerseyBatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const [batches, setBatches] = useState<JerseyBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'open' | 'closed' | 'coming-soon'>('open');
  const [formRekapStatus, setFormRekapStatus] = useState<'open' | 'closed'>('open');
  const [formPrice, setFormPrice] = useState(100000);
  const [formMaterial, setFormMaterial] = useState('Milano Standard Premium');
  const [formCare, setFormCare] = useState('Cuci dengan air dingin, jangan gunakan pemutih');
  const [formOrigin, setFormOrigin] = useState('Indonesia');
  const [formClosedMessage, setFormClosedMessage] = useState('Pemesanan Pre-Order Jersey untuk batch ini saat ini telah resmi ditutup.');
  const [formColors, setFormColors] = useState<Array<{ id: string; name: string; color: string; images: string[] }>>([
    { id: 'c-1', name: 'Biru Navy', color: '#0b244c', images: [] },
  ]);

  const isOwner = isSuperAdminOwner(user);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/store/batches', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.batches) {
        setBatches(data.batches);
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchBatches();
    }
  }, [isOwner]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setEditingSlug(null);
    setFormName('');
    setFormSlug('');
    setFormTagline('Fresh Edition · New Colors');
    setFormDescription('Batch terbaru jersey resmi DLOB dengan material Milano Standard.');
    setFormStatus('open');
    setFormRekapStatus('open');
    setFormPrice(100000);
    setFormMaterial('Milano Standard Premium');
    setFormCare('Cuci dengan air dingin, jangan gunakan pemutih');
    setFormOrigin('Indonesia');
    setFormClosedMessage('Pemesanan Pre-Order Jersey untuk batch ini saat ini telah resmi ditutup.');
    setFormColors([
      { id: 'c-biru', name: 'Biru Navy', color: '#0b244c', images: [] },
      { id: 'c-kuning', name: 'Kuning', color: '#FFC000', images: [] },
      { id: 'c-merah', name: 'Merah', color: '#ff0000', images: [] },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (batch: JerseyBatch) => {
    setEditingSlug(batch.slug);
    setFormName(batch.name);
    setFormSlug(batch.slug);
    setFormTagline(batch.tagline);
    setFormDescription(batch.description);
    setFormStatus(batch.status);
    setFormRekapStatus(batch.rekapStatus || 'open');
    setFormPrice(batch.startingPrice);
    setFormMaterial(batch.material);
    setFormCare(batch.care);
    setFormOrigin(batch.origin);
    setFormClosedMessage(batch.closedMessage || 'Pemesanan Pre-Order Jersey untuk batch ini saat ini telah resmi ditutup.');
    setFormColors(
      batch.colorVariants.map((v) => ({
        id: v.id,
        name: v.name,
        color: v.color,
        images: v.images || [],
      }))
    );
    setIsModalOpen(true);
  };

  const handleQuickToggleStatus = async (slug: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'open' ? 'closed' : 'open';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/store/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ slug, status: nextStatus }),
      });
      if (res.ok) {
        setBatches((prev) =>
          prev.map((b) => (b.slug === slug ? { ...b, status: nextStatus as any, badge: nextStatus === 'open' ? 'PRE-ORDER AKTIF' : 'BATCH DITUTUP' } : b))
        );
      } else {
        alert('Gagal mengubah status batch');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleQuickToggleRekap = async (slug: string, currentRekapStatus: string) => {
    const nextStatus = currentRekapStatus === 'open' ? 'closed' : 'open';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/store/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ slug, rekapStatus: nextStatus }),
      });
      if (res.ok) {
        setBatches((prev) =>
          prev.map((b) => (b.slug === slug ? { ...b, rekapStatus: nextStatus as any } : b))
        );
      } else {
        alert('Gagal mengubah status rekap batch');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteBatch = async (slug: string) => {
    if (!window.confirm(`Hapus batch "${slug}"? Halaman produk dan link PO batch ini tidak akan bisa diakses.`)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/store/batches?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.ok) {
        setBatches((prev) => prev.filter((b) => b.slug !== slug));
        alert('Batch berhasil dihapus.');
      } else {
        alert('Gagal menghapus batch');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSaveBatchForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanSlug = formSlug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
      if (!cleanSlug) throw new Error('Slug URL tidak boleh kosong');

      const updatedBatch: JerseyBatch = {
        id: cleanSlug,
        slug: cleanSlug,
        name: formName.trim(),
        tagline: formTagline.trim(),
        description: formDescription.trim(),
        status: formStatus,
        rekapStatus: formRekapStatus,
        badge: formStatus === 'open' ? 'PRE-ORDER AKTIF' : formStatus === 'coming-soon' ? 'SEGERA HADIR' : 'BATCH DITUTUP',
        badgeType: formStatus === 'open' ? 'active-preorder' : formStatus === 'coming-soon' ? 'coming-soon' : 'closed',
        startingPrice: formPrice,
        material: formMaterial.trim(),
        care: formCare.trim(),
        origin: formOrigin.trim(),
        estimatedDelivery: 'Kuota 15 Order',
        colorVariants: formColors.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          images: c.images.length > 0 ? c.images : [
            'https://qtdayzlrwmzdezkavjpd.supabase.co/storage/v1/object/public/jersey-assets/jersey%20dlob%20depan%20biru.png'
          ],
          bgColor: c.color,
        })),
        closedMessage: formClosedMessage.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/store/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ batch: updatedBatch }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Gagal menyimpan batch');
      }

      setIsModalOpen(false);
      fetchBatches();
      alert('✅ Batch jersey berhasil disimpan!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!authLoading && !isOwner) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-md w-full text-center p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Akses Terbatas</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400">
            Halaman Kelola Batch Jersey hanya dapat diakses secara eksklusif oleh Pemilik Sistem (Owner): <strong>ryradit@gmail.com</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Owner Exclusive
            </span>
            <span className="text-xs text-gray-500 dark:text-zinc-400">• Ryan Radityatama</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-emerald-500" />
            <span>Kelola Batch Pre-Order Jersey</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Atur batch jersey yang tampil di store, buat batch baru dengan link dan formulir PO tersendiri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchBatches}
            disabled={loading}
            className="p-2.5 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Batch Baru</span>
          </button>
        </div>
      </div>

      {/* ── Batches List ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Daftar Batch Jersey ({batches.length})
          </h2>
          <span className="text-xs text-gray-500 dark:text-zinc-400">
            Setiap batch memiliki link katalog &amp; form PO tersendiri
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
            <p className="text-xs text-gray-400 mt-2">Memuat daftar batch...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map((batch) => {
              const isClosed = batch.status === 'closed';
              const isRekapClosed = batch.rekapStatus === 'closed';
              const isNewBatch = batch.slug === 'new-batch-2026';
              const detailPath = isNewBatch ? '/store/jersey-dlob-new-batch' : `/store/${batch.slug}`;
              const poPath = isNewBatch ? '/store/new-batch-pre-order' : `/store/${batch.slug}/pre-order`;
              const detailUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${detailPath}`;
              const poFormUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${poPath}`;

              return (
                <div
                  key={batch.slug}
                  className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        batch.status === 'open'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : batch.status === 'coming-soon'
                          ? 'bg-zinc-800 text-white'
                          : 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                      }`}>
                        {batch.status === 'open' ? '🟢 PRE-ORDER AKTIF' : batch.status === 'coming-soon' ? '⏳ SEGERA HADIR' : '🔴 BATCH DITUTUP'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(batch)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300"
                          title="Edit Batch"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {batch.slug !== 'new-batch-2026' && batch.slug !== 'official' && (
                          <button
                            onClick={() => handleDeleteBatch(batch.slug)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
                            title="Hapus Batch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{batch.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{batch.tagline}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        Rp {batch.startingPrice?.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs text-gray-400">• {batch.colorVariants?.length || 0} Warna</span>
                    </div>

                    {/* Colors Preview */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {batch.colorVariants?.map((c, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full border border-black/20"
                          style={{ backgroundColor: c.color }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* ── Status Toggles ── */}
                  <div className="pt-3 border-t border-gray-100 dark:border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-zinc-400">Status Pre-Order:</span>
                      <button
                        onClick={() => handleQuickToggleStatus(batch.slug, batch.status)}
                        className={`px-3 py-1 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                          batch.status === 'open'
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        {batch.status === 'open' ? 'Buka' : 'Tutup'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-zinc-400">Status Rekap Data:</span>
                      <button
                        onClick={() => handleQuickToggleRekap(batch.slug, batch.rekapStatus || 'open')}
                        className={`px-3 py-1 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                          batch.rekapStatus === 'closed'
                            ? 'bg-amber-500 text-black hover:bg-amber-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {batch.rekapStatus === 'closed' ? '🔒 Frozen' : '🔓 Aktif'}
                      </button>
                    </div>
                  </div>

                  {/* ── Dedicated URL Links ── */}
                  <div className="pt-3 border-t border-gray-100 dark:border-white/5 space-y-2 text-xs">
                    {/* Link 1: Detail Katalog */}
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800/60 p-2.5 rounded-xl">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Katalog:</span>
                        <span className="font-mono text-gray-700 dark:text-zinc-300 truncate text-[11px]">
                          {detailPath}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => copyToClipboard(detailUrl, `cat-${batch.slug}`)}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500"
                          title="Salin Link Katalog"
                        >
                          {copiedLink === `cat-${batch.slug}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <Link
                          href={detailPath}
                          target="_blank"
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-blue-500"
                          title="Buka Halaman Detail"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Link 2: Form Pre-Order */}
                    <div className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[10px] font-bold text-blue-500 uppercase">Form PO:</span>
                        <span className="font-mono text-blue-700 dark:text-blue-300 truncate text-[11px]">
                          {poPath}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => copyToClipboard(poFormUrl, `po-${batch.slug}`)}
                          className="p-1 rounded hover:bg-blue-100 dark:hover:bg-zinc-700 text-blue-600"
                          title="Salin Link Form Pre-Order"
                        >
                          {copiedLink === `po-${batch.slug}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <Link
                          href={`/store/${batch.slug}/pre-order`}
                          target="_blank"
                          className="p-1 rounded hover:bg-blue-100 dark:hover:bg-zinc-700 text-blue-600"
                          title="Buka Form Pre-Order"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Link 3: Rekap Orders */}
                    <Link
                      href={`/admin/rekap-new-batch?batch=${batch.slug}`}
                      className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Lihat Rekapitulasi Pesanan</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT BATCH MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingSlug ? 'Edit Batch Jersey' : 'Buat Batch Pre-Order Baru'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Atur nama, slug URL, harga, dan varian warna untuk batch ini
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBatchForm} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Nama Batch *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingSlug) {
                        setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                      }
                    }}
                    placeholder="Contoh: Jersey DLOB All-Star 2026"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-800 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Slug URL (Unik) *
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="all-star-2026"
                    required
                    disabled={!!editingSlug && (editingSlug === 'new-batch-2026' || editingSlug === 'official')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-800 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Link PO: /store/{formSlug || 'slug'}/pre-order
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Tagline / Edisi
                </label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="Contoh: Fresh Colors · Dewasa, Kids & Balita Edition"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Deskripsi Lengkap
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Status Pre-Order
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs font-bold text-gray-900 dark:text-white"
                  >
                    <option value="open">🟢 DIBUKA (Menerima Pesanan)</option>
                    <option value="closed">🔴 DITUTUP (Form Dikunci)</option>
                    <option value="coming-soon">⏳ SEGERA HADIR (Preview Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Status Rekap Data
                  </label>
                  <select
                    value={formRekapStatus}
                    onChange={(e) => setFormRekapStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs font-bold text-gray-900 dark:text-white"
                  >
                    <option value="open">🔓 AKTIF (Dapat Diedit)</option>
                    <option value="closed">🔒 DIKUNCI / FREEZE (Final Vendor)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Pesan Khusus Saat Pre-Order Ditutup
                </label>
                <textarea
                  rows={2}
                  value={formClosedMessage}
                  onChange={(e) => setFormClosedMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs text-gray-900 dark:text-white"
                />
              </div>

              {/* Warna List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">
                    Varian Warna Jersey ({formColors.length})
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormColors([
                        ...formColors,
                        { id: `c-${Date.now()}`, name: 'Warna Baru', color: '#000000', images: [] },
                      ])
                    }
                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah Warna
                  </button>
                </div>

                <div className="space-y-2">
                  {formColors.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 p-2.5 rounded-xl">
                      <input
                        type="color"
                        value={c.color}
                        onChange={(e) => {
                          const updated = [...formColors];
                          updated[i].color = e.target.value;
                          setFormColors(updated);
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-gray-300"
                      />
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const updated = [...formColors];
                          updated[i].name = e.target.value;
                          setFormColors(updated);
                        }}
                        placeholder="Nama Warna (e.g. Biru Navy)"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white"
                      />
                      {formColors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormColors(formColors.filter((_, idx) => idx !== i))}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingSlug ? 'Simpan Perubahan' : 'Buat Batch Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
