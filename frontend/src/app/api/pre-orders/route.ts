import { NextRequest, NextResponse } from 'next/server';
import { supabase, isDemoMode } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama, ukuran, warna, lengan, namaPunggung, tanpaNamaPunggung } = body;

    // Validation
    if (!nama || !ukuran || !warna || !lengan) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate size
    const validSizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
    if (!validSizes.includes(ukuran)) {
      return NextResponse.json(
        { error: 'Invalid size' },
        { status: 400 }
      );
    }

    // Validate color
    const validColors = ['blue', 'pink', 'yellow'];
    if (!validColors.includes(warna)) {
      return NextResponse.json(
        { error: 'Invalid color' },
        { status: 400 }
      );
    }

    // Calculate price based on size and sleeve
    const getSizePrice = (size: string, sleeve: string) => {
      let basePrice;
      switch (size) {
        case 'S':
        case 'M':
        case 'L':
        case 'XL':
          basePrice = 110000;
          break;
        case 'XXL':
          basePrice = 120000;
          break;
        case '3XL':
          basePrice = 130000;
          break;
        default:
          basePrice = 110000;
      }
      
      // Add long sleeve fee
      const longSleeveFee = sleeve === 'long' ? 10000 : 0;
      return basePrice + longSleeveFee;
    };

    const harga = getSizePrice(ukuran, lengan);

    // Prepare data for insertion
    const preOrderData = {
      nama,
      ukuran,
      warna,
      lengan,
      nama_punggung: tanpaNamaPunggung ? null : (namaPunggung || null),
      tanpa_nama_punggung: tanpaNamaPunggung || false,
      harga,
      status: 'pending' as const
    };

    // Handle demo mode
    if (isDemoMode) {
      console.log('Demo mode: Pre-order data would be saved:', preOrderData);
      
      // Simulate database response
      const mockResponse = {
        id: `demo_${Date.now()}`,
        ...preOrderData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        data: mockResponse,
        message: 'Pre-order berhasil disimpan (Demo Mode)'
      });
    }

    // Create service role client to bypass RLS for public inserts
    const supabaseServiceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const serviceSupabase = createClient(supabaseServiceUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Insert into Supabase using service role to bypass RLS
    const { data, error } = await serviceSupabase
      .from('pre_orders')
      .insert([preOrderData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save pre-order', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Pre-order berhasil disimpan'
    });

  } catch (error) {
    console.error('Pre-order submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (isDemoMode) {
      // Return mock data for demo mode
      const mockOrders = [
        {
          id: 'demo_1',
          nama: 'John Doe',
          ukuran: 'L',
          warna: 'biru',
          nama_punggung: 'JOHN',
          tanpa_nama_punggung: false,
          harga: 110000,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      return NextResponse.json({
        success: true,
        data: mockOrders,
        count: mockOrders.length
      });
    }

    const { data, error, count } = await supabase
      .from('pre_orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pre-orders', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0
    });

  } catch (error) {
    console.error('Pre-order fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}