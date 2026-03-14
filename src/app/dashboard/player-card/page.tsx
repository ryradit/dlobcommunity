'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft,
  Download,
  ImagePlus,
  Loader2,
  Palette,
  RefreshCw,
  Sparkles,
  Upload,
} from 'lucide-react';

type TemplateId = 'official' | 'noir';
type ThemeId = 'navy' | 'noir' | 'emerald' | 'crimson' | 'violet' | 'gold';

interface Membership {
  payment_status: 'pending' | 'paid' | 'cancelled' | 'rejected' | null;
}

interface PlayerCardHistoryItem {
  id: string;
  template_id: TemplateId;
  theme_id: ThemeId;
  status: 'processing' | 'generated' | 'completed' | 'failed';
  background_image_url: string | null;
  final_card_url: string | null;
  source_image_url: string | null;
  failure_reason: string | null;
  created_at: string;
}

const MONTHLY_SUCCESS_LIMIT = 1;
const MONTHLY_ATTEMPT_LIMIT = 3;

const templateOptions: Array<{ id: TemplateId; label: string; subtitle: string; gradient: string }> = [
  {
    id: 'official',
    label: 'Official',
    subtitle: 'Classic DLOB energy',
    gradient: 'from-sky-500 to-indigo-700',
  },
  {
    id: 'noir',
    label: 'Noir',
    subtitle: 'Dark premium edition',
    gradient: 'from-zinc-700 to-black',
  },
];

const themeOptions: Array<{
  id: ThemeId;
  label: string;
  accent: string;
  panel: string;
  glow: string;
  ring: string;
  text: string;
}> = [
  { id: 'navy', label: 'Navy', accent: '#3b82f6', panel: '#0f172a', glow: 'rgba(59,130,246,0.28)', ring: 'ring-blue-400/40', text: '#dbeafe' },
  { id: 'noir', label: 'Noir', accent: '#f8fafc', panel: '#09090b', glow: 'rgba(255,255,255,0.16)', ring: 'ring-white/30', text: '#f4f4f5' },
  { id: 'emerald', label: 'Emerald', accent: '#10b981', panel: '#052e2b', glow: 'rgba(16,185,129,0.28)', ring: 'ring-emerald-400/40', text: '#d1fae5' },
  { id: 'crimson', label: 'Crimson', accent: '#ef4444', panel: '#3b0a0a', glow: 'rgba(239,68,68,0.25)', ring: 'ring-red-400/40', text: '#fee2e2' },
  { id: 'violet', label: 'Violet', accent: '#8b5cf6', panel: '#22103b', glow: 'rgba(139,92,246,0.28)', ring: 'ring-violet-400/40', text: '#ede9fe' },
  { id: 'gold', label: 'Gold', accent: '#f59e0b', panel: '#3b2a08', glow: 'rgba(245,158,11,0.28)', ring: 'ring-amber-400/40', text: '#fef3c7' },
];

export default function PlayerCardPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [memberName, setMemberName] = useState('Member DLOB');
  const [matchCount, setMatchCount] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [membershipStatus, setMembershipStatus] = useState<'Aktif' | 'Belum Aktif'>('Belum Aktif');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('official');
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('navy');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<PlayerCardHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setHistoryItems([]);
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);

    try {
      const { data, error } = await supabase
        .from('player_card_generations')
        .select('id, template_id, theme_id, status, background_image_url, final_card_url, source_image_url, failure_reason, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) {
        throw error;
      }

      setHistoryItems((data as PlayerCardHistoryItem[] | null) || []);
    } catch (error) {
      console.error('Failed to load player card history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadMemberData() {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        const displayName = (profile?.full_name || user.user_metadata?.full_name || profile?.email?.split('@')[0] || user.email?.split('@')[0] || 'Member DLOB').trim();
        const queryName = displayName;

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const [{ data: matches }, { data: membership }] = await Promise.all([
          supabase
            .from('match_members')
            .select('id, payment_status')
            .ilike('member_name', queryName),
          supabase
            .from('memberships')
            .select('payment_status')
            .ilike('member_name', queryName)
            .eq('month', currentMonth)
            .eq('year', currentYear)
            .maybeSingle(),
        ]);

        if (!active) return;

        setMemberName(displayName);
        setMatchCount(matches?.length || 0);
        setPaidCount(matches?.filter((item) => item.payment_status === 'paid').length || 0);
        setMembershipStatus((membership as Membership | null)?.payment_status === 'paid' ? 'Aktif' : 'Belum Aktif');
      } catch (error) {
        console.error('Failed to load player card data:', error);
      }
    }

    loadMemberData();
    loadHistory();

    return () => {
      active = false;
    };
  }, [user, loadHistory]);

  useEffect(() => {
    return () => {
      if (uploadedImageUrl) {
        URL.revokeObjectURL(uploadedImageUrl);
      }
    };
  }, [uploadedImageUrl]);

  const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;

  const monthlySuccessUsed = useMemo(
    () => historyItems.filter((item) => item.status === 'completed' && `${new Date(item.created_at).getFullYear()}-${new Date(item.created_at).getMonth()}` === currentMonthKey).length,
    [historyItems, currentMonthKey]
  );

  const monthlyAttemptsUsed = useMemo(
    () => historyItems.filter((item) => ['processing', 'generated', 'completed'].includes(item.status) && `${new Date(item.created_at).getFullYear()}-${new Date(item.created_at).getMonth()}` === currentMonthKey).length,
    [historyItems, currentMonthKey]
  );

  const handleSelectTemplate = (templateId: TemplateId) => {
    setSelectedTemplate(templateId);
    if (templateId === 'official' && selectedTheme === 'noir') setSelectedTheme('navy');
    if (templateId === 'noir' && selectedTheme === 'navy') setSelectedTheme('noir');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setHasGenerated(false);
    setGeneratedCardUrl(null);
    setGenerationId(null);
    setSourceImageUrl(null);

    if (!file.type.startsWith('image/')) {
      setErrorMessage('File harus berupa gambar.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran gambar maksimal 5MB untuk MVP ini.');
      return;
    }

    if (uploadedImageUrl) {
      URL.revokeObjectURL(uploadedImageUrl);
    }

    const nextUrl = URL.createObjectURL(file);
    setUploadedImageUrl(nextUrl);
    setUploadedFile(file);
    setUploadedImageName(file.name);
  };

  const handleGenerate = async () => {
    if (!uploadedFile || !uploadedImageUrl || !user) {
      setErrorMessage('Upload foto terbaik Anda terlebih dahulu.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGenerating(true);

    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
        reader.readAsDataURL(uploadedFile);
      });

      const response = await fetch('/api/ai/player-card/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl,
          userId: user.id,
          memberName,
          templateId: selectedTemplate,
          themeId: selectedTheme,
          matchCount,
          paidCount,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Gagal membuat player card dengan Vertex');
      }

      setGenerationId(result.generation.id);
      setGeneratedCardUrl(result.generation.finalCardUrl);
      setSourceImageUrl(result.generation.sourceImageUrl);
      setHasGenerated(true);
      setSuccessMessage('Player card lengkap berhasil dibuat oleh Vertex AI! Tersimpan di Supabase.');
      await loadHistory();
    } catch (error: any) {
      console.error('Generate player card failed:', error);
      setErrorMessage(error?.message || 'Gagal membuat player card');
      setHasGenerated(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setHasGenerated(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setGeneratedCardUrl(null);
    setGenerationId(null);
    setSourceImageUrl(null);
  };

  const handleDownload = () => {
    if (!generatedCardUrl) return;
    const link = document.createElement('a');
    link.href = generatedCardUrl;
    link.download = `DLOB_Player_Card_${memberName.replace(/\s+/g, '_')}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-4 lg:py-8 pr-4 lg:pr-8 pl-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">AI Player Card</h1>
            <p className="mt-2 text-gray-700 dark:text-zinc-300 max-w-3xl">
              Vertex AI Imagen 3 menghasilkan player card lengkap Anda — foto dan preferensi (template, nuansa) menjadi panduan AI untuk membuat satu kartu final berkualitas tinggi.
            </p>
          </div>
          <div className="rounded-2xl border border-violet-300/70 bg-violet-50 dark:bg-violet-500/10 px-4 py-3 text-sm text-violet-800 dark:text-violet-300 max-w-sm">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5" />
              <div>
                <p className="font-semibold">Full Vertex AI Generation</p>
                <p className="mt-1">Foto Anda menjadi referensi subjek — Imagen 3 membuat player card lengkap sekaligus.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-zinc-400">Limit sukses bulanan</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{monthlySuccessUsed}/{MONTHLY_SUCCESS_LIMIT}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">Hanya card berstatus selesai yang dihitung.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-5 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-zinc-400">Limit percobaan bulanan</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{monthlyAttemptsUsed}/{MONTHLY_ATTEMPT_LIMIT}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">Menghitung `processing`, `generated`, dan `completed`.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-8 items-start">
          <div className="space-y-6">
            <section className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. Upload foto terbaik</h2>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 dark:border-white/15 rounded-2xl p-6 text-left hover:border-blue-400 dark:hover:border-blue-400/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                    <ImagePlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Pilih foto portrait / half-body</p>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">Wajah jelas, cahaya cukup, maksimal 5MB.</p>
                  </div>
                </div>
                {uploadedImageName && (
                  <p className="mt-4 text-sm font-medium text-blue-700 dark:text-blue-300">File terpilih: {uploadedImageName}</p>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploadedImageUrl && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-zinc-800">
                  <img src={uploadedImageUrl} alt="Preview upload" className="w-full h-72 object-cover object-top" />
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Pilih template jersey</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templateOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectTemplate(option.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${selectedTemplate === option.id ? 'border-gray-900 dark:border-white shadow-md' : 'border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30'}`}
                  >
                    <div className={`h-24 rounded-xl bg-linear-to-br ${option.gradient}`} />
                    <p className="mt-3 font-semibold text-gray-900 dark:text-white">{option.label}</p>
                    <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">{option.subtitle}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. Pilih nuansa kartu</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {themeOptions.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`rounded-2xl border p-3 text-left transition-all ${selectedTheme === theme.id ? `border-gray-900 dark:border-white ring-2 ${theme.ring}` : 'border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/30'}`}
                  >
                    <div className="h-14 rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.panel} 5%, ${theme.accent} 100%)` }} />
                    <p className="mt-2 font-semibold text-sm text-gray-900 dark:text-white">{theme.label}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-sm p-6">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 text-white px-5 py-3 font-semibold hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate AI Player Card
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 dark:border-white/15 px-5 py-3 font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Preview
                </button>
              </div>
              {errorMessage && <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">{errorMessage}</p>}
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hasil AI Player Card</h2>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Dibuat penuh oleh Vertex AI Imagen 3 — foto, branding, dan nuansa kartu diintegrasikan langsung.</p>
                </div>
                {generatedCardUrl && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 text-white px-4 py-2.5 font-semibold hover:bg-blue-500 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>

              {successMessage && <p className="mb-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">{successMessage}</p>}

              <div className="rounded-3xl bg-gray-100 dark:bg-zinc-950/80 p-4 flex items-center justify-center min-h-120">
                {generatedCardUrl ? (
                  <img
                    src={generatedCardUrl}
                    alt="AI generated player card"
                    className="w-full max-w-sm rounded-3xl shadow-2xl object-contain"
                  />
                ) : (
                  <div className="text-center px-6 py-10">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-violet-500" />
                    </div>
                    <p className="text-base font-semibold text-gray-800 dark:text-white">Siap dibuat oleh Vertex AI</p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400 max-w-xs mx-auto">
                      Upload foto Anda, pilih template dan nuansa kartu, lalu klik Generate. Vertex AI Imagen 3 akan membuat player card lengkap dalam satu proses.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-sm p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My generated cards</h2>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Riwayat hasil generate Anda dari Supabase.</p>
                </div>
                <button
                  type="button"
                  onClick={loadHistory}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-white/15 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {historyLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="h-24 rounded-2xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
                  ))}
                </div>
              ) : historyItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 px-5 py-8 text-center text-sm text-gray-600 dark:text-zinc-400">
                  Belum ada riwayat generate. Generate card pertama Anda untuk mulai mengisi galeri ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {historyItems.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                      <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 p-4">
                        <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 h-28">
                          {item.final_card_url || item.background_image_url ? (
                            <img src={item.final_card_url || item.background_image_url || undefined} alt="Generated player card" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-zinc-400">No preview</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white uppercase">{item.template_id}</span>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 uppercase">{item.theme_id}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full uppercase font-semibold ${item.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : item.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-zinc-400">
                            {new Date(item.created_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {item.failure_reason && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{item.failure_reason}</p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium">
                            {item.final_card_url && (
                              <a href={item.final_card_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                Final card
                              </a>
                            )}
                            {item.background_image_url && (
                              <a href={item.background_image_url} target="_blank" rel="noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline">
                                Background
                              </a>
                            )}
                            {item.source_image_url && (
                              <a href={item.source_image_url} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                                Source image
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
