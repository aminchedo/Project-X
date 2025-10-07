import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, TrendingDown, DollarSign, Percent, AlertTriangle, CheckCircle } from 'lucide-react';

interface TradeExecutorProps {
  symbol?: string;
  currentPrice?: number;
  onExecute?: (trade: TradeParams) => void;
}

interface TradeParams {
  symbol: string;
  type: 'market' | 'limit' | 'stop';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  stopPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
}

const TradeExecutor: React.FC<TradeExecutorProps> = ({
  symbol = 'BTCUSDT',
  currentPrice = 43250,
  onExecute
}) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>(currentPrice.toString());
  const [stopPrice, setStopPrice] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const prc = orderType === 'market' ? currentPrice : parseFloat(price) || 0;
    return qty * prc;
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    
    const trade: TradeParams = {
      symbol,
      type: orderType,
      side,
      quantity: parseFloat(quantity),
      price: orderType !== 'market' ? parseFloat(price) : undefined,
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined
    };

    onExecute?.(trade);
    
    // Simulate execution
    setTimeout(() => {
      setIsExecuting(false);
      // Reset form
      setQuantity('');
    }, 1500);
  };

  const isValid = () => {
    if (!quantity || parseFloat(quantity) <= 0) return false;
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) return false;
    if (orderType === 'stop' && (!stopPrice || parseFloat(stopPrice) <= 0)) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
          <Play className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-50">Trade Executor</h2>
          <p className="text-sm text-slate-400">Execute trades instantly</p>
        </div>
      </motion.div>

      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Side Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setSide('buy')}
            className={`py-4 rounded-xl font-bold transition-all ${
              side === 'buy'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <TrendingUp className="w-6 h-6 mx-auto mb-1" />
            BUY
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`py-4 rounded-xl font-bold transition-all ${
              side === 'sell'
                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <TrendingDown className="w-6 h-6 mx-auto mb-1" />
            SELL
          </button>
        </div>

        {/* Order Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Order Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(['market', 'limit', 'stop'] as const).map(type => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`py-2 px-4 rounded-lg font-medium capitalize transition-all ${
                  orderType === type
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Symbol & Current Price */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Symbol</label>
            <input
              type="text"
              value={symbol}
              disabled
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Current Price</label>
            <input
              type="text"
              value={`$${currentPrice.toLocaleString()}`}
              disabled
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 font-mono"
            />
          </div>
        </div>

        {/* Quantity */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
          <div className="relative">
            <input
              id="trade-quantity"
              name="trade-quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 font-mono focus:border-cyan-500 focus:outline-none"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
              {[25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  onClick={() => setQuantity((1 * pct / 100).toFixed(4))}
                  className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price (for limit/stop orders) */}
        {orderType !== 'market' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {orderType === 'limit' ? 'Limit Price' : 'Stop Price'}
            </label>
            <input
              id={orderType === 'stop' ? 'stop-price' : 'limit-price'}
              name={orderType === 'stop' ? 'stop-price' : 'limit-price'}
              type="number"
              value={orderType === 'stop' ? stopPrice : price}
              onChange={(e) => orderType === 'stop' ? setStopPrice(e.target.value) : setPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>
        )}

        {/* Advanced Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Take Profit</label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 font-mono text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Stop Loss</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 font-mono text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Total */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total</span>
            <span className="text-2xl font-bold text-slate-50">
              ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Execute Button */}
        <motion.button
          onClick={handleExecute}
          disabled={!isValid() || isExecuting}
          whileHover={{ scale: isValid() ? 1.02 : 1 }}
          whileTap={{ scale: isValid() ? 0.98 : 1 }}
          className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${
            side === 'buy'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/20'
              : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-red-500/20'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isExecuting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Executing...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              Execute {side.toUpperCase()} Order
            </div>
          )}
        </motion.button>

        {/* Warning */}
        <div className="mt-4 flex items-start gap-2 text-xs text-yellow-400">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <p>Trading involves risk. Ensure you understand the risks before executing orders.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default TradeExecutor;
