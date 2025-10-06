import React, { Suspense, lazy } from 'react';
import { ProfessionalCard } from './Layout/ProfessionalLayout';
import Loading from './Loading';

// Lazy load heavy components
const PredictiveAnalyticsDashboard = lazy(() => import('./PredictiveAnalyticsDashboard'));
const AIInsightsPanel = lazy(() => import('./AIInsightsPanel'));
const RealTimeRiskMonitor = lazy(() => import('./RealTimeRiskMonitor'));
const RealTimeSignalPositions = lazy(() => import('./RealTimeSignalPositions'));
const MarketVisualization3D = lazy(() => import('./MarketVisualization3D'));
const MarketDepthChart = lazy(() => import('./MarketDepthChart'));
const TradingChart = lazy(() => import('./TradingChart'));
const Chart = lazy(() => import('./Chart'));
const SystemTester = lazy(() => import('./SystemTester'));

// Loading fallback component
const LazyLoadingFallback: React.FC<{ title?: string }> = ({ title = "Loading..." }) => (
  <ProfessionalCard title={title} subtitle="Loading component...">
    <div className="flex items-center justify-center py-12">
      <Loading />
    </div>
  </ProfessionalCard>
);

// Wrapper component for lazy loading with error boundary
interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({ 
  children, 
  fallbackTitle 
}) => (
  <Suspense fallback={<LazyLoadingFallback title={fallbackTitle} />}>
    {children}
  </Suspense>
);

// Lazy component exports
export const LazyPredictiveAnalyticsDashboard = () => (
  <LazyComponentWrapper fallbackTitle="AI Analytics">
    <PredictiveAnalyticsDashboard />
  </LazyComponentWrapper>
);

export const LazyAIInsightsPanel = ({ selectedSymbol }: { selectedSymbol: string }) => (
  <LazyComponentWrapper fallbackTitle="AI Insights">
    <AIInsightsPanel selectedSymbol={selectedSymbol} />
  </LazyComponentWrapper>
);

export const LazyRealTimeRiskMonitor = () => (
  <LazyComponentWrapper fallbackTitle="Risk Monitor">
    <RealTimeRiskMonitor />
  </LazyComponentWrapper>
);

export const LazyRealTimeSignalPositions = () => (
  <LazyComponentWrapper fallbackTitle="Signal Positions">
    <RealTimeSignalPositions />
  </LazyComponentWrapper>
);

export const LazyMarketVisualization3D = ({ 
  marketData, 
  selectedSymbol, 
  onSymbolSelect 
}: {
  marketData: any[];
  selectedSymbol: string;
  onSymbolSelect: (symbol: string) => void;
}) => (
  <LazyComponentWrapper fallbackTitle="3D Market Visualization">
    <MarketVisualization3D 
      marketData={marketData}
      selectedSymbol={selectedSymbol}
      onSymbolSelect={onSymbolSelect}
    />
  </LazyComponentWrapper>
);

export const LazyMarketDepthChart = ({ 
  data, 
  maxLevels 
}: {
  data: any;
  maxLevels: number;
}) => (
  <LazyComponentWrapper fallbackTitle="Market Depth">
    <MarketDepthChart data={data} maxLevels={maxLevels} />
  </LazyComponentWrapper>
);

export const LazyTradingChart = ({ 
  data, 
  symbol 
}: {
  data: any[];
  symbol: string;
}) => (
  <LazyComponentWrapper fallbackTitle="Trading Chart">
    <TradingChart data={data} symbol={symbol} />
  </LazyComponentWrapper>
);

export const LazyChart = ({ 
  data, 
  symbol 
}: {
  data: any[];
  symbol: string;
}) => (
  <LazyComponentWrapper fallbackTitle="Advanced Chart">
    <Chart data={data} symbol={symbol} />
  </LazyComponentWrapper>
);

export const LazySystemTester = () => (
  <LazyComponentWrapper fallbackTitle="System Tester">
    <SystemTester />
  </LazyComponentWrapper>
);

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0
  });

  React.useEffect(() => {
    const startTime = performance.now();
    
    // Monitor memory usage if available
    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memoryInfo.usedJSHeapSize / 1024 / 1024 // MB
      }));
    }

    // Monitor component count
    const componentCount = document.querySelectorAll('[data-component]').length;
    setMetrics(prev => ({
      ...prev,
      componentCount
    }));

    const endTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      renderTime: endTime - startTime
    }));
  }, []);

  return metrics;
};

export default {
  LazyPredictiveAnalyticsDashboard,
  LazyAIInsightsPanel,
  LazyRealTimeRiskMonitor,
  LazyRealTimeSignalPositions,
  LazyMarketVisualization3D,
  LazyMarketDepthChart,
  LazyTradingChart,
  LazyChart,
  LazySystemTester,
  usePerformanceMonitor
};
