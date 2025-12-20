import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking all authentication data...');
    
    // Log all cookies
    const allCookies: Record<string, string> = {};
    request.cookies.getAll().forEach(cookie => {
      allCookies[cookie.name] = cookie.value;
    });
    console.log('🍪 All cookies:', allCookies);
    
    // Log all headers
    const authHeaders = {
      'authorization': request.headers.get('authorization'),
      'x-supabase-auth': request.headers.get('x-supabase-auth'),
      'cookie': request.headers.get('cookie')
    };
    console.log('📋 Auth headers:', authHeaders);
    
    // Try different cookie names that Supabase might use
    const possibleTokens = [
      request.cookies.get('sb-access-token')?.value,
      request.cookies.get('sb-refresh-token')?.value, 
      request.cookies.get('supabase-auth-token')?.value,
      request.cookies.get('supabase.auth.token')?.value,
      request.headers.get('authorization')?.replace('Bearer ', '')
    ].filter(Boolean);
    
    console.log('🔑 Possible tokens found:', possibleTokens.length);
    
    // Try to get user session from Supabase client
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('📱 Supabase session:', sessionData ? 'Found' : 'Not found', sessionError ? `Error: ${sessionError.message}` : '');
    
    // Try to get user from each possible token
    for (let i = 0; i < possibleTokens.length; i++) {
      const token = possibleTokens[i];
      console.log(`🧪 Testing token ${i + 1}:`, token?.substring(0, 20) + '...');
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          console.log(`✅ Token ${i + 1} valid! User:`, user.email);
          
          // Look up member profile
          const { data: member } = await supabase
            .from('members')
            .select('*')
            .eq('email', user.email)
            .single();
          
          return new Response(JSON.stringify({
            success: true,
            debug: {
              authUser: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name
              },
              memberProfile: member,
              tokenUsed: `Token ${i + 1}`,
              cookieNames: request.cookies.getAll().map(c => c.name)
            }
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          console.log(`❌ Token ${i + 1} invalid:`, error?.message);
        }
      } catch (tokenError) {
        console.log(`❌ Token ${i + 1} error:`, tokenError);
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      debug: {
        message: 'No valid authentication found',
        cookieCount: request.cookies.size,
        cookieNames: request.cookies.getAll().map(c => c.name),
        hasAuthHeader: !!request.headers.get('authorization'),
        possibleTokensFound: possibleTokens.length
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Debug error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}