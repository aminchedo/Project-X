import { RateLimiterState } from '@/types/crypto.types';
import { FEATURE_FLAGS } from '@/config/cryptoApiConfig';

/**
 * Rate Limiter using Token Bucket algorithm
 * Prevents exceeding API rate limits
 */
class RateLimiter {
  private limiters: Map<string, RateLimiterState> = new Map();

  /**
   * Check if request is allowed
   * @param serviceKey - Unique identifier for the service
   * @param limit - Maximum requests per minute
   * @returns true if request is allowed
   */
  async checkLimit(serviceKey: string, limit: number): Promise<boolean> {
    if (!FEATURE_FLAGS.USE_REAL_APIS) {
      return true; // No rate limiting in mock mode
    }

    const now = Date.now();
    const windowDuration = 60 * 1000; // 1 minute in milliseconds

    let state = this.limiters.get(serviceKey);

    if (!state) {
      // Initialize new limiter
      state = {
        requests: 0,
        windowStart: now,
        limit
      };
      this.limiters.set(serviceKey, state);
    }

    // Check if window has expired
    if (now - state.windowStart >= windowDuration) {
      // Reset window
      state.requests = 0;
      state.windowStart = now;
    }

    // Check if within limit
    if (state.requests >= state.limit) {
      const waitTime = windowDuration - (now - state.windowStart);

      if (FEATURE_FLAGS.DEBUG_LOGGING) {
        console.warn(
          `[RateLimiter] ${serviceKey} rate limit exceeded. ` +
          `Wait ${Math.ceil(waitTime / 1000)}s`
        );
      }

      // Add small jitter to prevent thundering herd
      const jitter = Math.random() * 1000;
      await this.sleep(Math.min(waitTime, 5000) + jitter);

      // Recheck after waiting
      return this.checkLimit(serviceKey, limit);
    }

    // Increment request count
    state.requests++;
    return true;
  }

  /**
   * Reset rate limiter for a service (useful for testing)
   */
  reset(serviceKey?: string): void {
    if (serviceKey) {
      this.limiters.delete(serviceKey);
    } else {
      this.limiters.clear();
    }
  }

  /**
   * Get current state for monitoring
   */
  getState(serviceKey: string): RateLimiterState | null {
    return this.limiters.get(serviceKey) || null;
  }

  /**
   * Get all active limiters for monitoring
   */
  getAllStates(): Map<string, RateLimiterState> {
    return new Map(this.limiters);
  }

  /**
   * Check if service is currently rate limited
   */
  isRateLimited(serviceKey: string): boolean {
    const state = this.limiters.get(serviceKey);
    if (!state) return false;

    const now = Date.now();
    const windowDuration = 60 * 1000;

    // Check if window has expired
    if (now - state.windowStart >= windowDuration) {
      return false;
    }

    return state.requests >= state.limit;
  }

  /**
   * Get remaining requests for a service
   */
  getRemainingRequests(serviceKey: string): number {
    const state = this.limiters.get(serviceKey);
    if (!state) return 0;

    const now = Date.now();
    const windowDuration = 60 * 1000;

    // Check if window has expired
    if (now - state.windowStart >= windowDuration) {
      return state.limit;
    }

    return Math.max(0, state.limit - state.requests);
  }

  /**
   * Get time until rate limit resets (in milliseconds)
   */
  getResetTime(serviceKey: string): number {
    const state = this.limiters.get(serviceKey);
    if (!state) return 0;

    const now = Date.now();
    const windowDuration = 60 * 1000;

    // Check if window has expired
    if (now - state.windowStart >= windowDuration) {
      return 0;
    }

    return Math.max(0, windowDuration - (now - state.windowStart));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export default new RateLimiter();
