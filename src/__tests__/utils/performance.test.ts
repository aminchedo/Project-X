import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { perfMonitor, debounce, throttle } from '../../utils/performance';

describe('Performance Utilities', () => {
  describe('perfMonitor', () => {
    beforeEach(() => {
      perfMonitor.clear();
      perfMonitor.setEnabled(true);
    });

    it('tracks metric duration', () => {
      perfMonitor.start('test-metric');
      
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Wait ~10ms
      }
      
      const duration = perfMonitor.end('test-metric');
      
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should be around 10ms
    });

    it('returns all tracked metrics', () => {
      perfMonitor.start('metric1');
      perfMonitor.end('metric1');
      
      perfMonitor.start('metric2');
      perfMonitor.end('metric2');
      
      const metrics = perfMonitor.getMetrics();
      
      expect(metrics).toHaveLength(2);
      expect(metrics[0].name).toBe('metric1');
      expect(metrics[1].name).toBe('metric2');
    });

    it('calculates average duration', () => {
      // Run same metric multiple times
      for (let i = 0; i < 3; i++) {
        perfMonitor.start('test');
        perfMonitor.end('test');
      }
      
      const average = perfMonitor.getAverage('test');
      
      expect(average).toBeGreaterThan(0);
    });

    it('can be disabled', () => {
      perfMonitor.setEnabled(false);
      
      perfMonitor.start('test');
      const duration = perfMonitor.end('test');
      
      expect(duration).toBeUndefined();
    });

    it('clears all metrics', () => {
      perfMonitor.start('test');
      perfMonitor.end('test');
      
      perfMonitor.clear();
      
      const metrics = perfMonitor.getMetrics();
      expect(metrics).toHaveLength(0);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('delays function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);
      
      debouncedFn();
      expect(fn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('cancels previous call', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      vi.advanceTimersByTime(100);
      
      // Should only call once despite 3 invocations
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments correctly', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);
      
      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);
      
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('limits function execution rate', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);
      
      throttledFn(); // Called immediately
      expect(fn).toHaveBeenCalledTimes(1);
      
      throttledFn(); // Ignored (within throttle period)
      expect(fn).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(100);
      
      throttledFn(); // Called (after throttle period)
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('passes arguments correctly', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);
      
      throttledFn('arg1', 'arg2');
      
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });
});
