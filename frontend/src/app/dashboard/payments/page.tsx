'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  AlertCircle,
  Download,
  Filter,
  Search
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paidAmount?: number;
  paymentMethod?: 'bank_transfer' | 'cash' | 'digital_wallet';
  type: 'monthly' | 'tournament' | 'special';
}

interface PaymentStats {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  paymentRate: number;
  thisMonthPaid: number;
}

export default function MemberPaymentPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    paymentRate: 0,
    thisMonthPaid: 0
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'partial'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    let isAuthenticated = false;
    let currentUser: any = null;
    
    // Get session and URL params at the start
    const { data: { session } } = await supabase.auth.getSession();
    const urlParams = new URLSearchParams(window.location.search);
    const testUser = urlParams.get('test_user');
    
    try {
      console.log('🔄 Loading real payment data for member...');
      console.log('📱 Supabase session:', session ? 'Found' : 'Not found');
      
      if (session) {
        console.log('👤 Session user email:', session.user?.email);
        console.log('🔑 Session access token exists:', !!session.access_token);
      }

      // Get current user info
      
      try {
        const authUrl = testUser ? `/api/auth/me?test_user=${testUser}` : '/api/auth/me';
        
        // Prepare headers with session token if available
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (session?.access_token && !testUser) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
          console.log('🔑 Sending access token with request');
        }
        
        const userResponse = await fetch(authUrl, {
          credentials: 'include',
          headers,
        });        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.user) {
            currentUser = userData.user;
            isAuthenticated = true;
            console.log('✅ Authenticated user:', currentUser.name, '(ID:', currentUser.id, ')');
            
            // Special debugging for Kevin
            if (currentUser.email === 'kevinharyono55@gmail.com' || currentUser.name.includes('Kevin')) {
              console.log('🎯 KEVIN DETECTED! Email:', currentUser.email, 'ID:', currentUser.id);
              console.log('🎯 Session info:', session ? 'Has session' : 'No session');
              console.log('🎯 Auth method:', session ? 'Google OAuth' : 'Test user');
            }
          } else {
            console.log('❌ Auth API returned success=false');
          }
        } else {
          console.log('❌ Auth API returned status:', userResponse.status);
        }
      } catch (authError) {
        console.log('❌ Authentication request failed:', authError);
      }
      
      // If no authenticated user, use demo mode with first available member
      if (!currentUser) {
        console.log('🎭 No authenticated user found, using demo mode...');
        const membersResponse = await fetch('/api/members');
        const membersData = await membersResponse.json();
        
        if (membersData.success && membersData.data && membersData.data.length > 0) {
          // Use Ryan Radityatama as demo user (has good sample data)
          const demoUser = membersData.data.find((m: any) => 
            m.name.toLowerCase().includes('ryan radityatama')
          ) || membersData.data[0];
          
          currentUser = {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email || 'demo@dlob.com',
            role: demoUser.role || 'member'
          };
          
          setIsUsingDemoData(true);
          console.log('👤 Using demo user:', currentUser.name, '(ID:', currentUser.id, ')');
        } else {
          throw new Error('No demo users available');
        }
      } else {
        // User is authenticated, ensure we don't use demo mode
        setIsUsingDemoData(false);
        console.log('🔐 User is authenticated, loading real payment data');
        console.log('✅ Authenticated as:', currentUser.name, 'with ID:', currentUser.id);
      }
      console.log('👤 Current user:', currentUser.name, '(ID:', currentUser.id, ')');

      // Get member's payment history
      console.log('🔍 Fetching payments for user ID:', currentUser.id);
      
      // Prepare headers for payment API call (include session token if available)
      const paymentHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token && !urlParams.get('test_user')) {
        paymentHeaders['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const paymentsResponse = await fetch(`/api/payments?member_id=${currentUser.id}`, {
        credentials: 'include',
        headers: paymentHeaders,
      });
      
      console.log('📡 Payments API response status:', paymentsResponse.status);
      const paymentsData = await paymentsResponse.json();
      console.log('📊 Payments API response:', paymentsData.success ? 'SUCCESS' : 'FAILED');
      
      // Handle the API response structure
      let memberPayments = [];
      if (paymentsData.success && paymentsData.data) {
        // Check if data has payments property (new structure) or is direct array (old structure)
        memberPayments = paymentsData.data.payments || paymentsData.data;
        // Ensure it's an array
        memberPayments = Array.isArray(memberPayments) ? memberPayments : [];
      }

      console.log('💰 Found member payments:', memberPayments.length);
      if (memberPayments.length > 0) {
        console.log('💳 First payment sample:', {
          id: memberPayments[0].id,
          type: memberPayments[0].type,
          amount: memberPayments[0].amount,
          member: memberPayments[0].member?.name,
          member_id: memberPayments[0].member_id
        });
        
        // Calculate total for comparison
        const totalAmount = memberPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        console.log('💰 Total payment amount loaded:', totalAmount);
        
        // Special check for Kevin
        if (currentUser.email === 'kevinharyono55@gmail.com' || currentUser.name.includes('Kevin')) {
          console.log('🎯 KEVIN PAYMENT CHECK:');
          console.log('🎯 Payments loaded:', memberPayments.length);
          console.log('🎯 Total amount:', totalAmount, '(should be 27000)');
          console.log('🎯 All payments:', memberPayments.map((p: any) => `${p.type}: ${p.amount}`));
        }
        
        // Verify payments belong to the current user
        const correctUser = memberPayments.every((p: any) => p.member_id === currentUser.id);
        console.log('🔍 Payment ownership verification:', correctUser ? '✅ CORRECT' : '❌ MISMATCH');
        
        if (!correctUser) {
          console.error('🚨 CRITICAL: Payments do not belong to current user!');
          console.error('Expected member_id:', currentUser.id);
          console.error('Found member_ids:', [...new Set(memberPayments.map((p: any) => p.member_id))]);
        }
      } else {
        console.log('⚠️ No payments found for user:', currentUser.name, '- will show empty state');
      }

      // Transform real payment data to match UI interface
      const transformedPayments: PaymentRecord[] = memberPayments.map((payment: any) => {
        // Determine payment type and description
        let title = '';
        let description = '';
        let type: 'monthly' | 'tournament' | 'special' = 'special';

        switch (payment.type) {
          case 'monthly':
            title = `Monthly Membership Fee - ${new Date(payment.due_date).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}`;
            description = 'Monthly membership fee for DLOB badminton community';
            type = 'monthly';
            break;
          case 'daily':
            title = `Saturday Session Fee - ${new Date(payment.due_date).toLocaleDateString('id-ID')}`;
            description = 'Saturday badminton session attendance fee';
            type = 'special';
            break;
          case 'match':
            title = `Match Shuttlecock Fee - ${new Date(payment.due_date).toLocaleDateString('id-ID')}`;
            description = 'Shuttlecock fee for badminton match';
            type = 'special';
            break;
          case 'tournament':
            title = `Tournament Entry Fee - ${new Date(payment.due_date).toLocaleDateString('id-ID')}`;
            description = 'Entry fee for badminton tournament';
            type = 'tournament';
            break;
          case 'penalty':
            title = `Late Payment Penalty - ${new Date(payment.due_date).toLocaleDateString('id-ID')}`;
            description = 'Penalty for late payment';
            type = 'special';
            break;
          default:
            title = `${payment.type || 'Payment'} - ${new Date(payment.due_date).toLocaleDateString('id-ID')}`;
            description = payment.notes || 'Payment fee';
        }

        // Determine status based on payment data
        let status: 'paid' | 'pending' | 'overdue' | 'partial' = 'pending';
        const now = new Date();
        const dueDate = new Date(payment.due_date);

        if (payment.status === 'paid') {
          status = 'paid';
        } else if (payment.status === 'partial') {
          status = 'partial';
        } else if (dueDate < now) {
          status = 'overdue';
        } else {
          status = 'pending';
        }

        // Map payment method
        let paymentMethod: 'bank_transfer' | 'cash' | 'digital_wallet' | undefined;
        if (payment.payment_method) {
          switch (payment.payment_method.toLowerCase()) {
            case 'bank_transfer':
            case 'transfer':
              paymentMethod = 'bank_transfer';
              break;
            case 'cash':
              paymentMethod = 'cash';
              break;
            case 'digital_wallet':
            case 'e_wallet':
            case 'gopay':
            case 'ovo':
            case 'dana':
              paymentMethod = 'digital_wallet';
              break;
          }
        }

        return {
          id: payment.id,
          title,
          description,
          amount: payment.amount,
          dueDate: payment.due_date,
          paidDate: payment.paid_date || undefined,
          status,
          paidAmount: payment.paid_amount || (status === 'paid' ? payment.amount : undefined),
          paymentMethod,
          type
        };
      });

      // Sort payments by due date (newest first)
      transformedPayments.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

      setPayments(transformedPayments);

      // Calculate real stats
      const totalPaid = transformedPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.paidAmount || p.amount), 0);
      
      const totalPending = transformedPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const totalOverdue = transformedPayments
        .filter(p => p.status === 'overdue')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const paymentRate = transformedPayments.length > 0 ? 
        Math.round((transformedPayments.filter(p => p.status === 'paid').length / transformedPayments.length) * 100) : 0;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthPaid = transformedPayments
        .filter(p => {
          if (!p.paidDate) return false;
          const paidDate = new Date(p.paidDate);
          return p.status === 'paid' && 
                 paidDate.getMonth() === currentMonth && 
                 paidDate.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + (p.paidAmount || p.amount), 0);

      setPaymentStats({
        totalPaid,
        totalPending,
        totalOverdue,
        paymentRate,
        thisMonthPaid
      });

      console.log('✅ Payment data loaded successfully', {
        isAuthenticated: isAuthenticated ? 'YES' : 'NO',
        isDemo: isAuthenticated ? 'NO' : 'YES',
        totalPayments: transformedPayments.length,
        totalPaid: formatCurrency(totalPaid),
        paymentRate: `${paymentRate}%`,
        userType: isAuthenticated ? 'Real User' : 'Demo Mode'
      });

    } catch (error) {
      console.error('❌ Error loading payment data:', error);
      
      // If we have an authenticated user, don't use fallback - just show empty state
      if (currentUser && isAuthenticated) {
        console.log('🚫 Authenticated user found but error occurred - showing empty state instead of fallback');
        setPayments([]);
        setPaymentStats({
          totalPaid: 0,
          totalPending: 0, 
          totalOverdue: 0,
          paymentRate: 0,
          thisMonthPaid: 0
        });
        setIsUsingDemoData(false);
        return;
      }
      
      // DISABLE fallback when user is authenticated - prevent wrong data override
      if (!currentUser && !isAuthenticated) {
        console.log('🔄 No authenticated user found, trying fallback demo data...');
        
        // Try to get all payments as fallback (for demo purposes only)
        try {
          console.log('🔄 Loading demo payments...');
          const allPaymentsResponse = await fetch('/api/payments', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        
        if (allPaymentsResponse.ok) {
          const allPaymentsData = await allPaymentsResponse.json();
          if (allPaymentsData.success && allPaymentsData.data) {
            let allPayments = allPaymentsData.data.payments || allPaymentsData.data;
            allPayments = Array.isArray(allPayments) ? allPayments : [];
            
            // Use the first member's payments as demo data
            if (allPayments.length > 0) {
              const firstMemberPayments = allPayments.filter((p: any) => 
                p.member_id === allPayments[0].member_id
              );
              
              console.log('📝 Using fallback payments from member:', allPayments[0].member?.name);
              // Only set demo mode if we weren't already authenticated
              if (!isAuthenticated) {
                setIsUsingDemoData(true);
              }
              
              // Transform fallback payments the same way
              const demoPayments: PaymentRecord[] = firstMemberPayments.map((payment: any) => {
                let title = '';
                let description = '';
                let type: 'monthly' | 'tournament' | 'special' = 'special';

                switch (payment.type) {
                  case 'monthly':
                    title = `Monthly Membership Fee - ${new Date(payment.due_date).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}`;
                    description = 'Monthly membership fee for DLOB badminton community';
                    type = 'monthly';
                    break;
                  case 'daily':
                    title = `Saturday Session Fee - ${new Date(payment.due_date).toLocaleDateString('id-ID')}`;
                    description = 'Saturday badminton session attendance fee';
                    type = 'special';
                    break;
                  case 'match':
                    title = `Match Shuttlecock Fee - ${new Date(payment.due_date).toLocaleDateString('id-ID')}`;
                    description = 'Shuttlecock fee for badminton match';
                    type = 'special';
                    break;
                  default:
                    title = `${payment.type || 'Payment'} - ${new Date(payment.due_date).toLocaleDateString('id-ID')}`;
                    description = payment.notes || 'Payment fee';
                }

                let status: 'paid' | 'pending' | 'overdue' | 'partial' = 'pending';
                const now = new Date();
                const dueDate = new Date(payment.due_date);

                if (payment.status === 'paid') {
                  status = 'paid';
                } else if (payment.status === 'partial') {
                  status = 'partial';
                } else if (dueDate < now) {
                  status = 'overdue';
                } else {
                  status = 'pending';
                }

                return {
                  id: payment.id,
                  title,
                  description,
                  amount: payment.amount,
                  dueDate: payment.due_date,
                  paidDate: payment.paid_date || undefined,
                  status,
                  paidAmount: payment.paid_amount || (status === 'paid' ? payment.amount : undefined),
                  paymentMethod: undefined,
                  type
                };
              });

              setPayments(demoPayments);

              // Calculate demo stats
              const totalPaid = demoPayments
                .filter(p => p.status === 'paid')
                .reduce((sum, p) => sum + (p.paidAmount || p.amount), 0);
              
              const totalPending = demoPayments
                .filter(p => p.status === 'pending')
                .reduce((sum, p) => sum + p.amount, 0);
              
              const totalOverdue = demoPayments
                .filter(p => p.status === 'overdue')
                .reduce((sum, p) => sum + p.amount, 0);

              setPaymentStats({
                totalPaid,
                totalPending,
                totalOverdue,
                paymentRate: demoPayments.length > 0 ? 
                  Math.round((demoPayments.filter(p => p.status === 'paid').length / demoPayments.length) * 100) : 0,
                thisMonthPaid: totalPaid
              });

              console.log('✅ Demo payment data loaded successfully');
              return;
            }
          }
        }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
        
        // Final fallback to empty state for demo mode
        setPayments([]);
        setPaymentStats({
          totalPaid: 0,
          totalPending: 0,
          totalOverdue: 0,
          paymentRate: 0,
          thisMonthPaid: 0
        });
        
        console.warn('Using empty payment state due to API error');
      } // Close the if (!currentUser && !isAuthenticated) block
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'overdue':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'partial':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'bank_transfer':
        return '🏦';
      case 'cash':
        return '💰';
      case 'digital_wallet':
        return '📱';
      default:
        return '';
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
                <p className="text-sm text-gray-600">Track your payment history and dues</p>
              </div>
            </div>
            <button className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Download className="h-4 w-4 mr-1" />
              Export History
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Paid</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(paymentStats.totalPaid)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-lg font-bold text-yellow-600">
                  {formatCurrency(paymentStats.totalPending)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(paymentStats.totalOverdue)}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payment Rate</p>
                <p className="text-2xl font-bold text-blue-600">{paymentStats.paymentRate}%</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Demo Data Alert */}
        {isUsingDemoData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Demo Mode</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Showing demo payment data. Please log in to view your personal payment history.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Outstanding Payments Alert */}
        {!isUsingDemoData && (paymentStats.totalPending > 0 || paymentStats.totalOverdue > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Outstanding Payments</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You have {formatCurrency(paymentStats.totalPending + paymentStats.totalOverdue)} in outstanding payments.
                  Please settle your dues to continue enjoying club benefits.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {getStatusIcon(payment.status)}
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{payment.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{payment.description}</p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Due: {formatDate(payment.dueDate)}</span>
                          </div>
                          {payment.paidDate && (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                              <span>Paid: {formatDate(payment.paidDate)}</span>
                            </div>
                          )}
                          {payment.paymentMethod && (
                            <div className="flex items-center">
                              <span className="mr-1">{getPaymentMethodIcon(payment.paymentMethod)}</span>
                              <span className="capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </div>
                    {payment.paidAmount && payment.paidAmount !== payment.amount && (
                      <div className="text-sm text-green-600">
                        Paid: {formatCurrency(payment.paidAmount)}
                      </div>
                    )}
                    <div className={`mt-2 ${getStatusBadge(payment.status)}`}>
                      {payment.status.toUpperCase()}
                    </div>
                    {payment.status === 'pending' && (
                      <button className="mt-2 flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>

                {payment.status === 'partial' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-800">
                        Remaining Balance: {formatCurrency(payment.amount - (payment.paidAmount || 0))}
                      </span>
                      <button className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pay Balance
                      </button>
                    </div>
                  </div>
                )}

                {payment.status === 'overdue' && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-800">
                        ⚠️ This payment is overdue. Please settle immediately.
                      </span>
                      <button className="flex items-center px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700">
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pay Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredPayments.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No payments found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Payment Methods Info */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🏦</span>
                <h4 className="font-medium text-gray-900">Bank Transfer</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">BCA: 1234567890</p>
              <p className="text-sm text-gray-600">a.n. DLOB Badminton Club</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">📱</span>
                <h4 className="font-medium text-gray-900">Digital Wallet</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">GoPay / OVO / Dana</p>
              <p className="text-sm text-gray-600">0812-3456-7890</p>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">💰</span>
                <h4 className="font-medium text-gray-900">Cash Payment</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">Pay directly to admin</p>
              <p className="text-sm text-gray-600">During club sessions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}