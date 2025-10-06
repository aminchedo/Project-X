import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  MemoryStick, 
  Wifi, 
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { ProfessionalCard } from './Layout/ProfessionalLayout';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  apiResponseTime: number;
  websocketLatency: number;
  frameRate: number;
  bundleSize: number;
  cacheHitRate: number;
}

interface PerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  className = '',
  showDetails = false 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    apiResponseTime: 0,
    websocketLatency: 0,
    frameRate: 0,
    bundleSize: 0,
    cacheHitRate: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [isMonitoring]);

  const startMonitoring = () => {
    monitoringIntervalRef.current = setInterval(() => {
      updateMetrics();
    }, 1000);

    // Monitor frame rate
    const monitorFrameRate = () => {
      frameCountRef.current++;
      requestAnimationFrame(monitorFrameRate);
    };
    monitorFrameRate();
  };

  const stopMonitoring = () => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  };

  const updateMetrics = () => {
    const now = performance.now();
    const timeDiff = now - lastTimeRef.current;
    
    // Calculate frame rate
    const frameRate = timeDiff > 0 ? (frameCountRef.current * 1000) / timeDiff : 0;
    frameCountRef.current = 0;
    lastTimeRef.current = now;

    // Get memory usage if available
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0;

    // Count components
    const componentCount = document.querySelectorAll('[data-component]').length;

    // Simulate API response time
    const apiResponseTime = Math.random() * 100 + 50;

    // Simulate WebSocket latency
    const websocketLatency = Math.random() * 50 + 10;

    // Calculate render time
    const renderTime = performance.now() - now;

    // Simulate bundle size (in MB)
    const bundleSize = 2.5 + Math.random() * 0.5;

    // Simulate cache hit rate
    const cacheHitRate = 85 + Math.random() * 10;

    const newMetrics: PerformanceMetrics = {
      renderTime,
      memoryUsage,
      componentCount,
      apiResponseTime,
      websocketLatency,
      frameRate,
      bundleSize,
      cacheHitRate
    };

    setMetrics(newMetrics);
    checkForAlerts(newMetrics);
  };

  const checkForAlerts = (newMetrics: PerformanceMetrics) => {
    const newAlerts: string[] = [];

    if (newMetrics.memoryUsage > 100) {
      newAlerts.push('High memory usage detected');
    }

    if (newMetrics.frameRate < 30) {
      newAlerts.push('Low frame rate detected');
    }

    if (newMetrics.apiResponseTime > 200) {
      newAlerts.push('Slow API response time');
    }

    if (newMetrics.websocketLatency > 100) {
      newAlerts.push('High WebSocket latency');
    }

    if (newMetrics.renderTime > 16) {
      newAlerts.push('Slow render time');
    }

    setAlerts(newAlerts);
  };

  const getPerformanceStatus = (): 'excellent' | 'good' | 'warning' | 'critical' => {
    if (metrics.frameRate > 55 && metrics.memoryUsage < 50 && metrics.apiResponseTime < 100) {
      return 'excellent';
    } else if (metrics.frameRate > 45 && metrics.memoryUsage < 75 && metrics.apiResponseTime < 150) {
      return 'good';
    } else if (metrics.frameRate > 30 && metrics.memoryUsage < 100 && metrics.apiResponseTime < 200) {
      return 'warning';
    } else {
      return 'critical';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const status = getPerformanceStatus();

  return (
    <ProfessionalCard 
      title="Performance Monitor" 
      subtitle={`Status: ${status.toUpperCase()}`}
      className={className}
      actions={
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            isMonitoring 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isMonitoring ? 'Stop' : 'Start'} Monitoring
        </button>
      }
    >
      <div className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status)}
            <div>
              <h3 className="text-sm font-medium text-white">System Performance</h3>
              <p className={`text-xs ${getStatusColor(status)}`}>
                {status === 'excellent' && 'All systems optimal'}
                {status === 'good' && 'Performance is good'}
                {status === 'warning' && 'Some performance issues detected'}
                {status === 'critical' && 'Critical performance issues'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{Math.round(metrics.frameRate)}</div>
            <div className="text-xs text-slate-400">FPS</div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
            <MemoryStick className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{metrics.memoryUsage.toFixed(1)} MB</div>
            <div className="text-xs text-slate-400">Memory</div>
          </div>

          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
            <Clock className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{metrics.apiResponseTime.toFixed(0)}ms</div>
            <div className="text-xs text-slate-400">API Time</div>
          </div>

          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
            <Wifi className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{metrics.websocketLatency.toFixed(0)}ms</div>
            <div className="text-xs text-slate-400">WS Latency</div>
          </div>

          <div className="text-center p-3 bg-slate-700/30 rounded-lg">
            <Cpu className="w-5 h-5 text-orange-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{metrics.componentCount}</div>
            <div className="text-xs text-slate-400">Components</div>
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-300">Performance Alerts</h4>
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-red-500/10 border border-red-500/30 rounded">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{alert}</span>
              </div>
            ))}
          </div>
        )}

        {/* Detailed Metrics */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Detailed Metrics</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Render Time:</span>
                <span className="text-white">{metrics.renderTime.toFixed(2)}ms</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Bundle Size:</span>
                <span className="text-white">{metrics.bundleSize.toFixed(2)}MB</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Cache Hit Rate:</span>
                <span className="text-white">{metrics.cacheHitRate.toFixed(1)}%</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Frame Rate:</span>
                <span className="text-white">{metrics.frameRate.toFixed(1)} FPS</span>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tips */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300">Performance Tips</h4>
          <div className="text-xs text-slate-400 space-y-1">
            {status === 'critical' && (
              <>
                <div>• Consider reducing the number of active components</div>
                <div>• Check for memory leaks in long-running processes</div>
                <div>• Optimize API calls and reduce request frequency</div>
              </>
            )}
            {status === 'warning' && (
              <>
                <div>• Monitor memory usage trends</div>
                <div>• Consider lazy loading for heavy components</div>
                <div>• Optimize WebSocket message frequency</div>
              </>
            )}
            {status === 'good' && (
              <>
                <div>• Performance is within acceptable ranges</div>
                <div>• Continue monitoring for any degradation</div>
              </>
            )}
            {status === 'excellent' && (
              <>
                <div>• Excellent performance across all metrics</div>
                <div>• System is running optimally</div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProfessionalCard>
  );
};

export default PerformanceMonitor;
