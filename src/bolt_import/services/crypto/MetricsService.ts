import { ApiMetrics, ServiceHealth } from '@/types/crypto.types';
import { FEATURE_FLAGS } from '@/config/cryptoApiConfig';

/**
 * Metrics and Monitoring Service
 * Collects and aggregates metrics from all API services
 */
class MetricsService {
  private services: Map<string, any> = new Map();
  private globalMetrics: {
    totalRequests: number;
    totalErrors: number;
    totalCacheHits: number;
    totalCacheMisses: number;
    averageResponseTime: number;
    servicesHealth: Map<string, ServiceHealth>;
  } = {
      totalRequests: 0,
      totalErrors: 0,
      totalCacheHits: 0,
      totalCacheMisses: 0,
      averageResponseTime: 0,
      servicesHealth: new Map()
    };

  /**
   * Register a service for monitoring
   */
  registerService(service: { serviceName: string; getMetrics?: () => ApiMetrics; getHealth?: () => ServiceHealth; resetMetrics?: () => void }): void {
    this.services.set(service.serviceName, service);
  }

  /**
   * Unregister a service
   */
  unregisterService(serviceName: string): void {
    this.services.delete(serviceName);
  }

  /**
   * Collect metrics from all registered services
   */
  collectMetrics(): Map<string, ApiMetrics> {
    const allMetrics = new Map<string, ApiMetrics>();

    for (const [serviceName, service] of this.services) {
      if (service.getMetrics) {
        const metrics = service.getMetrics();
        allMetrics.set(serviceName, metrics);

        // Update global metrics
        this.globalMetrics.totalRequests += metrics.totalRequests;
        this.globalMetrics.totalErrors += metrics.failedRequests;
        this.globalMetrics.totalCacheHits += metrics.cacheHits;
        this.globalMetrics.totalCacheMisses += metrics.cacheMisses;
      }
    }

    // Calculate average response time
    const totalServices = allMetrics.size;
    if (totalServices > 0) {
      const totalResponseTime = Array.from(allMetrics.values())
        .reduce((sum, metrics) => sum + metrics.averageLatency, 0);
      this.globalMetrics.averageResponseTime = totalResponseTime / totalServices;
    }

    return allMetrics;
  }

  /**
   * Collect health status from all services
   */
  collectHealth(): Map<string, ServiceHealth> {
    const allHealth = new Map<string, ServiceHealth>();

    for (const [serviceName, service] of this.services) {
      if (service.getHealth) {
        const health = service.getHealth();
        allHealth.set(serviceName, health);
        this.globalMetrics.servicesHealth.set(serviceName, health);
      }
    }

    return allHealth;
  }

  /**
   * Get global metrics summary
   */
  getGlobalMetrics(): {
    totalRequests: number;
    totalErrors: number;
    totalCacheHits: number;
    totalCacheMisses: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    healthyServices: number;
    totalServices: number;
    servicesHealth: Map<string, ServiceHealth>;
  } {
    const totalCacheRequests = this.globalMetrics.totalCacheHits + this.globalMetrics.totalCacheMisses;
    const errorRate = this.globalMetrics.totalRequests > 0
      ? this.globalMetrics.totalErrors / this.globalMetrics.totalRequests
      : 0;
    const cacheHitRate = totalCacheRequests > 0
      ? this.globalMetrics.totalCacheHits / totalCacheRequests
      : 0;

    const healthyServices = Array.from(this.globalMetrics.servicesHealth.values())
      .filter(health => health.status === 'healthy').length;
    const totalServices = this.globalMetrics.servicesHealth.size;

    return {
      totalRequests: this.globalMetrics.totalRequests,
      totalErrors: this.globalMetrics.totalErrors,
      totalCacheHits: this.globalMetrics.totalCacheHits,
      totalCacheMisses: this.globalMetrics.totalCacheMisses,
      averageResponseTime: this.globalMetrics.averageResponseTime,
      errorRate,
      cacheHitRate,
      healthyServices,
      totalServices,
      servicesHealth: this.globalMetrics.servicesHealth
    };
  }

  /**
   * Get metrics for a specific service
   */
  getServiceMetrics(serviceName: string): ApiMetrics | null {
    const service = this.services.get(serviceName);
    return service?.getMetrics() || null;
  }

  /**
   * Get health for a specific service
   */
  getServiceHealth(serviceName: string): ServiceHealth | null {
    const service = this.services.get(serviceName);
    return service?.getHealth() || null;
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    healthyServices: number;
    totalServices: number;
    errorRate: number;
    averageResponseTime: number;
    services: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy';
      errorRate: number;
      responseTime: number;
    }>;
  } {
    const health = this.collectHealth();

    const services = Array.from(health.entries()).map(([name, health]) => ({
      name,
      status: health.status,
      errorRate: health.errorRate,
      responseTime: health.responseTime
    }));

    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const totalCount = services.length;
    const overallErrorRate = this.globalMetrics.totalRequests > 0
      ? this.globalMetrics.totalErrors / this.globalMetrics.totalRequests
      : 0;

    let systemStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (healthyCount === 0 || overallErrorRate > 0.5) {
      systemStatus = 'unhealthy';
    } else if (healthyCount < totalCount * 0.8 || overallErrorRate > 0.1) {
      systemStatus = 'degraded';
    }

    return {
      status: systemStatus,
      healthyServices: healthyCount,
      totalServices: totalCount,
      errorRate: overallErrorRate,
      averageResponseTime: this.globalMetrics.averageResponseTime,
      services
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.globalMetrics = {
      totalRequests: 0,
      totalErrors: 0,
      totalCacheHits: 0,
      totalCacheMisses: 0,
      averageResponseTime: 0,
      servicesHealth: new Map()
    };

    // Reset individual service metrics
    for (const service of this.services.values()) {
      if (service.resetMetrics) {
        service.resetMetrics();
      }
    }
  }

  /**
   * Get metrics dashboard data
   */
  getDashboardData(): {
    systemHealth: ReturnType<MetricsService['getSystemHealth']>;
    globalMetrics: ReturnType<MetricsService['getGlobalMetrics']>;
    serviceMetrics: Map<string, ApiMetrics>;
    serviceHealth: Map<string, ServiceHealth>;
  } {
    return {
      systemHealth: this.getSystemHealth(),
      globalMetrics: this.getGlobalMetrics(),
      serviceMetrics: this.collectMetrics(),
      serviceHealth: this.collectHealth()
    };
  }

  /**
   * Log metrics to console (for debugging)
   */
  logMetrics(): void {
    if (!FEATURE_FLAGS.DEBUG_LOGGING) return;

    console.group('📊 API Metrics Summary');

    const global = this.getGlobalMetrics();
    console.log('Global Metrics:', {
      totalRequests: global.totalRequests,
      errorRate: `${(global.errorRate * 100).toFixed(2)}%`,
      cacheHitRate: `${(global.cacheHitRate * 100).toFixed(2)}%`,
      averageResponseTime: `${global.averageResponseTime.toFixed(2)}ms`,
      healthyServices: `${global.healthyServices}/${global.totalServices}`
    });

    const systemHealth = this.getSystemHealth();
    console.log('System Health:', systemHealth.status);

    console.log('Service Details:');
    for (const [name, health] of this.globalMetrics.servicesHealth) {
      console.log(`  ${name}: ${health.status} (${health.errorRate.toFixed(2)}% error rate)`);
    }

    console.groupEnd();
  }

  /**
   * Export metrics data for external monitoring
   */
  exportMetrics(): {
    timestamp: number;
    systemHealth: ReturnType<MetricsService['getSystemHealth']>;
    globalMetrics: ReturnType<MetricsService['getGlobalMetrics']>;
    services: Array<{
      name: string;
      metrics: ApiMetrics;
      health: ServiceHealth;
    }>;
  } {
    const metrics = this.collectMetrics();
    const health = this.collectHealth();

    const services = Array.from(metrics.keys()).map(name => ({
      name,
      metrics: metrics.get(name)!,
      health: health.get(name)!
    }));

    return {
      timestamp: Date.now(),
      systemHealth: this.getSystemHealth(),
      globalMetrics: this.getGlobalMetrics(),
      services
    };
  }
}

// Singleton instance
export default new MetricsService();
