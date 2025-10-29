/**
 * BaseApiService - Foundation for all API interactions
 * 
 * Provides:
 * - Request management with timeout handling
 * - Retry logic with exponential backoff
 * - Automatic fallback to backup APIs
 * - Error handling and logging
 * - Request statistics tracking
 */

interface ApiConfig {
  name: string;
  baseUrl: string;
  key: string;
  timeout: number;
}

interface RequestLog {
  service: string;
  endpoint: string;
  success: boolean;
  latency: number;
  timestamp: number;
  error?: string;
}

export class BaseApiService {
  private requestLogs: RequestLog[] = [];
  private readonly MAX_LOGS = 100;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

  /**
   * Make an API request with retry logic and fallback support
   * @param config Primary API configuration
   * @param endpoint API endpoint path
   * @param options Fetch options
   * @param fallbacks Array of fallback configurations
   * @param attempt Current attempt number (internal use)
   */
  protected async request<T>(
    config: ApiConfig,
    endpoint: string,
    options: RequestInit = {},
    fallbacks: ApiConfig[] = [],
    attempt: number = 1
  ): Promise<T> {
    const startTime = Date.now();
    const url = this.buildUrl(config, endpoint);
    const headers = this.buildHeaders(config, options.headers);

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Log successful request
      this.logRequest({
        service: config.name,
        endpoint,
        success: true,
        latency: Date.now() - startTime,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed request
      this.logRequest({
        service: config.name,
        endpoint,
        success: false,
        latency: Date.now() - startTime,
        timestamp: Date.now(),
        error: errorMessage,
      });

      // Retry logic
      if (attempt < this.MAX_RETRIES) {
        console.warn(
          `Request to ${config.name} failed (attempt ${attempt}/${this.MAX_RETRIES}). Retrying in ${this.RETRY_DELAYS[attempt - 1]}ms...`
        );
        await this.sleep(this.RETRY_DELAYS[attempt - 1]);
        return this.request(config, endpoint, options, fallbacks, attempt + 1);
      }

      // Try fallback APIs
      if (fallbacks.length > 0) {
        console.warn(`All retries failed for ${config.name}. Trying fallback: ${fallbacks[0].name}`);
        const [nextFallback, ...remainingFallbacks] = fallbacks;
        return this.request(nextFallback, endpoint, options, remainingFallbacks, 1);
      }

      // All attempts failed
      console.error(`All API attempts failed for ${config.name}:`, errorMessage);
      throw new Error(`API request failed: ${errorMessage}`);
    }
  }

  /**
   * Build full URL from config and endpoint
   */
  protected buildUrl(config: ApiConfig, endpoint: string): string {
    const baseUrl = config.baseUrl.endsWith('/')
      ? config.baseUrl.slice(0, -1)
      : config.baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${path}`;
  }

  /**
   * Build headers with API key if required
   */
  protected buildHeaders(config: ApiConfig, customHeaders?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Add custom headers
    if (customHeaders) {
      Object.entries(customHeaders).forEach(([key, value]) => {
        headers[key] = value as string;
      });
    }

    // Add API key if present
    if (config.key) {
      // Different APIs use different header names
      if (config.name.includes('coinmarketcap')) {
        headers['X-CMC_PRO_API_KEY'] = config.key;
      } else if (config.name.includes('newsapi')) {
        headers['X-Api-Key'] = config.key;
      } else if (config.name.includes('cryptocompare')) {
        headers['authorization'] = `Apikey ${config.key}`;
      }
    }

    return headers;
  }

  /**
   * Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log request for monitoring
   */
  private logRequest(entry: RequestLog): void {
    this.requestLogs.push(entry);

    // Keep only last MAX_LOGS entries
    if (this.requestLogs.length > this.MAX_LOGS) {
      this.requestLogs.shift();
    }
  }

  /**
   * Get request statistics
   */
  public getStats(): {
    totalRequests: number;
    successRate: number;
    averageLatency: number;
    recentLogs: RequestLog[];
  } {
    const total = this.requestLogs.length;
    const successful = this.requestLogs.filter(log => log.success).length;
    const totalLatency = this.requestLogs.reduce((sum, log) => sum + log.latency, 0);

    return {
      totalRequests: total,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      averageLatency: total > 0 ? totalLatency / total : 0,
      recentLogs: this.requestLogs.slice(-10),
    };
  }

  /**
   * Clear request logs
   */
  public clearLogs(): void {
    this.requestLogs = [];
  }
}

