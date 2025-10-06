import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, Loader, TestTube, Clock, Settings, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface TestResult {
  id: string;
  name: string;
  status: 'success' | 'error' | 'running' | 'pending';
  message: string;
  duration?: number;
  data?: any;
}

export const TestingFramework: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const availableTests = [
    {
      id: 'phase4',
      name: 'Phase 4 Comprehensive Tests',
      description: 'Complete test suite for Phase 4 implementation',
      endpoint: '/api/test/phase4',
      estimatedDuration: '30-60 seconds'
    },
    {
      id: 'simple',
      name: 'Simple Phase 4 Tests',
      description: 'Basic functionality tests for Phase 4',
      endpoint: '/api/test/simple',
      estimatedDuration: '10-20 seconds'
    },
    {
      id: 'phases',
      name: 'Phase 5 & 6 Tests',
      description: 'Tests for Phase 5 (Scanner) and Phase 6 (Risk Management)',
      endpoint: '/api/test/phases',
      estimatedDuration: '20-40 seconds'
    },
    {
      id: 'websocket',
      name: 'WebSocket Tests',
      description: 'Test WebSocket connectivity and functionality',
      endpoint: '/api/test/websocket',
      estimatedDuration: '5-10 seconds'
    },
    {
      id: 'verification',
      name: 'Implementation Verification',
      description: 'Verify system implementation completeness',
      endpoint: '/api/verify/implementation',
      estimatedDuration: '15-30 seconds'
    },
    {
      id: 'health',
      name: 'Health Check Verification',
      description: 'Comprehensive health check with verification',
      endpoint: '/api/verify/health',
      estimatedDuration: '5-15 seconds'
    }
  ];

  const runTest = async (testId: string) => {
    const test = availableTests.find(t => t.id === testId);
    if (!test) return;

    setIsRunning(true);
    setSelectedTest(testId);

    // Add test to results with running status
    const newTestResult: TestResult = {
      id: testId,
      name: test.name,
      status: 'running',
      message: `Running ${test.name}...`,
      duration: 0
    };

    setTestResults(prev => [newTestResult, ...prev]);

    const startTime = Date.now();

    try {
      const response = await api.get(test.endpoint);
      const duration = Date.now() - startTime;

      setTestResults(prev => 
        prev.map(result => 
          result.id === testId 
            ? {
                ...result,
                status: 'success',
                message: `${test.name} completed successfully!`,
                duration,
                data: response.test_result || response.verification_result || response.health_result
              }
            : result
        )
      );
    } catch (error: any) {
      const duration = Date.now() - startTime;

      setTestResults(prev => 
        prev.map(result => 
          result.id === testId 
            ? {
                ...result,
                status: 'error',
                message: `${test.name} failed: ${error.message || 'Unknown error'}`,
                duration
              }
            : result
        )
      );
    } finally {
      setIsRunning(false);
      setSelectedTest(null);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    for (const test of availableTests) {
      await runTest(test.id);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunning(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'error':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'running':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Testing Framework</h2>
        <p className="text-gray-400">Comprehensive testing suite for all system components</p>
      </div>

      {/* Test Controls */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TestTube className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Test Controls</h3>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Running All Tests...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run All Tests
              </>
            )}
          </button>

          <button
            onClick={clearResults}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear Results
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTests.map(test => (
            <div key={test.id} className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-medium text-white">{test.name}</h4>
                <button
                  onClick={() => runTest(test.id)}
                  disabled={isRunning}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Run
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-2">{test.description}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {test.estimatedDuration}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">Test Results</h3>
            <span className="text-sm text-gray-400">({testResults.length} tests)</span>
          </div>

          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={`${result.id}-${index}`}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.name}</span>
                  {result.duration && (
                    <span className="text-xs opacity-75">
                      ({result.duration}ms)
                    </span>
                  )}
                </div>
                
                <p className="text-sm mb-2">{result.message}</p>
                
                {result.data && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer hover:text-white transition-colors">
                      View Details
                    </summary>
                    <div className="mt-2 bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-auto max-h-48">
                      <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Information */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-white">Testing Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">What are these tests?</h4>
            <p className="text-sm text-gray-400">
              These tests verify the functionality of different system components, 
              from basic functionality to comprehensive integration tests.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Test Categories</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Phase 4: Scoring system and detectors</li>
              <li>• Phase 5 & 6: Scanner and risk management</li>
              <li>• WebSocket: Real-time communication</li>
              <li>• Verification: System completeness</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Running Tests</h4>
            <p className="text-sm text-gray-400">
              Tests can be run individually or all at once. Each test will show 
              its status, duration, and detailed results.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Expected Results</h4>
            <p className="text-sm text-gray-400">
              Successful tests should show green status with detailed output. 
              Failed tests will show error messages for debugging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
