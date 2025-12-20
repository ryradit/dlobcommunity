'use client';

import { useEffect } from 'react';

/**
 * Component to clean OAuth tokens from URL hash to prevent exposure
 * This runs on every page load to ensure tokens don't remain visible in URL
 */
export default function URLCleaner() {
  useEffect(() => {
    const cleanURL = () => {
      // Check if there are auth tokens in the URL hash
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Check for common OAuth parameters that should be cleaned
        const oauthParams = [
          'access_token',
          'expires_at', 
          'expires_in',
          'provider_refresh_token',
          'provider_token',
          'refresh_token',
          'token_type'
        ];
        
        const hasOAuthParams = oauthParams.some(param => hashParams.has(param));
        
        if (hasOAuthParams) {
          // Clean the URL immediately without affecting browser history
          const cleanUrl = window.location.origin + window.location.pathname + window.location.search;
          window.history.replaceState({}, document.title, cleanUrl);
          
          console.log('🧹 Cleaned OAuth tokens from URL for security');
        }
      }
    };

    // Clean URL on component mount
    cleanURL();
    
    // Also clean URL when hash changes (in case of navigation)
    const handleHashChange = () => {
      cleanURL();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // This component renders nothing - it's just for the side effect
  return null;
}