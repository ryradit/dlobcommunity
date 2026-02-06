import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Global singleton pattern - stored on window object to persist across chunks in production
declare global {
  interface Window {
    __supabaseClient?: SupabaseClient;
    __supabaseClientInitializing?: boolean;
  }
}

let browserClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  // In browser, use SSR browser client for proper cookie-based PKCE flow
  if (typeof window !== 'undefined') {
    // Return existing client if already created
    if (browserClient) {
      return browserClient;
    }
    
    if (window.__supabaseClient) {
      browserClient = window.__supabaseClient;
      return browserClient;
    }
    
    // Prevent multiple simultaneous initializations
    if (window.__supabaseClientInitializing) {
      console.warn('⚠️ Supabase client already initializing, waiting...');
      // Return a temporary client - will be replaced on next access
      const tempClient = createBrowserClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false, // Don't persist to avoid conflicts
        }
      });
      return tempClient;
    }
    
    try {
      window.__supabaseClientInitializing = true;
      console.log('🔧 Creating new Supabase browser client');
      
      browserClient = createBrowserClient(supabaseUrl, supabaseKey, {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        }
      });
      
      window.__supabaseClient = browserClient;
      return browserClient;
    } finally {
      window.__supabaseClientInitializing = false;
    }
  }
  
  // Server-side: create a new instance
  return createClient(supabaseUrl, supabaseKey);
}

export const supabase = getSupabaseClient();

// Demo mode flag - set to false when Supabase credentials are properly configured
export const isDemoMode = !supabaseUrl || !supabaseKey || 
                         supabaseUrl === '' || 
                         supabaseKey === '';