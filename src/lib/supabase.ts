import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    // createBrowserClient from @supabase/ssr handles document.cookie, path: '/',
    // and cookie chunking automatically when cookies option is omitted.
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        debug: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'dlob-web-app',
        },
      },
    });
  }
  return supabaseInstance;
}

// Export for compatibility
export const supabase = getSupabase();
