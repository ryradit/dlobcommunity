import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Global singleton pattern - stored on window object to persist across chunks in production
declare global {
  interface Window {
    __supabaseClient?: SupabaseClient;
  }
}

function getSupabaseClient(): SupabaseClient {
  // In browser, use global window object to ensure single instance across all chunks
  if (typeof window !== 'undefined') {
    if (!window.__supabaseClient) {
      window.__supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce',
          storage: window.localStorage,
        },
      });
    }
    return window.__supabaseClient;
  }
  
  // Server-side: create a new instance (won't have AbortError issues)
  return createClient(supabaseUrl, supabaseKey);
}

export const supabase = getSupabaseClient();

// Demo mode flag - set to false when Supabase credentials are properly configured
export const isDemoMode = !supabaseUrl || !supabaseKey || 
                         supabaseUrl === '' || 
                         supabaseKey === '';