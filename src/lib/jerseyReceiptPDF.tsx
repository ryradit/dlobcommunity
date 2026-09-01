import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#f3f4f6', padding: 0 },
  card: { margin: 20, backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden' },
  // Header
  header: {
    backgroundColor: '#0b244c',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerTitle: { color: '#ffffff', fontSize: 18, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  headerSub: { color: '#93c5fd', fontSize: 10, marginTop: 3 },
  // Paid banner
  paidBanner: {
    backgroundColor: '#dcfce7',
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#86efac',
    borderBottomStyle: 'dashed',
  },
  paidTitle: { color: '#15803d', fontSize: 13, fontFamily: 'Helvetica-Bold' },
  paidSub: { color: '#166534', fontSize: 8.5, marginTop: 2 },
  // Body
  body: { paddingVertical: 16, paddingHorizontal: 24 },
  greeting: { fontSize: 10, color: '#374151', marginBottom: 12, lineHeight: 1.4 },
  // Meta box
  metaBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
  },
  metaRow: { flexDirection: 'row', marginBottom: 2 },
  metaLabel: { fontSize: 8.5, color: '#6b7280', width: '35%' },
  metaValue: { fontSize: 8.5, color: '#111827', fontFamily: 'Helvetica-Bold', flex: 1 },
  // Table
  tableLabel: {
    fontSize: 8.5,
    color: '#374151',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'solid',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: { fontSize: 7.5, color: '#d1d5db', fontFamily: 'Helvetica-Bold' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
  },
  tableCell: { fontSize: 8, color: '#111827' },
  // Total
  totalBox: {
    backgroundColor: '#0b244c',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 10, color: '#93c5fd', fontFamily: 'Helvetica-Bold' },
  totalValue: { fontSize: 13, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  // Note
  noteBox: {
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderStyle: 'solid',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  noteText: { fontSize: 8, color: '#92400e', lineHeight: 1.4 },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'solid',
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerText: { fontSize: 7.5, color: '#9ca3af' },
});

const fmt = (n: number) =>
  'Rp ' + n.toLocaleString('id-ID');

const colorLabel = (w: string) =>
  w === 'biru' ? 'Biru Navy' : w === 'kuning' ? 'Kuning' : 'Merah';

type Item = {
  warna: string; ukuran: string; lengan: string;
  nama_punggung: string | null; tanpa_nama_punggung: boolean; harga: number;
};

type ReceiptData = {
  orderId: string; orderNumber?: string; nama: string; no_wa: string;
  total_harga: number; created_at: string; items: Item[];
};

export function JerseyReceiptPDF({ data }: { data: ReceiptData }) {
  const orderDate = new Date(data.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const orderNum = data.orderNumber || ('#' + data.orderId.slice(0, 8).toUpperCase());

  return (
    <Document title={`Kwitansi DLOB — ${data.nama}`} author="DLOB Community">
      <Page size="A5" orientation="portrait" style={styles.page}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>DLOB Community</Text>
            <Text style={styles.headerSub}>Pre-Order Jersey New Batch</Text>
          </View>

          {/* Paid banner */}
          <View style={styles.paidBanner}>
            <Text style={styles.paidTitle}>✅ Pembayaran Lunas!</Text>
            <Text style={styles.paidSub}>Pesanan dikonfirmasi dan akan segera diproses.</Text>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.greeting}>
              Halo {data.nama}!{'\n'}
              Berikut kwitansi digital pembayaran jersey Pre-Order DLOB New Batch kamu.
            </Text>

            {/* Order meta */}
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>No. Order</Text>
                <Text style={styles.metaValue}>{orderNum}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Tanggal</Text>
                <Text style={styles.metaValue}>{orderDate}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>WhatsApp</Text>
                <Text style={styles.metaValue}>{data.no_wa}</Text>
              </View>
            </View>

            {/* Items table */}
            <Text style={styles.tableLabel}>Detail Pesanan</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { width: '22%' }]}>Warna</Text>
                <Text style={[styles.tableHeaderCell, { width: '14%' }]}>Ukuran</Text>
                <Text style={[styles.tableHeaderCell, { width: '22%' }]}>Lengan</Text>
                <Text style={[styles.tableHeaderCell, { width: '24%' }]}>Nama Punggung</Text>
                <Text style={[styles.tableHeaderCell, { width: '18%', textAlign: 'right' }]}>Harga</Text>
              </View>
              {data.items.map((it, i) => (
                <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#f9fafb' : '#ffffff' }]}>
                  <Text style={[styles.tableCell, { width: '22%' }]}>{colorLabel(it.warna)}</Text>
                  <Text style={[styles.tableCell, { width: '14%', fontFamily: 'Helvetica-Bold' }]}>{it.ukuran}</Text>
                  <Text style={[styles.tableCell, { width: '22%', color: '#4b5563' }]}>
                    {it.lengan === 'panjang' ? 'Lengan Panjang' : 'Lengan Pendek'}
                  </Text>
                  <Text style={[styles.tableCell, { width: '24%' }]}>
                    {it.tanpa_nama_punggung ? '(Tanpa nama)' : it.nama_punggung || '—'}
                  </Text>
                  <Text style={[styles.tableCell, { width: '18%', color: '#059669', fontFamily: 'Helvetica-Bold', textAlign: 'right' }]}>
                    {fmt(it.harga)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Total */}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Pembayaran</Text>
              <Text style={styles.totalValue}>{fmt(data.total_harga)}</Text>
            </View>

            {/* Note */}
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                Info Proses: Jersey akan diproses setelah semua pesanan terkumpul.
                Tim DLOB akan menghubungi kamu via WhatsApp untuk info pengiriman.
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© {new Date().getFullYear()} DLOB Community · dlobcommunity.com</Text>
            <Text style={[styles.footerText, { marginTop: 2 }]}>Dokumen ini digenerate otomatis.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
