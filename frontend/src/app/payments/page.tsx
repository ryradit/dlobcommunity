'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useLanguage, LanguageSwitcher } from '@/hooks/useLanguage';

interface Payment {
  id: string;
  member_id: string;
  amount: number;
  type: 'daily' | 'monthly' | 'tournament';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_date?: string;
  payment_method?: 'cash' | 'transfer' | 'midtrans' | 'xendit';
  transaction_id?: string;
  notes?: string;
  member: {
    id: string;
    name: string;
    email: string;
  };
}

export default function PaymentsPage() {
  const { language } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      // Mock data for demonstration
      const mockPayments: Payment[] = [
        {
          id: '1',
          member_id: '1',
          amount: 50000,
          type: 'monthly',
          status: 'pending',
          due_date: '2025-10-25',
          member: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com'
          },
          notes: 'Monthly membership fee'
        },
        {
          id: '2',
          member_id: '2',
          amount: 15000,
          type: 'daily',
          status: 'paid',
          due_date: '2025-10-22',
          paid_date: '2025-10-22T09:00:00Z',
          payment_method: 'transfer',
          transaction_id: 'TXN001',
          member: {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com'
          }
        },
        {
          id: '3',
          member_id: '3',
          amount: 100000,
          type: 'tournament',
          status: 'overdue',
          due_date: '2025-10-15',
          member: {
            id: '3',
            name: 'Bob Wilson',
            email: 'bob@example.com'
          },
          notes: 'Tournament registration fee'
        }
      ];
      
      setPayments(mockPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (activeTab === 'all') return true;
    return payment.status === activeTab;
  });

  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {language === 'en' ? 'Payments' : 'Pembayaran'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {language === 'en' ? 'Manage your membership fees and payments' : 'Kelola iuran dan pembayaran keanggotaan Anda'}
                </p>
              </div>
              <div className="ml-6">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Paid</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Overdue</h3>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Payments' },
                { key: 'pending', label: 'Pending' },
                { key: 'paid', label: 'Paid' },
                { key: 'overdue', label: 'Overdue' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <div key={payment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {getStatusIcon(payment.status)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{payment.member.name}</h3>
                        <p className="text-gray-600">{payment.member.email}</p>
                        {payment.notes && (
                          <p className="text-sm text-gray-500">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.type === 'daily' 
                            ? 'bg-blue-100 text-blue-800'
                            : payment.type === 'monthly'
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {payment.type}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 text-sm mt-2">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Due: {new Date(payment.due_date).toLocaleDateString()}</span>
                      </div>
                      {payment.paid_date && (
                        <div className="text-gray-600 text-sm">
                          Paid: {new Date(payment.paid_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {payment.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm">
                        Pay Now
                      </button>
                      <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm">
                        Mark as Paid
                      </button>
                    </div>
                  )}

                  {payment.payment_method && payment.transaction_id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Payment Method: <span className="font-medium">{payment.payment_method}</span>
                        {payment.transaction_id && (
                          <span className="ml-4">
                            Transaction ID: <span className="font-mono">{payment.transaction_id}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No payments found</h3>
                <p className="text-gray-600">No payments match your current filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}