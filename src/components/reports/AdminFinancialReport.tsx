/**
 * Admin Financial Report PDF Component
 * Generates financial reports for admin dashboard
 */

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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  summaryCard: {
    width: '48%',
    padding: 15,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    border: '1px solid #bbf7d0',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#166534',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803d',
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
  col1: { width: '30%' },
  col2: { width: '20%' },
  col3: { width: '25%' },
  col4: { width: '25%' },
  statusPaid: {
    color: '#16a34a',
    fontWeight: 'bold',
  },
  statusPending: {
    color: '#eab308',
    fontWeight: 'bold',
  },
  statusOverdue: {
    color: '#dc2626',
    fontWeight: 'bold',
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
  chartContainer: {
    width: '100%',
    height: 200,
    marginVertical: 15,
  },
});

export interface FinancialReportData {
  reportDate: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    totalPending: number;
    totalPaid: number;
    totalMembers: number;
    paymentRate: number;
  };
  payments: Array<{
    memberName: string;
    type: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    dueDate: string;
    paidDate?: string;
  }>;
  chartImage?: string;
  logo?: string;
}

export const AdminFinancialReport: React.FC<{ data: FinancialReportData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          {data.logo && <Image src={data.logo} style={styles.logo} />}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Financial Report</Text>
          <Text style={styles.subtitle}>DLOB Community Admin</Text>
          <Text style={styles.subtitle}>{data.reportDate}</Text>
        </View>
      </View>

      {/* Report Period */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Report Period</Text>
        <Text style={{ fontSize: 11, color: '#1e293b' }}>
          {data.period.start} - {data.period.end}
        </Text>
      </View>

      {/* Financial Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(data.summary.totalRevenue)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Payments Received</Text>
            <Text style={styles.summaryValue}>{data.summary.totalPaid}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fef3c7', borderColor: '#fde047' }]}>
            <Text style={[styles.summaryLabel, { color: '#854d0e' }]}>Pending Payments</Text>
            <Text style={[styles.summaryValue, { color: '#a16207' }]}>
              {data.summary.totalPending}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Payment Rate</Text>
            <Text style={styles.summaryValue}>{data.summary.paymentRate.toFixed(1)}%</Text>
          </View>
        </View>
      </View>

      {/* Revenue Chart */}
      {data.chartImage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Trends</Text>
          <Image src={data.chartImage} style={styles.chartContainer} />
        </View>
      )}

      {/* Payment Details Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableColHeader, styles.col1]}>Member</Text>
            <Text style={[styles.tableColHeader, styles.col2]}>Type</Text>
            <Text style={[styles.tableColHeader, styles.col3]}>Amount</Text>
            <Text style={[styles.tableColHeader, styles.col4]}>Status</Text>
          </View>
          {data.payments.slice(0, 15).map((payment, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.col1]}>{payment.memberName}</Text>
              <Text style={[styles.tableCol, styles.col2]}>{payment.type}</Text>
              <Text style={[styles.tableCol, styles.col3]}>
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(payment.amount)}
              </Text>
              <Text
                style={[
                  styles.tableCol,
                  styles.col4,
                  payment.status === 'paid' ? styles.statusPaid :
                  payment.status === 'pending' ? styles.statusPending :
                  payment.status === 'overdue' ? styles.statusOverdue : {},
                ]}
              >
                {payment.status.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
        {data.payments.length > 15 && (
          <Text style={{ fontSize: 9, color: '#64748b', marginTop: 10, fontStyle: 'italic' }}>
            Showing 15 of {data.payments.length} payments
          </Text>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>
          Generated by DLOB Community Platform • Report Date: {data.reportDate}
        </Text>
        <Text>Confidential - For Admin Use Only</Text>
      </View>
    </Page>
  </Document>
);

export default AdminFinancialReport;
