/**
 * Session validator and synchronizer for cross-tab authentication
 * Ensures auth state is consistent across all browser tabs
 */

import { supabase } from '@/lib/supabase';
import { AuthService } from '@/lib/auth';

export class SessionSyncManager {
  private static instance: SessionSyncManager;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime = 0;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly MIN_SYNC_GAP = 1000; // 1 second minimum between syncs

  static getInstance(): SessionSyncManager {
    if (!SessionSyncManager.instance) {
      SessionSyncManager.instance = new SessionSyncManager();
    }
    return SessionSyncManager.instance;
  }

  /**
   * Start periodic session validation
   */
  startPeriodicSync(onAuthChange: (user: any) => void) {
    if (typeof window === 'undefined') return;

    console.log('🔄 Starting session sync manager');

    // Clear any existing interval
    this.stopPeriodicSync();

    // Immediate sync
    this.validateSession(onAuthChange);

    // Periodic sync every 30 seconds
    this.syncInterval = setInterval(() => {
      this.validateSession(onAuthChange);
    }, this.SYNC_INTERVAL);

    // Listen for visibility changes to sync when tab becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden && Date.now() - this.lastSyncTime > this.MIN_SYNC_GAP) {
        console.log('👁️ Tab visible, validating session');
        this.validateSession(onAuthChange);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on beforeunload
    window.addEventListener('beforeunload', () => {
      this.stopPeriodicSync();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  }

  /**
   * Stop periodic session validation
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Session sync manager stopped');
    }
  }

  /**
   * Validate current session and sync if needed
   */
  private async validateSession(onAuthChange: (user: any) => void) {
    try {
      this.lastSyncTime = Date.now();
      
      // Get current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('🚨 Session validation error:', error);
        onAuthChange(null);
        return;
      }

      if (session?.user) {
        // Validate user profile still exists and is active
        const currentUser = await AuthService.getCurrentUser();
        onAuthChange(currentUser);
      } else {
        onAuthChange(null);
      }
    } catch (error) {
      console.error('❌ Session validation failed:', error);
    }
  }

  /**
   * Force immediate session sync
   */
  async forceSyncSession(onAuthChange: (user: any) => void) {
    console.log('⚡ Force syncing session');
    await this.validateSession(onAuthChange);
  }

  /**
   * Check if session is likely expired
   */
  static isSessionExpired(session: any): boolean {
    if (!session || !session.expires_at) return true;
    
    const expiryTime = new Date(session.expires_at * 1000).getTime();
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;
    
    // Consider expired if less than 5 minutes remaining
    return timeUntilExpiry < 300000;
  }

  /**
   * Refresh session if needed
   */
  static async refreshSessionIfNeeded() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && this.isSessionExpired(session)) {
        console.log('🔄 Session expiring soon, refreshing...');
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('❌ Session refresh failed:', error);
          return null;
        }
        
        console.log('✅ Session refreshed successfully');
        return data.session;
      }
      
      return session;
    } catch (error) {
      console.error('❌ Error checking/refreshing session:', error);
      return null;
    }
  }
}

// Export singleton instance
export const sessionSync = SessionSyncManager.getInstance();