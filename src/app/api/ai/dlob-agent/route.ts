import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { DLOB_KNOWLEDGE_BASE, DLOB_ADMIN_KNOWLEDGE_BASE, DLOB_MEMBER_KNOWLEDGE_BASE } from '@/lib/dlob-knowledge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Service-role client for executing tools
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── YouTube helper ──────────────────────────────────────────────────────────
async function searchYouTube(query: string) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' badminton tutorial')}&type=video&maxResults=3&key=${process.env.YOUTUBE_API_KEY}&relevanceLanguage=id&safeSearch=strict`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      duration: 'Video',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch { return []; }
}

// ─── Fonnte WA helper ─────────────────────────────────────────────────────────
async function sendWA(phone: string, message: string): Promise<boolean> {
  let p = phone.trim().replace(/\D/g, '');
  if (p.startsWith('0')) p = '62' + p.slice(1);
  if (!p.startsWith('62')) p = '62' + p;
  const form = new URLSearchParams({ target: p, message, countryCode: '62' });
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { Authorization: process.env.FONNTE_TOKEN!, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const data = await res.json();
  return data.status === true || data.status === 'true';
}

// ─── Tool definitions ─────────────────────────────────────────────────────────
const ADMIN_TOOLS = [
  {
    name: 'get_unpaid_summary',
    description: 'Dapatkan ringkasan semua anggota yang belum membayar tagihan pertandingan (payment_status pending). Menampilkan nama, jumlah tagihan, dan total outstanding.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_club_stats',
    description: 'Dapatkan statistik komunitas: total member aktif, total pertandingan bulan ini, pendapatan bulan ini.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'send_reminder_all_unpaid',
    description: 'Kirim pesan WA reminder pembayaran ke SEMUA anggota yang masih punya tagihan belum bayar.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'send_reminder_to_member',
    description: 'Kirim pesan WA reminder pembayaran ke satu anggota tertentu.',
    parameters: {
      type: 'object',
      properties: { member_name: { type: 'string', description: 'Nama lengkap anggota' } },
      required: ['member_name'],
    },
  },
  {
    name: 'get_recent_matches',
    description: 'Dapatkan daftar pertandingan terbaru.',
    parameters: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Jumlah pertandingan, default 5' } },
      required: [],
    },
  },
  {
    name: 'get_revenue_summary',
    description: 'Dapatkan ringkasan pendapatan komunitas. Bisa untuk semua bulan (all-time), satu bulan tertentu, atau satu tahun tertentu. Menampilkan total paid (revenue masuk), total pending (belum bayar), breakdown per bulan, dan jumlah pertandingan.',
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'number', description: 'Bulan (1-12). Kosongkan untuk semua bulan.' },
        year: { type: 'number', description: 'Tahun (misal 2025 atau 2026). Kosongkan untuk semua tahun.' },
      },
      required: [],
    },
  },
  {
    name: 'get_player_ranking',
    description: 'Dapatkan ranking pemain tertentu di leaderboard — posisi rank, best player score, statistik (match, wins, win rate, avg score, streak).',
    parameters: {
      type: 'object',
      properties: { player_name: { type: 'string', description: 'Nama lengkap pemain' } },
      required: ['player_name'],
    },
  },
  {
    name: 'get_member_billing_summary',
    description: 'Dapatkan total tagihan (paid + pending) untuk anggota tertentu, bisa untuk semua bulan atau bulan/tahun tertentu. Menampilkan breakdown per pertandingan beserta status pembayaran. Jika hasilnya ambiguous=true, berarti ditemukan beberapa nama yang mirip dan harus ditanyakan kembali ke admin nama mana yang dimaksud.',
    parameters: {
      type: 'object',
      properties: {
        member_name: { type: 'string', description: 'Nama lengkap anggota yang ingin dicek tagihannya' },
        month: { type: 'number', description: 'Bulan (1-12). Kosongkan untuk semua bulan.' },
        year: { type: 'number', description: 'Tahun (misal 2025 atau 2026). Kosongkan untuk semua tahun.' },
      },
      required: ['member_name'],
    },
  },
  {
    name: 'search_youtube',
    description: 'Cari video tutorial badminton di YouTube.',
    parameters: {
      type: 'object',
      properties: { keyword: { type: 'string', description: 'Kata kunci pencarian' } },
      required: ['keyword'],
    },
  },
];

const MEMBER_TOOLS = [
  {
    name: 'get_my_pending_payments',
    description: 'Dapatkan daftar tagihan pertandingan saya yang belum dibayar.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_my_match_stats',
    description: 'Dapatkan statistik pertandingan saya: total match, win rate, streak.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_my_ranking',
    description: 'Dapatkan ranking saya di leaderboard hari ini — posisi rank, best player score, dan perubahan dibanding hari kemarin.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_player_ranking',
    description: 'Dapatkan ranking pemain tertentu di leaderboard — posisi rank, best player score, statistik (match, wins, win rate, avg score, streak).',
    parameters: {
      type: 'object',
      properties: { player_name: { type: 'string', description: 'Nama lengkap pemain' } },
      required: ['player_name'],
    },
  },
  {
    name: 'get_my_membership',
    description: 'Cek status membership saya bulan ini.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'resend_my_payment_reminder',
    description: 'Kirim ulang WA notifikasi tagihan ke nomor saya sendiri.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'search_youtube',
    description: 'Cari video tutorial badminton di YouTube.',
    parameters: {
      type: 'object',
      properties: { keyword: { type: 'string', description: 'Kata kunci pencarian' } },
      required: ['keyword'],
    },
  },
];

// ─── Name similarity helper (bigram) ────────────────────────────────────────
function bigramSimilarity(a: string, b: string): number {
  const s = (str: string) => str.toLowerCase().replace(/\s+/g, '');
  const sa = s(a); const sb = s(b);
  if (!sa.length || !sb.length) return 0;
  const bigrams = (str: string) => { const bg = new Set<string>(); for (let i = 0; i < str.length - 1; i++) bg.add(str.slice(i, i + 2)); return bg; };
  const ba = bigrams(sa); const bb = bigrams(sb);
  let shared = 0; for (const g of ba) if (bb.has(g)) shared++;
  return (2 * shared) / (ba.size + bb.size);
}

async function suggestMemberNames(query: string, limit = 4): Promise<string[]> {
  const { data } = await supabaseAdmin.from('match_members').select('member_name');
  const allNames = [...new Set((data || []).map((r: any) => r.member_name as string))];
  return allNames
    .map(n => ({ name: n, score: bigramSimilarity(query, n) }))
    .filter(x => x.score >= 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.name);
}

// ─── Ranking calculator helper ───────────────────────────────────────────────
async function getPlayerRankingInfo(playerName: string): Promise<
  { rank: number; name: string; bestPlayerScore: number; totalMatches: number; wins: number; losses: number; winRate: number; avgScore: number; longestWinStreak: number; currentStreak: number } | 
  { error: string }
> {
  try {
    // Fetch all match members data
    const { data: allMatches } = await supabaseAdmin
      .from('match_members')
      .select('member_name, score, matches(match_date, team1_player1, team1_player2, team2_player1, team2_player2, winner)');

    if (!allMatches || allMatches.length === 0) return { error: 'No match data found' };

    // Build stats for all players
    const playerStats: Record<string, {
      totalMatches: number; wins: number; losses: number; totalScore: number;
      matchHistory: boolean[];
    }> = {};

    for (const match of allMatches) {
      const name = match.member_name;
      if (!playerStats[name]) {
        playerStats[name] = { totalMatches: 0, wins: 0, losses: 0, totalScore: 0, matchHistory: [] };
      }
      
      const m = (match.matches as any);
      if (!m) continue;

      const team1 = [m.team1_player1, m.team1_player2].map((n: string) => n?.toLowerCase());
      const team2 = [m.team2_player1, m.team2_player2].map((n: string) => n?.toLowerCase());
      const inTeam1 = team1.includes(name.toLowerCase());
      const inTeam2 = team2.includes(name.toLowerCase());

      if (inTeam1 || inTeam2) {
        playerStats[name].totalMatches++;
        playerStats[name].totalScore += match.score || 0;
        const won = (inTeam1 && m.winner === 'team1') || (inTeam2 && m.winner === 'team2');
        if (won) playerStats[name].wins++;
        else playerStats[name].losses++;
        playerStats[name].matchHistory.push(won);
      }
    }

    // Calculate best player score (same algorithm as leaderboard)
    const maxStats = {
      matches: Math.max(...Object.values(playerStats).map(s => s.totalMatches), 1),
      wins: Math.max(...Object.values(playerStats).map(s => s.wins), 1),
      losses: Math.max(...Object.values(playerStats).map(s => s.losses), 1),
      avgScore: Math.max(...Object.values(playerStats).map(s => s.totalMatches > 0 ? s.totalScore / s.totalMatches : 0), 1),
      streak: 0,
    };

    // Calculate longest streak for max
    for (const stats of Object.values(playerStats)) {
      let current = 0, longest = 0;
      for (const won of stats.matchHistory) {
        if (won) { current++; longest = Math.max(longest, current); }
        else { current = 0; }
      }
      maxStats.streak = Math.max(maxStats.streak, longest);
    }

    // Calculate score for each player
    const playerScores: Array<{ name: string; score: number; stats: { totalMatches: number; wins: number; losses: number; totalScore: number; matchHistory: boolean[]; winRate: number; avgScore: number; longestWinStreak: number; currentStreak: number } }> = [];
    for (const [name, stats] of Object.entries(playerStats)) {
      if (stats.totalMatches === 0) continue;

      const winRate = (stats.wins / stats.totalMatches) * 100;
      const avgScore = stats.totalMatches > 0 ? stats.totalScore / stats.totalMatches : 0;
      
      let longestStreak = 0, currentStreak = 0;
      for (const won of stats.matchHistory) {
        if (won) { currentStreak++; longestStreak = Math.max(longestStreak, currentStreak); }
        else { currentStreak = 0; }
      }

      const normMatches = (stats.totalMatches / maxStats.matches) * 100;
      const normWins = (stats.wins / maxStats.wins) * 100;
      const normAvgScore = (avgScore / maxStats.avgScore) * 100;
      const normStreak = (longestStreak / Math.max(maxStats.streak, 1)) * 100;

      const score = (normMatches * 0.25) + (normWins * 0.20) + (winRate * 0.20) + (normAvgScore * 0.15) + (normStreak * 0.10);
      
      playerScores.push({
        name,
        score: Math.round(score * 10) / 10,
        stats: {
          totalMatches: stats.totalMatches,
          wins: stats.wins,
          losses: stats.losses,
          totalScore: stats.totalScore,
          matchHistory: stats.matchHistory,
          winRate: Math.round(winRate),
          avgScore: Math.round(avgScore * 10) / 10,
          longestWinStreak: longestStreak,
          currentStreak: currentStreak,
        },
      });
    }

    // Sort by score and find rank
    playerScores.sort((a, b) => b.score - a.score);
    const playerIndex = playerScores.findIndex(p => p.name.toLowerCase() === playerName.toLowerCase());

    if (playerIndex === -1) return { error: `Pemain "${playerName}" tidak ditemukan` };

    const player = playerScores[playerIndex];
    return {
      rank: playerIndex + 1,
      name: player.name,
      bestPlayerScore: player.score,
      totalMatches: player.stats.totalMatches,
      wins: player.stats.wins,
      losses: player.stats.losses,
      winRate: player.stats.winRate,
      avgScore: player.stats.avgScore,
      longestWinStreak: player.stats.longestWinStreak,
      currentStreak: player.stats.currentStreak,
    };
  } catch (err) {
    return { error: `Error calculating ranking: ${err}` };
  }
}

/**
 * Resolve a name query to an exact DB name:
 * - Returns { resolved: string } if exactly one confident match
 * - Returns { autocorrected: string, original: string } if typo+single high-conf match
 * - Returns { ambiguous: string[] } if multiple candidates
 * - Returns { notFound: true, suggestions: string[] } if no match
 */
async function resolveMemberName(query: string): Promise<
  | { resolved: string; autocorrected?: string }
  | { ambiguous: string[] }
  | { notFound: true; suggestions: string[] }
> {
  // Fetch distinct names that contain the query (fast pre-filter)
  const { data: candidateRows } = await supabaseAdmin
    .from('match_members')
    .select('member_name')
    .ilike('member_name', `%${query}%`);

  const containsMatches: string[] = [...new Set((candidateRows || []).map((r: any) => r.member_name as string))];

  // Tiered matching on contains-results
  const exact = containsMatches.filter(n => n.toLowerCase() === query.toLowerCase());
  const startsWith = containsMatches.filter(n => n.toLowerCase().startsWith(query.toLowerCase()));
  const wordBoundary = containsMatches.filter(n =>
    n.toLowerCase().split(/\s+/).some(w => w.startsWith(query.toLowerCase()))
  );

  const candidates = exact.length ? exact : startsWith.length ? startsWith : wordBoundary.length ? wordBoundary : [];

  if (candidates.length === 1) return { resolved: candidates[0] };
  if (candidates.length > 1) return { ambiguous: candidates };

  // No match via substring tiers — run full similarity across all names
  const { data: allRows } = await supabaseAdmin.from('match_members').select('member_name');
  const allNames = [...new Set((allRows || []).map((r: any) => r.member_name as string))];
  const scored = allNames
    .map(n => ({ name: n, score: bigramSimilarity(query, n) }))
    .filter(x => x.score >= 0.2)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return { notFound: true, suggestions: [] };

  // Single high-confidence match (score ≥ 0.55) → auto-correct silently
  if (scored.length === 1 || scored[0].score >= 0.55) {
    const topScore = scored[0].score;
    const topCandidates = scored.filter(x => x.score >= topScore - 0.1);
    if (topCandidates.length === 1) {
      return { resolved: topCandidates[0].name, autocorrected: query };
    }
    return { ambiguous: topCandidates.map(x => x.name) };
  }

  return { notFound: true, suggestions: scored.slice(0, 4).map(x => x.name) };
}

// ─── Tool executors ───────────────────────────────────────────────────────────
async function executeAdminTool(name: string, args: any): Promise<any> {
  try {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dlobcommunity.com';
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (name === 'get_unpaid_summary') {
    const { data } = await supabaseAdmin
      .from('match_members')
      .select('member_name, amount_due, attendance_fee, matches(match_date)')
      .eq('payment_status', 'pending');

    if (!data?.length) return { message: 'Tidak ada tagihan yang belum dibayar.', members: [] };

    const map: Record<string, { totalDue: number; matchCount: number; oldestDate: string }> = {};
    for (const r of data) {
      if (!map[r.member_name]) map[r.member_name] = { totalDue: 0, matchCount: 0, oldestDate: '' };
      map[r.member_name].totalDue += (r.amount_due || 0) + (r.attendance_fee || 0);
      map[r.member_name].matchCount++;
      const d = (r.matches as any)?.match_date || '';
      if (!map[r.member_name].oldestDate || d < map[r.member_name].oldestDate) map[r.member_name].oldestDate = d;
    }

    const members = Object.entries(map)
      .sort((a, b) => b[1].totalDue - a[1].totalDue)
      .map(([name, v]) => ({ name, totalDue: v.totalDue, matchCount: v.matchCount, oldestDate: v.oldestDate }));

    const totalOutstanding = members.reduce((s, m) => s + m.totalDue, 0);
    return { totalMembers: members.length, totalOutstanding, members };
  }

  if (name === 'get_club_stats') {
    const [memberCount, matchCount, revenueData] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member').eq('is_active', true),
      supabaseAdmin.from('matches').select('*', { count: 'exact', head: true })
        .gte('match_date', `${year}-${String(month).padStart(2, '0')}-01`)
        .lt('match_date', `${year}-${String(month + 1).padStart(2, '0')}-01`),
      supabaseAdmin.from('match_members').select('amount_due, attendance_fee, matches(match_date)')
        .eq('payment_status', 'paid'),
    ]);

    const revenue = (revenueData.data || []).reduce((s: number, r: any) => {
      const d = (r.matches as any)?.match_date || '';
      const m = new Date(d).getMonth() + 1;
      const y = new Date(d).getFullYear();
      return (m === month && y === year) ? s + (r.amount_due || 0) + (r.attendance_fee || 0) : s;
    }, 0);

    return {
      activeMembers: memberCount.count || 0,
      matchesThisMonth: matchCount.count || 0,
      revenueThisMonth: revenue,
    };
  }

  if (name === 'send_reminder_all_unpaid') {
    const { data } = await supabaseAdmin
      .from('match_members')
      .select('member_name, amount_due, attendance_fee')
      .eq('payment_status', 'pending');

    if (!data?.length) return { sent: 0, message: 'Tidak ada tagihan pending.' };

    // Group by member
    const map: Record<string, number> = {};
    for (const r of data) {
      map[r.member_name] = (map[r.member_name] || 0) + (r.amount_due || 0) + (r.attendance_fee || 0);
    }

    // Fetch phones
    const names = Object.keys(map);
    const { data: profiles } = await supabaseAdmin.from('profiles').select('full_name, phone').in('full_name', names);
    const phoneMap: Record<string, string> = {};
    for (const p of profiles || []) if (p.phone) phoneMap[p.full_name] = p.phone;

    let sent = 0; let skipped = 0;
    for (const [name, total] of Object.entries(map)) {
      const phone = phoneMap[name];
      if (!phone) { skipped++; continue; }
      const msg = `🏸 DLOB - Reminder Pembayaran\n\nHalo ${name}!\n\nKamu masih punya tagihan yang belum dibayar sebesar Rp ${total.toLocaleString('id-ID')}.\n\nSegera bayar melalui:\n${appUrl}/dashboard/pembayaran\n\nAtau tunai ke Admin di lapangan.\n\n— DLOB Community`;
      const ok = await sendWA(phone, msg);
      if (ok) sent++; else skipped++;
      await new Promise(r => setTimeout(r, 300));
    }
    return { sent, skipped, totalMembers: names.length };
  }

  if (name === 'send_reminder_to_member') {
    const memberName: string = args.member_name;

    const resolution = await resolveMemberName(memberName);

    if ('notFound' in resolution) {
      return {
        success: false,
        query: memberName,
        suggestions: resolution.suggestions,
        reason: resolution.suggestions.length
          ? `Anggota "${memberName}" tidak ditemukan. Mungkin maksudnya: ${resolution.suggestions.join(', ')}?`
          : `Anggota "${memberName}" tidak ditemukan di sistem.`,
      };
    }
    if ('ambiguous' in resolution) {
      return {
        success: false,
        ambiguous: true,
        query: memberName,
        candidates: resolution.ambiguous,
        reason: `Ditemukan beberapa anggota dengan nama mirip: ${resolution.ambiguous.join(', ')}. Sebutkan nama lengkap yang dimaksud.`,
      };
    }

    const resolvedName = resolution.resolved;
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name, phone').ilike('full_name', resolvedName).maybeSingle();
    if (!profile?.phone) return { success: false, reason: `${resolvedName} tidak punya nomor HP terdaftar.` };

    const { data: unpaid } = await supabaseAdmin.from('match_members').select('amount_due, attendance_fee').eq('member_name', resolvedName).eq('payment_status', 'pending');
    const total = (unpaid || []).reduce((s, r) => s + (r.amount_due || 0) + (r.attendance_fee || 0), 0);
    if (!total) return { success: false, reason: `${resolvedName} tidak punya tagihan pending.` };

    const msg = `🏸 DLOB - Reminder Pembayaran\n\nHalo ${resolvedName}!\n\nKamu masih punya tagihan yang belum dibayar sebesar Rp ${total.toLocaleString('id-ID')}.\n\nSegera bayar melalui:\n${appUrl}/dashboard/pembayaran\n\nAtau tunai ke Admin di lapangan.\n\n— DLOB Community`;
    const ok = await sendWA(profile.phone, msg);
    return { success: ok, name: resolvedName, totalDue: total, ...(resolution.autocorrected ? { note: `Nama dikoreksi dari "${resolution.autocorrected}" ke "${resolvedName}"` } : {}) };
  }

  if (name === 'get_revenue_summary') {
    const filterMonth: number | undefined = args.month;
    const filterYear: number | undefined = args.year;

    // ── Fetch match revenue (shuttlecock + attendance fee) ───────────────────
    const [{ data: matchRows }, { data: membershipRows }] = await Promise.all([
      supabaseAdmin
        .from('match_members')
        .select('amount_due, attendance_fee, payment_status, matches(match_date)'),
      supabaseAdmin
        .from('memberships')
        .select('amount, payment_status, month, year'),
    ]);

    // ── Filter & aggregate match revenue by YYYY-MM ──────────────────────────
    const filteredMatches = (matchRows || []).filter(r => {
      const d = (r.matches as any)?.match_date;
      if (!d) return false;
      const dt = new Date(d);
      if (filterMonth && filterYear) return dt.getMonth() + 1 === filterMonth && dt.getFullYear() === filterYear;
      if (filterMonth) return dt.getMonth() + 1 === filterMonth;
      if (filterYear) return dt.getFullYear() === filterYear;
      return true;
    });

    const byMonth: Record<string, { matchPaid: number; matchPending: number; membershipPaid: number; membershipPending: number; matchDates: Set<string> }> = {};

    for (const r of filteredMatches) {
      const d = (r.matches as any)?.match_date as string | undefined;
      if (!d) continue;
      const key = d.slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { matchPaid: 0, matchPending: 0, membershipPaid: 0, membershipPending: 0, matchDates: new Set() };
      const amount = (r.amount_due || 0) + (r.attendance_fee || 0);
      if (r.payment_status === 'paid') byMonth[key].matchPaid += amount;
      else byMonth[key].matchPending += amount;
      byMonth[key].matchDates.add(d);
    }

    // ── Filter & aggregate membership revenue by YYYY-MM ────────────────────
    const filteredMemberships = (membershipRows || []).filter(r => {
      if (!r.year) return false;
      if (filterMonth && filterYear) return r.month === filterMonth && r.year === filterYear;
      if (filterMonth) return r.month === filterMonth;
      if (filterYear) return r.year === filterYear;
      return true;
    });

    for (const r of filteredMemberships) {
      const key = `${r.year}-${String(r.month).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { matchPaid: 0, matchPending: 0, membershipPaid: 0, membershipPending: 0, matchDates: new Set() };
      const amount = r.amount || 0;
      if (r.payment_status === 'paid') byMonth[key].membershipPaid += amount;
      else byMonth[key].membershipPending += amount;
    }

    // ── Serialize ────────────────────────────────────────────────────────────
    const byMonthSerialized = Object.fromEntries(
      Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, {
          matchRevenuePaid: v.matchPaid,
          matchRevenuePending: v.matchPending,
          membershipRevenuePaid: v.membershipPaid,
          membershipRevenuePending: v.membershipPending,
          totalPaid: v.matchPaid + v.membershipPaid,
          totalPending: v.matchPending + v.membershipPending,
          matchCount: v.matchDates.size,
        }])
    );

    const matchTotalPaid = filteredMatches.filter(r => r.payment_status === 'paid').reduce((s, r) => s + (r.amount_due || 0) + (r.attendance_fee || 0), 0);
    const matchTotalPending = filteredMatches.filter(r => r.payment_status !== 'paid').reduce((s, r) => s + (r.amount_due || 0) + (r.attendance_fee || 0), 0);
    const membershipTotalPaid = filteredMemberships.filter(r => r.payment_status === 'paid').reduce((s, r) => s + (r.amount || 0), 0);
    const membershipTotalPending = filteredMemberships.filter(r => r.payment_status !== 'paid').reduce((s, r) => s + (r.amount || 0), 0);

    const filterLabel = filterMonth && filterYear ? `${filterMonth}/${filterYear}` : filterMonth ? `bulan ${filterMonth}` : filterYear ? `tahun ${filterYear}` : 'semua waktu';

    return {
      filterApplied: filterLabel,
      matchRevenuePaid: matchTotalPaid,
      matchRevenuePending: matchTotalPending,
      membershipRevenuePaid: membershipTotalPaid,
      membershipRevenuePending: membershipTotalPending,
      totalPaid: matchTotalPaid + membershipTotalPaid,
      totalPending: matchTotalPending + membershipTotalPending,
      grandTotal: matchTotalPaid + membershipTotalPaid + matchTotalPending + membershipTotalPending,
      byMonth: byMonthSerialized,
    };
  }

  if (name === 'get_recent_matches') {
    const limit = args.limit || 5;
    const { data } = await supabaseAdmin.from('matches').select('id, match_date, match_number, shuttlecock_count').order('match_date', { ascending: false }).limit(limit);
    return { matches: data || [] };
  }

  if (name === 'get_member_billing_summary') {
    const memberName: string = args.member_name;
    const filterMonth: number | undefined = args.month;
    const filterYear: number | undefined = args.year;

    // ── Step 1: resolve name (exact / auto-correct / ambiguous / not-found) ──
    const resolution = await resolveMemberName(memberName);

    if ('notFound' in resolution) {
      return {
        found: false,
        query: memberName,
        suggestions: resolution.suggestions,
        message: resolution.suggestions.length
          ? `Nama "${memberName}" tidak ditemukan. Mungkin maksudnya: ${resolution.suggestions.join(', ')}?`
          : `Tidak ada anggota dengan nama "${memberName}" di sistem.`,
      };
    }

    if ('ambiguous' in resolution) {
      return {
        found: false,
        ambiguous: true,
        query: memberName,
        candidates: resolution.ambiguous,
        message: `Ditemukan beberapa anggota dengan nama mirip "${memberName}": ${resolution.ambiguous.join(', ')}. Sebutkan nama lengkap yang dimaksud.`,
      };
    }

    const resolvedName = resolution.resolved;
    const wasAutocorrected = resolution.autocorrected;

    // ── Step 2: fetch billing rows for the resolved exact name ─────────────────
    const { data: rows } = await supabaseAdmin
      .from('match_members')
      .select('amount_due, attendance_fee, payment_status, matches(match_date, match_number)')
      .eq('member_name', resolvedName);

    if (!rows?.length) {
      return { memberName: resolvedName, found: false, message: `Tidak ada data tagihan untuk "${resolvedName}".` };
    }

    // Filter by month/year if requested
    const filtered = rows.filter(r => {
      const d = (r.matches as any)?.match_date;
      if (!d) return false;
      const dt = new Date(d);
      if (filterMonth && filterYear) return dt.getMonth() + 1 === filterMonth && dt.getFullYear() === filterYear;
      if (filterMonth) return dt.getMonth() + 1 === filterMonth;
      if (filterYear) return dt.getFullYear() === filterYear;
      return true;
    });

    if (!filtered.length) {
      const label = filterMonth && filterYear
        ? `${filterMonth}/${filterYear}`
        : filterMonth ? `bulan ${filterMonth}` : filterYear ? `tahun ${filterYear}` : '';
      return { memberName: resolvedName, found: true, message: `Tidak ada tagihan untuk periode ${label}`, details: [] };
    }

    // Build per-match breakdown
    const details = filtered.map(r => ({
      matchDate: (r.matches as any)?.match_date,
      matchNumber: (r.matches as any)?.match_number,
      shuttlecockFee: r.amount_due || 0,
      attendanceFee: r.attendance_fee || 0,
      total: (r.amount_due || 0) + (r.attendance_fee || 0),
      status: r.payment_status,
    })).sort((a, b) => (a.matchDate || '').localeCompare(b.matchDate || ''));

    // Aggregate by month
    const byMonth: Record<string, { paid: number; pending: number; count: number }> = {};
    for (const d of details) {
      if (!d.matchDate) continue;
      const key = d.matchDate.slice(0, 7); // YYYY-MM
      if (!byMonth[key]) byMonth[key] = { paid: 0, pending: 0, count: 0 };
      if (d.status === 'paid') byMonth[key].paid += d.total;
      else byMonth[key].pending += d.total;
      byMonth[key].count++;
    }

    const totalPaid = details.filter(d => d.status === 'paid').reduce((s, d) => s + d.total, 0);
    const totalPending = details.filter(d => d.status !== 'paid').reduce((s, d) => s + d.total, 0);
    const grandTotal = totalPaid + totalPending;

    return {
      memberName: resolvedName,
      ...(wasAutocorrected ? { note: `Nama "${wasAutocorrected}" tidak ditemukan, menampilkan data untuk "${resolvedName}" (kemungkinan yang dimaksud).` } : {}),
      found: true,
      filterApplied: filterMonth || filterYear ? { month: filterMonth, year: filterYear } : 'all',
      grandTotal,
      totalPaid,
      totalPending,
      totalMatches: details.length,
      byMonth,
      details,
    };
  }

  if (name === 'search_youtube') {
    const videos = await searchYouTube(args.keyword);
    return { videos };
  }

  if (name === 'get_player_ranking') {
    const playerName: string = args.player_name;
    const resolution = await resolveMemberName(playerName);

    if ('notFound' in resolution) {
      return {
        found: false,
        query: playerName,
        suggestions: resolution.suggestions,
        message: resolution.suggestions.length
          ? `Pemain "${playerName}" tidak ditemukan. Mungkin maksudnya: ${resolution.suggestions.join(', ')}?`
          : `Pemain "${playerName}" tidak ditemukan di sistem.`,
      };
    }

    if ('ambiguous' in resolution) {
      return {
        found: false,
        ambiguous: true,
        query: playerName,
        candidates: resolution.ambiguous,
        message: `Ditemukan beberapa pemain dengan nama mirip: ${resolution.ambiguous.join(', ')}. Sebutkan nama lengkap yang dimaksud.`,
      };
    }

    const rankInfo = await getPlayerRankingInfo(resolution.resolved);
    return { ...(resolution.autocorrected ? { note: `Nama dikoreksi dari "${resolution.autocorrected}" ke "${resolution.resolved}"` } : {}), ...rankInfo };
  }

  return { error: `Unknown admin tool: ${name}` };
  } catch (err: any) {
    console.error(`[executeAdminTool:${name}] Error:`, err?.message || err);
    return { toolError: true, tool: name, message: err?.message || String(err) };
  }
}

async function executeMemberTool(name: string, args: any, memberName: string, memberPhone: string | null, isExempt: boolean = false): Promise<any> {
  try {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.dlobcommunity.com';
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (name === 'get_my_pending_payments') {
    const { data } = await supabaseAdmin
      .from('match_members')
      .select('amount_due, attendance_fee, matches(match_date, match_number)')
      .eq('member_name', memberName)
      .eq('payment_status', 'pending');

    const items = (data || []).map(r => ({
      matchDate: (r.matches as any)?.match_date,
      matchNumber: (r.matches as any)?.match_number,
      shuttlecockFee: r.amount_due || 0,
      attendanceFee: r.attendance_fee || 0,
      total: (r.amount_due || 0) + (r.attendance_fee || 0),
    }));
    const grandTotal = items.reduce((s, i) => s + i.total, 0);
    return { pendingItems: items.length, grandTotal, items, isVipExempt: isExempt, note: isExempt ? `${memberName} memiliki status VIP/Gratis — biaya pertandingan dibebaskan oleh admin.` : undefined };
  }

  if (name === 'get_my_match_stats') {
    const { data } = await supabaseAdmin
      .from('match_members')
      .select('matches(match_date, team1_player1, team1_player2, team2_player1, team2_player2, winner)')
      .eq('member_name', memberName);

    const matches = (data || []).map(r => r.matches as any).filter(Boolean);
    const total = matches.length;
    let wins = 0;
    for (const m of matches) {
      const team1 = [m.team1_player1, m.team1_player2].map((n: string) => n?.toLowerCase());
      const team2 = [m.team2_player1, m.team2_player2].map((n: string) => n?.toLowerCase());
      const inTeam1 = team1.includes(memberName.toLowerCase());
      if ((inTeam1 && m.winner === 'team1') || (!inTeam1 && m.winner === 'team2')) wins++;
    }
    return { totalMatches: total, wins, losses: total - wins, winRate: total > 0 ? Math.round((wins / total) * 100) : 0 };
  }

  if (name === 'get_my_membership') {
    const { data } = await supabaseAdmin
      .from('memberships')
      .select('month, year, payment_status, amount')
      .ilike('member_name', memberName)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    if (!data) return { hasActiveMembership: false, month, year };
    return { hasActiveMembership: data.payment_status === 'paid', status: data.payment_status, amount: data.amount, month, year };
  }

  if (name === 'resend_my_payment_reminder') {
    if (!memberPhone) return { success: false, reason: 'Nomor HP tidak terdaftar di profil kamu.' };
    const { data: unpaid } = await supabaseAdmin.from('match_members').select('amount_due, attendance_fee').eq('member_name', memberName).eq('payment_status', 'pending');
    const total = (unpaid || []).reduce((s, r) => s + (r.amount_due || 0) + (r.attendance_fee || 0), 0);
    if (!total) return { success: false, reason: 'Kamu tidak punya tagihan pending saat ini.' };
    const msg = `🏸 DLOB - Tagihan Kamu\n\nHalo ${memberName}!\n\nTagihan tertunda kamu: Rp ${total.toLocaleString('id-ID')}\n\nBayar di: ${appUrl}/dashboard/pembayaran\n\n— DLOB Community`;
    const ok = await sendWA(memberPhone, msg);
    return { success: ok, totalDue: total };
  }

  if (name === 'search_youtube') {
    const videos = await searchYouTube(args.keyword);
    return { videos };
  }

  if (name === 'get_my_ranking') {
    const rankInfo = await getPlayerRankingInfo(memberName);
    return rankInfo;
  }

  if (name === 'get_player_ranking') {
    const playerName: string = args.player_name;
    const resolution = await resolveMemberName(playerName);

    if ('notFound' in resolution) {
      return {
        found: false,
        query: playerName,
        suggestions: resolution.suggestions,
        message: resolution.suggestions.length
          ? `Pemain "${playerName}" tidak ditemukan. Mungkin maksudnya: ${resolution.suggestions.join(', ')}?`
          : `Pemain "${playerName}" tidak ditemukan di sistem.`,
      };
    }

    if ('ambiguous' in resolution) {
      return {
        found: false,
        ambiguous: true,
        query: playerName,
        candidates: resolution.ambiguous,
        message: `Ditemukan beberapa pemain dengan nama mirip: ${resolution.ambiguous.join(', ')}. Sebutkan nama lengkap yang dimaksud.`,
      };
    }

    const rankInfo = await getPlayerRankingInfo(resolution.resolved);
    return { ...(resolution.autocorrected ? { note: `Nama dikoreksi dari "${resolution.autocorrected}" ke "${resolution.resolved}"` } : {}), ...rankInfo };
  }

  return { error: `Unknown member tool: ${name}` };
  } catch (err: any) {
    console.error(`[executeMemberTool:${name}] Error:`, err?.message || err);
    return { toolError: true, tool: name, message: err?.message || String(err) };
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, conversationHistory, userRole, userName, userPhone, authToken } = body;

    if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

    // Verify auth token if provided (server-side validation)
    let verifiedRole: 'admin' | 'member' | 'guest' = 'guest';
    let verifiedName = userName || 'Pengguna';
    let verifiedPhone = userPhone || null;
    let verifiedIsExempt = false;

    if (authToken) {
      const supabaseUser = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: { user } } = await supabaseUser.auth.getUser(authToken);
      if (user) {
        const { data: profile } = await supabaseAdmin.from('profiles').select('full_name, role, phone, is_payment_exempt').eq('id', user.id).maybeSingle();
        if (profile) {
          verifiedRole = profile.role === 'admin' ? 'admin' : 'member';
          verifiedName = profile.full_name || verifiedName;
          verifiedPhone = profile.phone || null;
          verifiedIsExempt = profile.is_payment_exempt === true;
        }
      }
    }

    // Select tools based on verified role
    const tools = verifiedRole === 'admin' ? ADMIN_TOOLS : (verifiedRole === 'member' ? MEMBER_TOOLS : []);

    const systemPrompt = verifiedRole === 'admin'
      ? `Anda adalah "Dlob Agent" - asisten pintar untuk ADMIN komunitas badminton DLOB.
Admin saat ini: ${verifiedName}

KAPABILITAS KAMU:
- Lihat ringkasan tagihan yang belum dibayar (semua member)
- Cek total tagihan satu member tertentu — semua bulan atau filter bulan/tahun spesifik
- Cek total pendapatan komunitas — semua waktu, bulan tertentu, atau tahun tertentu
- Kirim reminder WA ke anggota (satu per satu atau serentak)
- Cek statistik komunitas (member, pertandingan, pendapatan)
- Lihat pertandingan terbaru
- Coaching & tips badminton
- Cari video YouTube

CARA KERJA:
- Jawab dengan Bahasa Indonesia yang natural dan profesional
- Jika butuh data atau tindakan, gunakan tool yang tersedia
- Untuk tindakan berdampak (kirim reminder massal), konfirmasi hasil dengan jelas
- Maksimal 3-4 kalimat per respons kecuali menampilkan data
- JANGAN PERNAH menyebut nama tool/fungsi teknis (seperti get_unpaid_summary, send_reminder_all_unpaid, dll) dalam jawaban. Gunakan bahasa natural: "saya bisa lihat tagihan", "kirim reminder WA", dst.
- Jangan tampilkan tanda backtick, tanda kurung, atau signature fungsi apapun dalam jawaban ke user
- JANGAN gunakan markdown bold (**teks**) atau italic (*teks*) di manapun dalam jawaban. Tulis semua teks polos tanpa formatting markdown.
- Saat menjawab pertanyaan tentang tagihan member, tulis kalimat kesimpulan di AWAL lalu lanjutkan dengan detail. Contoh: "Septian Dwey memiliki total tagihan Rp 12.000 yang semuanya sudah dibayar. Terdapat 3 pertandingan..."
- Saat menjawab pertanyaan tentang pendapatan komunitas, jelaskan breakdown-nya: pendapatan pertandingan (kok + attendance fee) dan pendapatan membership secara terpisah, lalu total keseluruhan. Contoh: "Total pendapatan Februari 2026: Rp X dari pertandingan + Rp Y dari membership = Rp Z. Pending: Rp W."
- Jika hasil pencarian tagihan mengembalikan ambiguous=true (nama tidak unik), JANGAN tampilkan data apapun. Minta admin menyebutkan nama yang lebih spesifik, dan tampilkan daftar kandidat yang ditemukan. Contoh: "Ditemukan beberapa anggota dengan nama mirip: Edi Santoso, Dedi Kurniawan. Mohon sebutkan nama lengkap yang dimaksud."
- Jika hasil pencarian mengembalikan found=false dengan suggestions, beritahu admin nama tidak ditemukan dan tawarkan saran koreksi. Contoh: "Nama 'wahyo' tidak ditemukan. Mungkin yang dimaksud: Wahyu? Silakan konfirmasi nama lengkapnya."
- Jika data mengandung field "note" (nama dikoreksi otomatis), sampaikan koreksi tersebut di awal jawaban secara natural. Contoh: "Nama 'wahyo' tidak ditemukan, tapi saya menemukan Wahyu Santoso. Berikut tagihannya..."
${DLOB_KNOWLEDGE_BASE}
${DLOB_ADMIN_KNOWLEDGE_BASE}`
      : verifiedRole === 'member'
      ? `Anda adalah "Dlob Agent" - asisten pribadi untuk MEMBER komunitas badminton DLOB.
Member saat ini: ${verifiedName}
${verifiedIsExempt ? `Status VIP: GRATIS — ${verifiedName} memiliki akses VIP/pembebasan biaya, sehingga tagihan pertandingan selalu Rp 0. Ini adalah hak istimewa yang diberikan admin.` : ''}

KAPABILITAS KAMU:
- Cek tagihan pribadi ${verifiedName} yang belum dibayar
- Lihat statistik pertandingan pribadi (win rate, total match)
- Cek status membership bulan ini
- Kirim ulang WA tagihan ke nomor sendiri
- Coaching & tips badminton personal
- Cari video YouTube tutorial

CATATAN PENTING:
- Kamu HANYA boleh mengakses data milik ${verifiedName}
- Jangan tampilkan data anggota lain
- JANGAN gunakan markdown bold (**teks**) atau italic (*teks*) di manapun dalam jawaban. Tulis semua teks polos tanpa formatting markdown.
${verifiedIsExempt ? `- Jika ${verifiedName} bertanya kenapa tagihan 0 atau gratis, jelaskan bahwa mereka punya status VIP/Gratis dari admin` : ''}
${DLOB_KNOWLEDGE_BASE}
${DLOB_MEMBER_KNOWLEDGE_BASE}`
      : `Anda adalah "Dlob Agent" - asisten untuk komunitas badminton DLOB.
Pengguna belum login. Bantu dengan info umum: cara bergabung, membership, jadwal, dll.
${DLOB_KNOWLEDGE_BASE}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: systemPrompt,
    });

    // Build Gemini tool declarations
    const geminiTools = tools.length > 0 ? [{
      functionDeclarations: tools.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters as any,
      })),
    }] : undefined;

    // Gemini history with tool-call turns is complex to reconstruct correctly.
    // Instead pass an empty history and embed recent context as plain text in the message.
    // This prevents API errors from malformed history (stripped function call parts).
    const recentContext = (conversationHistory || [])
      .filter((m: any) => !m.content?.includes('Maaf, terjadi kesalahan')) // strip error msgs
      .slice(-6)
      .map((m: any) => `${m.role === 'user' ? verifiedName : 'Dlob Agent'}: ${m.content}`)
      .join('\n');

    const chat = model.startChat({
      history: [],
      tools: geminiTools,
      toolConfig: geminiTools ? { functionCallingConfig: { mode: 'AUTO' as any } } : undefined,
    });

    // Agentic loop — Gemini function calling pattern (max 4 rounds)
    let videos: any[] = [];
    let finalText = '';
    const firstMessage = recentContext
      ? `Riwayat percakapan sebelumnya:\n${recentContext}\n\nPerintah terbaru: ${query}`
      : query;

    // First call
    let result = await chat.sendMessage(firstMessage);

    for (let iteration = 0; iteration < 4; iteration++) {
      const functionCalls = result.response.functionCalls?.();

      if (!functionCalls || functionCalls.length === 0) {
        // No (more) tool calls — extract final text
        finalText = result.response.text() || '';
        break;
      }

      // Execute all tool calls in this iteration
      const toolResponseParts: any[] = [];
      for (const fc of functionCalls) {
        const toolResult = verifiedRole === 'admin'
          ? await executeAdminTool(fc.name, fc.args)
          : await executeMemberTool(fc.name, fc.args, verifiedName, verifiedPhone, verifiedIsExempt);

        // Collect videos from search_youtube tool
        if (fc.name === 'search_youtube' && toolResult.videos) {
          videos = [...videos, ...toolResult.videos];
        }

        toolResponseParts.push({
          functionResponse: { name: fc.name, response: toolResult },
        });
      }

      // Feed results back → get next response (may contain more function calls or final text)
      result = await chat.sendMessage(toolResponseParts as any);
    }

    if (!finalText) finalText = 'Maaf, saya tidak dapat memproses permintaan ini saat ini.';

    return NextResponse.json({
      response: finalText,
      videos: videos.slice(0, 3),
      role: verifiedRole,
      toolsUsed: tools.length > 0,
    });

  } catch (error: any) {
    console.error('Dlob Agent Error:', error?.message || error);
    console.error('Stack:', error?.stack);
    return NextResponse.json({ error: 'Failed to process request', details: error?.message || String(error) }, { status: 500 });
  }
}

