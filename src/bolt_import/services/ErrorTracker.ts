/**
 * ErrorTracker Service
 * 
 * Monitors API health and tracks errors across all services
 */

interface ErrorEntry {
  service: string;
  error: string;
  timestamp: number;
  context?: any;
}

interface ServiceHealth {
  service: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  lastError?: ErrorEntry;
  uptime: number;
}

export class ErrorTracker {
  private errors: ErrorEntry[] = [];
  private readonly MAX_ERRORS = 100;
  private serviceStats: Map<string, { success: number; failed: number; startTime: number }> = new Map();

  /**
   * Log an error
   */
  logError(service: string, error: Error | string, context?: any): void {
    const errorEntry: ErrorEntry = {
      service,
      error: error instanceof Error ? error.message : error,
      timestamp: Date.now(),
      context,
    };

    this.errors.push(errorEntry);

    // Keep only last MAX_ERRORS
    if (this.errors.length > this.MAX_ERRORS) {
      this.errors.shift();
    }

    // Update service stats
    const stats = this.serviceStats.get(service) || { success: 0, failed: 0, startTime: Date.now() };
    stats.failed++;
    this.serviceStats.set(service, stats);

    console.error(`[ErrorTracker] ${service}:`, error);
  }

  /**
   * Log a successful request
   */
  logSuccess(service: string): void {
    const stats = this.serviceStats.get(service) || { success: 0, failed: 0, startTime: Date.now() };
    stats.success++;
    this.serviceStats.set(service, stats);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByService: Record<string, number>;
    recentErrors: ErrorEntry[];
  } {
    const errorsByService: Record<string, number> = {};

    this.errors.forEach(error => {
      errorsByService[error.service] = (errorsByService[error.service] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      errorsByService,
      recentErrors: this.errors.slice(-10),
    };
  }

  /**
   * Get service health for a specific service
   */
  getServiceHealth(service: string): ServiceHealth | null {
    const stats = this.serviceStats.get(service);

    if (!stats) {
      return null;
    }

    const totalRequests = stats.success + stats.failed;
    const successRate = totalRequests > 0 ? (stats.success / totalRequests) * 100 : 0;
    const uptime = Date.now() - stats.startTime;

    const lastError = this.errors
      .filter(e => e.service === service)
      .slice(-1)[0];

    return {
      service,
      totalRequests,
      successfulRequests: stats.success,
      failedRequests: stats.failed,
      successRate,
      lastError,
      uptime,
    };
  }

  /**
   * Get health for all services
   */
  getAllServicesHealth(): ServiceHealth[] {
    const services = Array.from(this.serviceStats.keys());
    return services.map(service => this.getServiceHealth(service)!).filter(Boolean);
  }

  /**
   * Export error report
   */
  exportReport(): string {
    const stats = this.getErrorStats();
    const servicesHealth = this.getAllServicesHealth();

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalErrors: stats.totalErrors,
        errorsByService: stats.errorsByService,
      },
      servicesHealth: servicesHealth.map(health => ({
        service: health.service,
        successRate: health.successRate.toFixed(2) + '%',
        totalRequests: health.totalRequests,
        failedRequests: health.failedRequests,
        uptimeHours: (health.uptime / (1000 * 60 * 60)).toFixed(2),
      })),
      recentErrors: stats.recentErrors.map(error => ({
        service: error.service,
        error: error.error,
        timestamp: new Date(error.timestamp).toISOString(),
      })),
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Clear all statistics
   */
  clearStats(): void {
    this.serviceStats.clear();
  }

  /**
   * Get errors for a specific service
   */
  getErrorsByService(service: string): ErrorEntry[] {
    return this.errors.filter(error => error.service === service);
  }

  /**
   * Get errors in time range
   */
  getErrorsInTimeRange(startTime: number, endTime: number): ErrorEntry[] {
    return this.errors.filter(error =>
      error.timestamp >= startTime && error.timestamp <= endTime
    );
  }

  /**
   * Check if service is healthy
   */
  isServiceHealthy(service: string, minSuccessRate: number = 80): boolean {
    const health = this.getServiceHealth(service);

    if (!health) {
      return true; // No data yet, assume healthy
    }

    return health.successRate >= minSuccessRate;
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

