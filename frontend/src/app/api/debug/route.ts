import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables (without exposing sensitive data)
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_FORCE_DEMO_MODE: process.env.NEXT_PUBLIC_FORCE_DEMO_MODE,
      NODE_ENV: process.env.NODE_ENV,
      // Show first few characters of URLs to verify they're set
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
    };

    // Test Supabase connection
    let supabaseTest = 'not tested';
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && serviceKey) {
        const supabase = createClient(supabaseUrl, serviceKey);
        const { error } = await supabase.from('pre_orders').select('count').limit(1);
        supabaseTest = error ? `Error: ${error.message}` : 'Connection successful';
      } else {
        supabaseTest = 'Missing credentials';
      }
    } catch (error: any) {
      supabaseTest = `Test failed: ${error.message}`;
    }

    return NextResponse.json({
      status: 'API is working',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      supabaseConnectionTest: supabaseTest,
      deployment: 'Production deployment active'
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}