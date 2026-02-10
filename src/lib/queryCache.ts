/**
 * Simple in-memory query cache for Supabase queries
 * Helps prevent redundant API calls during rapid navigation/refreshes
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 30000; // 30 seconds default TTL

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string, ttl: number = this.defaultTTL): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > ttl) {
      // Cache expired
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate (clear) specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const queryCache = new QueryCache();

/**
 * Helper function to wrap Supabase queries with caching
 */
export async function cachedQuery<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = queryCache.get<T>(cacheKey, ttl);
  if (cached !== null) {
    return cached;
  }

  // Cache miss, execute query
  const result = await queryFn();
  
  // Store in cache
  queryCache.set(cacheKey, result);
  
  return result;
}
