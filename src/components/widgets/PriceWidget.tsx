import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { realtimeWs } from '../../services/websocket';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PriceWidgetProps {
  symbol: string;
  compact?: boolean;
}

const PriceWidget: React.FC<PriceWidgetProps> = ({ symbol, compact = false }) => {
  const [price, setPrice] = useState<number>(0);
  const [change, setChange] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchPrice();
    connectWebSocket();

    const interval = setInterval(fetchPrice, 30000);
    return () => {
      clearInterval(interval);
      realtimeWs.disconnect();
    };
  }, [symbol]);

  const fetchPrice = async () => {
    try {
      const response = await api.crypto.getCurrentPrice(symbol);
      setPrice(response.price);
      setChange(response.change_24h || 0);
    } catch (err) {
      console.error('Price fetch error:', err);
    }
  };

  const connectWebSocket = () => {
    realtimeWs.connect();
    realtimeWs.onStateChange((state) => setIsConnected(state === 'connected'));
    realtimeWs.onMessage((event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'price' && message.symbol === symbol) {
          setPrice(message.price);
        }
      } catch (err) {
        console.error('WebSocket error:', err);
      }
    });
  };

  if (compact) {
    return (
      <motion.div
        className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg"
        whileHover={{ scale: 1.02 }}
      >
        <span className="text-sm font-medium text-slate-300">{symbol}</span>
        <span className="text-sm font-bold text-slate-50">${price.toLocaleString()}</span>
        <div className={`flex items-center gap-1 text-xs font-semibold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change).toFixed(2)}%
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-slate-50">{symbol}</h3>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
      </div>
      
      <div className="text-3xl font-bold text-slate-50 mb-2">
        ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>
      
      <div className={`flex items-center gap-2 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {change >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        <span className="text-lg font-semibold">
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>
    </motion.div>
  );
};

export default PriceWidget;
