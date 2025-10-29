/**
 * Prometheus Client for Frontend Metrics
 * 
 * This utility helps track frontend performance metrics and send them to Prometheus
 */

interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

class PrometheusClient {
  private metricsEndpoint: string;
  private enabled: boolean;
  private metricsBuffer: MetricData[] = [];
  private flushInterval: number = 10000; // 10 seconds
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.metricsEndpoint = import.meta.env.VITE_METRICS_ENDPOINT || 'http://localhost:3002/metrics';
    this.enabled = import.meta.env.VITE_ENABLE_METRICS === 'true';
    
    if (this.enabled) {
      this.startPeriodicFlush();
      this.trackPageLoad();
      this.trackErrors();
    }
  }

  /**
   * Track a custom metric
   */
  public track(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.enabled) return;

    this.metricsBuffer.push({
      name,
      value,
      labels,
      timestamp: Date.now()
    });
  }

  /**
   * Track API request
   */
  public trackAPIRequest(endpoint: string, method: string, status: number, duration: number): void {
    this.track('frontend_api_requests_total', 1, {
      endpoint,
      method,
      status: status.toString()
    });

    this.track('frontend_api_request_duration_seconds', duration / 1000, {
      endpoint,
      method
    });
  }

  /**
   * Track page view
   */
  public trackPageView(page: string): void {
    this.track('frontend_page_views_total', 1, {
      page
    });
  }

  /**
   * Track user interaction
   */
  public trackInteraction(action: string, component: string): void {
    this.track('frontend_user_interactions_total', 1, {
      action,
      component
    });
  }

  /**
   * Track error
   */
  public trackError(error: Error, context?: string): void {
    this.track('frontend_errors_total', 1, {
      error_type: error.name,
      context: context || 'unknown'
    });

    console.error('[Prometheus] Error tracked:', {
      name: error.name,
      message: error.message,
      context
    });
  }

  /**
   * Track page load performance
   */
  private trackPageLoad(): void {
    window.addEventListener('load', () => {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;

        this.track('frontend_page_load_time_seconds', loadTime / 1000);
        this.track('frontend_dom_ready_time_seconds', domReady / 1000);
      }
    });
  }

  /**
   * Track JavaScript errors
   */
  private trackErrors(): void {
    window.addEventListener('error', (event) => {
      this.trackError(new Error(event.message), event.filename || 'unknown');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error('Unhandled Promise Rejection'), event.reason);
    });
  }

  /**
   * Start periodic flush of metrics
   */
  private startPeriodicFlush(): void {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Flush metrics to server
   */
  public async flush(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      // Convert metrics to Prometheus format
      const prometheusFormat = this.toPrometheusFormat(metrics);

      // Send to metrics endpoint (proxy server will handle this)
      await fetch(`${this.metricsEndpoint}/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: prometheusFormat
      });

      console.log('[Prometheus] Flushed', metrics.length, 'metrics');
    } catch (error) {
      console.error('[Prometheus] Failed to flush metrics:', error);
      // Re-add metrics to buffer
      this.metricsBuffer.unshift(...metrics);
    }
  }

  /**
   * Convert metrics to Prometheus text format
   */
  private toPrometheusFormat(metrics: MetricData[]): string {
    const lines: string[] = [];

    for (const metric of metrics) {
      const labels = metric.labels
        ? `{${Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
        : '';

      lines.push(`${metric.name}${labels} ${metric.value} ${metric.timestamp || Date.now()}`);
    }

    return lines.join('\n');
  }

  /**
   * Stop the client and flush remaining metrics
   */
  public async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    await this.flush();
  }
}

// Export singleton instance
export const prometheusClient = new PrometheusClient();

// Export class for testing
export { PrometheusClient };

// Export helper function for API tracking
export function trackAPICall<T>(
  apiCall: () => Promise<T>,
  endpoint: string,
  method: string = 'GET'
): Promise<T> {
  const startTime = Date.now();

  return apiCall()
    .then((result) => {
      const duration = Date.now() - startTime;
      prometheusClient.trackAPIRequest(endpoint, method, 200, duration);
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      const status = error.response?.status || 500;
      prometheusClient.trackAPIRequest(endpoint, method, status, duration);
      throw error;
    });
}
