/**
 * Centralized DLOB Design Tokens & Theme Configuration
 * 
 * Edit this single file to change the color and style of all buttons,
 * badges, and accent elements across the entire website instantly.
 */

export const THEME = {
  // ─── Buttons ─────────────────────────────────────────────────────────────
  
  /** Primary call-to-action button (Form submit, Auth, Main Actions) */
  btnPrimary: 'bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md',

  /** Contrast White Pill button (Hero CTA, Navbar Dashboard) */
  btnWhite: 'bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-full transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md',

  /** Glassmorphic translucent button (Hero secondary, Dark banners) */
  btnGlass: 'bg-black/25 hover:bg-white/20 border border-white/25 text-white font-bold rounded-full backdrop-blur-md transition-all shadow-lg',

  /** Floating AI Chat trigger button */
  btnFloatingChat: 'bg-zinc-950/90 hover:bg-black text-white border border-white/20 shadow-2xl backdrop-blur-xl',

  // ─── Badges & Tags ───────────────────────────────────────────────────────
  
  /** Category badge / meta tag (Blog & Tips, Section chips) */
  badge: 'px-4 py-1.5 rounded-full text-xs font-semibold bg-[#4382C8]/10 text-[#4382C8] border border-[#4382C8]/20 dark:bg-[#4382C8]/20 dark:text-blue-300 dark:border-blue-400/30',

  /** Section decorative line / underline accent */
  accentBar: 'w-12 h-1 bg-[#4382C8] rounded-full',

  // ─── Glassmorphic Card & Section Designs (#4382C8) ────────────────────────
  
  /** Glassmorphic Card with brand blue styling */
  cardGlass: 'backdrop-blur-xl bg-[#4382C8]/15 border border-[#4382C8]/30 shadow-xl rounded-3xl',
  
  /** Glassmorphic Section Background with brand blue gradient */
  sectionGlass: 'bg-gradient-to-br from-[#4382C8] via-[#356ca8] to-[#1f4a7c] text-white',
};
