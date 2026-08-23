'use client';

import { useState, useEffect } from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Cpu, Database, Mail, MessageSquare, HardDrive, ShieldCheck } from 'lucide-react';

interface ServiceHealth {
  name?: string;
  status: 'operational' | 'degraded' | 'down' | 'not_configured';
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
}

interface IncidentItem {
  id: string;
  title: string;
  service_name: string;
  impact: string;
  status: string;
  description?: string;
  resolution?: string;
  started_at: string;
  resolved_at?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: {
    gemini?: ServiceHealth;
    supabase?: ServiceHealth;
    email?: ServiceHealth;
    whatsapp?: ServiceHealth;
    gdrive?: ServiceHealth;
  };
  incidents?: IncidentItem[];
}

export default function SystemHealthMonitor() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (res.ok) {
        const data: HealthResponse = await res.json();
        setHealthData(data);
        setLastChecked(new Date().toLocaleTimeString('id-ID'));
      }
    } catch (err) {
      console.error('Failed to fetch health check:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Auto check every 3 minutes
    const interval = setInterval(fetchHealth, 180000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status?: ServiceHealth['status']) => {
    switch (status) {
      case 'operational':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Operational
          </span>
        );
      case 'degraded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            Quota / Slow
          </span>
        );
      case 'down':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            <XCircle className="w-3 h-3" />
            Error / Down
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
            Unconfigured
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-linear-to-br from-teal-500/20 to-[#3e6461]/20 border border-teal-500/30 text-[#3e6461] dark:text-teal-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Status API, Quota &amp; Layanan Eksternal
              {healthData?.status === 'healthy' && (
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              )}
              {healthData?.status === 'degraded' && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              )}
              {healthData?.status === 'down' && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Diagnostik real-time Gemini, Supabase, Google Drive Quota, Email, dan Bot WhatsApp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastChecked && (
            <span className="text-xs text-gray-400 dark:text-zinc-500">
              Pembaruan: {lastChecked}
            </span>
          )}
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Mengecek...' : 'Cek Status'}</span>
          </button>
        </div>
      </div>

      {/* Grid of 5 services */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-5">
        {/* Gemini AI Card */}
        <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/70 dark:border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">Google Gemini</span>
              </div>
              {getStatusBadge(healthData?.services?.gemini?.status)}
            </div>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1 line-clamp-2">
              {healthData?.services?.gemini?.message || 'Memeriksa status...'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-200/50 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-500">
            <span>LLM Engine</span>
            {healthData?.services?.gemini?.latencyMs !== undefined && (
              <span className="font-mono text-blue-500 font-semibold">
                {healthData.services.gemini.latencyMs}ms
              </span>
            )}
          </div>
        </div>

        {/* Supabase Database Card */}
        <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/70 dark:border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">Supabase DB</span>
              </div>
              {getStatusBadge(healthData?.services?.supabase?.status)}
            </div>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1 line-clamp-2">
              {healthData?.services?.supabase?.message || 'Memeriksa status...'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-200/50 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-500">
            <span>PostgreSQL</span>
            {healthData?.services?.supabase?.latencyMs !== undefined && (
              <span className="font-mono text-emerald-500 font-semibold">
                {healthData.services.supabase.latencyMs}ms
              </span>
            )}
          </div>
        </div>

        {/* Google Drive Storage Card */}
        <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/70 dark:border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <HardDrive className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">Google Drive</span>
              </div>
              {getStatusBadge(healthData?.services?.gdrive?.status)}
            </div>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1 line-clamp-2">
              {healthData?.services?.gdrive?.message || 'Memeriksa status...'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-200/50 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-500">
            <span>Media Quota</span>
            {healthData?.services?.gdrive?.latencyMs !== undefined && (
              <span className="font-mono text-amber-500 font-semibold">
                {healthData.services.gdrive.latencyMs}ms
              </span>
            )}
          </div>
        </div>

        {/* Resend / Email Card */}
        <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/70 dark:border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">Email Server</span>
              </div>
              {getStatusBadge(healthData?.services?.email?.status)}
            </div>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1 line-clamp-2">
              {healthData?.services?.email?.message || 'Memeriksa status...'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-200/50 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-500">
            <span>SMTP DreamHost</span>
            <span className="font-semibold text-purple-500">Active</span>
          </div>
        </div>

        {/* WhatsApp Gateway Card */}
        <div className="bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/70 dark:border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">WhatsApp Bot</span>
              </div>
              {getStatusBadge(healthData?.services?.whatsapp?.status)}
            </div>
            <p className="text-xs text-gray-600 dark:text-zinc-400 mb-1 line-clamp-2">
              {healthData?.services?.whatsapp?.message || 'Memeriksa status...'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-200/50 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-500">
            <span>Fonnte Bot</span>
            <span className="font-semibold text-green-500">Active</span>
          </div>
        </div>
      </div>

      {/* Info notice when degraded or down */}
      {healthData?.status === 'degraded' && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Catatan Sistem:</strong> Salah satu layanan mengalami degradasi respons atau limit kuota Google Drive/Gemini. Riwayat insiden telah dicatat di Supabase secara otomatis.
          </span>
        </div>
      )}

      {/* Supabase Incidents Log preview */}
      {healthData?.incidents && healthData.incidents.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              Riwayat Insiden Terakhir (Tercatat di Supabase)
            </span>
            <a
              href="/api/health"
              target="_blank"
              className="text-[11px] text-[#3e6461] dark:text-teal-400 hover:underline font-semibold"
            >
              Buka Status Page Lengkap →
            </a>
          </div>
          <div className="space-y-2">
            {healthData.incidents.slice(0, 2).map((inc) => (
              <div
                key={inc.id}
                className="text-xs p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800/30 border border-gray-200/50 dark:border-white/5 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white mr-2">{inc.title}</span>
                  <span className="text-gray-500 text-[11px]">{new Date(inc.started_at).toLocaleDateString('id-ID')}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 uppercase">
                  {inc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
