import { ApiResponse, ApiError, ApiMetrics, ServiceHealth } from '@/types/crypto.types';
import { CACHE_CONFIG } from '@/config/cryptoApiConfig';
import RateLimiter from './RateLimiter';
import CircuitBreaker from './CircuitBreaker';
import ApiCache from './ApiCache';

/**
 * Enhanced Base API Service with security features
 * Integrates rate limiting, circuit breaker, caching, and monitoring
 */
export abstract class BaseApiService {
    protected serviceName: string;
    protected metrics: ApiMetrics;
    private startTime: number;

    constructor(serviceName: string) {
        this.serviceName = serviceName;
        this.startTime = Date.now();
        this.metrics = {
            service: serviceName,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageLatency: 0,
            lastRequestTime: 0,
            rateLimitHits: 0,
            circuitBreakerTrips: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }

    /**
     * Make API request with all security features
     */
    protected async makeRequest<T>(
        endpoint: ApiEndpoint,
        path: string,
        params: Record<string, any> = {},
        cacheKey?: string,
        cacheTTL?: number
    ): Promise<ApiResponse<T>> {
        const requestStart = Date.now();
        this.metrics.totalRequests++;
        this.metrics.lastRequestTime = requestStart;

        try {
            // Check rate limit
            const rateLimitPassed = await RateLimiter.checkLimit(
                `${this.serviceName}:${endpoint.name}`,
                endpoint.rateLimit
            );

            if (!rateLimitPassed) {
                this.metrics.rateLimitHits++;
                throw new Error(`Rate limit exceeded for ${endpoint.name}`);
            }

            // Check cache first
            if (cacheKey && CACHE_CONFIG.ENABLED) {
                const cached = ApiCache.get<T>(cacheKey);
                if (cached !== null) {
                    this.metrics.cacheHits++;
                    return {
                        success: true,
                        data: cached,
                        error: null,
                        timestamp: Date.now(),
                        source: endpoint.name,
                        cached: true,
                        cache_age: Date.now() - requestStart
                    };
                }
                this.metrics.cacheMisses++;
            }

            // Execute request with circuit breaker
            const result = await CircuitBreaker.execute(
                `${this.serviceName}:${endpoint.name}`,
                () => this.executeRequest<T>(endpoint, path, params)
            );

            // Cache successful result
            if (cacheKey && CACHE_CONFIG.ENABLED && result.success && result.data) {
                ApiCache.set(cacheKey, result.data, cacheTTL);
            }

            this.metrics.successfulRequests++;
            this.updateLatency(requestStart);

            return result;

        } catch (error) {
            this.metrics.failedRequests++;
            this.updateLatency(requestStart);

            // Check if it's a circuit breaker error
            if (error instanceof Error && error.message.includes('Circuit breaker OPEN')) {
                this.metrics.circuitBreakerTrips++;
            }

            return {
                success: false,
                data: null,
                error: this.formatError(error).message,
                timestamp: Date.now(),
                source: endpoint.name,
                cached: false
            };
        }
    }

    /**
     * Execute the actual HTTP request
     */
    private async executeRequest<T>(
        endpoint: ApiEndpoint,
        path: string,
        params: Record<string, any>
    ): Promise<ApiResponse<T>> {
        const url = new URL(path, endpoint.baseUrl);

        // Add query parameters
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });

        // Prepare headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'CryptoAI/1.0'
        };

        // Add API key if available
        const apiKey = endpoint.getKey();
        if (apiKey) {
            if (endpoint.headerName) {
                headers[endpoint.headerName] = apiKey;
            } else {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
        }

        // Make request
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(endpoint.timeout)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        return {
            success: true,
            data,
            error: null,
            timestamp: Date.now(),
            source: endpoint.name,
            cached: false
        };
    }

    /**
     * Format error for consistent response
     */
    private formatError(error: any): ApiError {
        if (error instanceof Error) {
            return {
                code: 'API_ERROR',
                message: error.message,
                timestamp: Date.now()
            };
        }

        return {
            code: 'UNKNOWN_ERROR',
            message: 'An unknown error occurred',
            timestamp: Date.now()
        };
    }

    /**
     * Update average latency metric
     */
    private updateLatency(requestStart: number): void {
        const latency = Date.now() - requestStart;
        this.metrics.averageLatency =
            (this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency) /
            this.metrics.totalRequests;
    }

    /**
     * Get service health status
     */
    getHealth(): ServiceHealth {
        const uptime = Date.now() - this.startTime;
        const errorRate = this.metrics.totalRequests > 0
            ? this.metrics.failedRequests / this.metrics.totalRequests
            : 0;

        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

        if (errorRate > 0.5) {
            status = 'unhealthy';
        } else if (errorRate > 0.1 || this.metrics.circuitBreakerTrips > 0) {
            status = 'degraded';
        }

        return {
            service: this.serviceName,
            status,
            lastCheck: Date.now(),
            responseTime: this.metrics.averageLatency,
            errorRate,
            uptime,
            dependencies: this.getDependencies()
        };
    }

    /**
     * Get service metrics
     */
    getMetrics(): ApiMetrics {
        return { ...this.metrics };
    }

    /**
     * Reset metrics (for testing)
     */
    resetMetrics(): void {
        this.metrics = {
            service: this.serviceName,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageLatency: 0,
            lastRequestTime: 0,
            rateLimitHits: 0,
            circuitBreakerTrips: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }

    /**
     * Get dependencies for health check
     */
    protected abstract getDependencies(): Array<{
        name: string;
        status: 'healthy' | 'unhealthy';
        responseTime: number;
    }>;

    /**
     * Generate cache key for request
     */
    protected generateCacheKey(prefix: string, params: Record<string, any>): string {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join('&');

        return `${this.serviceName}:${prefix}:${sortedParams}`;
    }

    /**
     * Check if service is available (not rate limited or circuit broken)
     */
    isAvailable(): boolean {
        const rateLimited = RateLimiter.isRateLimited(`${this.serviceName}:primary`);
        const circuitOpen = CircuitBreaker.isOpen(`${this.serviceName}:primary`);

        return !rateLimited && !circuitOpen;
    }

    /**
     * Get service status summary
     */
    getStatus(): {
        available: boolean;
        rateLimited: boolean;
        circuitOpen: boolean;
        health: ServiceHealth;
        metrics: ApiMetrics;
    } {
        const rateLimited = RateLimiter.isRateLimited(`${this.serviceName}:primary`);
        const circuitOpen = CircuitBreaker.isOpen(`${this.serviceName}:primary`);

        return {
            available: !rateLimited && !circuitOpen,
            rateLimited,
            circuitOpen,
            health: this.getHealth(),
            metrics: this.getMetrics()
        };
    }
}

// Helper type for API endpoints
interface ApiEndpoint {
    name: string;
    baseUrl: string;
    getKey: () => string;
    timeout: number;
    headerName?: string;
    rateLimit: number;
}
