/**
 * Shuttlecock Usage Report PDF Component
 * Generates shuttlecock usage reports grouped by time periods (weekly, monthly, yearly, total)
 */

'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 5,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  periodCard: {
    width: '22%',
    padding: 18,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    border: '1px solid #bbf7d0',
  },
  periodCardAlt: {
    width: '22%',
    padding: 18,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    border: '1px solid #bfdbfe',
  },
  periodLabel: {
    fontSize: 11,
    color: '#166534',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  periodLabelAlt: {
    fontSize: 11,
    color: '#1e40af',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  periodPeriod: {
    fontSize: 9,
    color: '#4b7c59',
    marginBottom: 10,
  },
  periodPeriodAlt: {
    fontSize: 9,
    color: '#3730a3',
    marginBottom: 10,
  },
  periodValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#15803d',
  },
  periodValueAlt: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  periodUnit: {
    fontSize: 9,
    color: '#166534',
    marginTop: 5,
  },
  periodUnitAlt: {
    fontSize: 9,
    color: '#1e40af',
    marginTop: 5,
  },
  detailsSection: {
    marginTop: 20,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderBottom: '2px solid #cbd5e1',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1px solid #e2e8f0',
  },
  tableCol: {
    fontSize: 10,
  },
  tableColHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  col1: { width: '40%' },
  col2: { width: '30%' },
  col3: { width: '30%' },
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
});

export interface PeriodSummary {
  periodName: string;
  periodLabel: string;
  shuttlecocks: number;
  matches: number;
}

export interface MonthlySummary {
  month: string;
  monthLabel: string;
  shuttlecocks: number;
  matches: number;
}

export interface ShuttlecockUsageReportData {
  reportDate: string;
  generatedDate: string;
  summaries: PeriodSummary[];
  monthlySummaries?: MonthlySummary[];
  logo?: string;
}

export const ShuttlecockUsageReport: React.FC<{ data: ShuttlecockUsageReportData }> = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {data.logo && <Image src={data.logo} style={styles.logo} />}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Shuttlecock Usage Report</Text>
            <Text style={styles.subtitle}>DLOB Community Admin</Text>
            <Text style={styles.subtitle}>{data.generatedDate}</Text>
          </View>
        </View>

        {/* Report Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Summary</Text>
          <Text style={{ fontSize: 11, color: '#1e293b' }}>
            {data.reportDate}
          </Text>
        </View>

        {/* Usage by Time Period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shuttlecock Usage by Period</Text>
          <View style={styles.periodGrid}>
            {data.summaries.map((summary, index) => {
              const isAlternate = index % 2 === 1;
              return (
                <View
                  key={index}
                  style={isAlternate ? styles.periodCardAlt : styles.periodCard}
                >
                  <Text style={isAlternate ? styles.periodLabelAlt : styles.periodLabel}>
                    {summary.periodName}
                  </Text>
                  <Text style={isAlternate ? styles.periodPeriodAlt : styles.periodPeriod}>
                    {summary.periodLabel}
                  </Text>
                  <Text style={isAlternate ? styles.periodValueAlt : styles.periodValue}>
                    {summary.shuttlecocks}
                  </Text>
                  <Text style={isAlternate ? styles.periodUnitAlt : styles.periodUnit}>
                    Shuttlecocks ({summary.matches} matches)
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Summary Section Table */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Summary Details</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableColHeader, styles.col1]}>Period</Text>
              <Text style={[styles.tableColHeader, styles.col2]}>Matches</Text>
              <Text style={[styles.tableColHeader, styles.col3]}>Shuttlecocks</Text>
            </View>
            {data.summaries.map((summary, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.col1]}>
                  {summary.periodName} • {summary.periodLabel}
                </Text>
                <Text style={[styles.tableCol, styles.col2]}>{summary.matches}</Text>
                <Text style={[styles.tableCol, styles.col3]}>{summary.shuttlecocks}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Breakdown Section */}
        {data.monthlySummaries && data.monthlySummaries.length > 0 && (
          <View style={[styles.section, { marginTop: 30, paddingTop: 20, borderTop: '2px solid #e2e8f0' }]}>
            <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableColHeader, styles.col1]}>Month</Text>
                <Text style={[styles.tableColHeader, styles.col2]}>Matches</Text>
                <Text style={[styles.tableColHeader, styles.col3]}>Shuttlecocks</Text>
              </View>
              {data.monthlySummaries.map((monthly, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCol, styles.col1]}>
                    {monthly.month}
                  </Text>
                  <Text style={[styles.tableCol, styles.col2]}>{monthly.matches}</Text>
                  <Text style={[styles.tableCol, styles.col3]}>{monthly.shuttlecocks}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated by DLOB Community Platform • Report Date: {data.generatedDate}
          </Text>
          <Text>Confidential - For Admin Use Only</Text>
        </View>
      </Page>
    </Document>
  );
};
