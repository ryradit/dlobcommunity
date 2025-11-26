/**
 * Utility functions for handling authentication redirects
 * Supports both development and production environments
 */

/**
 * Get the current site URL for authentication redirects
 * This handles both development (localhost) and production (Vercel) environments
 */
export function getSiteUrl(): string {
  // Check if we're on the client side
  if (typeof window !== 'undefined') {
    // Client side - use window.location
    return window.location.origin;
  }
  
  // Server side - use environment variables
  if (process.env.VERCEL_URL) {
    // Production on Vercel
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    // Custom site URL
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Development fallback
  return 'http://localhost:3000';
}

/**
 * Get the auth callback URL for Supabase OAuth
 */
export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`;
}

/**
 * Get the auth redirect URL after login
 */
export function getAuthRedirectUrl(userRole: 'admin' | 'member' = 'member'): string {
  const baseUrl = getSiteUrl();
  return userRole === 'admin' ? `${baseUrl}/admin` : `${baseUrl}/dashboard`;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || getSiteUrl().includes('localhost');
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return !isDevelopment();
}