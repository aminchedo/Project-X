import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { realtimeTradingWs } from '../services/websocket';

const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    realtimeTradingWs.onStateChange((state) => {
      const connected = state === 'connected';
      setIsConnected(connected);
      setShowBanner(!connected);
      setReconnecting(state === 'connecting');
    });

    return () => {
      realtimeTradingWs.disconnect();
    };
  }, []);

  const handleReconnect = () => {
    setReconnecting(true);
    realtimeTradingWs.connect();
  };

  return (
    <>
      {/* Connection Indicator (Always Visible) */}
      <div className="fixed top-4 right-4 z-40">
        <motion.div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-xl border shadow-lg ${
            isConnected
              ? 'bg-green-500/20 border-green-500/50'
              : 'bg-red-500/20 border-red-500/50'
          }`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
        >
          {reconnecting ? (
            <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
          ) : isConnected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-sm font-semibold ${
            isConnected ? 'text-green-400' : 'text-red-400'
          }`}>
            {reconnecting ? 'Reconnecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </motion.div>
      </div>

      {/* Disconnection Banner */}
      <AnimatePresence>
        {showBanner && !reconnecting && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 bg-red-500/95 backdrop-blur-xl border-b border-red-600 p-4"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
          >
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <WifiOff className="w-5 h-5 text-white" />
                <div>
                  <p className="text-white font-semibold">Connection Lost</p>
                  <p className="text-red-100 text-sm">Real-time updates are paused</p>
                </div>
              </div>

              <button
                onClick={handleReconnect}
                className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnect
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ConnectionStatus;
