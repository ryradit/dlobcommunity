import {
  Document, Page, Text, View, StyleSheet, Image,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#f3f4f6', padding: 0 },
  card: { margin: 24, backgroundColor: '#ffffff', borderRadius: 12 },
  // Header
  header: { backgroundColor: '#0b244c', borderRadius: '12 12 0 0', padding: '24 28', alignItems: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontFamily: 'Helvetica-Bold', marginTop: 8 },
  headerSub: { color: '#93c5fd', fontSize: 10, marginTop: 3 },
  // Paid banner
  paidBanner: { backgroundColor: '#dcfce7', padding: '12 28', alignItems: 'center', borderBottom: '2pt dashed #bbf7d0' },
  paidTitle: { color: '#15803d', fontSize: 14, fontFamily: 'Helvetica-Bold' },
  paidSub: { color: '#166534', fontSize: 9, marginTop: 3 },
  // Body
  body: { padding: '20 28' },
  greeting: { fontSize: 11, color: '#374151', marginBottom: 14, lineHeight: 1.5 },
  // Meta box
  metaBox: { backgroundColor: '#f9fafb', borderRadius: 8, padding: '10 14', marginBottom: 16, border: '1pt solid #e5e7eb' },
  metaRow: { flexDirection: 'row', marginBottom: 3 },
  metaLabel: { fontSize: 9, color: '#6b7280', width: '40%' },
  metaValue: { fontSize: 9, color: '#111827', fontFamily: 'Helvetica-Bold', flex: 1 },
  // Table
  tableLabel: { fontSize: 9, color: '#374151', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  table: { border: '1pt solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 14 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#111827', padding: '7 10' },
  tableHeaderCell: { fontSize: 8, color: '#d1d5db', fontFamily: 'Helvetica-Bold' },
  tableRow: { flexDirection: 'row', padding: '7 10', borderTop: '1pt solid #e5e7eb' },
  tableCell: { fontSize: 9, color: '#111827' },
  // Total
  totalBox: { backgroundColor: '#0b244c', borderRadius: 8, padding: '12 16', marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 11, color: '#93c5fd', fontFamily: 'Helvetica-Bold' },
  totalValue: { fontSize: 15, color: '#ffffff', fontFamily: 'Helvetica-Bold' },
  // Note
  noteBox: { backgroundColor: '#fefce8', border: '1pt solid #fde68a', borderRadius: 8, padding: '10 14', marginBottom: 16 },
  noteText: { fontSize: 9, color: '#92400e', lineHeight: 1.6 },
  // Footer
  footer: { borderTop: '1pt solid #e5e7eb', padding: '12 28', alignItems: 'center' },
  footerText: { fontSize: 8, color: '#9ca3af' },
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
