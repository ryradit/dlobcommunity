import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
// Demo mode flag - set to false when Supabase credentials are properly configured
export const isDemoMode = !supabaseUrl || !supabaseKey || 
                         supabaseUrl === '' || 
                         supabaseKey === '';