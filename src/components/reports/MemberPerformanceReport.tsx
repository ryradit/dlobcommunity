/**
 * Member Performance Report PDF Component
 * Laporan analitik performa member DLOB Community
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const BLUE = '#2563eb';
const DARK = '#1e293b';
const MUTED = '#64748b';
const BORDER = '#e2e8f0';
const BG_LIGHT = '#f8fafc';
const GREEN = '#16a34a';
const RED = '#dc2626';
const AMBER = '#d97706';
const PURPLE = '#7c3aed';

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica', fontSize: 10 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24, paddingBottom: 16,
    borderBottomWidth: 2, borderBottomColor: BLUE, borderBottomStyle: 'solid',
  },
  logo: { width: 80, height: 40, objectFit: 'contain' },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: DARK },
  headerSub: { fontSize: 10, color: MUTED, marginTop: 3 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 13, fontWeight: 'bold', color: DARK,
    borderBottomWidth: 1, borderBottomColor: BORDER, borderBottomStyle: 'solid',
    paddingBottom: 4, marginBottom: 10,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  infoLabel: { fontSize: 10, color: MUTED },
  infoValue: { fontSize: 10, fontWeight: 'bold', color: DARK },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '30%', padding: 10, backgroundColor: BG_LIGHT,
    borderRadius: 6, borderWidth: 1, borderColor: BORDER, borderStyle: 'solid',
  },
  statCardWide: {
    width: '47%', padding: 10, backgroundColor: BG_LIGHT,
    borderRadius: 6, borderWidth: 1, borderColor: BORDER, borderStyle: 'solid',
  },
  statLabel: { fontSize: 9, color: MUTED, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: BLUE },
  statValueGreen: { fontSize: 18, fontWeight: 'bold', color: GREEN },
  statValueRed: { fontSize: 18, fontWeight: 'bold', color: RED },
  statValuePurple: { fontSize: 18, fontWeight: 'bold', color: PURPLE },
  statValueAmber: { fontSize: 18, fontWeight: 'bold', color: AMBER },
  statSub: { fontSize: 8, color: MUTED, marginTop: 2 },
  progressBg: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, marginTop: 6 },
  progressFill: { height: 8, borderRadius: 4 },
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  formRow: { flexDirection: 'row', gap: 5, marginTop: 6 },
  formDotWin: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#dcfce7', borderWidth: 1, borderColor: GREEN, borderStyle: 'solid',
    alignItems: 'center', justifyContent: 'center',
  },
  formDotLoss: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#fee2e2', borderWidth: 1, borderColor: RED, borderStyle: 'solid',
    alignItems: 'center', justifyContent: 'center',
  },
  formDotText: { fontSize: 8, fontWeight: 'bold' },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#f1f5f9', padding: '6 8', borderRadius: 4, marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row', padding: '5 8',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9', borderBottomStyle: 'solid',
  },
  tableRowAlt: { flexDirection: 'row', padding: '5 8', backgroundColor: BG_LIGHT },
  tableColName: { flex: 2, fontSize: 9, color: DARK },
  tableColNum: { flex: 1, fontSize: 9, color: DARK, textAlign: 'center' },
  tableHeaderText: { fontSize: 9, fontWeight: 'bold', color: MUTED },
  monthRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', marginTop: 8 },
  monthBlock: { flex: 1, alignItems: 'center' },
  monthBarWin: { width: '100%', backgroundColor: '#86efac', borderRadius: 3 },
  monthBarLoss: { width: '100%', backgroundColor: '#fca5a5', borderRadius: 3, marginTop: 2 },
  monthLabel: { fontSize: 7, color: MUTED, marginTop: 3, textAlign: 'center' },
  insightBox: { padding: 10, borderRadius: 5, marginBottom: 8, borderLeftWidth: 4, borderLeftStyle: 'solid' },
  insightBoxStrength: { backgroundColor: '#f0fdf4', borderLeftColor: '#22c55e' },
  insightBoxImprovement: { backgroundColor: '#fffbeb', borderLeftColor: '#f59e0b' },
  insightBoxRecommendation: { backgroundColor: '#eff6ff', borderLeftColor: '#3b82f6' },
  insightBadge: {
    fontSize: 7, fontWeight: 'bold', marginBottom: 3,
    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, alignSelf: 'flex-start',
  },
  insightBadgeStrength: { color: '#15803d', backgroundColor: '#dcfce7' },
  insightBadgeImprovement: { color: '#b45309', backgroundColor: '#fef3c7' },
  insightBadgeRecommendation: { color: '#1d4ed8', backgroundColor: '#dbeafe' },
  insightTitle: { fontSize: 11, fontWeight: 'bold', color: DARK, marginBottom: 3 },
  insightText: { fontSize: 9, color: '#334155', lineHeight: 1.5 },
  chartImg: { width: '100%', height: 200, marginTop: 8 },
  footer: {
    position: 'absolute', bottom: 25, left: 40, right: 40,
    textAlign: 'center', fontSize: 8, color: '#94a3b8',
    borderTopWidth: 1, borderTopColor: BORDER, borderTopStyle: 'solid', paddingTop: 8,
  },
  highlightBox: {
    backgroundColor: '#eff6ff', borderRadius: 6, padding: 12,
    borderWidth: 1, borderColor: '#bfdbfe', borderStyle: 'solid', marginBottom: 10,
  },
  highlightText: { fontSize: 11, fontWeight: 'bold', color: BLUE, textAlign: 'center' },
  highlightSub: { fontSize: 9, color: MUTED, textAlign: 'center', marginTop: 3 },
});

export interface MemberReportData {
  memberName: string;
  memberEmail: string;
  reportDate: string;
  hasMembership: boolean;
  stats: {
    totalMatches: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    doublesWinRate: number;
    averageScore: number;
    highestScore: number;
    biggestWinMargin: number;
    longestWinStreak: number;
    longestLossStreak: number;
    currentStreak: { type: 'win' | 'loss' | null; count: number };
    recentForm: boolean[];
  };
  partnerStats: Array<{ name: string; matches: number; wins: number; winRate: number }>;
  opponentStats: Array<{ name: string; matches: number; wins: number; losses: number; winRate: number }>;
  monthlyData: Array<{ month: string; wins: number; losses: number }>;
  insights: Array<{ title: string; description: string; type: 'strength' | 'improvement' | 'recommendation' }>;
  partnerRecommendations: Array<{ partner: string; reason: string; confidence: 'high' | 'medium' | 'low'; winRate: number }>;
  chartImage?: string;
  logo?: string;
}

function barH(value: number, max: number, maxH: number = 40): number {
  if (max === 0) return 2;
  return Math.max(2, (value / max) * maxH);
}

export const MemberPerformanceReport: React.FC<{ data: MemberReportData }> = ({ data }) => {
  const s = data.stats;
  const maxMonthlyWin = Math.max(...data.monthlyData.map(m => m.wins), 1);
  const maxMonthlyLoss = Math.max(...data.monthlyData.map(m => m.losses), 1);

  return (
    <Document>
      {/* PAGE 1 — Ringkasan & Statistik Utama */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>{data.logo && <Image src={data.logo} style={styles.logo} />}</View>
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>Laporan Performa Anggota</Text>
            <Text style={styles.headerSub}>DLOB Badminton Community</Text>
            <Text style={styles.headerSub}>{data.reportDate}</Text>
          </View>
        </View>

        {/* Informasi Anggota */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Anggota</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nama</Text>
                <Text style={styles.infoValue}>{data.memberName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{data.memberEmail}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status Membership</Text>
                <Text style={[styles.infoValue, { color: data.hasMembership ? GREEN : RED }]}>
                  {data.hasMembership ? 'Aktif' : 'Tidak Aktif'}
                </Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tanggal Laporan</Text>
                <Text style={styles.infoValue}>{data.reportDate}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Pertandingan</Text>
                <Text style={styles.infoValue}>{s.totalMatches} pertandingan</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Win Rate</Text>
                <Text style={[styles.infoValue, { color: s.winRate >= 50 ? GREEN : RED }]}>
                  {(s.winRate ?? 0).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Statistik Utama */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistik Utama</Text>
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Pertandingan</Text>
              <Text style={styles.statValue}>{s.totalMatches}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Kemenangan</Text>
              <Text style={styles.statValueGreen}>{s.totalWins}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Kekalahan</Text>
              <Text style={styles.statValueRed}>{s.totalLosses}</Text>
            </View>
            <View style={styles.statCardWide}>
              <Text style={styles.statLabel}>Win Rate (Persentase Menang)</Text>
              <Text style={[styles.statValue, { color: s.winRate >= 50 ? GREEN : RED }]}>
                {(s.winRate ?? 0).toFixed(1)}%
              </Text>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, {
                  width: `${Math.min(s.winRate, 100)}%`,
                  backgroundColor: s.winRate >= 50 ? GREEN : RED,
                }]} />
              </View>
            </View>
            <View style={styles.statCardWide}>
              <Text style={styles.statLabel}>Streak Saat Ini</Text>
              <Text style={[styles.statValue, {
                color: s.currentStreak.type === 'win' ? GREEN : s.currentStreak.type === 'loss' ? RED : MUTED,
              }]}>
                {s.currentStreak.count > 0
                  ? `${s.currentStreak.count}x ${s.currentStreak.type === 'win' ? 'Menang' : 'Kalah'}`
                  : '-'}
              </Text>
              <Text style={styles.statSub}>Streak menang terpanjang: {s.longestWinStreak}x</Text>
            </View>
          </View>
        </View>

        {/* Statistik Skor & Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistik Skor dan Performa</Text>
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Rata-rata Skor</Text>
                <Text style={styles.statValueAmber}>{s.averageScore}</Text>
                <Text style={styles.statSub}>poin per pertandingan</Text>
              </View>
              <View style={[styles.statCard, { marginTop: 8 }]}>
                <Text style={styles.statLabel}>Skor Tertinggi</Text>
                <Text style={styles.statValuePurple}>{s.highestScore}</Text>
                <Text style={styles.statSub}>poin terbaik yang pernah dicapai</Text>
              </View>
              <View style={[styles.statCard, { marginTop: 8 }]}>
                <Text style={styles.statLabel}>Margin Kemenangan Terbesar</Text>
                <Text style={styles.statValueGreen}>+{s.biggestWinMargin}</Text>
                <Text style={styles.statSub}>selisih poin kemenangan terbesar</Text>
              </View>
            </View>
            <View style={styles.col}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>5 Pertandingan Terakhir</Text>
                <View style={styles.formRow}>
                  {(s.recentForm.length > 0 ? s.recentForm.slice(0, 5) : Array(5).fill(null)).map((win: boolean | null, i: number) => (
                    <View key={i} style={win === true ? styles.formDotWin : styles.formDotLoss}>
                      <Text style={[styles.formDotText, { color: win === true ? GREEN : RED }]}>
                        {win === true ? 'M' : 'K'}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.statSub, { marginTop: 5 }]}>M = Menang, K = Kalah</Text>
              </View>
              <View style={[styles.statCard, { marginTop: 8 }]}>
                <Text style={styles.statLabel}>Streak Menang Terpanjang</Text>
                <Text style={styles.statValueGreen}>{s.longestWinStreak}x</Text>
                <Text style={styles.statSub}>berturut-turut menang</Text>
              </View>
              <View style={[styles.statCard, { marginTop: 8 }]}>
                <Text style={styles.statLabel}>Streak Kalah Terpanjang</Text>
                <Text style={styles.statValueRed}>{s.longestLossStreak}x</Text>
                <Text style={styles.statSub}>berturut-turut kalah</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Laporan dibuat oleh Platform DLOB Community  •  {data.reportDate}  •  Halaman 1</Text>
        </View>
      </Page>

      {/* PAGE 2 — Tren Bulanan, Partner, Lawan */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { marginBottom: 16 }]}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: DARK }}>{data.memberName}</Text>
          <Text style={{ fontSize: 9, color: MUTED }}>Laporan Performa — {data.reportDate}</Text>
        </View>

        {data.monthlyData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tren Bulanan (Menang vs Kalah)</Text>
            <View style={styles.monthRow}>
              {data.monthlyData.map((m, i) => (
                <View key={i} style={styles.monthBlock}>
                  <Text style={[styles.statSub, { color: GREEN, textAlign: 'center' }]}>{m.wins}</Text>
                  <View style={[styles.monthBarWin, { height: barH(m.wins, maxMonthlyWin) }]} />
                  <View style={[styles.monthBarLoss, { height: barH(m.losses, maxMonthlyLoss) }]} />
                  <Text style={[styles.statSub, { color: RED, textAlign: 'center' }]}>{m.losses}</Text>
                  <Text style={styles.monthLabel}>{m.month}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, backgroundColor: '#86efac', borderRadius: 2 }} />
                <Text style={styles.statSub}>Menang</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, backgroundColor: '#fca5a5', borderRadius: 2 }} />
                <Text style={styles.statSub}>Kalah</Text>
              </View>
            </View>
          </View>
        )}

        {data.partnerStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistik Partner</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Nama Partner</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Main</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Menang</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Win%</Text>
            </View>
            {data.partnerStats.slice(0, 6).map((p, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.tableColName}>{p.name}</Text>
                <Text style={styles.tableColNum}>{p.matches}</Text>
                <Text style={[styles.tableColNum, { color: GREEN }]}>{p.wins}</Text>
                <Text style={[styles.tableColNum, { color: p.winRate >= 50 ? GREEN : RED, fontWeight: 'bold' }]}>
                  {(p.winRate ?? 0).toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.opponentStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistik Lawan</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Nama Lawan</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Main</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Menang</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Kalah</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Win%</Text>
            </View>
            {data.opponentStats.slice(0, 6).map((o, i) => (
              <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={styles.tableColName}>{o.name}</Text>
                <Text style={styles.tableColNum}>{o.matches}</Text>
                <Text style={[styles.tableColNum, { color: GREEN }]}>{o.wins}</Text>
                <Text style={[styles.tableColNum, { color: RED }]}>{o.losses}</Text>
                <Text style={[styles.tableColNum, { color: o.winRate >= 50 ? GREEN : RED, fontWeight: 'bold' }]}>
                  {(o.winRate ?? 0).toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.partnerRecommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rekomendasi Partner Terbaik</Text>
            {data.partnerRecommendations.slice(0, 3).map((r, i) => (
              <View key={i} style={[styles.highlightBox, { marginBottom: 6 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: DARK }}>{r.partner}</Text>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: GREEN }}>{(r.winRate ?? 0).toFixed(0)}% Win Rate</Text>
                </View>
                <Text style={{ fontSize: 9, color: MUTED, marginTop: 4 }}>{r.reason}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text>Laporan dibuat oleh Platform DLOB Community  •  {data.reportDate}  •  Halaman 2</Text>
        </View>
      </Page>

      {/* PAGE 3 — AI Insights */}
      {data.insights.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={[styles.header, { marginBottom: 16 }]}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: DARK }}>{data.memberName}</Text>
            <Text style={{ fontSize: 9, color: MUTED }}>Laporan Performa — {data.reportDate}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analisis AI — Wawasan Performa</Text>
            <Text style={[styles.statSub, { marginBottom: 10 }]}>
              Dianalisis oleh Google Gemini AI berdasarkan data pertandingan Anda.
            </Text>
            {data.insights.map((insight, index) => {
              const boxStyle = insight.type === 'strength'
                ? { ...styles.insightBox, ...styles.insightBoxStrength }
                : insight.type === 'improvement'
                ? { ...styles.insightBox, ...styles.insightBoxImprovement }
                : { ...styles.insightBox, ...styles.insightBoxRecommendation };
              const badgeStyle = insight.type === 'strength'
                ? { ...styles.insightBadge, ...styles.insightBadgeStrength }
                : insight.type === 'improvement'
                ? { ...styles.insightBadge, ...styles.insightBadgeImprovement }
                : { ...styles.insightBadge, ...styles.insightBadgeRecommendation };
              const badgeLabel = insight.type === 'strength' ? 'KELEBIHAN'
                : insight.type === 'improvement' ? 'PERLU DITINGKATKAN'
                : 'REKOMENDASI';
              return (
                <View key={index} style={boxStyle}>
                  <Text style={badgeStyle}>{badgeLabel}</Text>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightText}>{insight.description}</Text>
                </View>
              );
            })}
          </View>

          {data.chartImage && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Grafik Performa</Text>
              <Image src={data.chartImage} style={styles.chartImg} />
            </View>
          )}

          <View style={[styles.highlightBox, { marginTop: 10 }]}>
            <Text style={styles.highlightText}>Terus Tingkatkan Performa Anda!</Text>
            <Text style={styles.highlightSub}>
              Laporan ini dibuat untuk membantu Anda memahami tren permainan dan area yang perlu dikembangkan.
              Konsistensi adalah kunci utama peningkatan performa.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text>Laporan dibuat oleh Platform DLOB Community  •  {data.reportDate}  •  Halaman 3</Text>
          </View>
        </Page>
      )}
    </Document>
  );
};

export default MemberPerformanceReport;