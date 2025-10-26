import { createClient } from '@supabase/supabase-js';

// Admin client using service key (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If service key is available, create admin client that bypasses RLS
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Check if admin client is available
export const hasAdminAccess = !!supabaseAdmin;

export default supabaseAdmin;