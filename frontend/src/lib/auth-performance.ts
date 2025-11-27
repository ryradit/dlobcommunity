/**
 * Performance monitoring and optimization service for DLOB authentication
 * Tracks and optimizes Google Sign-In and auth callback performance
 */

interface PerformanceMetrics {
  googleOAuthStart: number;
  googleOAuthRedirect: number;
  callbackStart: number;
  callbackComplete: number;
  totalAuthTime: number;
}

export class AuthPerformanceMonitor {
  private static metrics: Partial<PerformanceMetrics> = {};
  private static readonly PERFORMANCE_KEY = 'dlob_auth_performance';
  
  /**
   * Start tracking Google OAuth performance
   */
  static startGoogleOAuth() {
    this.metrics.googleOAuthStart = performance.now();
    console.log('📊 Performance: Google OAuth started');
  }
  
  /**
   * Mark Google OAuth redirect completion
   */
  static completeGoogleOAuthRedirect() {
    if (this.metrics.googleOAuthStart) {
      this.metrics.googleOAuthRedirect = performance.now();
      const duration = this.metrics.googleOAuthRedirect - this.metrics.googleOAuthStart;
      console.log(`📊 Performance: Google OAuth redirect completed in ${Math.round(duration)}ms`);
    }
  }
  
  /**
   * Start tracking auth callback performance
   */
  static startCallback() {
    this.metrics.callbackStart = performance.now();
    console.log('📊 Performance: Auth callback started');
  }
  
  /**
   * Complete auth callback tracking
   */
  static completeCallback() {
    if (this.metrics.callbackStart) {
      this.metrics.callbackComplete = performance.now();
      const callbackDuration = this.metrics.callbackComplete - this.metrics.callbackStart;
      console.log(`📊 Performance: Auth callback completed in ${Math.round(callbackDuration)}ms`);
      
      // Calculate total auth time if we have OAuth start time
      if (this.metrics.googleOAuthStart) {
        this.metrics.totalAuthTime = this.metrics.callbackComplete - this.metrics.googleOAuthStart;
        console.log(`📊 Performance: Total Google Sign-In time: ${Math.round(this.metrics.totalAuthTime)}ms`);
        
        // Store performance data for analysis
        this.storePerformanceData();
        
        // Provide performance feedback
        this.analyzePerformance();
      }
    }
  }
  
  /**
   * Store performance data in localStorage for analysis
   */
  private static storePerformanceData() {
    if (typeof window !== 'undefined') {
      try {
        const existingData = JSON.parse(localStorage.getItem(this.PERFORMANCE_KEY) || '[]');
        existingData.push({
          timestamp: new Date().toISOString(),
          ...this.metrics
        });
        
        // Keep only last 10 measurements
        if (existingData.length > 10) {
          existingData.splice(0, existingData.length - 10);
        }
        
        localStorage.setItem(this.PERFORMANCE_KEY, JSON.stringify(existingData));
      } catch (error) {
        console.warn('Failed to store performance data:', error);
      }
    }
  }
  
  /**
   * Analyze performance and provide recommendations
   */
  private static analyzePerformance() {
    const { totalAuthTime } = this.metrics;
    
    if (!totalAuthTime) return;
    
    if (totalAuthTime < 3000) {
      console.log('🚀 Performance: Excellent! Google Sign-In completed quickly');
    } else if (totalAuthTime < 8000) {
      console.log('⚡ Performance: Good sign-in speed');
    } else if (totalAuthTime < 15000) {
      console.warn('⏳ Performance: Sign-in is slower than expected. This might be due to:');
      console.warn('  • Slow internet connection');
      console.warn('  • Database query delays');
      console.warn('  • Supabase server latency');
    } else {
      console.error('🐌 Performance: Very slow sign-in detected. Potential issues:');
      console.error('  • Network connectivity problems');
      console.error('  • Database performance issues');
      console.error('  • OAuth provider delays');
      console.error('  • Browser/device performance issues');
    }
  }
  
  /**
   * Get average performance from stored data
   */
  static getAveragePerformance(): number | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = JSON.parse(localStorage.getItem(this.PERFORMANCE_KEY) || '[]');
      const validTimes = data
        .map((entry: any) => entry.totalAuthTime)
        .filter((time: number) => time && time > 0);
      
      if (validTimes.length === 0) return null;
      
      return validTimes.reduce((sum: number, time: number) => sum + time, 0) / validTimes.length;
    } catch (error) {
      console.warn('Failed to calculate average performance:', error);
      return null;
    }
  }
  
  /**
   * Reset all performance metrics
   */
  static reset() {
    this.metrics = {};
  }
  
  /**
   * Check if current performance is significantly slower than average
   */
  static isPerformanceRegression(): boolean {
    const average = this.getAveragePerformance();
    const current = this.metrics.totalAuthTime;
    
    if (!average || !current) return false;
    
    // Consider it a regression if current time is 50% slower than average
    return current > average * 1.5;
  }
  
  /**
   * Generate performance report
   */
  static generateReport(): string {
    const average = this.getAveragePerformance();
    const current = this.metrics.totalAuthTime;
    
    let report = '📊 DLOB Auth Performance Report\n';
    report += '================================\n';
    
    if (current) {
      report += `Current Session: ${Math.round(current)}ms\n`;
    }
    
    if (average) {
      report += `Average Performance: ${Math.round(average)}ms\n`;
    }
    
    if (current && average) {
      const percentage = ((current - average) / average) * 100;
      if (percentage > 0) {
        report += `Current session is ${Math.round(percentage)}% slower than average\n`;
      } else {
        report += `Current session is ${Math.round(Math.abs(percentage))}% faster than average\n`;
      }
    }
    
    report += '\n💡 Tips for faster sign-in:\n';
    report += '• Use a stable internet connection\n';
    report += '• Clear browser cache if issues persist\n';
    report += '• Try signing in during off-peak hours\n';
    
    return report;
  }
  
  /**
   * Clear all stored performance data
   */
  static clearStoredData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.PERFORMANCE_KEY);
      console.log('📊 Performance data cleared');
    }
  }
}

// Export helper functions for easy use
export const trackGoogleOAuth = () => AuthPerformanceMonitor.startGoogleOAuth();
export const trackOAuthRedirect = () => AuthPerformanceMonitor.completeGoogleOAuthRedirect();
export const trackCallbackStart = () => AuthPerformanceMonitor.startCallback();
export const trackCallbackComplete = () => AuthPerformanceMonitor.completeCallback();
export const getPerformanceReport = () => AuthPerformanceMonitor.generateReport();