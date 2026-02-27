/**
 * Member Performance Report PDF Component
 * Generates professional PDF reports for member analytics
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '2px solid #2563eb',
  },
  logo: {
    width: 100,
    height: 'auto',
    maxHeight: 60,
    objectFit: 'contain',
  },
  headerText: {
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    color: '#64748b',
  },
  value: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 10,
  },
  statCard: {
    width: '48%',
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  chart: {
    width: '100%',
    height: 250,
    marginVertical: 15,
  },
  insightBox: {
    backgroundColor: '#eff6ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    border: '1px solid #bfdbfe',
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  insightText: {
    fontSize: 10,
    color: '#1e293b',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
    borderTop: '1px solid #e2e8f0',
    paddingTop: 10,
  },
  badge: {
    fontSize: 9,
    color: '#fff',
    backgroundColor: '#22c55e',
    padding: '4px 8px',
    borderRadius: 4,
  },
});

export interface MemberReportData {
  memberName: string;
  memberEmail: string;
  reportDate: string;
  stats: {
    totalMatches: number;
    winRate: number;
    singlesWinRate: number;
    doublesWinRate: number;
    attendanceRate: number;
    currentRank: number;
    totalMembers: number;
  };
  insights: Array<{
    title: string;
    description: string;
    type: 'strength' | 'improvement' | 'recommendation';
  }>;
  chartImage?: string; // Base64 image of performance chart
  logo?: string; // Base64 logo image
}

export const MemberPerformanceReport: React.FC<{ data: MemberReportData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with logo */}
      <View style={styles.header}>
        <View>
          {data.logo && <Image src={data.logo} style={styles.logo} />}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Performance Report</Text>
          <Text style={styles.subtitle}>DLOB Community</Text>
          <Text style={styles.subtitle}>{data.reportDate}</Text>
        </View>
      </View>

      {/* Member Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Member Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{data.memberName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{data.memberEmail}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Current Ranking:</Text>
          <Text style={styles.value}>
            #{data.stats.currentRank} of {data.stats.totalMembers} members
          </Text>
        </View>
      </View>

      {/* Performance Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Matches</Text>
            <Text style={styles.statValue}>{data.stats.totalMatches}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Overall Win Rate</Text>
            <Text style={styles.statValue}>{data.stats.winRate.toFixed(1)}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Singles Win Rate</Text>
            <Text style={styles.statValue}>{data.stats.singlesWinRate.toFixed(1)}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Doubles Win Rate</Text>
            <Text style={styles.statValue}>{data.stats.doublesWinRate.toFixed(1)}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Attendance Rate</Text>
            <Text style={styles.statValue}>{data.stats.attendanceRate.toFixed(1)}%</Text>
          </View>
        </View>
      </View>

      {/* Performance Chart */}
      {data.chartImage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Trends</Text>
          <Image src={data.chartImage} style={styles.chart} />
        </View>
      )}

      {/* AI Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI-Generated Insights</Text>
        {data.insights.slice(0, 3).map((insight, index) => (
          <View key={index} style={styles.insightBox}>
            <Text style={styles.insightTitle}>
              {insight.type === 'strength' && '💪 '}{insight.type === 'improvement' && '📈 '}
              {insight.type === 'recommendation' && '💡 '}{insight.title}
            </Text>
            <Text style={styles.insightText}>{insight.description}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>
          Generated by DLOB Community Platform • Report Date: {data.reportDate}
        </Text>
        <Text>For more information, visit https://dlob.community</Text>
      </View>
    </Page>
  </Document>
);

export default MemberPerformanceReport;
