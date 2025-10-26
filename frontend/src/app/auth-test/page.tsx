'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthTestPage() {
  const [authData, setAuthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🧪 Testing authentication...');
      
      // 1. Check Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('📱 Supabase session:', session);
      console.log('❌ Session error:', error);
      
      // 2. Test API without token
      const apiResponse1 = await fetch('/api/auth/me');
      const apiData1 = await apiResponse1.json();
      console.log('🔗 API without token:', apiData1);
      
      // 3. Test API with token (if session exists)
      let apiData2 = null;
      if (session?.access_token) {
        console.log('🔑 Testing with access token...');
        const apiResponse2 = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        apiData2 = await apiResponse2.json();
        console.log('🔗 API with token:', apiData2);
      }
      
      // 4. Test debug endpoint
      const debugResponse = await fetch('/api/auth/debug', {
        headers: session?.access_token ? {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        } : {}
      });
      const debugData = await debugResponse.json();
      console.log('🐛 Debug response:', debugData);
      
      setAuthData({
        session: session ? {
          user: session.user,
          access_token: session.access_token?.substring(0, 20) + '...',
          expires_at: session.expires_at
        } : null,
        sessionError: error,
        apiWithoutToken: apiData1,
        apiWithToken: apiData2,
        debug: debugData
      });
      
    } catch (error) {
      console.error('Auth test error:', error);
      setAuthData({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Testing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Authentication Debug</h1>
          
          <div className="space-y-6">
            <button
              onClick={checkAuth}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Test
            </button>
            
            <div className="grid gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold text-gray-900 mb-2">Supabase Session</h3>
                <pre className="text-sm text-gray-700 overflow-auto">
                  {JSON.stringify(authData?.session, null, 2)}
                </pre>
              </div>
              
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold text-gray-900 mb-2">API Call (No Token)</h3>
                <pre className="text-sm text-gray-700 overflow-auto">
                  {JSON.stringify(authData?.apiWithoutToken, null, 2)}
                </pre>
              </div>
              
              {authData?.apiWithToken && (
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-semibold text-gray-900 mb-2">API Call (With Token)</h3>
                  <pre className="text-sm text-gray-700 overflow-auto">
                    {JSON.stringify(authData?.apiWithToken, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-semibold text-gray-900 mb-2">Debug Endpoint</h3>
                <pre className="text-sm text-gray-700 overflow-auto">
                  {JSON.stringify(authData?.debug, null, 2)}
                </pre>
              </div>
              
              {authData?.error && (
                <div className="bg-red-50 p-4 rounded">
                  <h3 className="font-semibold text-red-900 mb-2">Error</h3>
                  <p className="text-red-700">{authData.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}