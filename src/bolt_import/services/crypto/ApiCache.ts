import { CacheEntry } from '@/types/crypto.types';
import { CACHE_CONFIG, FEATURE_FLAGS } from '@/config/cryptoApiConfig';

/**
 * In-memory API response cache with TTL
 * Reduces API calls and improves performance
 */
class ApiCache {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Start cleanup interval if caching is enabled
        if (CACHE_CONFIG.ENABLED) {
            this.startCleanup();
        }
    }

    /**
     * Get value from cache
     */
    get<T>(key: string): T | null {
        if (!CACHE_CONFIG.ENABLED || !FEATURE_FLAGS.USE_REAL_APIS) {
            return null;
        }

        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        if (FEATURE_FLAGS.DEBUG_LOGGING) {
            console.log(`[Cache] HIT: ${key}`);
        }

        return entry.data as T;
    }

    /**
     * Set value in cache
     */
    set<T>(key: string, data: T, ttl?: number): void {
        if (!CACHE_CONFIG.ENABLED || !FEATURE_FLAGS.USE_REAL_APIS) {
            return;
        }

        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttl || CACHE_CONFIG.TTL
        };

        this.cache.set(key, entry);

        if (FEATURE_FLAGS.DEBUG_LOGGING) {
            console.log(`[Cache] SET: ${key} (TTL: ${entry.ttl}ms)`);
        }
    }

    /**
     * Get or set pattern - returns cached value or executes function and caches result
     */
    async getOrSet<T>(
        key: string,
        fn: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const result = await fn();
        this.set(key, result, ttl);
        return result;
    }

    /**
     * Delete specific key
     */
    delete(key: string): void {
        this.cache.delete(key);
        if (FEATURE_FLAGS.DEBUG_LOGGING) {
            console.log(`[Cache] DELETE: ${key}`);
        }
    }

    /**
     * Delete keys matching pattern
     */
    deletePattern(pattern: string): number {
        const regex = new RegExp(pattern);
        let deleted = 0;

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
                deleted++;
            }
        }

        if (FEATURE_FLAGS.DEBUG_LOGGING && deleted > 0) {
            console.log(`[Cache] DELETE PATTERN: ${pattern} (${deleted} keys)`);
        }

        return deleted;
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
        if (FEATURE_FLAGS.DEBUG_LOGGING) {
            console.log('[Cache] Cleared all entries');
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        keys: string[];
        memoryUsage: number;
        hitRate: number;
    } {
        const now = Date.now();
        let validEntries = 0;
        let totalMemory = 0;

        for (const [, entry] of this.cache.entries()) {
            if (now - entry.timestamp <= entry.ttl) {
                validEntries++;
                totalMemory += JSON.stringify(entry.data).length;
            }
        }

        return {
            size: validEntries,
            keys: Array.from(this.cache.keys()),
            memoryUsage: totalMemory,
            hitRate: 0 // TODO: Implement hit rate tracking
        };
    }

    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean {
        if (!CACHE_CONFIG.ENABLED || !FEATURE_FLAGS.USE_REAL_APIS) {
            return false;
        }

        const entry = this.cache.get(key);
        if (!entry) return false;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Get TTL remaining for a key (in milliseconds)
     */
    getTTL(key: string): number {
        const entry = this.cache.get(key);
        if (!entry) return 0;

        const now = Date.now();
        const remaining = entry.ttl - (now - entry.timestamp);
        return Math.max(0, remaining);
    }

    /**
     * Extend TTL for a key
     */
    extendTTL(key: string, additionalMs: number): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        entry.ttl += additionalMs;
        return true;
    }

    /**
     * Start automatic cleanup of expired entries
     */
    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            let cleaned = 0;

            for (const [key, entry] of this.cache.entries()) {
                if (now - entry.timestamp > entry.ttl) {
                    this.cache.delete(key);
                    cleaned++;
                }
            }

            if (cleaned > 0 && FEATURE_FLAGS.DEBUG_LOGGING) {
                console.log(`[Cache] Cleaned ${cleaned} expired entries`);
            }
        }, 60 * 1000); // Run every minute
    }

    /**
     * Stop cleanup interval
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clear();
    }

    /**
     * Get cache keys by prefix
     */
    getKeysByPrefix(prefix: string): string[] {
        return Array.from(this.cache.keys()).filter(key => key.startsWith(prefix));
    }

    /**
     * Get cache size by prefix
     */
    getSizeByPrefix(prefix: string): number {
        return this.getKeysByPrefix(prefix).length;
    }

    /**
     * Clear cache by prefix
     */
    clearByPrefix(prefix: string): number {
        const keys = this.getKeysByPrefix(prefix);
        keys.forEach(key => this.cache.delete(key));

        if (FEATURE_FLAGS.DEBUG_LOGGING && keys.length > 0) {
            console.log(`[Cache] Cleared ${keys.length} keys with prefix: ${prefix}`);
        }

        return keys.length;
    }
}

// Singleton instance
export default new ApiCache();
