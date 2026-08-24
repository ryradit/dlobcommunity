'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, ChevronRight, Plus, Trash2, ShoppingBag, Copy, Expand, Sparkles, Info } from 'lucide-react';
import SmartCropImage from '@/components/SmartCropImage';

// ── Constants & Size Data ────────────────────────────────────
export type SizeCategory = 'dewasa' | 'kids' | 'balita';

export interface SizeOption {
  id: string; // 'XS'..'3XL', 'Kids S'..'Kids XL', 'Balita XS'..'Balita XL'
  label: string;
  category: SizeCategory;
  keterangan?: string;
  tinggi: number;
  lebar: number;
  pendekPrice: number;
  panjangPrice: number;
}

export const sizeOptions: SizeOption[] = [
  // Dewasa (Adult)
  { id: 'XS', label: 'XS', category: 'dewasa', tinggi: 65, lebar: 45, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'S', label: 'S', category: 'dewasa', tinggi: 68, lebar: 48, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'M', label: 'M', category: 'dewasa', tinggi: 71, lebar: 51, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'L', label: 'L', category: 'dewasa', tinggi: 74, lebar: 54, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'XL', label: 'XL', category: 'dewasa', tinggi: 77, lebar: 57, pendekPrice: 110000, panjangPrice: 120000 },
  { id: 'XXL', label: 'XXL', category: 'dewasa', tinggi: 80, lebar: 62, pendekPrice: 120000, panjangPrice: 130000 },
  { id: '3XL', label: '3XL', category: 'dewasa', tinggi: 83, lebar: 65, pendekPrice: 130000, panjangPrice: 140000 },

  // Kids (7-13 Tahun) - 100k
  { id: 'Kids S', label: 'S', category: 'kids', keterangan: '7-8 TAHUN', tinggi: 57, lebar: 43, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Kids M', label: 'M', category: 'kids', keterangan: '8-9 TAHUN', tinggi: 59, lebar: 44, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Kids L', label: 'L', category: 'kids', keterangan: '10-11 TAHUN', tinggi: 62, lebar: 46, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Kids XL', label: 'XL', category: 'kids', keterangan: '12-13 TAHUN', tinggi: 65, lebar: 48, pendekPrice: 100000, panjangPrice: 110000 },

  // Balita (1-6 Tahun) - 100k
  { id: 'Balita XS', label: 'XS', category: 'balita', keterangan: '1 - 2 TAHUN', tinggi: 36, lebar: 28, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Balita S', label: 'S', category: 'balita', keterangan: '2 - 3 TAHUN', tinggi: 40, lebar: 31, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Balita M', label: 'M', category: 'balita', keterangan: '3 - 4 TAHUN', tinggi: 43, lebar: 34, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Balita L', label: 'L', category: 'balita', keterangan: '4 - 5 TAHUN', tinggi: 45, lebar: 36, pendekPrice: 100000, panjangPrice: 110000 },
  { id: 'Balita XL', label: 'XL', category: 'balita', keterangan: '5 - 6 TAHUN', tinggi: 47, lebar: 38, pendekPrice: 100000, panjangPrice: 110000 },
];

const warnaOptions = [
  {
    value: 'biru',
    label: 'Blue',
    color: '#0b244c',
    images: [
      '/images/new jersey promotion/biru-photo1.jpeg',
      '/images/new jersey promotion/biru-photo2.jpeg',
    ],
  },
  {
    value: 'kuning',
    label: 'Yellow',
    color: '#FFC000',
    images: [
      '/images/new jersey promotion/kuning-photo1.jpeg',
      '/images/new jersey promotion/kuning-photo2.jpeg',
    ],
  },
  {
    value: 'merah',
    label: 'Red',
    color: '#ff0000',
    images: [
      '/images/new jersey promotion/merah-photo1.jpeg',
      '/images/new jersey promotion/merah-photo2.jpeg',
      '/images/new jersey promotion/merah-photo3.jpeg',
      '/images/new jersey promotion/merah-photo4.jpeg',
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────
function getSizePrice(size: string, sleeve: string): number {
  const item = sizeOptions.find((s) => s.id === size);
  if (!item) {
    if (size.startsWith('Kids') || size.startsWith('Balita')) {
      return 100000 + (sleeve === 'panjang' ? 10000 : 0);
    }
    let base = 110000;
    if (size === 'XXL') base = 120000;
    if (size === '3XL') base = 130000;
    return base + (sleeve === 'panjang' ? 10000 : 0);
  }
  return sleeve === 'panjang' ? item.panjangPrice : item.pendekPrice;
}

function formatRp(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(n);
}

// ── Types ────────────────────────────────────────────────────
interface OrderItem {
  id: string;
  warna: string;
  kategoriUkuran: SizeCategory;
  ukuran: string;
  lengan: 'pendek' | 'panjang';
  namaPunggung: string;
  tanpaNamaPunggung: boolean;
  imgIdx: number;
}

function emptyItem(): OrderItem {
  return {
    id: Math.random().toString(36).slice(2),
    warna: '',
    kategoriUkuran: 'dewasa',
    ukuran: '',
    lengan: 'pendek',
    namaPunggung: '',
    tanpaNamaPunggung: false,
    imgIdx: 0,
  };
}

// ── Item Card Component ───────────────────────────────────────
function ItemCard({
  item,
  index,
  total,
  onChange,
  onRemove,
  onShowSizeGuide,
  onShowAIRecommend,
  onZoom,
}: {
  item: OrderItem;
  index: number;
  total: number;
  onChange: (patch: Partial<OrderItem>) => void;
  onRemove: () => void;
  onShowSizeGuide: () => void;
  onShowAIRecommend: () => void;
  onZoom: (src: string) => void;
}) {
  const selectedWarna = warnaOptions.find((w) => w.value === item.warna);
  const imgIdx = item.imgIdx ?? 0;
  const currentCategory = item.kategoriUkuran || 'dewasa';
  const availableSizes = sizeOptions.filter((s) => s.category === currentCategory);

  return (
    <div className="border-2 border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">
            {index + 1}
          </div>
          <span className="font-semibold text-gray-900 text-sm">
            Jersey #{index + 1}
            {selectedWarna && item.ukuran && (
              <span className="ml-2 text-gray-400 font-normal">
                — {selectedWarna.label} / {item.ukuran} ({formatRp(getSizePrice(item.ukuran, item.lengan))})
              </span>
            )}
          </span>
        </div>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">

        {/* ── Warna ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">1. Pilih Warna *</label>
          <div className="grid grid-cols-3 gap-3">
            {warnaOptions.map((w) => {
              const selected = item.warna === w.value;
              return (
                <div
                  key={w.value}
                  onClick={() => onChange({ warna: w.value, imgIdx: 0 })}
                  className={`cursor-pointer border-2 rounded-2xl overflow-hidden transition-all ${
                    selected ? 'border-black shadow-md' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="relative aspect-[3/4] bg-gray-100">
                    <SmartCropImage src={w.images[item.warna === w.value ? imgIdx : 0]} alt={w.label} name={w.label} />
                    {/* Zoom button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onZoom(w.images[item.warna === w.value ? imgIdx : 0]);
                      }}
                      className="absolute top-2 left-2 w-7 h-7 bg-black/50 hover:bg-black rounded-lg flex items-center justify-center transition-colors z-10"
                      title="Zoom foto"
                    >
                      <Expand className="w-3.5 h-3.5 text-white" />
                    </button>
                    {/* Image dots */}
                    {w.images.length > 1 && selected && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {w.images.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onChange({ imgIdx: i }); }}
                            className={`rounded-full transition-all ${
                              i === imgIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    {selected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-black rounded-full flex items-center justify-center shadow-md">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2.5 flex items-center gap-2 bg-white">
                    <div className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0 shadow-xs" style={{ backgroundColor: w.color }} />
                    <span className="text-xs font-bold text-gray-900">{w.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Kategori & Ukuran ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <label className="text-sm font-semibold text-gray-700">2. Pilih Tipe &amp; Ukuran *</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onShowAIRecommend}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>D&apos;LOB AI Rekomendasi Ukuran</span>
              </button>
              <button
                type="button"
                onClick={onShowSizeGuide}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1"
              >
                📏 Panduan Ukuran
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 rounded-full mb-4">
            <button
              type="button"
              onClick={() => {
                onChange({ kategoriUkuran: 'dewasa', ukuran: '' });
              }}
              className={`py-2 px-3 text-xs font-bold rounded-full transition-all ${
                currentCategory === 'dewasa'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              👤 Dewasa (110k)
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ kategoriUkuran: 'kids', ukuran: '' });
              }}
              className={`py-2 px-3 text-xs font-bold rounded-full transition-all ${
                currentCategory === 'kids'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              👦 Kids (100k)
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ kategoriUkuran: 'balita', ukuran: '' });
              }}
              className={`py-2 px-3 text-xs font-bold rounded-full transition-all ${
                currentCategory === 'balita'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              👶 Balita (100k)
            </button>
          </div>

          {/* Size Pills for Active Category */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {availableSizes.map((s) => {
              const isSelected = item.ukuran === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChange({ ukuran: s.id })}
                  className={`py-3 px-2 text-center border-2 rounded-2xl transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-black bg-black text-white shadow-md'
                      : 'border-gray-200 text-gray-700 hover:border-black hover:bg-gray-50'
                  }`}
                >
                  <span className="font-bold text-sm">{s.label}</span>
                  {s.keterangan && (
                    <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                      {s.keterangan}
                    </span>
                  )}
                  <span className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {s.tinggi}x{s.lebar}cm
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Lengan ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">3. Pilihan Lengan</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'pendek', label: 'Lengan Pendek', extra: 'Standar' },
              { value: 'panjang', label: 'Lengan Panjang', extra: '+Rp 10.000' },
            ].map((l) => (
              <button
                key={l.value}
                type="button"
                onClick={() => onChange({ lengan: l.value as 'pendek' | 'panjang' })}
                className={`py-3 px-4 text-xs font-semibold border-2 rounded-full transition-all flex items-center justify-between ${
                  item.lengan === l.value
                    ? 'border-black bg-black text-white shadow-sm'
                    : 'border-gray-200 text-gray-700 hover:border-black'
                }`}
              >
                <span>{l.label}</span>
                <span className={`text-[11px] font-medium ${item.lengan === l.value ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {l.extra}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Nama Punggung ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">4. Nama Punggung (Opsional)</label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-black">
              <input
                type="checkbox"
                checked={item.tanpaNamaPunggung}
                onChange={(e) =>
                  onChange({
                    tanpaNamaPunggung: e.target.checked,
                    namaPunggung: e.target.checked ? '' : item.namaPunggung,
                  })
                }
                className="w-4 h-4 rounded text-black focus:ring-black border-gray-300"
              />
              Tanpa nama punggung
            </label>
          </div>
          {!item.tanpaNamaPunggung && (
            <input
              type="text"
              value={item.namaPunggung}
              onChange={(e) => onChange({ namaPunggung: e.target.value.toUpperCase() })}
              placeholder="Contoh: RYAN, KEVIN, ADIT"
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-semibold tracking-wider uppercase focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          )}
        </div>

      </div>
    </div>
  );
}

import AISizeRecommenderModal from '@/components/store/AISizeRecommenderModal';

// ── Main Page Component ──────────────────────────────────────
export default function NewBatchPreOrderPage() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [noWa, setNoWa] = useState('');
  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sizeGuideTab, setSizeGuideTab] = useState<SizeCategory>('dewasa');
  const [aiModalIndex, setAiModalIndex] = useState<number | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [copiedRek, setCopiedRek] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const grandTotal = items.reduce((sum, it) => {
    if (!it.ukuran) return sum;
    return sum + getSizePrice(it.ukuran, it.lengan);
  }, 0);

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const updateItem = (index: number, patch: Partial<OrderItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (!nama.trim()) { alert('Mohon isi nama lengkap'); return false; }
    if (!noWa.trim() || noWa.length < 9) { alert('Mohon isi nomor WhatsApp yang valid'); return false; }
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
          nama: nama.trim(),
          noWa: noWa.trim(),
          items: items.map((it) => ({
            warna: it.warna,
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

  const copyAmount = () => {
    navigator.clipboard.writeText(grandTotal.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // ── Success View ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border-2 border-black rounded-3xl p-8 sm:p-10 max-w-lg w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl shadow-md">
            ✓
          </div>
          <h2 className="text-2xl font-light text-gray-900 mb-2">Pre-Order Diterima!</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Terima kasih, <strong className="text-gray-900">{nama}</strong>! Pesanan Anda untuk{' '}
            <strong className="text-gray-900">{items.length} jersey</strong> telah kami catat.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8 text-left">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Rekening Pembayaran</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">BCA 1082386054</p>
                <p className="text-xs text-gray-600">a.n. Ryan Radityatama</p>
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
              href={`https://wa.me/6281387643604?text=${encodeURIComponent(`Halo kak Ryan, saya ${nama} ingin konfirmasi pembayaran pre-order Jersey DLOB New Batch.\n\nTotal: ${formatRp(grandTotal)}\nNo. rekening: BCA 1082386054\n\n[lampirkan bukti transfer]`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm uppercase tracking-widest rounded-full flex items-center justify-center gap-2 transition-all shadow-md"
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

  // ── Form View ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Image Zoom Modal ── */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <img src={zoomImage} alt="Zoom preview" className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl" />
        </div>
      )}

      {/* ── AI Size Recommender Modal ── */}
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

      {/* ── Size Guide Modal (3 Tables: Adult, Kids, Balita) ── */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📏 Panduan Ukuran Jersey DLOB New Batch
              </h3>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center text-lg"
              >
                ✕
              </button>
            </div>

            {/* Category Selector Tabs inside Modal */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-full mb-6">
              <button
                type="button"
                onClick={() => setSizeGuideTab('dewasa')}
                className={`py-2 px-3 text-xs font-bold rounded-full transition-all ${
                  sizeGuideTab === 'dewasa' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
                }`}
              >
                Dewasa (110k)
              </button>
              <button
                type="button"
                onClick={() => setSizeGuideTab('kids')}
                className={`py-2 px-3 text-xs font-bold rounded-full transition-all ${
                  sizeGuideTab === 'kids' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
                }`}
              >
                Kids (100k)
              </button>
              <button
                type="button"
                onClick={() => setSizeGuideTab('balita')}
                className={`py-2 px-3 text-xs font-bold rounded-full transition-all ${
                  sizeGuideTab === 'balita' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
                }`}
              >
                Balita 👶 (100k)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50 text-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">Size</th>
                    <th className="text-left py-3 px-4 font-semibold">Keterangan</th>
                    <th className="text-right py-3 px-4 font-semibold">Tinggi (cm)</th>
                    <th className="text-right py-3 px-4 font-semibold">Lebar (cm)</th>
                    <th className="text-right py-3 px-4 font-semibold">Harga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sizeOptions
                    .filter((s) => s.category === sizeGuideTab)
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-gray-900">{s.label}</td>
                        <td className="py-3 px-4 text-gray-600">{s.keterangan || 'Dewasa Standard'}</td>
                        <td className="text-right py-3 px-4 font-mono">{s.tinggi}</td>
                        <td className="text-right py-3 px-4 font-mono">{s.lebar}</td>
                        <td className="text-right py-3 px-4 font-mono font-bold text-emerald-600">
                          {formatRp(s.pendekPrice)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">💡 Catatan:</p>
              <p>• Satuan ukuran dalam Centimeter (cm) dengan toleransi jahitan ±2cm.</p>
              <p>• Lengan panjang dikenakan tambahan +Rp 10.000 dari harga lengan pendek.</p>
            </div>

            <button
              onClick={() => setShowSizeGuide(false)}
              className="mt-6 w-full py-3.5 bg-black text-white font-semibold text-sm rounded-full hover:bg-gray-800 transition-all shadow-md"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-zinc-950 text-white border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => router.push('/store')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs uppercase tracking-wider mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Katalog
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Form Pre-Order Online</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight mb-3">
            Pre-Order <span className="font-bold italic">Jersey DLOB New Batch</span>
          </h1>
          <p className="text-zinc-300 text-sm max-w-lg leading-relaxed">
            Tersedia untuk ukuran <strong>Dewasa (Rp 110k)</strong>, <strong>Kids (Rp 100k)</strong>, dan <strong>Balita 👶 (Rp 100k)</strong>. Bisa memesan lebih dari satu jersey sekaligus!
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
              Pesanan mulai diproses ke tahap produksi pabrik setelah kuota minimum <strong>15 order</strong> terkumpul. Kami akan mengonfirmasi detail dan status pesanan Anda via WhatsApp. 🏸
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl px-6 py-3 text-xs text-blue-900">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span><strong>Catatan Logo:</strong> Logo di gambar dan video hanya contoh, aslinya sekarang sudah menggunakan logo official D&apos;LOB.</span>
        </div>
      </div>

      {/* Form Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">

          {/* ── Data Pemesan ── */}
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
                  placeholder="Contoh: Ryan Radityatama"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nomor WhatsApp Aktif *</label>
                <input
                  type="tel"
                  value={noWa}
                  onChange={(e) => setNoWa(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>
            </div>
          </div>

          {/* ── List Jersey Items ── */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                <h2 className="text-base font-bold text-gray-900">Detail Pilihan Jersey</h2>
              </div>
              <span className="text-xs text-gray-500 font-semibold">{items.length} Jersey Terpilih</span>
            </div>

            {items.map((item, index) => (
              <ItemCard
                key={item.id}
                item={item}
                index={index}
                total={items.length}
                onChange={(patch) => updateItem(index, patch)}
                onRemove={() => removeItem(index)}
                onShowSizeGuide={() => setShowSizeGuide(true)}
                onShowAIRecommend={() => setAiModalIndex(index)}
                onZoom={(src) => setZoomImage(src)}
              />
            ))}

            <button
              type="button"
              onClick={addItem}
              className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-black rounded-3xl text-sm font-bold text-gray-700 hover:text-black flex items-center justify-center gap-2 transition-all bg-white hover:bg-gray-50 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jersey Lainnya (+1)</span>
            </button>
          </div>

          {/* ── Ringkasan & Submit Bar ── */}
          <div className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Total Estimasi Pembayaran</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
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
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm uppercase tracking-widest rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
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

      {/* ── Confirmation Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="bg-black text-white p-6">
              <p className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-1">Konfirmasi Pesanan</p>
              <h3 className="text-xl font-bold">Pastikan pesanan sudah sesuai</h3>
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
              </div>

              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={it.id} className="p-3.5 rounded-2xl border border-gray-200 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">
                        Jersey #{i + 1} — {warnaOptions.find((w) => w.value === it.warna)?.label} ({it.ukuran})
                      </p>
                      <p className="text-gray-500 text-[11px] mt-0.5">
                        {it.lengan === 'panjang' ? 'Lengan Panjang' : 'Lengan Pendek'} • {it.tanpaNamaPunggung ? 'Tanpa nama punggung' : `Nama: ${it.namaPunggung || '-'}`}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-gray-900">
                      {formatRp(getSizePrice(it.ukuran, it.lengan))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-zinc-950 text-white rounded-2xl flex justify-between items-center">
                <span className="text-xs font-semibold text-zinc-300">Total ({items.length} item):</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{formatRp(grandTotal)}</span>
              </div>
            </div>

            <div className="p-6 pt-2 space-y-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm uppercase tracking-widest rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Konfirmasi & Kirim Pesanan'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-full transition-all"
              >
                Ubah Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
