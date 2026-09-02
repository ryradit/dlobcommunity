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
  badge: 'px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-white/10',

  /** Section decorative line / underline accent */
  accentBar: 'w-12 h-1 bg-zinc-950 rounded-full',
};
