'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, ChevronRight, Plus, Trash2, ShoppingBag, Copy, Expand } from 'lucide-react';
import SmartCropImage from '@/components/SmartCropImage';

// ── Constants ────────────────────────────────────────────────
const ukuranOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

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
    ],
  },
];

const sizeGuide = [
  { size: 'XS',  tinggi: 65, lebar: 45 },
  { size: 'S',   tinggi: 68, lebar: 48 },
  { size: 'M',   tinggi: 71, lebar: 51 },
  { size: 'L',   tinggi: 74, lebar: 54 },
  { size: 'XL',  tinggi: 77, lebar: 57 },
  { size: 'XXL', tinggi: 80, lebar: 62 },
  { size: '3XL', tinggi: 83, lebar: 65 },
];

// ── Helpers ──────────────────────────────────────────────────
function getSizePrice(size: string, sleeve: string): number {
  let base = 110000;
  if (size === 'XXL') base = 120000;
  if (size === '3XL') base = 130000;
  return base + (sleeve === 'panjang' ? 10000 : 0);
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
  ukuran: string;
  lengan: 'pendek' | 'panjang';
  namaPunggung: string;
  tanpaNamaPunggung: boolean;
  // per-color image carousel index
  imgIdx: number;
}

function emptyItem(): OrderItem {
  return {
    id: Math.random().toString(36).slice(2),
    warna: '',
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
  onZoom,
}: {
  item: OrderItem;
  index: number;
  total: number;
  onChange: (patch: Partial<OrderItem>) => void;
  onRemove: () => void;
  onShowSizeGuide: () => void;
  onZoom: (src: string) => void;
}) {
  const selectedWarna = warnaOptions.find((w) => w.value === item.warna);
  const imgIdx = item.imgIdx ?? 0;

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-white">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">
            {index + 1}
          </div>
          <span className="font-semibold text-gray-900 text-sm">
            Jersey #{index + 1}
            {selectedWarna && item.ukuran && (
              <span className="ml-2 text-gray-400 font-normal">
                — {selectedWarna.label} / {item.ukuran}
              </span>
            )}
          </span>
        </div>
        {total > 1 && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
        )}
      </div>

      <div className="p-5 space-y-6">

        {/* ── Warna ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Pilih Warna *</label>
          <div className="grid grid-cols-3 gap-3">
            {warnaOptions.map((w) => {
              const selected = item.warna === w.value;
              return (
                <div
                  key={w.value}
                  onClick={() => onChange({ warna: w.value, imgIdx: 0 })}
                  className={`cursor-pointer border-2 rounded-xl overflow-hidden transition-all ${
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
                      <div className="absolute top-2 right-2 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2 flex items-center gap-2 bg-white">
                    <div className="w-3 h-3 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: w.color }} />
                    <span className="text-xs font-semibold text-gray-900">{w.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Ukuran ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700">Pilih Ukuran *</label>
            <button type="button" onClick={onShowSizeGuide} className="text-xs text-blue-600 hover:underline font-medium">
              Panduan Ukuran
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {ukuranOptions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ukuran: s })}
                className={`py-2.5 text-xs font-semibold border-2 rounded-lg transition-all ${
                  item.ukuran === s
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-700 hover:border-black'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Lengan ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Pilih Lengan *</label>
          <div className="flex gap-3">
            {(['pendek', 'panjang'] as const).map((sleeve) => (
              <button
                key={sleeve}
                type="button"
                onClick={() => onChange({ lengan: sleeve })}
                className={`flex-1 py-2.5 text-xs font-semibold border-2 rounded-lg transition-all ${
                  item.lengan === sleeve
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-700 hover:border-black'
                }`}
              >
                {sleeve === 'pendek' ? 'Lengan Pendek' : 'Lengan Panjang (+Rp 10.000)'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Nama Punggung ── */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Nama di Punggung</label>
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={item.tanpaNamaPunggung}
              onChange={(e) => onChange({ tanpaNamaPunggung: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
            />
            <span className="text-sm text-gray-600">Tanpa nama di punggung</span>
          </label>
          {!item.tanpaNamaPunggung && (
            <input
              type="text"
              value={item.namaPunggung}
              onChange={(e) => onChange({ namaPunggung: e.target.value })}
              placeholder="Nama punggung jersey (maks 12 karakter)"
              maxLength={12}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none transition-colors"
            />
          )}
        </div>

        {/* ── Price chip ── */}
        {item.warna && item.ukuran && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-xs text-gray-500">{selectedWarna?.label} · {item.ukuran} · {item.lengan === 'panjang' ? 'Panjang' : 'Pendek'}</span>
            <span className="font-bold text-gray-900 text-sm">{formatRp(getSizePrice(item.ukuran, item.lengan))}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function NewBatchPreOrderPage() {
  const router = useRouter();

  const [nama, setNama] = useState('');
  const [noWa, setNoWa] = useState('');
  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const copyAccount = () => {
    navigator.clipboard.writeText('1082386054');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyAmount = () => {
    navigator.clipboard.writeText(String(grandTotal));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const updateItem = (id: string, patch: Partial<OrderItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const isItemValid = (it: OrderItem) =>
    it.warna && it.ukuran && (it.tanpaNamaPunggung || it.namaPunggung.trim());

  const isFormValid = nama.trim() && noWa.trim() && items.every(isItemValid);

  const grandTotal = items.reduce(
    (sum, it) => sum + (it.warna && it.ukuran ? getSizePrice(it.ukuran, it.lengan) : 0),
    0
  );

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setShowConfirm(false);
    setIsSubmitting(true);

    try {
      const payload = {
        nama,
        noWa,
        items: items.map((it) => ({
          warna: it.warna,
          ukuran: it.ukuran,
          lengan: it.lengan,
          namaPunggung: it.namaPunggung,
          tanpaNamaPunggung: it.tanpaNamaPunggung,
        })),
      };

      const res = await fetch('/api/new-batch-pre-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pre-order');

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(`Terjadi kesalahan: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success Screen ───────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-light text-gray-900 mb-2 tracking-tight">
            Pre-Order <span className="font-bold">Berhasil!</span>
          </h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            Terima kasih, <span className="font-semibold text-gray-800">{nama}</span>!
            Pre-order <span className="font-semibold">{items.length} jersey</span> New Batch Anda sudah kami terima.
            Kami akan menghubungi via WhatsApp <span className="font-semibold">{noWa}</span> untuk konfirmasi pembayaran.
          </p>

          {/* Order summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left mb-6 space-y-3 text-sm">
            {items.map((it, i) => {
              const w = warnaOptions.find((w) => w.value === it.warna);
              return (
                <div key={it.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-semibold text-gray-900">Jersey #{i + 1} — {w?.label} / {it.ukuran}</p>
                    <p className="text-gray-400 text-xs">
                      {it.lengan === 'panjang' ? 'Lengan Panjang' : 'Lengan Pendek'}
                      {' · '}
                      {it.tanpaNamaPunggung ? 'Tanpa nama' : it.namaPunggung}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900">{formatRp(getSizePrice(it.ukuran, it.lengan))}</span>
                </div>
              );
            })}
            <div className="flex justify-between pt-2 text-base">
              <span className="font-bold text-gray-900">Total ({items.length} jersey)</span>
              <span className="font-bold text-gray-900">{formatRp(grandTotal)}</span>
            </div>
          </div>

          {/* Payment info */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 text-left mb-6">
            <p className="text-xs uppercase tracking-widest text-blue-500 font-semibold mb-3">💳 Langkah Selanjutnya — Transfer Pembayaran</p>
            <div className="bg-white border border-blue-100 rounded-xl px-5 py-4 mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Bank BCA</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-2xl font-bold text-gray-900 tracking-widest">1082386054</p>
                  <button
                    type="button"
                    onClick={copyAccount}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      copied
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-black hover:text-black'
                    }`}
                  >
                    {copied ? (
                      <><CheckCircle className="w-3.5 h-3.5" />Tersalin!</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" />Salin</>
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">a/n <span className="font-semibold text-gray-900">Ryan Radityatama</span></p>
              </div>
              <div className="text-3xl select-none">🏦</div>
            </div>
            <div className="flex justify-between items-center bg-white border border-blue-100 rounded-xl px-5 py-3 mb-3">
              <span className="text-sm text-gray-500">Jumlah transfer</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-blue-700">{formatRp(grandTotal)}</span>
                <button
                  type="button"
                  onClick={copyAmount}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    copiedAmount
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-black hover:text-black'
                  }`}
                >
                  {copiedAmount ? (
                    <><CheckCircle className="w-3.5 h-3.5" />Tersalin!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" />Salin</>
                  )}
                </button>
              </div>
            </div>
            <div className="mt-1">
              <p className="text-xs text-blue-600 leading-relaxed mb-3">
                Setelah transfer, kirim <strong>bukti pembayaran</strong> via WhatsApp ke nomor di bawah. Pesanan akan dikonfirmasi setelah pembayaran diterima.
              </p>
              <a
                href={`https://wa.me/6281387643604?text=${encodeURIComponent(`Halo kak Ryan, saya ${nama} ingin konfirmasi pre-order Jersey DLOB New Batch.\n\nTotal transfer: ${formatRp(grandTotal)}\nNo. rekening: BCA 1082386054\n\n[lampirkan bukti transfer]`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full bg-green-500 hover:bg-green-600 hover:scale-[1.02] active:scale-[0.98] text-white rounded-full px-6 py-3.5 transition-all shadow-md"
              >
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.122 1.526 5.855L.057 23.882l6.163-1.617A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.814 9.814 0 01-5.003-1.37l-.359-.213-3.72.976.993-3.63-.234-.373A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs text-green-100 leading-none mb-0.5">Kirim bukti transfer ke</p>
                    <p className="font-bold text-sm leading-none">081387643604</p>
                  </div>
                </div>
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white opacity-70 shrink-0"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => router.push('/store')} className="w-full py-4 bg-black text-white font-semibold text-sm uppercase tracking-widest rounded-full hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
              Kembali ke Store
            </button>
            <button onClick={() => router.push('/')} className="w-full py-4 border border-gray-300 text-gray-700 font-semibold text-sm uppercase tracking-widest rounded-full hover:border-black hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all">
              Ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">

      {/* ── Image Zoom Modal ── */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-10 right-0 flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
            >
              Tutup <span className="text-lg leading-none">×</span>
            </button>
            <img
              src={zoomImage}
              alt="Zoom jersey"
              className="w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
            {/* Modal header */}
            <div className="bg-black px-6 py-5">
              <p className="text-xs uppercase tracking-widest text-white/50 mb-1">Konfirmasi Pesanan</p>
              <h3 className="text-xl font-bold text-white">Pastikan pesanan sudah benar</h3>
            </div>

            {/* Order details */}
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Customer */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nama</span>
                  <span className="font-semibold text-gray-900">{nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">No. WhatsApp</span>
                  <span className="font-semibold text-gray-900">{noWa}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {items.map((it, i) => {
                  const w = warnaOptions.find((w) => w.value === it.warna);
                  return (
                    <div key={it.id} className="border border-gray-200 rounded-xl p-4 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900">Jersey #{i + 1}</span>
                        <span className="font-bold text-gray-900">{formatRp(getSizePrice(it.ukuran, it.lengan))}</span>
                      </div>
                      <div className="space-y-1 text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: w?.color }} />
                          <span>{w?.label} · {it.ukuran} · {it.lengan === 'panjang' ? 'Lengan Panjang' : 'Lengan Pendek'}</span>
                        </div>
                        <p>Nama punggung: <span className="font-medium text-gray-700">{it.tanpaNamaPunggung ? 'Tanpa nama' : it.namaPunggung}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grand total */}
              <div className="flex justify-between items-center bg-black text-white rounded-xl px-5 py-4">
                <span className="text-sm font-medium">Total ({items.length} jersey)</span>
                <span className="text-xl font-bold">{formatRp(grandTotal)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 pt-2 flex flex-col gap-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 bg-black text-white font-bold text-sm uppercase tracking-widest rounded-full hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {isSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</>
                ) : (
                  <>✅ Konfirmasi &amp; Pesan</>
                )}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full py-3.5 border-2 border-gray-200 text-gray-700 font-semibold text-sm rounded-full hover:border-black hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                ← Kembali &amp; Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">📏 Panduan Ukuran</h3>
                <button onClick={() => setShowSizeGuide(false)} className="text-gray-400 hover:text-gray-900 text-2xl font-light">×</button>
              </div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold">Ukuran</th>
                    <th className="text-right py-3 px-4 font-semibold">Tinggi (cm)</th>
                    <th className="text-right py-3 px-4 font-semibold">Lebar (cm)</th>
                    <th className="text-right py-3 px-4 font-semibold">Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeGuide.map((g, i) => (
                    <tr key={g.size} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="py-3 px-4 font-semibold">{g.size}</td>
                      <td className="text-right py-3 px-4">{g.tinggi}</td>
                      <td className="text-right py-3 px-4">{g.lebar}</td>
                      <td className="text-right py-3 px-4 font-semibold">{formatRp(getSizePrice(g.size, 'pendek'))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-4">Toleransi ±2cm. Lengan panjang +Rp 10.000.</p>
              <button onClick={() => setShowSizeGuide(false)} className="mt-6 w-full py-3.5 bg-black text-white font-semibold text-sm rounded-full hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => router.push('/store')}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Store
          </button>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50 mb-2">Jersey DLOB · New Batch</p>
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight mb-3">
            Pre-Order <span className="font-bold italic">New Batch</span>
          </h1>
          <p className="text-white/60 text-sm max-w-md leading-relaxed">
            Hadir dalam 3 warna eksklusif — Blue, Yellow, dan Red. Bisa pesan lebih dari satu jersey sekaligus!
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-3">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4">
          <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Informasi Pre-Order</p>
            <p className="text-amber-700 text-sm mt-0.5">
              Pesanan mulai diproses setelah kuota minimum <strong>15 order</strong> terpenuhi.
              Kami akan menghubungi Anda via WhatsApp untuk konfirmasi pembayaran. 🏸
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 text-xs text-blue-900">
          <span className="text-blue-600 font-bold">💡 Catatan Logo:</span>
          <span>Logo di gambar dan video hanya contoh, aslinya sekarang sudah menggunakan logo official D&apos;LOB.</span>
        </div>
      </div>

      {/* Form Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">

          {/* ── Data Diri ── */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
              <h2 className="text-lg font-semibold text-gray-900">Data Diri</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Lengkap *</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  required
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">No. WhatsApp *</label>
                <input
                  type="tel"
                  value={noWa}
                  onChange={(e) => setNoWa(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  required
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-black focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* ── Jersey Items ── */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Detail Jersey
                  <span className="ml-2 text-sm font-normal text-gray-400">({items.length} jersey)</span>
                </h2>
              </div>
            </div>

            <div className="space-y-5">
              {items.map((item, index) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  total={items.length}
                  onChange={(patch) => updateItem(item.id, patch)}
                  onRemove={() => removeItem(item.id)}
                  onShowSizeGuide={() => setShowSizeGuide(true)}
                  onZoom={setZoomImage}
                />
              ))}
            </div>

            {/* Add Jersey Button */}
            <button
              type="button"
              onClick={addItem}
              className="mt-5 w-full py-4 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center gap-2 text-gray-500 hover:border-black hover:text-black transition-all font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Jersey Lagi
            </button>
          </div>

          <div className="border-t border-gray-100" />

          {/* ── Order Summary ── */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-4 h-4 text-gray-700" />
              <h3 className="text-base font-bold text-gray-900">Ringkasan Pesanan</h3>
            </div>

            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between text-gray-500">
                <span>Nama</span><span className="font-medium text-gray-900">{nama || '—'}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>No. WA</span><span className="font-medium text-gray-900">{noWa || '—'}</span>
              </div>
            </div>

            {items.some((it) => it.warna && it.ukuran) && (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                {items.map((it, i) => {
                  if (!it.warna || !it.ukuran) return null;
                  const w = warnaOptions.find((w) => w.value === it.warna);
                  return (
                    <div key={it.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Jersey #{i + 1} · {w?.label} / {it.ukuran} / {it.lengan === 'panjang' ? 'Panjang' : 'Pendek'}
                      </span>
                      <span className="font-semibold text-gray-900">{formatRp(getSizePrice(it.ukuran, it.lengan))}</span>
                    </div>
                  );
                })}
                <div className="flex justify-between border-t border-gray-200 pt-3 mt-2 text-base">
                  <span className="font-bold text-gray-900">Total ({items.length} jersey)</span>
                  <span className="font-bold text-gray-900">{formatRp(grandTotal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Submit ── */}
          <div>
            <button
              type="button"
              onClick={() => isFormValid && setShowConfirm(true)}
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-4 font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-full ${
                isFormValid && !isSubmitting
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  Pre-Order {items.length > 1 ? `${items.length} Jersey` : 'Sekarang'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
            {!isFormValid && (
              <p className="text-xs text-red-500 text-center mt-3">
                Harap lengkapi semua field yang wajib diisi (*)
              </p>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
