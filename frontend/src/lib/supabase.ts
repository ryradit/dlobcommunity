import { createClient } from '@supabase/supabase-js';
import { getSiteUrl } from './auth-utils';

// Use environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if we have valid Supabase credentials and want to use real mode
const hasValidCredentials = supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseKey !== 'your_anon_key_here';

// Force demo mode for development until database is fully set up
// Set NEXT_PUBLIC_FORCE_DEMO_MODE=false when ready for real Supabase
const forceDemoMode = process.env.NEXT_PUBLIC_FORCE_DEMO_MODE !== 'false';

if (!hasValidCredentials) {
  console.warn('⚠️ Supabase credentials not configured. Running in demo mode.');
} else if (forceDemoMode) {
  console.info('🎭 Demo mode enabled. Set NEXT_PUBLIC_FORCE_DEMO_MODE=false to use real Supabase.');
}

// Create Supabase client with correct auth configuration
export const supabase = createClient(
  supabaseUrl || 'https://demo.supabase.co', 
  supabaseKey || 'demo-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Export a flag to check if we're in demo mode
export const isDemoMode = !hasValidCredentials || forceDemoMode;

export default supabase;

// Database Types for TypeScript
export interface Database {
  public: {
    Tables: {
      members: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone?: string;
          role: 'admin' | 'member';
          membership_type: 'regular' | 'premium';
          join_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string;
          role?: 'admin' | 'member';
          membership_type?: 'regular' | 'premium';
          join_date?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string;
          role?: 'admin' | 'member';
          membership_type?: 'regular' | 'premium';
          join_date?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      pre_orders: {
        Row: {
          id: string;
          nama: string;
          ukuran: 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';
          warna: 'biru' | 'pink' | 'kuning';
          lengan: 'short' | 'long';
          nama_punggung: string | null;
          tanpa_nama_punggung: boolean;
          harga: number;
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nama: string;
          ukuran: 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';
          warna: 'biru' | 'pink' | 'kuning';
          lengan?: 'short' | 'long';
          nama_punggung?: string | null;
          tanpa_nama_punggung?: boolean;
          harga: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          ukuran?: 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';
          warna?: 'biru' | 'pink' | 'kuning';
          lengan?: 'short' | 'long';
          nama_punggung?: string | null;
          tanpa_nama_punggung?: boolean;
          harga?: number;
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
          updated_at?: string;
        };
      };
    };
  };
}