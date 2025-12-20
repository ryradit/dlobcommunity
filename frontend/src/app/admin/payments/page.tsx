'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MembershipService } from '@/lib/services/membershipService';
import { 
  ArrowLeft,
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  Plus,
  Send,
  Eye,
  Edit,
  Trash2,
  Crown,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface PaymentRequirement {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  type: 'monthly' | 'tournament' | 'special';
  status: 'active' | 'inactive';
  createdDate: string;
  applicableMembers: 'all' | 'premium' | 'regular';
}

interface PaymentRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  requirementId: string;
  requirementTitle: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paidAmount?: number;
  paymentMethod?: 'bank_transfer' | 'cash' | 'digital_wallet';
  notes?: string;
}

interface PaymentStats {
  totalRequirements: number;
  totalPendingAmount: number;
  totalCollectedAmount: number;
  paymentRate: number;
  overduePayments: number;
}

export default function AdminPaymentManagementPage() {
  const [paymentRequirements, setPaymentRequirements] = useState<PaymentRequirement[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalRequirements: 0,
    totalPendingAmount: 0,
    totalCollectedAmount: 0,
    paymentRate: 0,
    overduePayments: 0
  });

  const [activeTab, setActiveTab] = useState<'requirements' | 'payments'>('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'partial'>('all');
  const [showAddRequirementModal, setShowAddRequirementModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [conversionType, setConversionType] = useState<'to-membership' | 'to-daily'>('to-membership');
  const [showMemberPaymentModal, setShowMemberPaymentModal] = useState(false);
  const [selectedMemberPayments, setSelectedMemberPayments] = useState<any>(null);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      console.log('🔄 Loading real payment data from API...');

      // Fetch real payment records from API
      const paymentsResponse = await fetch('/api/payments');
      const paymentsData = await paymentsResponse.json();
      
      if (!paymentsData.success) {
        throw new Error('Failed to fetch payments');
      }

      // Fetch all members for member details
      const membersResponse = await fetch('/api/members');
      const membersData = await membersResponse.json();
      const allMembers = membersData.success ? membersData.data : [];

      // Handle the new API structure: { success: true, data: { payments: [...], stats: {...} } }
      let paymentsList = [];
      if (paymentsData.success && paymentsData.data) {
        // Check if data has payments property (new structure) or is direct array (old structure)
        paymentsList = paymentsData.data.payments || paymentsData.data;
        // Ensure it's an array
        paymentsList = Array.isArray(paymentsList) ? paymentsList : [];
      }

      console.log('🔍 Raw payments data structure:', {
        success: paymentsData.success,
        hasData: !!paymentsData.data,
        dataKeys: paymentsData.data ? Object.keys(paymentsData.data) : [],
        paymentsListLength: paymentsList.length,
        firstPayment: paymentsList.length > 0 ? paymentsList[0] : 'none',
        firstPaymentId: paymentsList.length > 0 ? paymentsList[0]?.id : 'none',
        allPaymentIds: paymentsList.slice(0, 5).map((p: any) => ({ 
          id: p.id, 
          type: typeof p.id, 
          member_id: p.member_id, 
          amount: p.amount,
          isUndefined: p.id === undefined,
          isNull: p.id === null,
          isStringUndefined: p.id === 'undefined',
          isEmpty: p.id === '',
          isFalsy: !p.id
        })),
        undefinedIds: paymentsList.filter((p: any) => !p.id || p.id === 'undefined' || p.id === undefined).length,
        totalPayments: paymentsList.length
      });

      // Transform payment data to match interface
      const realPayments: PaymentRecord[] = paymentsList.map((payment: any, index: number) => {
        const member = allMembers.find((m: any) => m.id === payment.member_id);
        
        // Ensure payment has a valid ID - use existing ID or generate one
        let paymentId = payment.id;
        if (!paymentId || paymentId === 'undefined' || paymentId === undefined || paymentId === null || paymentId === '') {
          // Generate a more robust fallback ID using member_id and due_date if payment.id is missing
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const safeMemberId = payment.member_id || 'unknown';
          const safeDate = payment.due_date || new Date().toISOString().split('T')[0];
          paymentId = `gen_payment_${safeMemberId}_${safeDate}_${index}_${timestamp}_${randomSuffix}`;
          console.warn('⚠️ Payment missing ID, generated robust ID:', paymentId, 'for payment:', payment);
        }
        
        return {
          id: paymentId,
          memberId: payment.member_id,
          memberName: member?.name || 'Unknown Member',
          memberEmail: member?.email || 'unknown@email.com',
          requirementId: payment.match_id || 'general',
          requirementTitle: getPaymentTitle(payment),
          amount: payment.amount,
          dueDate: payment.due_date,
          paidDate: payment.paid_date,
          status: payment.status as 'paid' | 'pending' | 'overdue' | 'partial',
          paidAmount: payment.status === 'paid' ? payment.amount : undefined,
          paymentMethod: getPaymentMethod(payment),
          notes: payment.notes || getPaymentNotes(payment)
        };
      });

      // Create dynamic requirements based on payment patterns
      const requirementMap = new Map();
      realPayments.forEach(payment => {
        if (!requirementMap.has(payment.requirementTitle)) {
          requirementMap.set(payment.requirementTitle, {
            id: payment.requirementId,
            title: payment.requirementTitle,
            description: getRequirementDescription(payment),
            amount: payment.amount,
            dueDate: payment.dueDate,
            type: getPaymentTypeFromTitle(payment.requirementTitle),
            status: 'active' as const,
            createdDate: new Date().toISOString().split('T')[0],
            applicableMembers: 'all' as const
          });
        }
      });

      const realRequirements: PaymentRequirement[] = Array.from(requirementMap.values());

      console.log('✅ Real payment data loaded:', {
        payments: realPayments.length,
        requirements: realRequirements.length
      });

      setPaymentRecords(realPayments);
      setPaymentRequirements(realRequirements);

      // Calculate real stats
      const totalRequirements = realRequirements.filter(r => r.status === 'active').length;
      const totalPendingAmount = realPayments
        .filter(p => p.status === 'pending' || p.status === 'overdue')
        .reduce((sum, p) => sum + p.amount, 0);
      const totalCollectedAmount = realPayments
        .filter(p => p.status === 'paid' || p.status === 'partial')
        .reduce((sum, p) => sum + (p.paidAmount || p.amount), 0);
      const overduePayments = realPayments.filter(p => {
        if (p.status !== 'pending') return false;
        const dueDate = new Date(p.dueDate);
        const today = new Date();
        return dueDate < today;
      }).length;
      const paymentRate = realPayments.length > 0 
        ? Math.round((realPayments.filter(p => p.status === 'paid').length / realPayments.length) * 100)
        : 0;

      setPaymentStats({
        totalRequirements,
        totalPendingAmount,
        totalCollectedAmount,
        paymentRate,
        overduePayments
      });

    } catch (error) {
      console.error('❌ Error loading payment data:', error);
      
      // Fallback to sample data if API fails
      console.log('⚠️ Using fallback payment data');
      setPaymentRecords([]);
      setPaymentRequirements([]);
      setPaymentStats({
        totalRequirements: 0,
        totalPendingAmount: 0,
        totalCollectedAmount: 0,
        paymentRate: 0,
        overduePayments: 0
      });
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const getPaymentTitle = (payment: any) => {
    // Check if this is a match-based payment (has match_id or match info in notes)
    const isMatchPayment = payment.match_id || (payment.notes && payment.notes.includes('🏸 Match Payment'));
    
    if (isMatchPayment) {
      // Extract player names from notes if available
      const playerMatch = payment.notes?.match(/Players: ([^.]+)/);
      const playersText = playerMatch ? playerMatch[1] : 'Unknown Players';
      
      return `🏸 Match Payment - ${formatDate(payment.due_date)} (${playersText})`;
    }
    
    switch (payment.type) {
      case 'monthly':
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'];
        const dueDate = new Date(payment.due_date);
        const monthYear = `${monthNames[dueDate.getMonth()]} ${dueDate.getFullYear()}`;
        return `💳 Monthly Membership Fee - ${monthYear}`;
      case 'shuttlecock':
        return `🏸 Shuttlecock Fee - ${formatDate(payment.due_date)}`;
      case 'daily':
        // Check if this is a session payment
        if (payment.notes?.includes('Daily Session Fee') || payment.notes?.includes('Session Fee')) {
          return `📅 Daily Session Fee - ${formatDate(payment.due_date)} (Convertible to Membership)`;
        }
        return `Daily Payment - ${formatDate(payment.due_date)}`;
      case 'match':
        return `Match Fee - ${formatDate(payment.due_date)}`;
      case 'tournament':
        return `🏆 Tournament Entry Fee`;
      case 'penalty':
        return `⚠️ Late Payment Penalty`;
      default:
        return `Payment Fee - ${formatDate(payment.due_date)}`;
    }
  };

  const getPaymentMethod = (payment: any): 'bank_transfer' | 'cash' | 'digital_wallet' | undefined => {
    if (payment.payment_method) return payment.payment_method;
    if (payment.status === 'paid') return 'bank_transfer'; // Default assumption
    return undefined;
  };

  const getPaymentNotes = (payment: any) => {
    // Use the existing notes if available (contains match and player info)
    if (payment.notes) {
      return payment.notes;
    }
    
    // Fallback to generating notes from fee breakdown
    let notes = '';
    if (payment.shuttlecock_fee > 0) {
      notes += `Shuttlecock fee: Rp ${payment.shuttlecock_fee.toLocaleString('id-ID')}`;
    }
    if (payment.attendance_fee > 0) {
      if (notes) notes += ', ';
      notes += `Session fee: Rp ${payment.attendance_fee.toLocaleString('id-ID')}`;
    }
    return notes || 'Regular payment';
  };

  // Helper function to identify payment types for better UI grouping
  const isShuttlecockPayment = (payment: PaymentRecord) => {
    return payment.notes?.includes('🏸 Shuttlecock') || 
           payment.requirementTitle.includes('🏸 Shuttlecock') ||
           payment.requirementTitle.includes('Shuttlecock Fee') ||
           (payment.amount > 0 && payment.amount <= 5000);
  };

  const isSessionPayment = (payment: PaymentRecord) => {
    return payment.notes?.includes('📅 Daily Session') || 
           payment.notes?.includes('Session Fee') ||
           payment.requirementTitle.includes('📅 Daily Session') ||
           payment.requirementTitle.includes('Session Fee') ||
           (payment.amount >= 15000 && payment.amount <= 25000);
  };

  const isConvertibleToMembership = (payment: PaymentRecord) => {
    return isSessionPayment(payment) && payment.status === 'pending' && payment.amount >= 18000;
  };

  const getRequirementDescription = (payment: PaymentRecord) => {
    if (payment.requirementTitle.includes('🏸 Match Payment')) {
      return 'Payment for specific badminton match including shuttlecock and session fees for all players involved';
    }
    
    switch (true) {
      case payment.requirementTitle.includes('Monthly Membership'):
        return 'Monthly membership fee for DLOB badminton club access';
      case payment.requirementTitle.includes('Saturday Session'):
        return 'Saturday evening session attendance fee (8:00 PM)';
      case payment.requirementTitle.includes('Shuttlecock'):
        return 'Shuttlecock usage fee for matches and sessions';
      case payment.requirementTitle.includes('Tournament'):
        return 'Tournament entry and participation fee';
      default:
        return 'General payment requirement';
    }
  };

  const getPaymentTypeFromTitle = (title: string): 'monthly' | 'tournament' | 'special' => {
    if (title.includes('Monthly Membership')) return 'monthly';
    if (title.includes('Tournament')) return 'tournament';
    return 'special';
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

  const handleMarkPayment = async (payment: PaymentRecord, status: 'paid' | 'partial', amount?: number, paymentMethod?: string, paymentNotes?: string) => {
    // 🚨 IMMEDIATE PARAMETER CAPTURE - BEFORE ANY OTHER CODE
    console.log('🔬 FUNCTION ENTRY - RAW PARAMETERS:', {
      argumentsLength: arguments.length,
      payment: payment,
      paymentId: payment?.id,
      paymentIdType: typeof payment?.id,
      paymentIdStringified: JSON.stringify(payment?.id),
      paymentExists: !!payment,
      status: status,
      amount: amount,
      paymentMethod: paymentMethod,
      paymentNotes: paymentNotes
    });

    // 🚨 FREEZE THE PAYMENT OBJECT TO PREVENT MUTATIONS
    const frozenPayment = Object.freeze({...payment});
    console.log('❄️ FROZEN PAYMENT COPY:', frozenPayment);

    try {
      console.log('💳 Updating payment status:', { 
        paymentId: frozenPayment?.id, 
        paymentObject: frozenPayment,
        status, 
        amount 
      });
      
      // Validate payment object and ID using frozen copy
      if (!frozenPayment) {
        throw new Error('Invalid payment: Payment object is missing');
      }
      
      if (!frozenPayment.id || frozenPayment.id === 'undefined' || frozenPayment.id === undefined) {
        console.error('❌ Invalid payment ID details:', {
          paymentId: frozenPayment.id,
          paymentIdType: typeof frozenPayment.id,
          memberName: frozenPayment.memberName,
          memberId: frozenPayment.memberId,
          fullPayment: frozenPayment,
          originalPayment: payment
        });
        throw new Error(`Invalid payment ID: "${frozenPayment.id}". Cannot update payment for ${frozenPayment.memberName}`);
      }
      
      console.log('🔗 Update URL preparation:', {
        paymentId: frozenPayment.id,
        paymentIdType: typeof frozenPayment.id,
        paymentIdLength: frozenPayment.id?.length,
        paymentIdValue: JSON.stringify(frozenPayment.id),
        url: `/api/payments/${frozenPayment.id}`
      });

      // Check if this is a generated ID (not from database) - MUST happen before validation
      const isGeneratedId = !frozenPayment.id || 
                            frozenPayment.id === 'undefined' || 
                            frozenPayment.id === undefined ||
                            frozenPayment.id === null ||
                            frozenPayment.id === '' ||
                            (frozenPayment.id && typeof frozenPayment.id === 'string' && (
                              frozenPayment.id.startsWith('payment_') || 
                              frozenPayment.id.startsWith('gen_payment_') || 
                              frozenPayment.id.startsWith('emergency_')
                            )) ||
                            (frozenPayment as any).isGeneratedPayment;

      console.log('🔍 Generated ID check result:', {
        isGeneratedId,
        paymentId: frozenPayment.id,
        paymentIdType: typeof frozenPayment.id,
        checks: {
          isNil: !frozenPayment.id,
          isStringUndefined: frozenPayment.id === 'undefined',
          isUndefined: frozenPayment.id === undefined,
          isNull: frozenPayment.id === null,
          isEmpty: frozenPayment.id === '',
          startsWithPayment: frozenPayment.id && typeof frozenPayment.id === 'string' && frozenPayment.id.startsWith('payment_'),
          startsWithGenPayment: frozenPayment.id && typeof frozenPayment.id === 'string' && frozenPayment.id.startsWith('gen_payment_'),
          startsWithEmergency: frozenPayment.id && typeof frozenPayment.id === 'string' && frozenPayment.id.startsWith('emergency_'),
          hasGeneratedFlag: (frozenPayment as any).isGeneratedPayment
        }
      });

      // If it's not a generated ID but still invalid, this is a critical error
      if (!isGeneratedId && (!frozenPayment.id || frozenPayment.id === undefined || frozenPayment.id === 'undefined' || frozenPayment.id === null || frozenPayment.id === '')) {
        console.error('🚨 CRITICAL: Payment ID is invalid but not flagged as generated:', {
          id: frozenPayment.id,
          idType: typeof frozenPayment.id,
          idStringified: JSON.stringify(frozenPayment.id),
          isGeneratedId: isGeneratedId,
          paymentObject: frozenPayment,
          paymentTitle: frozenPayment.requirementTitle,
          memberName: frozenPayment.memberName,
          originalPayment: payment
        });
        throw new Error(`CRITICAL: Payment ID is invalid but not flagged as generated: "${frozenPayment.id}" (${typeof frozenPayment.id})`);
      }
      
      const updatePayload = {
        status,
        paid_date: new Date().toISOString().split('T')[0],
        paid_amount: amount || frozenPayment.amount,
        payment_method: paymentMethod || 'cash',
        notes: paymentNotes || `Payment marked as ${status} by admin`,
        // Include member_id and other fields for new payment creation
        member_id: frozenPayment.memberId,
        amount: frozenPayment.amount,
        due_date: frozenPayment.dueDate,
        type: frozenPayment.requirementTitle.includes('Shuttlecock') ? 'shuttlecock' :
              frozenPayment.requirementTitle.includes('Session') ? 'daily' :
              frozenPayment.requirementTitle.includes('Membership') ? 'monthly' : 'general'
      };
      
      console.log('📤 Update payload:', updatePayload);
      console.log('🔍 Is generated ID?:', isGeneratedId);

      // Extreme safety: Ensure frozenPayment.id is never undefined in URL
      console.log('🔍 PRE-SAFETY CHECK - Payment ID Analysis:', {
        frozenPaymentId: frozenPayment.id,
        frozenPaymentIdType: typeof frozenPayment.id,
        frozenPaymentIdStringified: JSON.stringify(frozenPayment.id),
        frozenPaymentIdExists: !!frozenPayment.id,
        frozenPaymentIdIsUndefined: frozenPayment.id === undefined,
        frozenPaymentIdIsNull: frozenPayment.id === null,
        frozenPaymentIdIsEmpty: frozenPayment.id === '',
        frozenPaymentIdIsStringUndefined: frozenPayment.id === 'undefined'
      });

      // For generated payments, we'll create new ones, so ID doesn't matter for URL construction
      // For real payments, ensure we have a valid ID
      let safePaymentId = frozenPayment.id;
      if (isGeneratedId) {
        // For generated payments, we'll POST to /api/payments, so ID doesn't matter for URL
        safePaymentId = `temp_id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        console.log('🆕 Using temporary ID for new payment creation:', safePaymentId);
      } else if (!safePaymentId || safePaymentId === 'undefined' || safePaymentId === undefined || safePaymentId === null || safePaymentId === '') {
        // This should never happen now, but keep as final safety
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        safePaymentId = `emergency_payment_${frozenPayment.memberId}_${timestamp}_${randomSuffix}`;
        console.warn('🚨 EMERGENCY ID GENERATION for non-generated payment:', safePaymentId);
      }
      
      console.log('🛡️ SAFE ID CREATION:', {
        originalFrozenId: frozenPayment.id,
        safePaymentId: safePaymentId,
        safeIdType: typeof safePaymentId,
        safeIdStringified: JSON.stringify(safePaymentId)
      });

      const apiUrl = isGeneratedId ? '/api/payments' : `/api/payments/${safePaymentId}`;
      const method = isGeneratedId ? 'POST' : 'PUT';
      
      console.log('🛡️ EXTREME SAFETY CHECK:', {
        originalId: frozenPayment.id,
        safeId: safePaymentId,
        isGenerated: isGeneratedId,
        finalUrl: apiUrl,
        method: method,
        urlConstruction: `isGeneratedId ? '/api/payments' : '/api/payments/${safePaymentId}'`,
        actualUrlParts: apiUrl.split('/')
      });
      
      console.log('📡 API Call Details:', { 
        url: apiUrl, 
        method, 
        paymentId: frozenPayment.id,
        payloadMemberId: updatePayload.member_id,
        fullPayload: updatePayload
      });

      // Log the exact URL being called
      console.log('🌐 Exact API URL being called:', apiUrl);
      console.log('📦 Request payload being sent:', JSON.stringify(updatePayload, null, 2));

      // 🚨 CRITICAL: FINAL CHECK BEFORE FETCH CALL
      console.log('🚨 CRITICAL PRE-FETCH VALIDATION:', {
        apiUrl: apiUrl,
        urlContainsUndefined: apiUrl.includes('undefined'),
        method: method,
        frozenPaymentId: frozenPayment.id,
        safePaymentId: safePaymentId,
        isGeneratedId: isGeneratedId,
        urlParts: apiUrl.split('/'),
        lastUrlPart: apiUrl.split('/').pop()
      });

      // Prevent undefined URLs from being called - FINAL SAFETY CHECK
      if (apiUrl.includes('undefined') || apiUrl.includes('null') || apiUrl.endsWith('/') || safePaymentId.includes('undefined')) {
        console.error('🚨 EMERGENCY STOP: Invalid URL detected!', {
          url: apiUrl,
          frozenId: frozenPayment.id,
          safeId: safePaymentId,
          isGenerated: isGeneratedId,
          urlParts: apiUrl.split('/'),
          safeIdCheck: {
            type: typeof safePaymentId,
            value: safePaymentId,
            includesUndefined: safePaymentId.includes('undefined'),
            stringified: JSON.stringify(safePaymentId)
          }
        });
        throw new Error(`EMERGENCY STOP: Invalid API URL detected: ${apiUrl}. SafeId: ${safePaymentId}`);
      }

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
          requestUrl: apiUrl,
          requestMethod: method,
          paymentId: frozenPayment.id,
          safePaymentId: safePaymentId,
          isGeneratedId: isGeneratedId,
          memberName: frozenPayment.memberName
        });
        
        // Try to parse the error for better messaging
        let parsedError;
        try {
          parsedError = JSON.parse(errorText);
        } catch {
          parsedError = { error: errorText };
        }
        
        throw new Error(`Failed to ${isGeneratedId ? 'create' : 'update'} payment: ${parsedError.error || errorText}`);
      }

      const result = await response.json();
      console.log('📥 API response:', result);
      
      if (result.success) {
        const action = isGeneratedId ? 'created and marked' : 'updated';
        console.log(`✅ Payment ${action} successfully`);
        
        // For new payments, we might get a new ID back
        const updatedPaymentId = isGeneratedId && result.data?.id ? result.data.id : payment.id;
        
        // Update local state
        const updatedRecords = paymentRecords.map(record =>
          record.id === frozenPayment.id
            ? {
                ...record,
                id: updatedPaymentId, // Update with real ID if it was generated
                status,
                paidDate: new Date().toISOString().split('T')[0],
                paidAmount: amount || frozenPayment.amount,
                paymentMethod: paymentMethod as any,
                notes: paymentNotes || `Payment marked as ${status} by admin`
              }
            : record
        );
        setPaymentRecords(updatedRecords);
        
        // Show success message
        alert(`✅ Payment ${action} as ${status} successfully!\n\nMember: ${frozenPayment.memberName}\nAmount: ${formatCurrency(amount || frozenPayment.amount)}\nPayment ID: ${updatedPaymentId}`);
        
        // Reload data to get fresh stats
        await loadPaymentData();
      } else {
        console.error('❌ API returned error:', result.error);
        throw new Error(result.error || `Failed to ${isGeneratedId ? 'create' : 'update'} payment`);
      }
      
    } catch (error: any) {
      console.error('❌ Error updating payment:', error);
      console.error('❌ Error details:', {
        message: error.message,
        paymentId: frozenPayment.id,
        memberId: frozenPayment.memberId,
        memberName: frozenPayment.memberName,
        originalPaymentId: payment?.id
      });
      alert(`❌ Error updating payment: ${error.message}\n\nPayment ID: ${frozenPayment.id}\nMember: ${frozenPayment.memberName}`);
    } finally {
      setShowPaymentModal(false);
      setSelectedPayment(null);
    }
  };

  // Debug function to test a single payment in isolation
  const debugSinglePayment = async (payment: PaymentRecord) => {
    console.log('🧪 DEBUG: COMPLETE Payment Object Analysis:', {
      paymentObject: payment,
      allKeys: Object.keys(payment),
      allValues: Object.values(payment),
      id: payment.id,
      idType: typeof payment.id,
      idValue: JSON.stringify(payment.id),
      idExists: 'id' in payment,
      idHasValue: !!payment.id,
      idIsUndefined: payment.id === undefined,
      idIsNull: payment.id === null,
      idIsEmptyString: payment.id === '',
      idIsStringUndefined: payment.id === 'undefined',
      memberId: payment.memberId,
      memberName: payment.memberName,
      title: payment.requirementTitle,
      amount: payment.amount
    });

    // IMMEDIATE TEST - Check if payment.id would create undefined URL
    const wouldBeUrl = `/api/payments/${payment.id}`;
    console.log('🧪 DEBUG - URL Test:', {
      paymentId: payment.id,
      wouldBeUrl: wouldBeUrl,
      containsUndefined: wouldBeUrl.includes('undefined')
    });

    if (wouldBeUrl.includes('undefined')) {
      console.error('🚨 DEBUG - FOUND THE PROBLEM! Payment ID is undefined!');
      alert(`🚨 Found the root cause!\n\nPayment ID: ${payment.id}\nURL would be: ${wouldBeUrl}\n\nThis payment object has no valid ID!`);
      return;
    }

    // Create a safe copy with guaranteed valid ID
    const safePayment = {
      ...payment,
      id: payment.id || `emergency_${Date.now()}_${Math.random().toString(36).substring(2)}`
    };

    console.log('🛡️ DEBUG: Created safe payment copy:', {
      originalId: payment.id,
      safeId: safePayment.id,
      safePayment: safePayment
    });

    try {
      await handleMarkPayment(safePayment, 'paid', safePayment.amount, 'cash', 'Debug test payment');
      console.log('✅ DEBUG: Single payment test SUCCEEDED');
      alert('✅ Debug test successful!');
    } catch (error: any) {
      console.error('❌ DEBUG: Single payment test FAILED:', error);
      console.error('❌ DEBUG: Error details:', {
        errorMessage: error.message,
        errorStack: error.stack,
        safePaymentId: safePayment.id,
        originalPaymentId: payment.id
      });
      alert(`❌ Debug test failed: ${error.message}`);
    }
  };

  // Alternative direct API call bypassing handleMarkPayment
  const directPaymentTest = async (payment: PaymentRecord) => {
    console.log('🚀 DIRECT API TEST: Bypassing handleMarkPayment function');
    console.log('🚀 DIRECT TEST - Payment Object:', {
      payment: payment,
      paymentId: payment.id,
      paymentIdType: typeof payment.id,
      paymentIdExists: !!payment.id
    });

    // Test what URL would actually be constructed
    const testUrl = `/api/payments/${payment.id}`;
    console.log('🚀 DIRECT TEST - URL Construction:', {
      paymentId: payment.id,
      testUrl: testUrl,
      urlContainsUndefined: testUrl.includes('undefined')
    });

    // If URL contains undefined, stop here
    if (testUrl.includes('undefined')) {
      console.error('🚨 DIRECT TEST - URL CONTAINS UNDEFINED!', {
        originalPaymentId: payment.id,
        constructedUrl: testUrl
      });
      alert(`🚨 Direct test found the problem!\n\nPayment ID: ${payment.id}\nURL: ${testUrl}\n\nThe payment object has an undefined ID!`);
      return;
    }
    
    const testPayment = {
      member_id: payment.memberId,
      amount: payment.amount,
      type: 'daily',
      status: 'paid',
      paid_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      notes: 'Direct API test payment',
      due_date: payment.dueDate || new Date().toISOString().split('T')[0]
    };

    console.log('📤 DIRECT: Calling POST /api/payments directly:', testPayment);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayment)
      });

      console.log('📡 DIRECT: Response status:', response.status);
      const result = await response.json();
      console.log('📥 DIRECT: Response data:', result);

      if (result.success) {
        alert('✅ Direct API call successful! Payment created with ID: ' + result.data?.id);
      } else {
        alert('❌ Direct API call failed: ' + result.error);
      }
    } catch (error: any) {
      console.error('❌ DIRECT: API call failed:', error);
      alert('❌ Direct API call failed: ' + error.message);
    }
  };

  const handleMarkAllPaymentsForMember = async (memberPayments: any, status: 'paid' | 'partial', paymentMethod?: string, paymentNotes?: string) => {
    try {
      const member = memberPayments.member;
      let allPayments = [
        ...(memberPayments.shuttlecockPayments || []),
        memberPayments.sessionPayment,
        memberPayments.membershipPayment,
        ...memberPayments.otherPayments
      ].filter(Boolean);

      console.log(`💳 Marking ALL payments for ${member.name}:`, {
        memberName: member.name,
        paymentCount: allPayments.length,
        totalAmount: allPayments.reduce((sum: number, p: any) => sum + p.amount, 0),
        status,
        paymentIds: allPayments.map((p: any) => ({ id: p.id, type: typeof p.id, title: p.requirementTitle }))
      });

      if (allPayments.length === 0) {
        throw new Error(`No payments found for ${member.name}`);
      }

      // Deep validation and comprehensive debugging of payment data
      console.log('🔍 DEEP DEBUG - Raw payment data before processing:', {
        memberName: member.name,
        memberId: member.id,
        shuttlecockPayments: memberPayments.shuttlecockPayments?.map((p: any) => ({
          id: p.id, 
          idType: typeof p.id, 
          title: p.requirementTitle,
          amount: p.amount,
          fullObject: p
        })),
        sessionPayment: memberPayments.sessionPayment ? {
          id: memberPayments.sessionPayment.id,
          idType: typeof memberPayments.sessionPayment.id,
          title: memberPayments.sessionPayment.requirementTitle,
          amount: memberPayments.sessionPayment.amount,
          fullObject: memberPayments.sessionPayment
        } : null,
        membershipPayment: memberPayments.membershipPayment ? {
          id: memberPayments.membershipPayment.id,
          idType: typeof memberPayments.membershipPayment.id,
          title: memberPayments.membershipPayment.requirementTitle,
          amount: memberPayments.membershipPayment.amount,
          fullObject: memberPayments.membershipPayment
        } : null
      });

      // Validate and fix payment IDs before processing
      allPayments = allPayments.map((payment: any, index: number) => {
        console.log(`🔍 Validating payment ${index + 1}:`, {
          originalId: payment.id,
          idType: typeof payment.id,
          isUndefined: payment.id === undefined,
          isStringUndefined: payment.id === 'undefined',
          isNull: payment.id === null,
          isFalsy: !payment.id,
          paymentTitle: payment.requirementTitle,
          memberId: payment.memberId,
          memberIdFromParent: member.id
        });

        if (!payment.id || payment.id === 'undefined' || payment.id === undefined || payment.id === null) {
          // Create a more robust ID generation
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const safeDate = payment.dueDate || new Date().toISOString().split('T')[0];
          const safeMemberId = payment.memberId || member.id || 'unknown';
          
          const newId = `gen_payment_${safeMemberId}_${safeDate}_${index}_${timestamp}_${randomSuffix}`;
          
          console.warn(`⚠️ GENERATING NEW ID for payment:`, {
            oldId: payment.id,
            newId: newId,
            paymentTitle: payment.requirementTitle,
            memberName: member.name,
            reason: 'Invalid or missing ID'
          });
          
          return { 
            ...payment, 
            id: newId,
            memberId: safeMemberId, // Ensure memberId is set
            isGeneratedPayment: true // Flag to identify generated payments
          };
        }
        
        console.log(`✅ Payment ${index + 1} has valid ID:`, payment.id);
        return payment;
      });

      console.log('🔍 FINAL PAYMENT DATA after ID validation:', 
        allPayments.map((p: any, i: number) => ({
          index: i + 1,
          id: p.id,
          idType: typeof p.id,
          isGenerated: p.isGeneratedPayment || false,
          title: p.requirementTitle,
          amount: p.amount,
          memberId: p.memberId
        }))
      );

      // Mark all payments as paid with individual error handling
      const results = [];
      const errors = [];

      for (let i = 0; i < allPayments.length; i++) {
        const payment = allPayments[i];
        try {
          console.log(`🔄 Processing payment ${i + 1}/${allPayments.length} for ${member.name}:`, {
            id: payment.id,
            idType: typeof payment.id,
            title: payment.requirementTitle,
            amount: payment.amount,
            memberId: payment.memberId,
            isGenerated: payment.isGeneratedPayment || false
          });
          
          // Final safety check before API call
          if (!payment.id || payment.id === 'undefined' || payment.id === undefined) {
            throw new Error(`Payment still has invalid ID after validation: "${payment.id}" for payment "${payment.requirementTitle}"`);
          }
          
          // For debugging - check if this is a generated payment that should be created as new
          if (payment.isGeneratedPayment) {
            console.log(`🔧 Processing GENERATED payment - will create as new:`, {
              id: payment.id,
              title: payment.requirementTitle,
              amount: payment.amount,
              memberId: payment.memberId
            });
          }
          
          await handleMarkPayment(payment, status, payment.amount, paymentMethod, paymentNotes);
          results.push({ payment: payment.requirementTitle, success: true });
          console.log(`✅ Successfully processed payment ${i + 1}: ${payment.requirementTitle}`);
        } catch (error: any) {
          console.error(`❌ Failed to process payment ${i + 1}:`, {
            paymentId: payment.id,
            paymentTitle: payment.requirementTitle,
            error: error.message
          });
          errors.push({ payment: payment.requirementTitle, error: error.message });
        }
      }

      // Check if we had any failures
      if (errors.length > 0) {
        const successCount = results.length;
        const errorCount = errors.length;
        
        console.warn(`⚠️ Partial success for ${member.name}:`, {
          successful: successCount,
          failed: errorCount,
          errors: errors
        });

        if (successCount > 0) {
          // Some succeeded, some failed
          alert(`⚠️ PARTIAL SUCCESS for ${member.name}\n\n` +
                `✅ Successfully processed: ${successCount} payments\n` +
                `❌ Failed to process: ${errorCount} payments\n\n` +
                `Failed payments:\n${errors.map(e => `• ${e.payment}: ${e.error}`).join('\n')}\n\n` +
                `Please check the failed payments manually.`);
        } else {
          // All failed
          throw new Error(`All ${errorCount} payments failed to process:\n${errors.map(e => `• ${e.payment}: ${e.error}`).join('\n')}`);
        }
      } else {
        // All succeeded
        console.log(`✅ All payments processed successfully for ${member.name}`);
      }

      // Show success message only if all payments were processed
      if (errors.length === 0) {
        const totalAmount = allPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        alert(`✅ ALL PAYMENTS MARKED AS ${status.toUpperCase()}!\n\n` +
              `🏸 Member: ${member.name}\n` +
              `💰 Total Amount: ${formatCurrency(totalAmount)}\n` +
              `📄 Payments Updated: ${allPayments.length}\n` +
              `💳 Method: ${paymentMethod || 'cash'}\n\n` +
              `All shuttlecock, session, and membership fees have been processed!`);
      }

      // Reload payment data to reflect changes
      await loadPaymentData();

    } catch (error: any) {
      console.error('❌ Error marking all payments for member:', error);
      alert(`❌ Error marking all payments: ${error.message}`);
    } finally {
      // Always reload data in case some payments were processed
      try {
        await loadPaymentData();
      } catch (reloadError) {
        console.warn('⚠️ Failed to reload payment data after processing');
      }
    }
  };

  const handleConvertToDailySession = async (payment: PaymentRecord) => {
    try {
      console.log('🔄 Starting conversion to daily session for:', payment?.memberName || 'Unknown');
      
      // Validate payment object exists
      if (!payment || !payment.id || !payment.memberId) {
        throw new Error('Invalid payment data for daily session conversion');
      }

      console.log('📤 Calling daily conversion API with:', {
        paymentId: payment.id,
        memberId: payment.memberId
      });

      // Call the membership to daily conversion API
      const conversionResponse = await fetch('/api/payments/convert-to-daily', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId: payment.id,
          memberId: payment.memberId
        })
      });

      console.log('📡 Daily conversion API response status:', conversionResponse.status);
      
      if (!conversionResponse.ok) {
        const errorText = await conversionResponse.text();
        console.error('❌ Daily conversion API error:', errorText);
        throw new Error(`Failed to convert to daily session: ${errorText}`);
      }

      const conversionResult = await conversionResponse.json();
      console.log('✅ Daily session conversion result:', conversionResult);

      if (!conversionResult.success) {
        throw new Error(conversionResult.error || 'Conversion failed');
      }

      const { originalMembershipAmount, newSessionFee, message } = conversionResult.data;

      // Success message
      alert(`✅ Converted to Daily Session!\n\n` +
            `🏸 Member: ${payment.memberName}\n` +
            `� Session Fee: Rp${newSessionFee.toLocaleString('id-ID')}\n` +
            `💰 Original Membership: Rp${originalMembershipAmount.toLocaleString('id-ID')} (removed)\n` +
            `� Status: Back to pay-per-session model\n\n` +
            `${message}`);

      // Reload payment data
      await loadPaymentData();
      setShowMembershipModal(false);
      setSelectedPayment(null);

    } catch (error: any) {
      console.error('❌ Error converting to daily session:', error);
      alert(`❌ Error converting to daily session: ${error.message}`);
    }
  };

  const handleConvertToMembership = async (payment: PaymentRecord) => {
    try {
      console.log('🔄 Starting membership conversion for:', payment?.memberName || 'Unknown');
      
      // Validate payment object exists
      if (!payment || !payment.id || !payment.memberId) {
        throw new Error('Invalid payment data for membership conversion');
      }

      console.log('📤 Calling conversion API with:', {
        paymentId: payment.id,
        memberId: payment.memberId
      });

      // Call the new membership conversion API
      const conversionResponse = await fetch('/api/payments/convert-to-membership', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId: payment.id,
          memberId: payment.memberId
        })
      });

      console.log('📡 Conversion API response status:', conversionResponse.status);
      
      if (!conversionResponse.ok) {
        const errorText = await conversionResponse.text();
        console.error('❌ Conversion API error:', errorText);
        throw new Error(`Failed to convert to membership: ${errorText}`);
      }

      const conversionResult = await conversionResponse.json();
      console.log('✅ Membership conversion result:', conversionResult);

      if (!conversionResult.success) {
        throw new Error(conversionResult.error || 'Conversion failed');
      }

      const { membershipFee, saturdayCount, monthName, message } = conversionResult.data;

      // Success message
      alert(`✅ Converted to Membership!\n\n` +
            `🏸 Member: ${payment.memberName}\n` +
            `💰 Membership Fee: Rp${membershipFee.toLocaleString('id-ID')} (${saturdayCount} weeks)\n` +
            `📅 Period: ${monthName}\n` +
            `🎯 Original Session Payment: Removed (Rp${payment.amount.toLocaleString('id-ID')})\n` +
            `🚀 Future Matches: Only shuttlecock fees required!\n\n` +
            `${message}`);

      // Reload payment data
      await loadPaymentData();
      setShowMembershipModal(false);
      setSelectedPayment(null);

    } catch (error: any) {
      console.error('❌ Error converting to membership:', error);
      alert(`❌ Error converting to membership: ${error.message}`);
    }
  };

  const filteredPayments = paymentRecords.filter(record => {
    const matchesSearch = record.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.requirementTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
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
                href="/admin"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
                <p className="text-sm text-gray-600">Manage payment requirements and track collections</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAddRequirementModal(true)}
                className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Requirement
              </button>
              <button className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Requirements</p>
                <p className="text-2xl font-bold text-gray-900">{paymentStats.totalRequirements}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collected Amount</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(paymentStats.totalCollectedAmount)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(paymentStats.totalPendingAmount)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'payments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Payment Records
              </button>
              <button
                onClick={() => setActiveTab('requirements')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'requirements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Payment Requirements
              </button>
            </nav>
          </div>

          {activeTab === 'payments' && (
            <div>
              {/* Filters and Search */}
              <div className="p-6 border-b border-gray-200">
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

              {/* Payment Records - Grouped by Member */}
              <div className="space-y-6 p-6">
                {(() => {
                  // Group payments by member NAME and date (to handle duplicate member IDs)
                  const groupedPayments = filteredPayments.reduce((acc, payment) => {
                    const key = `${payment.memberName}_${payment.dueDate}`;
                    if (!acc[key]) {
                      acc[key] = {
                        member: {
                          id: payment.memberId,
                          name: payment.memberName,
                          email: payment.memberEmail
                        },
                        dueDate: payment.dueDate,
                        shuttlecockPayments: [], // Changed to array to handle multiple shuttlecock payments
                        sessionPayment: null,
                        membershipPayment: null,
                        otherPayments: []
                      };
                    }
                    
                    // Categorize payments using helper functions
                    if (isShuttlecockPayment(payment)) {
                      acc[key].shuttlecockPayments.push(payment); // Add to array for multiple shuttlecock payments
                    } else if (isSessionPayment(payment)) {
                      acc[key].sessionPayment = payment;
                    } else if (payment.requirementTitle.includes('Monthly Membership') || payment.requirementTitle.includes('💳 Monthly Membership')) {
                      // This is a membership payment that should be grouped with the same session
                      acc[key].membershipPayment = payment;
                    } else {
                      acc[key].otherPayments.push(payment);
                    }
                    
                    return acc;
                  }, {} as any);

                  return Object.values(groupedPayments).map((group: any, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                      {/* Member Header */}
                      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 rounded-t-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{group.member.name}</h3>
                            <p className="text-sm text-gray-600">{group.member.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">Due Date</p>
                            <p className="text-lg font-semibold text-blue-600">{formatDate(group.dueDate)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Details - Improved Layout */}
                      <div className="p-6">
                        <div className="space-y-6">
                          
                          {/* Shuttlecock Payments Section */}
                          {group.shuttlecockPayments && group.shuttlecockPayments.length > 0 && (
                            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-xl">🏸</span>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-orange-900">
                                      Shuttlecock Fees ({group.shuttlecockPayments.length} matches)
                                    </h4>
                                    <p className="text-sm text-orange-700">Equipment usage charges</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-orange-900">
                                    {formatCurrency(group.shuttlecockPayments.reduce((sum: number, p: any) => sum + p.amount, 0))}
                                  </p>
                                  <p className="text-xs text-orange-600">
                                    {group.shuttlecockPayments.filter((p: any) => p.status === 'paid').length} of {group.shuttlecockPayments.length} paid
                                  </p>
                                </div>
                              </div>
                              
                              {/* Individual Shuttlecock Payment Items */}
                              <div className="space-y-2 mb-3">
                                {group.shuttlecockPayments.map((payment: any, idx: number) => (
                                  <div key={idx} className="bg-orange-100 p-3 rounded-lg flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-orange-900">
                                        Match {idx + 1}: {formatCurrency(payment.amount)}
                                      </p>
                                      {payment.notes && (
                                        <p className="text-xs text-orange-600 truncate">
                                          {payment.notes}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2 ml-3">
                                      {getStatusIcon(payment.status)}
                                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(payment.status)}`}>
                                        {payment.status.toUpperCase()}
                                      </span>
                                      <button
                                        onClick={() => {
                                          console.log('🧪 BUTTON CLICKED - Updated code is running!', payment);
                                          alert(`🧪 Debug button clicked!\n\nPayment ID: ${payment.id}\nMember: ${payment.memberName}\nAmount: ${payment.amount}`);
                                          debugSinglePayment(payment);
                                        }}
                                        className="flex items-center px-1 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors mr-1"
                                        title="Debug Test This Payment"
                                      >
                                        🧪
                                      </button>
                                      <button
                                        onClick={() => directPaymentTest(payment)}
                                        className="flex items-center px-1 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors mr-1"
                                        title="Direct API Test (Bypass handleMarkPayment)"
                                      >
                                        🚀
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedPayment(payment);
                                          setShowPaymentModal(true);
                                        }}
                                        className="flex items-center px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                                        title="Mark as Paid"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Shuttlecock Summary Actions */}
                              <div className="flex items-center justify-between pt-3 border-t border-orange-200">
                                <span className="text-sm text-orange-700 font-medium">
                                  Total Shuttlecock: {formatCurrency(group.shuttlecockPayments.reduce((sum: number, p: any) => sum + p.amount, 0))}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <button className="flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 text-xs rounded-md hover:bg-orange-200 transition-colors">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View All
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Session Payment or Membership Payment */}
                          {(group.sessionPayment || group.membershipPayment) && (
                            <div className={`border-2 rounded-lg p-4 ${
                              group.membershipPayment 
                                ? 'bg-purple-50 border-purple-200' 
                                : 'bg-green-50 border-green-200'
                            }`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                    group.membershipPayment 
                                      ? 'bg-purple-100' 
                                      : 'bg-green-100'
                                  }`}>
                                    <span className="text-xl">
                                      {group.membershipPayment ? '�' : '�📅'}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className={`font-semibold ${
                                      group.membershipPayment 
                                        ? 'text-purple-900' 
                                        : 'text-green-900'
                                    }`}>
                                      {group.membershipPayment ? 'Monthly Membership' : 'Session Fee'}
                                    </h4>
                                    <p className={`text-sm ${
                                      group.membershipPayment 
                                        ? 'text-purple-700' 
                                        : 'text-green-700'
                                    }`}>
                                      {group.membershipPayment 
                                        ? 'Monthly facility access' 
                                        : 'Attendance & facility charge'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-lg font-bold ${
                                    group.membershipPayment 
                                      ? 'text-purple-900' 
                                      : 'text-green-900'
                                  }`}>
                                    {formatCurrency(
                                      group.membershipPayment?.amount || group.sessionPayment?.amount
                                    )}
                                  </p>
                                  <div className="flex items-center">
                                    {getStatusIcon(
                                      group.membershipPayment?.status || group.sessionPayment?.status
                                    )}
                                    <span className={`ml-1 text-xs px-2 py-1 rounded-full ${getStatusBadge(
                                      group.membershipPayment?.status || group.sessionPayment?.status
                                    )}`}>
                                      {(group.membershipPayment?.status || group.sessionPayment?.status).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {(group.membershipPayment?.notes || group.sessionPayment?.notes) && (
                                <p className={`text-sm mb-3 p-2 rounded ${
                                  group.membershipPayment 
                                    ? 'text-purple-600 bg-purple-100' 
                                    : 'text-green-600 bg-green-100'
                                }`}>
                                  {group.membershipPayment?.notes || group.sessionPayment?.notes}
                                </p>
                              )}

                              {/* Payment Actions with Bidirectional Conversion */}
                              <div className={`flex items-center justify-between pt-3 border-t ${
                                group.membershipPayment 
                                  ? 'border-purple-200' 
                                  : 'border-green-200'
                              }`}>
                                <span className={`text-sm font-medium ${
                                  group.membershipPayment 
                                    ? 'text-purple-700' 
                                    : 'text-green-700'
                                }`}>
                                  {group.membershipPayment ? 'Membership Actions:' : 'Session Actions:'}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedPayment(group.membershipPayment || group.sessionPayment);
                                      setShowPaymentModal(true);
                                    }}
                                    className={`flex items-center px-3 py-1.5 text-white text-xs rounded-md transition-colors ${
                                      group.membershipPayment 
                                        ? 'bg-purple-600 hover:bg-purple-700' 
                                        : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                    title="Mark as Paid"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Mark Paid
                                  </button>
                                  
                                  {/* Convert Session to Membership */}
                                  {group.sessionPayment && isConvertibleToMembership(group.sessionPayment) && (
                                    <button
                                      onClick={() => {
                                        console.log('👑 Convert to membership:', group.sessionPayment.memberName);
                                        setSelectedPayment(group.sessionPayment);
                                        setConversionType('to-membership');
                                        setShowMembershipModal(true);
                                      }}
                                      className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
                                      title="Convert Session to Monthly Membership"
                                    >
                                      <Crown className="h-3 w-3 mr-1" />
                                      → Membership
                                    </button>
                                  )}
                                  
                                  {/* Convert Membership back to Daily Session */}
                                  {group.membershipPayment && group.membershipPayment.status === 'pending' && (
                                    <button
                                      onClick={() => {
                                        console.log('🔄 Convert membership back to daily:', group.membershipPayment.memberName);
                                        setSelectedPayment(group.membershipPayment);
                                        setConversionType('to-daily');
                                        setShowMembershipModal(true);
                                      }}
                                      className="flex items-center px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                                      title="Convert Membership back to Daily Session Fee"
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      → Daily Session
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* No Session/Membership Payment Placeholder */}
                          {!group.sessionPayment && !group.membershipPayment && (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <div className="text-gray-400 mb-2">
                                <span className="text-2xl">💳</span>
                              </div>
                              <p className="text-gray-600 font-medium">No Session/Membership Payment</p>
                              <p className="text-gray-500 text-sm">Member may have membership or no session yet</p>
                            </div>
                          )}

                          {/* No Payments Found (All empty) */}
                          {(!group.shuttlecockPayments || group.shuttlecockPayments.length === 0) && !group.sessionPayment && !group.membershipPayment && group.otherPayments.length === 0 && (
                            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                              <div className="text-gray-400 mb-2">
                                <Calendar className="h-8 w-8 mx-auto" />
                              </div>
                              <p className="text-gray-600">No payments found for this member</p>
                            </div>
                          )}
                        </div>

                        {/* Other Payments (Monthly, Tournament, etc.) */}
                        {group.otherPayments.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <h5 className="font-medium text-gray-900 mb-3">Other Payments</h5>
                            <div className="space-y-3">
                              {group.otherPayments.map((payment: any) => (
                                <div key={payment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                                  <div>
                                    <h6 className="font-medium text-gray-900">{payment.requirementTitle}</h6>
                                    <p className="text-sm text-gray-600">{payment.notes}</p>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                      <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                                      <div className="flex items-center">
                                        {getStatusIcon(payment.status)}
                                        <span className={`ml-1 text-xs px-2 py-1 rounded-full ${getStatusBadge(payment.status)}`}>
                                          {payment.status.toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={() => {
                                          setSelectedPayment(payment);
                                          setShowPaymentModal(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-900 p-1"
                                        title="Mark as Paid"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Payment Summary */}
                        <div className="mt-6 pt-6 border-t border-gray-200 bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h5 className="font-semibold text-blue-900">Payment Summary</h5>
                              <p className="text-sm text-blue-700">Total charges for {group.member.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-900">
                                {formatCurrency(
                                  (group.shuttlecockPayments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0) + 
                                  (group.sessionPayment?.amount || 0) + 
                                  (group.membershipPayment?.amount || 0) + 
                                  group.otherPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
                                )}
                              </p>
                              <p className="text-sm text-blue-600">
                                {[
                                  (group.shuttlecockPayments && group.shuttlecockPayments.length > 0) && 'Shuttlecock',
                                  group.sessionPayment && 'Session',
                                  group.membershipPayment && 'Membership',
                                  ...group.otherPayments.map(() => 'Other')
                                ].filter(Boolean).join(' + ')}
                              </p>
                            </div>
                          </div>

                          {/* Member-Level Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                            <div>
                              <p className="text-sm font-medium text-blue-800">
                                Quick Actions for All Payments:
                              </p>
                              <p className="text-xs text-blue-600">
                                Process all pending payments for this member at once
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {(() => {
                                // Check if member has any pending payments
                                const allPayments = [
                                  ...(group.shuttlecockPayments || []),
                                  group.sessionPayment,
                                  group.membershipPayment,
                                  ...group.otherPayments
                                ].filter(Boolean);
                                
                                const pendingPayments = allPayments.filter(p => p.status === 'pending');
                                const hasPendingPayments = pendingPayments.length > 0;
                                
                                if (!hasPendingPayments) {
                                  return (
                                    <span className="text-sm text-green-600 font-medium flex items-center">
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      All Payments Complete
                                    </span>
                                  );
                                }

                                return (
                                  <>
                                    <span className="text-sm text-blue-700 font-medium">
                                      {pendingPayments.length} pending ({formatCurrency(pendingPayments.reduce((sum: number, p: any) => sum + p.amount, 0))})
                                    </span>
                                    <button
                                      onClick={() => {
                                        setSelectedMemberPayments(group);
                                        setShowMemberPaymentModal(true);
                                      }}
                                      className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                      title={`Process all ${pendingPayments.length} pending payments for ${group.member.name}`}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Process All Payments
                                    </button>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
                
                {filteredPayments.length === 0 && (
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <DollarSign className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
                    <p className="text-gray-600">No payment records match your current filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentRequirements.map((requirement) => (
                  <div key={requirement.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{requirement.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{requirement.description}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-medium">{formatCurrency(requirement.amount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Due Date:</span>
                            <span className="font-medium">{formatDate(requirement.dueDate)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Type:</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              requirement.type === 'monthly' ? 'bg-blue-100 text-blue-800' :
                              requirement.type === 'tournament' ? 'bg-purple-100 text-purple-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {requirement.type.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Applicable:</span>
                            <span className="capitalize font-medium">{requirement.applicableMembers}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col space-y-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mark Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Payment Status
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Member: {selectedPayment.memberName}</p>
              <p className="text-sm text-gray-600">Amount: {formatCurrency(selectedPayment.amount)}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleMarkPayment(selectedPayment, 'paid', selectedPayment.amount, 'bank_transfer')}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg border-2 border-green-200 text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Mark as Paid (Full Amount)
              </button>
              <button
                onClick={() => handleMarkPayment(selectedPayment, 'partial', selectedPayment.amount / 2, 'cash')}
                className="w-full flex items-center justify-center px-4 py-3 rounded-lg border-2 border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <AlertCircle className="h-5 w-5 mr-2" />
                Mark as Partial Payment
              </button>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPayment(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Membership Conversion Modal */}
      {showMembershipModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center mb-4">
              {conversionType === 'to-membership' ? (
                <>
                  <Crown className="h-6 w-6 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Convert to Monthly Membership
                  </h3>
                </>
              ) : (
                <>
                  <RotateCcw className="h-6 w-6 text-orange-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Convert to Daily Payment
                  </h3>
                </>
              )}
            </div>
            
            {conversionType === 'to-membership' ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-purple-900 mb-2">DLOB Membership Benefits</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Monthly unlimited Saturday sessions</li>
                  <li>• Only pay shuttlecock fee per session</li>
                  <li>• Priority court booking</li>
                  <li>• Member-exclusive tournaments</li>
                </ul>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-orange-900 mb-2">Daily Payment Structure</h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Pay per session attendance (Rp18,000)</li>
                  <li>• Plus shuttlecock fee per session (Rp5,000)</li>
                  <li>• No monthly commitment</li>
                  <li>• Pay only when you attend</li>
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Current Payment:</span>
                  <span className="text-red-600 line-through">Rp{selectedPayment.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Member:</span>
                  <span className="text-gray-700">{selectedPayment.memberName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">New Payment:</span>
                  {conversionType === 'to-membership' ? (
                    <span className="text-green-600 font-semibold">Rp5,000 (Shuttlecock Only)</span>
                  ) : (
                    <span className="text-orange-600 font-semibold">Rp23,000 (Session + Shuttlecock)</span>
                  )}
                </div>
              </div>

              {conversionType === 'to-membership' ? (
                <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-purple-900">Monthly Membership Fee:</span>
                    <span className="font-bold text-purple-900">
                      {(() => {
                        const today = new Date();
                        const currentMonth = today.getMonth();
                        const currentYear = today.getFullYear();
                        const firstDay = new Date(currentYear, currentMonth, 1);
                        const lastDay = new Date(currentYear, currentMonth + 1, 0);
                        let saturdayCount = 0;
                        const tempDate = new Date(firstDay);
                        while (tempDate <= lastDay) {
                          if (tempDate.getDay() === 6) saturdayCount++;
                          tempDate.setDate(tempDate.getDate() + 1);
                        }
                        const fee = saturdayCount === 4 ? 40000 : 45000;
                        return `Rp${fee.toLocaleString()} (${saturdayCount} weeks)`;
                      })()}
                    </span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Due next month. Current payment becomes shuttlecock-only. Future Saturdays: only shuttlecock fees.
                  </p>
                </div>
              ) : (
                <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-orange-900">Session Fee:</span>
                      <span className="font-semibold text-orange-900">Rp18,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-900">Shuttlecock Fee:</span>
                      <span className="font-semibold text-orange-900">Rp5,000</span>
                    </div>
                    <hr className="border-orange-300" />
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-orange-900">Total:</span>
                      <span className="font-bold text-orange-900">Rp23,000</span>
                    </div>
                  </div>
                  <p className="text-sm text-orange-700 mt-2">
                    Converts to non-member rate. Pay per session attendance.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowMembershipModal(false);
                  setSelectedPayment(null);
                }}
                className="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log(`🔄 ${conversionType} button clicked - selectedPayment:`, {
                    id: selectedPayment?.id,
                    memberId: selectedPayment?.memberId,
                    memberName: selectedPayment?.memberName,
                    amount: selectedPayment?.amount,
                    conversionType
                  });
                  
                  if (!selectedPayment) {
                    alert('❌ No payment selected. Please try again.');
                    return;
                  }
                  
                  if (conversionType === 'to-membership') {
                    handleConvertToMembership(selectedPayment);
                  } else {
                    handleConvertToDailySession(selectedPayment);
                  }
                }}
                className={`flex-1 px-4 py-2 text-sm text-white rounded-lg font-semibold ${
                  conversionType === 'to-membership' 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {conversionType === 'to-membership' ? 'Convert to Membership' : 'Convert to Daily Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member-Level Payment Processing Modal */}
      {showMemberPaymentModal && selectedMemberPayments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center mb-6">
              <DollarSign className="h-6 w-6 text-green-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">
                Process All Payments - {selectedMemberPayments.member.name}
              </h3>
            </div>

            {(() => {
              const allPayments = [
                ...(selectedMemberPayments.shuttlecockPayments || []),
                selectedMemberPayments.sessionPayment,
                selectedMemberPayments.membershipPayment,
                ...selectedMemberPayments.otherPayments
              ].filter(Boolean);
              
              const pendingPayments = allPayments.filter((p: any) => p.status === 'pending');
              const totalPendingAmount = pendingPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

              return (
                <>
                  {/* Payment Overview */}
                  <div className="bg-gray-50 border rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Payment Overview</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Payments:</span>
                        <span className="font-medium">{allPayments.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending Payments:</span>
                        <span className="font-medium text-orange-600">{pendingPayments.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium">{formatCurrency(allPayments.reduce((sum: number, p: any) => sum + p.amount, 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending Amount:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(totalPendingAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-gray-900">Pending Payments to Process:</h4>
                    {pendingPayments.length > 0 ? (
                      pendingPayments.map((payment: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{payment.requirementTitle}</p>
                            {payment.notes && (
                              <p className="text-sm text-gray-600">{payment.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                              PENDING
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                        All payments are already processed!
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {pendingPayments.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Choose Action:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            handleMarkAllPaymentsForMember(selectedMemberPayments, 'paid', 'bank_transfer', `All ${pendingPayments.length} payments processed by admin via bank transfer`);
                            setShowMemberPaymentModal(false);
                            setSelectedMemberPayments(null);
                          }}
                          className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          <div className="text-left">
                            <div className="font-semibold">Mark All as Paid</div>
                            <div className="text-sm opacity-90">Bank Transfer</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            handleMarkAllPaymentsForMember(selectedMemberPayments, 'paid', 'cash', `All ${pendingPayments.length} payments collected by admin in cash`);
                            setShowMemberPaymentModal(false);
                            setSelectedMemberPayments(null);
                          }}
                          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <DollarSign className="h-5 w-5 mr-2" />
                          <div className="text-left">
                            <div className="font-semibold">Mark All as Paid</div>
                            <div className="text-sm opacity-90">Cash Payment</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            handleMarkAllPaymentsForMember(selectedMemberPayments, 'partial', 'cash', `Partial payments collected for ${pendingPayments.length} items`);
                            setShowMemberPaymentModal(false);
                            setSelectedMemberPayments(null);
                          }}
                          className="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                          <AlertCircle className="h-5 w-5 mr-2" />
                          <div className="text-left">
                            <div className="font-semibold">Mark as Partial</div>
                            <div className="text-sm opacity-90">Partial Payment</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            handleMarkAllPaymentsForMember(selectedMemberPayments, 'paid', 'digital_wallet', `All ${pendingPayments.length} payments via digital wallet (GoPay/OVO/Dana)`);
                            setShowMemberPaymentModal(false);
                            setSelectedMemberPayments(null);
                          }}
                          className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Send className="h-5 w-5 mr-2" />
                          <div className="text-left">
                            <div className="font-semibold">Mark All as Paid</div>
                            <div className="text-sm opacity-90">Digital Wallet</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cancel Button */}
                  <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowMemberPaymentModal(false);
                        setSelectedMemberPayments(null);
                      }}
                      className="px-6 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}