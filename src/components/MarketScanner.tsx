import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { realtimeWs } from '../services/websocket';
import { Search, Play, Pause, RefreshCw, AlertCircle } from 'lucide-react';
import ResultsTable from './scanner/ResultsTable';
import ResultsGrid from './scanner/ResultsGrid';
import ResultsChart from './scanner/ResultsChart';
import ScannerHeatmap from './scanner/ScannerHeatmap';

interface ScanResult {
  symbol: string;
  score: number;
  signals: number;
  price: number;
  change_24h: number;
}

const MarketScanner: React.FC = () => {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'chart' | 'heatmap'>('table');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    connectWebSocket();
    return () => realtimeWs.disconnect();
  }, []);

  const connectWebSocket = () => {
    realtimeWs.connect();
    realtimeWs.onStateChange((state) => setIsConnected(state === 'connected'));
    realtimeWs.onMessage((event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'scan_result') {
          setResults(prev => [message.data, ...prev].slice(0, 100));
        }
      } catch (err) {
        console.error('WebSocket error:', err);
      }
    });
  };

  const startScan = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsScanning(true);
      const response = await api.scanner.startScan({ strategy: 'aggressive' });
      setResults(response.results || []);
    } catch (err) {
      setError('Scan failed');
      console.error('Scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const stopScan = () => {
    setIsScanning(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Search className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Market Scanner</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <p className="text-sm text-slate-400">{results.length} results</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {(['table', 'grid', 'chart', 'heatmap'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-sm font-medium capitalize transition-all ${
                  viewMode === mode ? 'bg-cyan-500 text-white' : 'text-slate-400'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {isScanning ? (
            <motion.button
              onClick={stopScan}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
            >
              <Pause className="w-4 h-4" />
              Stop
            </motion.button>
          ) : (
            <motion.button
              onClick={startScan}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {loading ? 'Scanning...' : 'Start Scan'}
            </motion.button>
          )}
        </div>
      </motion.div>

      {error && (
        <motion.div
          className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-slate-50">{error}</p>
        </motion.div>
      )}

      {viewMode === 'table' && <ResultsTable results={results} />}
      {viewMode === 'grid' && <ResultsGrid results={results} />}
      {viewMode === 'chart' && <ResultsChart results={results} />}
      {viewMode === 'heatmap' && <ScannerHeatmap results={results} />}
    </div>
  );
};

export default MarketScanner;
