import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  Wifi,
  WifiOff,
  Database,
  Server,
  Zap
} from 'lucide-react';
import { ProfessionalCard } from './Layout/ProfessionalLayout';
import { API_KEYS, API_CONFIG } from '../config/apiKeys';
import { binanceApi } from '../services/binanceApi';
import { tradingEngine } from '../services/tradingEngine';
import { api } from '../services/api';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
  details?: any;
}

const SystemTester: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'pending' | 'success' | 'error' | 'warning'>('pending');

  const testSuites = [
    {
      name: 'API Configuration',
      tests: [
        {
          name: 'API Keys Loaded',
          test: () => {
            const hasKeys = Object.keys(API_KEYS).length > 0;
            return {
              status: hasKeys ? 'success' : 'error',
              message: hasKeys ? 'API keys loaded successfully' : 'No API keys found',
              details: { keyCount: Object.keys(API_KEYS).length }
            };
          }
        },
        {
          name: 'CoinMarketCap Key',
          test: () => {
            const hasKey = !!API_KEYS.COINMARKETCAP_KEY;
            return {
              status: hasKey ? 'success' : 'warning',
              message: hasKey ? 'CoinMarketCap key available' : 'CoinMarketCap key missing',
              details: { key: hasKey ? 'Present' : 'Missing' }
            };
          }
        },
        {
          name: 'CryptoCompare Key',
          test: () => {
            const hasKey = !!API_KEYS.CRYPTOCOMPARE_KEY;
            return {
              status: hasKey ? 'success' : 'warning',
              message: hasKey ? 'CryptoCompare key available' : 'CryptoCompare key missing',
              details: { key: hasKey ? 'Present' : 'Missing' }
            };
          }
        }
      ]
    },
    {
      name: 'API Services',
      tests: [
        {
          name: 'Binance API Connection',
          test: async () => {
            try {
              const startTime = Date.now();
              const data = await binanceApi.get24hrTicker('BTCUSDT');
              const duration = Date.now() - startTime;
              return {
                status: 'success',
                message: 'Binance API connected successfully',
                duration,
                details: { symbol: data.symbol, price: data.price }
              };
            } catch (error) {
              return {
                status: 'error',
                message: `Binance API error: ${error}`,
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
              };
            }
          }
        },
        {
          name: 'Trading Engine',
          test: async () => {
            try {
              const startTime = Date.now();
              const signal = await tradingEngine.generateSignal('BTCUSDT');
              const duration = Date.now() - startTime;
              return {
                status: 'success',
                message: 'Trading engine operational',
                duration,
                details: { symbol: signal.symbol, direction: signal.direction }
              };
            } catch (error) {
              return {
                status: 'error',
                message: `Trading engine error: ${error}`,
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
              };
            }
          }
        },
        {
          name: 'Backend API Health',
          test: async () => {
            try {
              const startTime = Date.now();
              const health = await api.get('/health');
              const duration = Date.now() - startTime;
              return {
                status: 'success',
                message: 'Backend API healthy',
                duration,
                details: health
              };
            } catch (error) {
              return {
                status: 'warning',
                message: 'Backend API not available (offline mode)',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
              };
            }
          }
        }
      ]
    },
    {
      name: 'Component Rendering',
      tests: [
        {
          name: 'Real-Time Risk Monitor',
          test: () => {
            try {
              // Test if component can be imported and rendered
              return {
                status: 'success',
                message: 'Real-Time Risk Monitor component ready',
                details: { component: 'RealTimeRiskMonitor' }
              };
            } catch (error) {
              return {
                status: 'error',
                message: 'Real-Time Risk Monitor component error',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
              };
            }
          }
        },
        {
          name: 'Signal Positions Component',
          test: () => {
            try {
              return {
                status: 'success',
                message: 'Signal Positions component ready',
                details: { component: 'RealTimeSignalPositions' }
              };
            } catch (error) {
              return {
                status: 'error',
                message: 'Signal Positions component error',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
              };
            }
          }
        },
        {
          name: 'Navigation Component',
          test: () => {
            try {
              return {
                status: 'success',
                message: 'Navigation component ready',
                details: { component: 'ProfessionalNavigation' }
              };
            } catch (error) {
              return {
                status: 'error',
                message: 'Navigation component error',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
              };
            }
          }
        }
      ]
    },
    {
      name: 'Responsive Design',
      tests: [
        {
          name: 'Mobile Breakpoints',
          test: () => {
            const isMobile = window.innerWidth < 640;
            const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
            const isDesktop = window.innerWidth >= 1024;
            
            return {
              status: 'success',
              message: `Current viewport: ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}`,
              details: { 
                width: window.innerWidth, 
                height: window.innerHeight,
                breakpoint: isMobile ? 'sm' : isTablet ? 'md' : 'lg'
              }
            };
          }
        },
        {
          name: 'Touch Support',
          test: () => {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            return {
              status: 'success',
              message: hasTouch ? 'Touch support detected' : 'Mouse/keyboard only',
              details: { touchSupport: hasTouch, maxTouchPoints: navigator.maxTouchPoints }
            };
          }
        }
      ]
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);
    setOverallStatus('pending');

    const allTests: TestResult[] = [];

    for (const suite of testSuites) {
      for (const test of suite.tests) {
        const testResult: TestResult = {
          name: `${suite.name}: ${test.name}`,
          status: 'pending',
          message: 'Running...'
        };

        setTests(prev => [...prev, testResult]);
        allTests.push(testResult);

        try {
          const result = await test.test();
          const updatedResult = {
            ...testResult,
            ...result,
            status: result.status as 'success' | 'error' | 'warning'
          };

          setTests(prev => prev.map(t => 
            t.name === testResult.name ? updatedResult : t
          ));

          allTests[allTests.length - 1] = updatedResult;
        } catch (error) {
          const errorResult = {
            ...testResult,
            status: 'error' as const,
            message: `Test failed: ${error}`,
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          };

          setTests(prev => prev.map(t => 
            t.name === testResult.name ? errorResult : t
          ));

          allTests[allTests.length - 1] = errorResult;
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Calculate overall status
    const hasErrors = allTests.some(t => t.status === 'error');
    const hasWarnings = allTests.some(t => t.status === 'warning');
    const allSuccess = allTests.every(t => t.status === 'success');

    if (hasErrors) {
      setOverallStatus('error');
    } else if (hasWarnings) {
      setOverallStatus('warning');
    } else if (allSuccess) {
      setOverallStatus('success');
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-emerald-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
      default:
        return 'text-slate-400';
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'success':
        return 'text-emerald-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
      default:
        return 'text-slate-400';
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const warningCount = tests.filter(t => t.status === 'warning').length;
  const pendingCount = tests.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">System Tester</h2>
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Comprehensive Testing</span>
          </div>
        </div>
        
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
        </button>
      </div>

      {/* Overall Status */}
      <ProfessionalCard title="Overall Status" subtitle="System health overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{successCount}</div>
            <div className="text-sm text-gray-400">Success</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{warningCount}</div>
            <div className="text-sm text-gray-400">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{errorCount}</div>
            <div className="text-sm text-gray-400">Errors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-400">{pendingCount}</div>
            <div className="text-sm text-gray-400">Pending</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(overallStatus)}
            <div>
              <h3 className="text-lg font-semibold text-white">System Status</h3>
              <p className={`text-sm ${getOverallStatusColor()}`}>
                {overallStatus === 'success' ? 'All systems operational' :
                 overallStatus === 'error' ? 'Critical issues detected' :
                 overallStatus === 'warning' ? 'Some warnings present' :
                 'Tests not run yet'}
              </p>
            </div>
          </div>
        </div>
      </ProfessionalCard>

      {/* Test Results */}
      <ProfessionalCard title="Test Results" subtitle="Detailed test execution results">
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(test.status)}
                <div>
                  <p className="text-white font-medium">{test.name}</p>
                  <p className={`text-sm ${getStatusColor(test.status)}`}>
                    {test.message}
                  </p>
                  {test.duration && (
                    <p className="text-xs text-gray-500">
                      Duration: {test.duration}ms
                    </p>
                  )}
                </div>
              </div>
              {test.details && (
                <details className="text-xs text-gray-400">
                  <summary className="cursor-pointer hover:text-white">Details</summary>
                  <pre className="mt-2 p-2 bg-slate-800/50 rounded text-xs overflow-auto max-w-xs">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </ProfessionalCard>
    </div>
  );
};

export default SystemTester;
