/**
 * Performance Monitoring Utilities
 * For tracking scanner performance and optimizing user experience
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
  }

  /**
   * Start tracking a metric
   */
  start(metricName: string): void {
    if (!this.enabled) return;

    this.metrics.set(metricName, {
      name: metricName,
      startTime: performance.now(),
    });
  }

  /**
   * End tracking a metric and log the duration
   */
  end(metricName: string): number | undefined {
    if (!this.enabled) return undefined;

    const metric = this.metrics.get(metricName);
    if (!metric) {
      console.warn(`No metric found with name: ${metricName}`);
      return undefined;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${metricName}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Get all tracked metrics
   */
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  /**
   * Get average duration for a specific metric across multiple runs
   */
  getAverage(metricName: string): number | undefined {
    const allMetrics = Array.from(this.metrics.values())
      .filter(m => m.name === metricName && m.duration !== undefined);
    
    if (allMetrics.length === 0) return undefined;

    const sum = allMetrics.reduce((acc, m) => acc + (m.duration || 0), 0);
    return sum / allMetrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor(
  process.env.NODE_ENV === 'development'
);

/**
 * React Hook for performance monitoring
 */
export const usePerformanceMonitor = (metricName: string, dependencies: any[] = []) => {
  React.useEffect(() => {
    perfMonitor.start(metricName);
    return () => {
      perfMonitor.end(metricName);
    };
  }, dependencies);
};

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Measure component render time
 */
export const measureRender = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎨 ${componentName} rendered in ${duration.toFixed(2)}ms`);
    }
  };
};

/**
 * Check if browser supports key features
 */
export const checkBrowserSupport = () => {
  return {
    localStorage: typeof Storage !== 'undefined',
    webSocket: typeof WebSocket !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: typeof indexedDB !== 'undefined',
    performance: typeof performance !== 'undefined',
    clipboard: navigator.clipboard !== undefined,
  };
};

/**
 * Get current memory usage (if available)
 */
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
};

/**
 * Measure bundle size impact
 */
export const logBundleSize = (moduleName: string, sizeInKB: number) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📦 ${moduleName}: ${sizeInKB.toFixed(2)} KB`);
  }
};

// Need to import React for the hook
import React from 'react';

export default perfMonitor;
