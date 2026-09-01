import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  container: {
    borderWidth: 1.5,
    borderColor: '#111827',
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 20,
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  // Top Header Area with Brand & Red Lunas Stamp
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#111827',
    borderBottomStyle: 'solid',
    paddingBottom: 12,
    marginBottom: 14,
  },
  brandBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 38,
    height: 38,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#4b5563',
    marginTop: 1.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  receiptType: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  // RED LUNAS STAMP
  stampBox: {
    borderWidth: 2,
    borderColor: '#dc2626',
    borderStyle: 'solid',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    transform: 'rotate(-4deg)',
  },
  stampText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  stampSub: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  // Meta Info Grid (2 Columns)
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  metaCol: {
    width: '48%',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#6b7280',
    width: '38%',
  },
  metaValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    flex: 1,
  },
  // Table
  table: {
    borderWidth: 1,
    borderColor: '#111827',
    borderStyle: 'solid',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  th: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  td: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  tdBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  // Total Section
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  totalBox: {
    width: '50%',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderStyle: 'solid',
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  totalLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  // Note Section
  noteBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'solid',
    padding: 8,
    borderRadius: 2,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  noteTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: '#4b5563',
    lineHeight: 1.3,
  },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#111827',
    borderTopStyle: 'solid',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica',
    color: '#6b7280',
  },
});

const fmt = (n: number) =>
  'Rp ' + n.toLocaleString('id-ID');

const colorLabel = (w: string) =>
  w === 'biru' ? 'Biru' : w === 'kuning' ? 'Kuning' : 'Merah';

type Item = {
  warna: string; ukuran: string; lengan: string;
  nama_punggung: string | null; tanpa_nama_punggung: boolean; harga: number;
};

type ReceiptData = {
  orderId: string; orderNumber?: string; nama: string; no_wa: string;
  total_harga: number; created_at: string; items: Item[];
  logoSrc?: string;
};

export function JerseyReceiptPDF({ data }: { data: ReceiptData }) {
  const orderDate = new Date(data.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const orderNum = data.orderNumber || ('#' + data.orderId.slice(0, 8).toUpperCase());

  return (
    <Document title={`Kwitansi DLOB — ${data.nama}`} author="DLOB Community">
      <Page size="A5" orientation="portrait" style={styles.page}>
        <View style={styles.container}>
          <View>
            {/* Top Header with Brand & Red Stamp */}
            <View style={styles.topSection}>
              <View style={styles.brandBlock}>
                {data.logoSrc ? (
                  <Image src={data.logoSrc} style={styles.logo} />
                ) : null}
                <View>
                  <Text style={styles.title}>DLOB COMMUNITY</Text>
                  <Text style={styles.receiptType}>KWITANSI PEMBAYARAN RESMI</Text>
                </View>
              </View>

              {/* RED STAMP "LUNAS" */}
              <View style={styles.stampBox}>
                <Text style={styles.stampText}>LUNAS</Text>
                <Text style={styles.stampSub}>PAID & VERIFIED</Text>
              </View>
            </View>

            {/* Meta Info (2 Columns) */}
            <View style={styles.metaGrid}>
              <View style={styles.metaCol}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>No. Order:</Text>
                  <Text style={styles.metaValue}>{orderNum}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Tanggal:</Text>
                  <Text style={styles.metaValue}>{orderDate}</Text>
                </View>
              </View>

              <View style={styles.metaCol}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Pemesan:</Text>
                  <Text style={styles.metaValue}>{data.nama}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>WhatsApp:</Text>
                  <Text style={styles.metaValue}>{data.no_wa}</Text>
                </View>
              </View>
            </View>

            {/* Items Table */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: '22%' }]}>Item / Warna</Text>
                <Text style={[styles.th, { width: '15%' }]}>Ukuran</Text>
                <Text style={[styles.th, { width: '23%' }]}>Lengan</Text>
                <Text style={[styles.th, { width: '22%' }]}>Nama Punggung</Text>
                <Text style={[styles.th, { width: '18%', textAlign: 'right' }]}>Harga</Text>
              </View>
              {data.items.map((it, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tdBold, { width: '22%' }]}>{colorLabel(it.warna)}</Text>
                  <Text style={[styles.td, { width: '15%' }]}>{it.ukuran}</Text>
                  <Text style={[styles.td, { width: '23%' }]}>
                    {it.lengan === 'panjang' ? 'Panjang' : 'Pendek'}
                  </Text>
                  <Text style={[styles.td, { width: '22%' }]}>
                    {it.tanpa_nama_punggung ? '-' : it.nama_punggung || '-'}
                  </Text>
                  <Text style={[styles.tdBold, { width: '18%', textAlign: 'right' }]}>
                    {fmt(it.harga)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Total Box */}
            <View style={styles.totalSection}>
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>TOTAL BAYAR</Text>
                <Text style={styles.totalValue}>{fmt(data.total_harga)}</Text>
              </View>
            </View>

            {/* Note */}
            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>Keterangan:</Text>
              <Text style={styles.noteText}>
                Pembayaran telah diterima dan diverifikasi oleh admin DLOB Community. Jersey akan diproduksi dan diinformasikan melalui WhatsApp setelah selesai.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>DLOB Community · www.dlobcommunity.com</Text>
            <Text style={styles.footerText}>Dokumen kwitansi elektronik resmi & sah.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
