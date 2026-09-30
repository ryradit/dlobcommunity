'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Plus,
  Trash2,
  ShoppingBag,
  Copy,
  Sparkles,
  Info,
  AlertCircle,
  Lock
} from 'lucide-react';
import AISizeRecommenderModal from '@/components/store/AISizeRecommenderModal';
import { JerseyBatch, DEFAULT_JERSEY_BATCHES } from '@/lib/jerseyBatches';

const JERSEY_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@700&display=swap';

export type SizeCategory = 'dewasa' | 'kids' | 'balita';

export interface OrderItem {
  kategoriUkuran: SizeCategory;
  warna: string;
  ukuran: string;
  lengan: 'pendek' | 'panjang';
  namaPunggung: string;
  tanpaNamaPunggung: boolean;
}

function emptyItem(defaultColor: string = 'biru'): OrderItem {
  return {
    kategoriUkuran: 'dewasa',
    warna: defaultColor,
    ukuran: 'M',
    lengan: 'pendek',
    namaPunggung: '',
    tanpaNamaPunggung: false,
  };
}

function getSizePrice(size: string, sleeve: string): number {
  let base = 110000;
  if (size.startsWith('Kids') || size.startsWith('Balita')) {
    base = 100000;
  } else if (size === 'XXL') {
    base = 120000;
  } else if (size === '3XL') {
    base = 130000;
  }
  return base + (sleeve === 'panjang' ? 10000 : 0);
}

function formatRp(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

const sizeOptions = [
  // Dewasa
  { id: 'XS', label: 'XS', category: 'dewasa', keterangan: 'Dewasa Standar', tinggi: 65, lebar: 45, pendekPrice: 110000 },
  { id: 'S', label: 'S', category: 'dewasa', keterangan: 'Dewasa Standar', tinggi: 68, lebar: 48, pendekPrice: 110000 },
  { id: 'M', label: 'M', category: 'dewasa', keterangan: 'Dewasa Standar', tinggi: 71, lebar: 51, pendekPrice: 110000 },
  { id: 'L', label: 'L', category: 'dewasa', keterangan: 'Dewasa Standar', tinggi: 74, lebar: 54, pendekPrice: 110000 },
  { id: 'XL', label: 'XL', category: 'dewasa', keterangan: 'Dewasa Standar', tinggi: 77, lebar: 57, pendekPrice: 110000 },
  { id: 'XXL', label: 'XXL', category: 'dewasa', keterangan: 'Dewasa Big Size', tinggi: 80, lebar: 62, pendekPrice: 120000 },
  { id: '3XL', label: '3XL', category: 'dewasa', keterangan: 'Dewasa Jumbo', tinggi: 83, lebar: 65, pendekPrice: 130000 },
  // Kids
  { id: 'Kids S', label: 'Kids S', category: 'kids', keterangan: '7-8 Thn', tinggi: 57, lebar: 43, pendekPrice: 100000 },
  { id: 'Kids M', label: 'Kids M', category: 'kids', keterangan: '8-9 Thn', tinggi: 59, lebar: 44, pendekPrice: 100000 },
  { id: 'Kids L', label: 'Kids L', category: 'kids', keterangan: '10-11 Thn', tinggi: 62, lebar: 46, pendekPrice: 100000 },
  { id: 'Kids XL', label: 'Kids XL', category: 'kids', keterangan: '12-13 Thn', tinggi: 65, lebar: 48, pendekPrice: 100000 },
  // Balita
  { id: 'Balita XS', label: 'Balita XS', category: 'balita', keterangan: '1-2 Thn', tinggi: 36, lebar: 28, pendekPrice: 100000 },
  { id: 'Balita S', label: 'Balita S', category: 'balita', keterangan: '2-3 Thn', tinggi: 40, lebar: 31, pendekPrice: 100000 },
  { id: 'Balita M', label: 'Balita M', category: 'balita', keterangan: '3-4 Thn', tinggi: 43, lebar: 34, pendekPrice: 100000 },
  { id: 'Balita L', label: 'Balita L', category: 'balita', keterangan: '4-5 Thn', tinggi: 45, lebar: 36, pendekPrice: 100000 },
  { id: 'Balita XL', label: 'Balita XL', category: 'balita', keterangan: '5-6 Thn', tinggi: 47, lebar: 38, pendekPrice: 100000 },
];

export default function DynamicBatchPreOrderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || 'official';

  const [batch, setBatch] = useState<JerseyBatch | null>(null);
  const [loadingBatch, setLoadingBatch] = useState(true);

  const [nama, setNama] = useState('');
  const [noWa, setNoWa] = useState('');
  const [email, setEmail] = useState('');
  const [items, setItems] = useState<OrderItem[]>([emptyItem('off-blue')]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sizeGuideTab, setSizeGuideTab] = useState<SizeCategory>('dewasa');
  const [aiModalIndex, setAiModalIndex] = useState<number | null>(null);
  const [copiedRek, setCopiedRek] = useState(false);

  useEffect(() => {
    if (slug === 'new-batch-2026' || slug === 'jersey-dlob-new-batch') {
      router.replace('/store/official/pre-order');
      return;
    }

    fetch(`/api/store/batches?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.batch) {
          setBatch(data.batch);
          if (data.batch.colorVariants?.[0]?.name) {
            const firstColor = data.batch.colorVariants[0].id || 'biru';
            setItems([emptyItem(firstColor)]);
          }
        } else {
          const found = DEFAULT_JERSEY_BATCHES.find((b) => b.slug === slug || b.id === slug);
          if (found) setBatch(found);
        }
      })
      .catch((err) => {
        console.error('Failed to load batch:', err);
        const found = DEFAULT_JERSEY_BATCHES.find((b) => b.slug === slug || b.id === slug);
        if (found) setBatch(found);
      })
      .finally(() => setLoadingBatch(false));
  }, [slug]);

  const grandTotal = items.reduce((sum, it) => {
    if (!it.ukuran) return sum;
    return sum + getSizePrice(it.ukuran, it.lengan);
  }, 0);

  const defaultColorId = batch?.colorVariants?.[0]?.id || 'biru';

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem(defaultColorId)]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, patch: Partial<OrderItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const validate = () => {
    if (!nama.trim()) { alert('Mohon isi nama lengkap'); return false; }
    if (!noWa.trim() || noWa.length < 9) { alert('Mohon isi nomor WhatsApp yang valid'); return false; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      alert('Format email tidak valid'); return false;
    }
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.warna) { alert(`Jersey #${i + 1}: Mohon pilih warna`); return false; }
      if (!it.ukuran) { alert(`Jersey #${i + 1}: Mohon pilih ukuran`); return false; }
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/new-batch-pre-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchSlug: batch?.slug || slug,
          batchName: batch?.name || 'New Batch 2026',
          nama: nama.trim(),
          noWa: noWa.trim(),
          email: email.trim() || null,
          items: items.map((it) => ({
            warna: it.warna.toLowerCase().includes('kuning') ? 'kuning' : it.warna.toLowerCase().includes('merah') ? 'merah' : 'biru',
            ukuran: it.ukuran,
            lengan: it.lengan,
            namaPunggung: it.tanpaNamaPunggung ? '' : it.namaPunggung.trim(),
            tanpaNamaPunggung: it.tanpaNamaPunggung,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal menyimpan pesanan');
      }

      setSubmitted(true);
      setShowConfirm(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRek = () => {
    navigator.clipboard.writeText('1082386054');
    setCopiedRek(true);
    setTimeout(() => setCopiedRek(false), 2000);
  };

  // ── 1. Loading View ──────────────────────────────────────────
  if (loadingBatch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 border-3 border-gray-300 border-t-black rounded-full animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Memeriksa status batch...</p>
        </div>
      </div>
    );
  }

  // ── 2. Batch Not Found View ──────────────────────────────────
  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full text-center shadow-lg space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Batch Tidak Ditemukan</h2>
          <p className="text-xs text-gray-500">
            Formulir pemesanan batch &ldquo;{slug}&rdquo; tidak tersedia.
          </p>
          <button
            onClick={() => router.push('/store')}
            className="w-full py-3 bg-black hover:bg-gray-800 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all"
          >
            Kembali ke Katalog Store
          </button>
        </div>
      </div>
    );
  }

  // ── 3. BATCH CLOSED GATE VIEW (DO NOT ENTER FORM PAGE) ───────
  if (batch.status === 'closed' || batch.status === 'coming-soon') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 max-w-lg w-full text-center shadow-xl space-y-6">
          <div className="w-16 h-16 bg-red-100 border border-red-200 rounded-full flex items-center justify-center mx-auto text-red-600">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
              {batch.badge || 'Batch Ditutup'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Pre-Order {batch.name} Telah Resmi Ditutup
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed pt-2">
              {batch.closedMessage || 'Pemesanan Pre-Order Jersey DLOB untuk batch ini saat ini telah resmi ditutup. Terima kasih atas antusiasme dan partisipasi seluruh member!'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-500 leading-relaxed space-y-1 text-left">
            <p className="font-semibold text-gray-800">🏸 Jadwal &amp; Batch Selanjutnya:</p>
            <p>Formulir pemesanan untuk edisi ini sedang dinonaktifkan. Pantau terus update resmi di grup komunitas untuk pembukaan batch berikutnya.</p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => router.push(`/store/${batch.slug}`)}
              className="w-full py-4 bg-black hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-widest rounded-full transition-all shadow-md flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Lihat Detail Jersey {batch.name}</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/store')}
              className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-full transition-all"
            >
              Kembali ke Katalog Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 4. Success View ──────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border-2 border-black rounded-3xl p-8 sm:p-10 max-w-lg w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-[#4382C8] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl shadow-md">
            ✓
          </div>
          <h2 className="text-2xl font-light text-gray-900 mb-2">Pre-Order Diterima!</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Terima kasih, <strong className="text-gray-900">{nama}</strong>! Pesanan Anda untuk{' '}
            <strong className="text-gray-900">{items.length} jersey ({batch.name})</strong> telah kami catat.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8 text-left">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Rekening Pembayaran</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">BCA 1082386054</p>
                <p className="text-xs text-gray-600">a.n. DLOB Community</p>
              </div>
              <button
                type="button"
                onClick={copyRek}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold transition-all"
              >
                {copiedRek ? 'Tersalin!' : 'Salin Rek'}
              </button>
            </div>
            <div className="pt-3 border-t border-blue-200/60 flex justify-between items-center">
              <span className="text-xs text-gray-600">Total Transfer:</span>
              <span className="text-lg font-bold text-blue-900">{formatRp(grandTotal)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={`https://wa.me/6281387643604?text=${encodeURIComponent(`Halo Admin DLOB, saya ${nama} ingin konfirmasi pembayaran pre-order ${batch.name}.\n\nTotal: ${formatRp(grandTotal)}\nNo. rekening: BCA 1082386054\n\n[lampirkan bukti transfer]`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-[#4382C8] hover:bg-[#356db0] text-white font-bold text-sm uppercase tracking-widest rounded-full flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span>Konfirmasi via WhatsApp</span>
              <ChevronRight className="w-4 h-4" />
            </a>
            <button
              onClick={() => router.push('/store')}
              className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-full transition-all"
            >
              Kembali ke Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 5. Active Order Form View ────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <AISizeRecommenderModal
        isOpen={aiModalIndex !== null}
        onClose={() => setAiModalIndex(null)}
        onApplySize={(cat, sizeId) => {
          if (aiModalIndex !== null) {
            updateItem(aiModalIndex, { kategoriUkuran: cat, ukuran: sizeId });
          }
        }}
        theme="light"
      />

      {/* Header Banner */}
      <div className="bg-zinc-950 text-white border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => router.push(`/store/${batch.slug}`)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs uppercase tracking-wider mb-6 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Detail {batch.name}</span>
          </button>
          <div className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#4382C8]/15 text-[#4382C8] border border-[#4382C8]/30 mb-3">
            Form Pre-Order Online · {batch.slug}
          </div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight mb-3">
            Pre-Order <span className="font-bold italic">{batch.name}</span>
          </h1>
          <p className="text-zinc-300 text-sm max-w-lg leading-relaxed">
            {batch.tagline}. Tersedia untuk ukuran Dewasa, Kids, dan Balita.
          </p>
        </div>
      </div>

      {/* Disclaimers */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-3">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-6 py-4">
          <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-amber-900 text-sm">Ketentuan Pre-Order</p>
            <p className="text-amber-800 text-xs sm:text-sm mt-0.5 leading-relaxed">
              Pesanan mulai diproses ke tahap produksi pabrik setelah kuota minimum terpenuhi. Konfirmasi dan nomor resi akan dikirim via WhatsApp. 🏸
            </p>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
          {/* 1. Data Pemesan */}
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
              <h2 className="text-base font-bold text-gray-900">Data Pemesan</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nama Lengkap *</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-black focus:outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">No. WhatsApp *</label>
                <input
                  type="tel"
                  value={noWa}
                  onChange={(e) => setNoWa(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-black focus:outline-none text-sm transition-all"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Email <span className="text-gray-400 font-normal">(opsional, untuk bukti &amp; kwitansi resmi)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-black focus:outline-none text-sm transition-all"
              />
            </div>
          </div>

          {/* 2. Items Picker */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                <h2 className="text-base font-bold text-gray-900">Pilihan Jersey ({items.length})</h2>
              </div>
            </div>

            {items.map((item, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="font-bold text-sm text-gray-900">Jersey #{index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>

                {/* Warna */}
                {batch.colorVariants.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Pilih Warna</label>
                    <div className="flex flex-wrap gap-2.5">
                      {batch.colorVariants.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => updateItem(index, { warna: v.id || v.name })}
                          className={`px-3.5 py-2 rounded-xl border-2 flex items-center gap-2 text-xs font-bold transition-all ${
                            item.warna === v.id || item.warna === v.name
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: v.color }} />
                          <span>{v.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Kategori Ukuran */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Kategori Ukuran</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { cat: 'dewasa' as const, label: 'Dewasa' },
                      { cat: 'kids' as const, label: 'Kids (7-13 Thn)' },
                      { cat: 'balita' as const, label: 'Balita 👶 (1-6 Thn)' },
                    ].map((c) => (
                      <button
                        key={c.cat}
                        type="button"
                        onClick={() => {
                          const firstInCat = sizeOptions.find((s) => s.category === c.cat);
                          updateItem(index, {
                            kategoriUkuran: c.cat,
                            ukuran: firstInCat ? firstInCat.id : 'M',
                          });
                        }}
                        className={`p-2.5 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                          item.kategoriUkuran === c.cat
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ukuran */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Ukuran: <span className="font-mono text-blue-600">{item.ukuran}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAiModalIndex(index)}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Rekomendasi AI</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions
                      .filter((s) => s.category === item.kategoriUkuran)
                      .map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => updateItem(index, { ukuran: s.id })}
                          className={`min-w-10 h-10 px-3 rounded-xl border text-xs font-bold transition-all ${
                            item.ukuran === s.id
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Lengan */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Jenis Lengan</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateItem(index, { lengan: 'pendek' })}
                      className={`p-2.5 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                        item.lengan === 'pendek' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      Lengan Pendek
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItem(index, { lengan: 'panjang' })}
                      className={`p-2.5 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                        item.lengan === 'panjang' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      Lengan Panjang (+10k)
                    </button>
                  </div>
                </div>

                {/* Nama Punggung */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Nama Punggung (Gratis)</label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.tanpaNamaPunggung}
                        onChange={(e) => updateItem(index, { tanpaNamaPunggung: e.target.checked })}
                        className="rounded text-black"
                      />
                      <span>Tanpa nama</span>
                    </label>
                  </div>
                  {!item.tanpaNamaPunggung && (
                    <input
                      type="text"
                      value={item.namaPunggung}
                      onChange={(e) => updateItem(index, { namaPunggung: e.target.value.toUpperCase() })}
                      placeholder="Contoh: RYAN"
                      maxLength={18}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 font-mono uppercase text-sm font-bold focus:border-black focus:outline-none"
                    />
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                  <span className="text-gray-500">Subtotal Jersey #{index + 1}:</span>
                  <span className="font-mono font-bold text-sm text-gray-900">
                    {formatRp(getSizePrice(item.ukuran, item.lengan))}
                  </span>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-black rounded-3xl text-sm font-bold text-gray-700 hover:text-black flex items-center justify-center gap-2 transition-all bg-white hover:bg-gray-50 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jersey Lainnya (+1)</span>
            </button>
          </div>

          {/* Ringkasan & Submit */}
          <div className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Total Estimasi Pembayaran</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#4382C8] font-mono">
                    {formatRp(grandTotal)}
                  </span>
                  <span className="text-xs text-zinc-400">({items.length} jersey)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (validate()) setShowConfirm(true);
                }}
                className="px-8 py-4 bg-[#4382C8] hover:bg-[#356db0] text-white hover:scale-[1.02] active:scale-[0.98] shadow-blue-950/30 font-bold text-sm uppercase tracking-widest rounded-full transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Lanjutkan Pemesanan</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 text-center">
              Setelah klik tombol di atas, Anda akan melihat konfirmasi ringkasan dan instruksi rekening transfer BCA.
            </p>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="bg-black text-white p-6">
              <p className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-1">Konfirmasi Pesanan</p>
              <h3 className="text-xl font-bold">{batch.name}</h3>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nama:</span>
                  <span className="font-bold text-gray-900">{nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">WhatsApp:</span>
                  <span className="font-bold text-gray-900">{noWa}</span>
                </div>
                {email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-bold text-gray-900">{email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Rincian Item</p>
                {items.map((it, i) => (
                  <div key={i} className="flex justify-between items-center text-xs p-3 bg-gray-50 rounded-xl">
                    <div>
                      <span className="font-bold text-gray-900">
                        #{i + 1} {it.warna.toUpperCase()} ({it.ukuran})
                      </span>
                      <span className="text-gray-500 ml-1">· {it.lengan}</span>
                      {it.namaPunggung && (
                        <p className="font-mono text-gray-700 text-[11px] mt-0.5">&ldquo;{it.namaPunggung}&rdquo;</p>
                      )}
                    </div>
                    <span className="font-mono font-bold text-gray-900">{formatRp(getSizePrice(it.ukuran, it.lengan))}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t flex justify-between items-center">
                <span className="font-bold text-sm text-gray-900">Total Pembayaran:</span>
                <span className="font-mono font-bold text-lg text-blue-600">{formatRp(grandTotal)}</span>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex-1 py-3 bg-[#4382C8] hover:bg-[#356db0] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses...' : 'Kirim Pesanan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
