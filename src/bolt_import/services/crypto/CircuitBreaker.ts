import { CircuitBreakerState } from '@/types/crypto.types';
import { CIRCUIT_BREAKER_CONFIG, FEATURE_FLAGS } from '@/config/cryptoApiConfig';

/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by stopping requests to failing services
 */
class CircuitBreaker {
  private breakers: Map<string, CircuitBreakerState> = new Map();

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    serviceKey: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!FEATURE_FLAGS.USE_REAL_APIS) {
      return fn(); // No circuit breaker in mock mode
    }

    const state = this.getOrCreateState(serviceKey);

    // Check circuit state
    if (state.state === 'OPEN') {
      const now = Date.now();

      // Check if it's time to attempt recovery
      if (state.nextAttemptTime && now >= state.nextAttemptTime) {
        if (FEATURE_FLAGS.DEBUG_LOGGING) {
          console.log(`[CircuitBreaker] ${serviceKey} entering HALF_OPEN state`);
        }
        state.state = 'HALF_OPEN';
      } else {
        throw new Error(
          `Circuit breaker OPEN for ${serviceKey}. ` +
          `Next attempt in ${Math.ceil(((state.nextAttemptTime || now) - now) / 1000)}s`
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess(serviceKey);
      return result;
    } catch (error) {
      this.onFailure(serviceKey);
      throw error;
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess(serviceKey: string): void {
    const state = this.breakers.get(serviceKey);
    if (!state) return;

    if (state.state === 'HALF_OPEN') {
      if (FEATURE_FLAGS.DEBUG_LOGGING) {
        console.log(`[CircuitBreaker] ${serviceKey} recovered, closing circuit`);
      }
      state.state = 'CLOSED';
      state.failureCount = 0;
      state.lastFailureTime = null;
      state.nextAttemptTime = null;
    } else if (state.state === 'CLOSED') {
      // Reset failure count on success
      state.failureCount = 0;
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(serviceKey: string): void {
    const state = this.breakers.get(serviceKey);
    if (!state) return;

    state.failureCount++;
    state.lastFailureTime = Date.now();

    if (
      state.state === 'HALF_OPEN' ||
      state.failureCount >= CIRCUIT_BREAKER_CONFIG.THRESHOLD
    ) {
      if (FEATURE_FLAGS.DEBUG_LOGGING) {
        console.warn(
          `[CircuitBreaker] ${serviceKey} opening circuit ` +
          `(${state.failureCount} failures)`
        );
      }

      state.state = 'OPEN';
      state.nextAttemptTime = Date.now() + CIRCUIT_BREAKER_CONFIG.TIMEOUT;
    }
  }

  /**
   * Get or create circuit breaker state
   */
  private getOrCreateState(serviceKey: string): CircuitBreakerState {
    let state = this.breakers.get(serviceKey);

    if (!state) {
      state = {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: null,
        nextAttemptTime: null
      };
      this.breakers.set(serviceKey, state);
    }

    return state;
  }

  /**
   * Get current state for monitoring
   */
  getState(serviceKey: string): CircuitBreakerState | null {
    return this.breakers.get(serviceKey) || null;
  }

  /**
   * Get all circuit breaker states for monitoring
   */
  getAllStates(): Map<string, CircuitBreakerState> {
    return new Map(this.breakers);
  }

  /**
   * Check if circuit is open for a service
   */
  isOpen(serviceKey: string): boolean {
    const state = this.breakers.get(serviceKey);
    return state?.state === 'OPEN' || false;
  }

  /**
   * Check if circuit is half-open for a service
   */
  isHalfOpen(serviceKey: string): boolean {
    const state = this.breakers.get(serviceKey);
    return state?.state === 'HALF_OPEN' || false;
  }

  /**
   * Check if circuit is closed for a service
   */
  isClosed(serviceKey: string): boolean {
    const state = this.breakers.get(serviceKey);
    return state?.state === 'CLOSED' || true; // Default to closed if no state
  }

  /**
   * Get failure count for a service
   */
  getFailureCount(serviceKey: string): number {
    const state = this.breakers.get(serviceKey);
    return state?.failureCount || 0;
  }

  /**
   * Get time until next attempt (in milliseconds)
   */
  getNextAttemptTime(serviceKey: string): number {
    const state = this.breakers.get(serviceKey);
    if (!state || !state.nextAttemptTime) return 0;

    const now = Date.now();
    return Math.max(0, state.nextAttemptTime - now);
  }

  /**
   * Manually reset circuit breaker (for testing/admin)
   */
  reset(serviceKey?: string): void {
    if (serviceKey) {
      this.breakers.delete(serviceKey);
      if (FEATURE_FLAGS.DEBUG_LOGGING) {
        console.log(`[CircuitBreaker] Reset circuit breaker for ${serviceKey}`);
      }
    } else {
      this.breakers.clear();
      if (FEATURE_FLAGS.DEBUG_LOGGING) {
        console.log('[CircuitBreaker] Reset all circuit breakers');
      }
    }
  }

  /**
   * Force circuit breaker to open (for testing)
   */
  forceOpen(serviceKey: string): void {
    const state = this.getOrCreateState(serviceKey);
    state.state = 'OPEN';
    state.failureCount = CIRCUIT_BREAKER_CONFIG.THRESHOLD;
    state.lastFailureTime = Date.now();
    state.nextAttemptTime = Date.now() + CIRCUIT_BREAKER_CONFIG.TIMEOUT;

    if (FEATURE_FLAGS.DEBUG_LOGGING) {
      console.log(`[CircuitBreaker] Force opened circuit breaker for ${serviceKey}`);
    }
  }

  /**
   * Force circuit breaker to close (for testing)
   */
  forceClose(serviceKey: string): void {
    const state = this.getOrCreateState(serviceKey);
    state.state = 'CLOSED';
    state.failureCount = 0;
    state.lastFailureTime = null;
    state.nextAttemptTime = null;

    if (FEATURE_FLAGS.DEBUG_LOGGING) {
      console.log(`[CircuitBreaker] Force closed circuit breaker for ${serviceKey}`);
    }
  }
}

// Singleton instance
export default new CircuitBreaker();
