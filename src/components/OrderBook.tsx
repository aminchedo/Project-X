import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { realtimeTradingWs } from '../services/websocket';
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Activity,
  DollarSign
} from 'lucide-react';

interface OrderBookLevel {
  price: number;
  amount: number;
  total: number;
}

interface OrderBookData {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spread_percent: number;
  mid_price: number;
  total_bid_volume: number;
  total_ask_volume: number;
  timestamp: string;
}

interface OrderBookProps {
  symbol?: string;
  depth?: number;
}

const OrderBook: React.FC<OrderBookProps> = ({
  symbol = 'BTCUSDT',
  depth = 15
}) => {
  const [data, setData] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchOrderBook();
    connectWebSocket();

    const interval = setInterval(fetchOrderBook, 5000);
    return () => {
      clearInterval(interval);
      realtimeTradingWs.disconnect();
    };
  }, [symbol]);

  const fetchOrderBook = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.trading.getOrderBook(symbol);
      setData(response);
    } catch (err) {
      setError('Failed to load order book');
      console.error('Order book error:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    realtimeTradingWs.connect();
    
    realtimeTradingWs.onStateChange((state) => {
      setIsConnected(state === 'connected');
    });

    realtimeTradingWs.onMessage((event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'orderbook' && message.symbol === symbol) {
          setData(message.data);
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  };

  if (loading && !data) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading order book...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchOrderBook}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const maxTotal = Math.max(
    ...data.bids.slice(0, depth).map(b => b.total),
    ...data.asks.slice(0, depth).map(a => a.total)
  );

  const buyPressure = (data.total_bid_volume / (data.total_bid_volume + data.total_ask_volume)) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Order Book - {symbol}</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <p className="text-sm text-slate-400">
                {isConnected ? 'Real-time updates' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        <motion.button
          onClick={fetchOrderBook}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </motion.div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-slate-400">Mid Price</span>
          </div>
          <p className="text-2xl font-bold text-slate-50">
            ${data.mid_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-slate-400">Spread</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">
            ${data.spread.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{data.spread_percent.toFixed(3)}%</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-sm text-slate-400">Bid Volume</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {data.total_bid_volume.toFixed(2)}
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-sm text-slate-400">Ask Volume</span>
          </div>
          <p className="text-2xl font-bold text-red-400">
            {data.total_ask_volume.toFixed(2)}
          </p>
        </motion.div>
      </div>

      {/* Buy/Sell Pressure Bar */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-green-400">Buy Pressure</span>
          <span className="text-sm font-semibold text-red-400">Sell Pressure</span>
        </div>
        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${buyPressure}%` }}
            transition={{ duration: 1 }}
          />
          <motion.div
            className="absolute right-0 top-0 h-full bg-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${100 - buyPressure}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-green-400 font-semibold">{buyPressure.toFixed(1)}%</span>
          <span className="text-xs text-red-400 font-semibold">{(100 - buyPressure).toFixed(1)}%</span>
        </div>
      </motion.div>

      {/* Order Book */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-slate-700">
          {/* Bids */}
          <div>
            <div className="bg-green-500/10 border-b border-slate-700 p-4">
              <h3 className="font-semibold text-green-400 flex items-center gap-2">
                <TrendingUp size={18} />
                Bids (Buy Orders)
              </h3>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-700 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-4 text-slate-400 text-xs font-semibold">Price</th>
                    <th className="text-right py-2 px-4 text-slate-400 text-xs font-semibold">Amount</th>
                    <th className="text-right py-2 px-4 text-slate-400 text-xs font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {data.bids.slice(0, depth).map((bid, index) => (
                      <motion.tr
                        key={`${bid.price}-${index}`}
                        className="border-b border-slate-800 hover:bg-green-500/5 relative"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.01 }}
                      >
                        <td className="py-2 px-4 text-green-400 font-mono text-sm font-semibold">
                          {bid.price.toFixed(2)}
                        </td>
                        <td className="text-right py-2 px-4 text-slate-300 font-mono text-sm">
                          {bid.amount.toFixed(4)}
                        </td>
                        <td className="text-right py-2 px-4 text-slate-300 font-mono text-sm">
                          {bid.total.toFixed(4)}
                        </td>
                        {/* Volume Bar */}
                        <div
                          className="absolute right-0 top-0 h-full bg-green-500/10"
                          style={{ width: `${(bid.total / maxTotal) * 100}%` }}
                        />
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Asks */}
          <div>
            <div className="bg-red-500/10 border-b border-slate-700 p-4">
              <h3 className="font-semibold text-red-400 flex items-center gap-2">
                <TrendingDown size={18} />
                Asks (Sell Orders)
              </h3>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-700 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-4 text-slate-400 text-xs font-semibold">Price</th>
                    <th className="text-right py-2 px-4 text-slate-400 text-xs font-semibold">Amount</th>
                    <th className="text-right py-2 px-4 text-slate-400 text-xs font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {data.asks.slice(0, depth).map((ask, index) => (
                      <motion.tr
                        key={`${ask.price}-${index}`}
                        className="border-b border-slate-800 hover:bg-red-500/5 relative"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.01 }}
                      >
                        <td className="py-2 px-4 text-red-400 font-mono text-sm font-semibold">
                          {ask.price.toFixed(2)}
                        </td>
                        <td className="text-right py-2 px-4 text-slate-300 font-mono text-sm">
                          {ask.amount.toFixed(4)}
                        </td>
                        <td className="text-right py-2 px-4 text-slate-300 font-mono text-sm">
                          {ask.total.toFixed(4)}
                        </td>
                        {/* Volume Bar */}
                        <div
                          className="absolute right-0 top-0 h-full bg-red-500/10"
                          style={{ width: `${(ask.total / maxTotal) * 100}%` }}
                        />
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderBook;
