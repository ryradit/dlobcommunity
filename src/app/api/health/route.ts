import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ServiceHealth {
  status: 'operational' | 'degraded' | 'down' | 'not_configured';
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
}

// Timeout wrapper helper
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutErrorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutErrorMsg)), ms)
    ),
  ]);
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const services: Record<string, ServiceHealth> = {};

  // ── 1. Google Gemini AI Check ──────────────────────────────────────
  const geminiStart = Date.now();
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey || geminiKey.trim() === '' || geminiKey === 'your_gemini_api_key_here') {
    services.gemini = {
      status: 'not_configured',
      message: 'GEMINI_API_KEY is not set in environment variables',
    };
  } else {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Run lightweight ping with 6-second timeout
      const result = await withTimeout(
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: '1' }] }],
          generationConfig: { maxOutputTokens: 2, temperature: 0 },
        }),
        6000,
        'Gemini API timeout (>6s)'
      );

      const latencyMs = Date.now() - geminiStart;
      const text = result?.response?.text();

      services.gemini = {
        status: latencyMs > 3500 ? 'degraded' : 'operational',
        latencyMs,
        message: 'Operational',
        details: {
          model: 'gemini-2.5-flash',
          testedAt: new Date().toLocaleTimeString('id-ID'),
        },
      };
    } catch (err: any) {
      const latencyMs = Date.now() - geminiStart;
      const errMsg = err?.message || String(err);

      let status: ServiceHealth['status'] = 'down';
      let message = 'Gemini service unreachable';

      if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource exhausted')) {
        status = 'degraded';
        message = 'Quota Limit Reached (Rate Limited - 429)';
      } else if (errMsg.includes('401') || errMsg.includes('403') || errMsg.toLowerCase().includes('api key')) {
        status = 'down';
        message = 'Invalid API Key';
      } else if (errMsg.includes('timeout')) {
        status = 'degraded';
        message = 'High Latency / Timeout';
      } else if (errMsg.includes('500') || errMsg.includes('503')) {
        status = 'down';
        message = 'Gemini Server Maintenance / Down (503)';
      }

      services.gemini = {
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
      status: 'not_configured',
      message: 'Supabase URL or Anon Key is missing',
    };
  } else {
    try {
      const { error } = (await withTimeout(
        Promise.resolve(supabase.from('app_settings').select('id').limit(1)),
        4000,
        'Supabase query timeout (>4s)'
      )) as any;

      const latencyMs = Date.now() - dbStart;

      if (error && !error.message.includes('permission denied')) {
        services.supabase = {
          status: 'down',
          latencyMs,
          message: `Database error: ${error.message}`,
        };
      } else {
        services.supabase = {
          status: latencyMs > 2000 ? 'degraded' : 'operational',
          latencyMs,
          message: 'Operational',
        };
      }
    } catch (err: any) {
      services.supabase = {
        status: 'down',
        latencyMs: Date.now() - dbStart,
        message: err?.message || 'Failed to connect to Supabase',
      };
    }
  }

  // ── 3. Resend / Email Service ──────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  services.email = {
    status: resendKey ? 'operational' : 'not_configured',
    message: resendKey ? 'Configured' : 'RESEND_API_KEY not configured',
  };

  // ── 4. WhatsApp Notification Gateway (Fonnte) ─────────────────────
  const fonnteToken = process.env.FONNTE_TOKEN;
  services.whatsapp = {
    status: fonnteToken ? 'operational' : 'not_configured',
    message: fonnteToken ? 'Gateway Configured' : 'FONNTE_TOKEN not configured',
  };

  // ── Summary Status ─────────────────────────────────────────────────
  const hasDown = Object.values(services).some(s => s.status === 'down');
  const hasDegraded = Object.values(services).some(s => s.status === 'degraded');
  const overallStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy';

  return NextResponse.json({
    status: overallStatus,
    timestamp,
    services,
  });
}
