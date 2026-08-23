import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ServiceHealth {
  name: string;
  category: string;
  status: 'operational' | 'degraded' | 'down' | 'not_configured';
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutErrorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutErrorMsg)), ms)),
  ]);
}

export async function GET(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const services: Record<string, ServiceHealth> = {};

  // ── 1. Google Gemini AI Check ──────────────────────────────────────
  const geminiStart = Date.now();
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_AI_API_KEY;

  if (!geminiKey || geminiKey.trim() === '' || geminiKey === 'your_gemini_api_key_here') {
    services.gemini = {
      name: 'Google Gemini AI',
      category: 'Artificial Intelligence',
      status: 'not_configured',
      message: 'GEMINI_API_KEY is not configured in .env',
    };
  } else {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Run lightweight ping with 6-second timeout
      await withTimeout(
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: '1' }] }],
          generationConfig: { maxOutputTokens: 2, temperature: 0 },
        }),
        6000,
        'Gemini API timeout (>6s)'
      );

      const latencyMs = Date.now() - geminiStart;

      services.gemini = {
        name: 'Google Gemini AI',
        category: 'Artificial Intelligence',
        status: latencyMs > 3500 ? 'degraded' : 'operational',
        latencyMs,
        message: 'Layanan AI beroperasi normal (gemini-2.5-flash)',
        details: { model: 'gemini-2.5-flash' },
      };
    } catch (err: any) {
      const latencyMs = Date.now() - geminiStart;
      const errMsg = err?.message || String(err);

      let status: ServiceHealth['status'] = 'down';
      let message = 'Layanan Gemini tidak dapat dijangkau';

      if (
        errMsg.includes('429') ||
        errMsg.toLowerCase().includes('quota') ||
        errMsg.toLowerCase().includes('resource exhausted')
      ) {
        status = 'degraded';
        message = 'Batas kuota tercapai (Rate Limit 429) — fallback otomatis aktif';
      } else if (errMsg.includes('401') || errMsg.includes('403') || errMsg.toLowerCase().includes('api key')) {
        status = 'down';
        message = 'API Key Gemini tidak valid atau kadaluarsa';
      } else if (errMsg.includes('timeout')) {
        status = 'degraded';
        message = 'Respons lambat (>6s) — fallback otomatis aktif';
      } else if (errMsg.includes('500') || errMsg.includes('503')) {
        status = 'down';
        message = 'Server Gemini sedang pemeliharaan / down (503)';
      }

      services.gemini = {
        name: 'Google Gemini AI',
        category: 'Artificial Intelligence',
        status,
        latencyMs,
        message,
        details: { error: errMsg.slice(0, 150) },
      };
    }
  }

  // ── 2. Supabase Database Check ─────────────────────────────────────
  const dbStart = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    services.supabase = {
      name: 'Supabase Database',
      category: 'Database & Auth',
      status: 'not_configured',
      message: 'Supabase URL atau Anon Key tidak ditemukan',
    };
  } else {
    try {
      const { error } = (await withTimeout(
        Promise.resolve(supabase.from('profiles').select('id').limit(1)),
        4000,
        'Supabase query timeout (>4s)'
      )) as any;

      const latencyMs = Date.now() - dbStart;

      if (error && !error.message.includes('permission denied')) {
        services.supabase = {
          name: 'Supabase Database',
          category: 'Database & Auth',
          status: 'down',
          latencyMs,
          message: `Database error: ${error.message}`,
        };
      } else {
        services.supabase = {
          name: 'Supabase Database',
          category: 'Database & Auth',
          status: latencyMs > 2000 ? 'degraded' : 'operational',
          latencyMs,
          message: 'Koneksi PostgreSQL & Auth beroperasi normal',
        };
      }
    } catch (err: any) {
      services.supabase = {
        name: 'Supabase Database',
        category: 'Database & Auth',
        status: 'down',
        latencyMs: Date.now() - dbStart,
        message: err?.message || 'Gagal terhubung ke Supabase',
      };
    }
  }

  // ── 3. Email Gateway Check ─────────────────────────────────────────
  const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_PASS);
  const hasResend = !!process.env.RESEND_API_KEY;
  services.email = {
    name: 'Email Gateway',
    category: 'Notifications & Auth',
    status: hasSmtp || hasResend ? 'operational' : 'not_configured',
    message: hasSmtp
      ? `SMTP Server Aktif (${process.env.SMTP_HOST})`
      : hasResend
      ? 'Resend API Aktif'
      : 'Email Gateway belum dikonfigurasi',
  };

  // ── 4. WhatsApp Gateway Check (Fonnte) ─────────────────────────────
  const fonnteToken = process.env.FONNTE_TOKEN;
  services.whatsapp = {
    name: 'WhatsApp Bot Gateway',
    category: 'Notifications & Alerts',
    status: fonnteToken ? 'operational' : 'not_configured',
    message: fonnteToken ? 'Fonnte Gateway Terhubung' : 'FONNTE_TOKEN belum dikonfigurasi',
  };

  // ── Summary Status ─────────────────────────────────────────────────
  const hasDown = Object.values(services).some((s) => s.status === 'down');
  const hasDegraded = Object.values(services).some((s) => s.status === 'degraded');
  const overallStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy';

  const healthPayload = {
    status: overallStatus,
    timestamp,
    services,
  };

  // Check if request prefers HTML (e.g. user opens in browser)
  const acceptHeader = req.headers.get('accept') || '';
  const isHtml = acceptHeader.includes('text/html') && !req.nextUrl.searchParams.get('json');

  if (isHtml) {
    const statusColor =
      overallStatus === 'healthy'
        ? '#10b981'
        : overallStatus === 'degraded'
        ? '#f59e0b'
        : '#ef4444';

    const statusTitle =
      overallStatus === 'healthy'
        ? 'Semua Layanan Beroperasi Normal'
        : overallStatus === 'degraded'
        ? 'Sebagian Layanan Mengalami Degradasi / Fallback Aktif'
        : 'Beberapa Layanan Mengalami Gangguan';

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DLOB Community - Status & Diagnostik Sistem</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #09090b;
      color: #f4f4f5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    .container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #a1a1aa;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 14px;
      color: #71717a;
    }
    .banner {
      background: rgba(24, 24, 27, 0.8);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
    }
    .banner-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .pulse-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: ${statusColor};
      box-shadow: 0 0 20px ${statusColor};
      animation: pulse 2s infinite ease-in-out;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.7; }
    }
    .banner-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
    }
    .banner-time {
      font-size: 12px;
      color: #71717a;
      margin-top: 2px;
    }
    .btn-refresh {
      background: #27272a;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 10px 20px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-refresh:hover {
      background: #3f3f46;
      transform: scale(1.02);
    }
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    @media (min-width: 640px) {
      .cards-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .service-card {
      background: rgba(24, 24, 27, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: border-color 0.2s;
    }
    .service-card:hover {
      border-color: rgba(255, 255, 255, 0.2);
    }
    .card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .card-name {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
    }
    .card-cat {
      font-size: 11px;
      color: #71717a;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .tag {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .tag-operational { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .tag-degraded { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .tag-down { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .tag-not_configured { background: rgba(113, 113, 122, 0.15); color: #a1a1aa; border: 1px solid rgba(113, 113, 122, 0.3); }
    .card-msg {
      font-size: 13px;
      color: #a1a1aa;
      line-height: 1.5;
      margin-bottom: 14px;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 12px;
      color: #71717a;
    }
    .latency {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 600;
      color: #38bdf8;
    }
    .footer-links {
      text-align: center;
      margin-top: 24px;
      font-size: 13px;
      color: #71717a;
      display: flex;
      justify-content: center;
      gap: 16px;
    }
    .footer-links a {
      color: #a1a1aa;
      text-decoration: none;
      transition: color 0.2s;
    }
    .footer-links a:hover {
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">DLOB Live Diagnostics</div>
      <h1>Status &amp; Kesehatan Layanan</h1>
      <p class="subtitle">Pemantauan performa real-time untuk Google Gemini AI, Supabase DB, dan Gateway Notifikasi</p>
    </div>

    <div class="banner">
      <div class="banner-left">
        <div class="pulse-dot"></div>
        <div>
          <div class="banner-title">${statusTitle}</div>
          <div class="banner-time">Pemeriksaan terakhir: ${new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</div>
        </div>
      </div>
      <a href="/api/health" class="btn-refresh">🔄 Cek Ulang</a>
    </div>

    <div class="cards-grid">
      ${Object.values(services)
        .map((s) => {
          const tagClass = `tag-${s.status}`;
          const tagLabel =
            s.status === 'operational'
              ? 'Operational'
              : s.status === 'degraded'
              ? 'Degraded'
              : s.status === 'down'
              ? 'Down'
              : 'Unconfigured';

          return `
      <div class="service-card">
        <div>
          <div class="card-top">
            <div>
              <div class="card-cat">${s.category}</div>
              <div class="card-name">${s.name}</div>
            </div>
            <span class="tag ${tagClass}">${tagLabel}</span>
          </div>
          <div class="card-msg">${s.message || '-'}</div>
        </div>
        <div class="card-footer">
          <span>Status Respons</span>
          ${
            s.latencyMs !== undefined
              ? `<span class="latency">${s.latencyMs} ms</span>`
              : `<span style="color:#71717a">N/A</span>`
          }
        </div>
      </div>`;
        })
        .join('')}
    </div>

    <div class="footer-links">
      <a href="/admin">← Kembali ke Dashboard Admin</a>
      <span>·</span>
      <a href="/">Beranda</a>
      <span>·</span>
      <a href="/api/health?json=true">Buka Raw JSON</a>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  return NextResponse.json(healthPayload, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
