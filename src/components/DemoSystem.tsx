import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, Loader, Info, Clock, Settings } from 'lucide-react';
import { api } from '../services/api';

interface DemoResult {
  status: 'success' | 'error' | 'running';
  message: string;
  data?: any;
}

export const DemoSystem: React.FC = () => {
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [demoStatus, setDemoStatus] = useState<any>(null);

  // Fetch demo status on component mount
  useEffect(() => {
    const fetchDemoStatus = async () => {
      try {
        const status = await api.get('/api/demo/phase4/status');
        setDemoStatus(status);
      } catch (error) {
        console.error('Failed to fetch demo status:', error);
      }
    };

    fetchDemoStatus();
  }, []);

  const runDemo = async () => {
    setIsRunning(true);
    setDemoResult({ status: 'running', message: 'Running Phase 4 demo...' });

    try {
      const response = await api.get('/api/demo/phase4');
      
      setDemoResult({
        status: 'success',
        message: 'Demo completed successfully!',
        data: response.demo_result
      });
    } catch (error: any) {
      setDemoResult({
        status: 'error',
        message: `Demo failed: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Phase 4 Demo System</h2>
        <p className="text-gray-400">Complete demonstration of the scoring system with realistic data generation</p>
      </div>

      {/* Demo Status */}
      {demoStatus && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Demo System Status</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Status:</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {demoStatus.status}
              </span>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-2">Available Endpoints:</p>
              <div className="flex flex-wrap gap-1">
                {demoStatus.endpoints?.map((endpoint: string, index: number) => (
                  <span key={index} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                    {endpoint}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {demoStatus.features && (
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Features:</p>
              <ul className="text-sm text-gray-300 space-y-1">
                {demoStatus.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Demo Controls */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Demo Controls</h3>
        </div>

        <button
          onClick={runDemo}
          disabled={isRunning}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Running Demo...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Phase 4 Demo
            </>
          )}
        </button>

        <div className="mt-4 text-sm text-gray-400">
          <p>This demo will:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Generate realistic data for multiple symbols</li>
            <li>Run individual detector analysis with 9 signal types</li>
            <li>Perform context-aware scoring with market regime detection</li>
            <li>Execute multi-timeframe aggregation and consensus building</li>
            <li>Test weight optimization and configuration</li>
          </ul>
        </div>
      </div>

      {/* Demo Results */}
      {demoResult && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            {demoResult.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {demoResult.status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
            {demoResult.status === 'running' && <Loader className="w-5 h-5 text-blue-500 animate-spin" />}
            <span className="text-white font-medium">{demoResult.message}</span>
          </div>
          
          {demoResult.data && (
            <div className="space-y-4">
              <div className="bg-gray-900 p-4 rounded text-sm text-gray-300 overflow-auto max-h-96">
                <pre>{JSON.stringify(demoResult.data, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additional Information */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Demo Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">What is Phase 4?</h4>
            <p className="text-sm text-gray-400">
              Phase 4 represents the complete scoring system implementation with advanced detectors, 
              multi-timeframe analysis, and intelligent consensus building.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Demo Duration</h4>
            <p className="text-sm text-gray-400">
              The demo typically takes 30-60 seconds to complete, depending on the complexity 
              of the analysis and the number of symbols processed.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Expected Output</h4>
            <p className="text-sm text-gray-400">
              You'll see detailed results including detector scores, consensus analysis, 
              weight optimization results, and performance metrics.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Use Cases</h4>
            <p className="text-sm text-gray-400">
              Perfect for understanding the system's capabilities, testing configurations, 
              and demonstrating the advanced analytics to stakeholders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
