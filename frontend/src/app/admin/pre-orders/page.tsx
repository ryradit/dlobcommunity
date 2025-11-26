'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PreOrder {
  id: string;
  nama: string;
  ukuran: string;
  warna: string;
  nama_punggung: string | null;
  tanpa_nama_punggung: boolean;
  harga: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function PreOrderAdminPage() {
  const [orders, setOrders] = useState<PreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const getColorLabel = (color: string) => {
    switch (color) {
      case 'biru': return 'Biru Navy';
      case 'pink': return 'Pink';
      case 'kuning': return 'Kuning';
      default: return color;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Dikonfirmasi' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Dibatalkan' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Selesai' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/pre-orders');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch orders');
        }

        setOrders(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data pre-order...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-4">Admin Pre-Order</h1>
          <p className="text-gray-700">
            Kelola dan pantau semua pre-order jersey DLOB Community
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 text-lg">Belum ada pre-order yang masuk</p>
              <p className="text-gray-500 mt-2">Pre-order akan muncul di sini setelah ada yang submit form</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-black">
                    Total Pre-Order: {orders.length}
                  </h2>
                  <div className="text-sm text-gray-600">
                    Total Nilai: {formatPrice(orders.reduce((sum, order) => sum + order.harga, 0))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jersey Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Harga
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.nama}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {order.id.substring(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div>Ukuran: <span className="font-medium">{order.ukuran}</span></div>
                            <div>Warna: <span className="font-medium">{getColorLabel(order.warna)}</span></div>
                            <div>
                              Nama Punggung: 
                              <span className="font-medium ml-1">
                                {order.tanpa_nama_punggung ? 'Tanpa Nama' : (order.nama_punggung || '-')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-black">
                            {formatPrice(order.harga)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-black mb-3">Panduan Admin:</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Data pre-order akan tersimpan otomatis ketika customer submit form</li>
            <li>• Status default adalah "Pending" - ubah sesuai progress pesanan</li>
            <li>• Gunakan informasi ini untuk follow-up pembayaran dan produksi</li>
            <li>• Data dapat diekspor atau diintegrasikan dengan sistem lain</li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
}