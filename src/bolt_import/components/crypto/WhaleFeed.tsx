/**
 * WhaleFeed Component
 * 
 * Displays:
 * - Real-time whale transactions
 * - Transaction filters
 * - Visual indicators for transaction types
 */

import React, { useState } from 'react';
import { useWhaleFeed } from '../../hooks/useCryptoData';
import { Waves, TrendingUp, TrendingDown, ArrowRightLeft, ExternalLink, Filter } from 'lucide-react';

export const WhaleFeed: React.FC = () => {
  const { data, loading, error, statistics } = useWhaleFeed(30000);
  const [filterBlockchain, setFilterBlockchain] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<number>(0);

  const formatAddress = (address: string): string => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <TrendingDown size={16} className="text-blue-400" />;
      case 'withdrawal':
        return <TrendingUp size={16} className="text-green-400" />;
      default:
        return <ArrowRightLeft size={16} className="text-purple-400" />;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'deposit':
        return 'bg-blue-900/20 border-blue-500';
      case 'withdrawal':
        return 'bg-green-900/20 border-green-500';
      default:
        return 'bg-purple-900/20 border-purple-500';
    }
  };

  const getAmountBadge = (amountUSD: number) => {
    if (amountUSD >= 10000000) {
      return <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">MEGA</span>;
    }
    if (amountUSD >= 5000000) {
      return <span className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded">LARGE</span>;
    }
    return null;
  };

  // Filter transactions
  const filteredTransactions = data?.filter(tx => {
    if (filterBlockchain !== 'all' && tx.blockchain.toLowerCase() !== filterBlockchain.toLowerCase()) {
      return false;
    }
    if (filterType !== 'all' && tx.type !== filterType) {
      return false;
    }
    if (tx.amountUSD < minAmount) {
      return false;
    }
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="text-center text-gray-400 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Monitoring whale transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="text-center text-red-400 py-8">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Waves className="text-blue-400" size={28} />
          <div>
            <h3 className="text-xl font-bold text-white">Whale Transactions</h3>
            <p className="text-gray-400 text-sm">
              {filteredTransactions.length} transactions tracked
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-sm font-medium">Live</span>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">Total Volume</div>
            <div className="text-white text-lg font-bold">
              ${(statistics.totalVolumeUSD / 1e6).toFixed(2)}M
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">Avg Transaction</div>
            <div className="text-white text-lg font-bold">
              ${(statistics.averageValueUSD / 1e6).toFixed(2)}M
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-xs mb-1">Total Count</div>
            <div className="text-white text-lg font-bold">
              {statistics.totalTransactions}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-800">
        <Filter size={16} className="text-gray-400" />

        <select
          value={filterBlockchain}
          onChange={(e) => setFilterBlockchain(e.target.value)}
          className="px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Chains</option>
          <option value="ethereum">Ethereum</option>
          <option value="bitcoin">Bitcoin</option>
          <option value="tron">Tron</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="transfer">Transfers</option>
        </select>

        <input
          type="number"
          placeholder="Min Amount (USD)"
          value={minAmount || ''}
          onChange={(e) => setMinAmount(Number(e.target.value) || 0)}
          className="px-3 py-1 bg-gray-800 text-gray-300 rounded text-sm border border-gray-700 focus:border-blue-500 focus:outline-none w-40"
        />
      </div>

      {/* Transaction List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Waves size={48} className="mx-auto mb-4 opacity-50" />
            <p>No whale transactions match the filters.</p>
            <p className="text-sm mt-2">Transactions are monitored every 30 seconds.</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className={`border rounded-lg p-4 transition-all hover:bg-gray-800/50 ${getTypeColor(tx.type)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(tx.type)}
                  <span className="text-white font-semibold capitalize">{tx.type}</span>
                  {getAmountBadge(tx.amountUSD)}
                </div>
                <span className="text-gray-500 text-xs">{formatTimeAgo(tx.timestamp)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-gray-400 text-xs mb-1">Amount</div>
                  <div className="text-white font-bold">
                    {tx.amount.toFixed(4)} {tx.symbol}
                  </div>
                  <div className="text-green-400 text-sm">
                    ${tx.amountUSD.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs mb-1">Blockchain</div>
                  <div className="text-white font-medium">{tx.blockchain}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">From:</span>
                  <span className="text-gray-300 font-mono">{formatAddress(tx.from)}</span>
                </div>
                <ArrowRightLeft size={14} className="text-gray-600" />
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">To:</span>
                  <span className="text-gray-300 font-mono">{formatAddress(tx.to)}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-700">
                <a
                  href={`https://etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  <span>View on Explorer</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

