import React, { useState, useEffect } from 'react';
import { 
  Fish, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Clock, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react';
import { ProfessionalCard, ProfessionalButton } from './Layout/ProfessionalLayout';
import { dataManager, WhaleTransaction } from '../services/DataManager';

interface WhaleTrackerProps {
  className?: string;
}

const WhaleTracker: React.FC<WhaleTrackerProps> = ({ className = '' }) => {
  const [whaleTransactions, setWhaleTransactions] = useState<WhaleTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<WhaleTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    minValue: 1000000,
    maxValue: 100000000,
    symbols: [] as string[],
    blockchains: [] as string[],
    timeRange: '24h' as '1h' | '6h' | '24h' | '7d'
  });
  const [stats, setStats] = useState({
    totalVolume: 0,
    transactionCount: 0,
    topSymbol: '',
    topBlockchain: ''
  });

  useEffect(() => {
    // Subscribe to whale transaction updates
    const unsubscribe = dataManager.subscribe('whaleTransactions', (transactions: WhaleTransaction[]) => {
      setWhaleTransactions(transactions);
      updateStats(transactions);
    });

    // Load initial data
    loadWhaleData();

    return unsubscribe;
  }, []);

  useEffect(() => {
    applyFilters();
  }, [whaleTransactions, filters]);

  const loadWhaleData = async () => {
    setIsLoading(true);
    try {
      const transactions = dataManager.getWhaleTransactions();
      setWhaleTransactions(transactions);
      updateStats(transactions);
    } catch (error) {
      console.error('Failed to load whale data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStats = (transactions: WhaleTransaction[]) => {
    const totalVolume = transactions.reduce((sum, tx) => sum + tx.value, 0);
    const transactionCount = transactions.length;
    
    // Find top symbol
    const symbolCounts = transactions.reduce((acc, tx) => {
      acc[tx.symbol] = (acc[tx.symbol] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    const topSymbol = Object.keys(symbolCounts).reduce((a, b) => 
      symbolCounts[a] > symbolCounts[b] ? a : b, 'N/A'
    );
    
    // Find top blockchain
    const blockchainCounts = transactions.reduce((acc, tx) => {
      acc[tx.blockchain] = (acc[tx.blockchain] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    const topBlockchain = Object.keys(blockchainCounts).reduce((a, b) => 
      blockchainCounts[a] > blockchainCounts[b] ? a : b, 'N/A'
    );

    setStats({
      totalVolume,
      transactionCount,
      topSymbol,
      topBlockchain
    });
  };

  const applyFilters = () => {
    let filtered = whaleTransactions.filter(tx => {
      // Value filter
      if (tx.value < filters.minValue || tx.value > filters.maxValue) {
        return false;
      }

      // Symbol filter
      if (filters.symbols.length > 0 && !filters.symbols.includes(tx.symbol)) {
        return false;
      }

      // Blockchain filter
      if (filters.blockchains.length > 0 && !filters.blockchains.includes(tx.blockchain)) {
        return false;
      }

      // Time range filter
      const now = new Date();
      const txTime = new Date(tx.timestamp);
      const timeDiff = now.getTime() - txTime.getTime();
      
      switch (filters.timeRange) {
        case '1h':
          if (timeDiff > 60 * 60 * 1000) return false;
          break;
        case '6h':
          if (timeDiff > 6 * 60 * 60 * 1000) return false;
          break;
        case '24h':
          if (timeDiff > 24 * 60 * 60 * 1000) return false;
          break;
        case '7d':
          if (timeDiff > 7 * 24 * 60 * 60 * 1000) return false;
          break;
      }

      return true;
    });

    // Sort by value (highest first)
    filtered.sort((a, b) => b.value - a.value);
    
    setFilteredTransactions(filtered);
  };

  const formatValue = (value: number): string => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatAmount = (amount: number, symbol: string): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M ${symbol}`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K ${symbol}`;
    }
    return `${amount.toFixed(2)} ${symbol}`;
  };

  const getTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getBlockchainColor = (blockchain: string): string => {
    const colors: { [key: string]: string } = {
      'ethereum': 'text-blue-400',
      'bitcoin': 'text-orange-400',
      'binance-smart-chain': 'text-yellow-400',
      'tron': 'text-red-400',
      'polygon': 'text-purple-400',
      'avalanche': 'text-red-500',
      'solana': 'text-green-400'
    };
    return colors[blockchain.toLowerCase()] || 'text-gray-400';
  };

  const getUniqueSymbols = (): string[] => {
    return [...new Set(whaleTransactions.map(tx => tx.symbol))].sort();
  };

  const getUniqueBlockchains = (): string[] => {
    return [...new Set(whaleTransactions.map(tx => tx.blockchain))].sort();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <ProfessionalCard 
        title="Whale Tracker" 
        subtitle="Monitor large cryptocurrency transactions in real-time"
        actions={
          <ProfessionalButton 
            onClick={loadWhaleData} 
            loading={isLoading}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </ProfessionalButton>
        }
      >
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{formatValue(stats.totalVolume)}</div>
            <div className="text-sm text-slate-400">Total Volume</div>
          </div>
          
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <Fish className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{stats.transactionCount}</div>
            <div className="text-sm text-slate-400">Transactions</div>
          </div>
          
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{stats.topSymbol}</div>
            <div className="text-sm text-slate-400">Top Symbol</div>
          </div>
          
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <Eye className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <div className="text-lg font-bold text-white capitalize">{stats.topBlockchain}</div>
            <div className="text-sm text-slate-400">Top Chain</div>
          </div>
        </div>
      </ProfessionalCard>

      {/* Filters */}
      <ProfessionalCard title="Filters" subtitle="Customize whale transaction monitoring">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Value Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Value Range</label>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Min Value"
                value={filters.minValue}
                onChange={(e) => setFilters(prev => ({ ...prev, minValue: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max Value"
                value={filters.maxValue}
                onChange={(e) => setFilters(prev => ({ ...prev, maxValue: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Time Range</label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>

          {/* Symbols */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Symbols</label>
            <select
              multiple
              value={filters.symbols}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFilters(prev => ({ ...prev, symbols: selected }));
              }}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={4}
            >
              {getUniqueSymbols().map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>

          {/* Blockchains */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Blockchains</label>
            <select
              multiple
              value={filters.blockchains}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFilters(prev => ({ ...prev, blockchains: selected }));
              }}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={4}
            >
              {getUniqueBlockchains().map(blockchain => (
                <option key={blockchain} value={blockchain}>{blockchain}</option>
              ))}
            </select>
          </div>
        </div>
      </ProfessionalCard>

      {/* Transactions List */}
      <ProfessionalCard 
        title={`Whale Transactions (${filteredTransactions.length})`}
        subtitle="Large cryptocurrency movements detected"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Fish className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No whale transactions found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx, index) => (
              <div key={`${tx.id}-${index}`} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full bg-slate-600/50 ${getBlockchainColor(tx.blockchain)}`}>
                      <Fish className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{tx.symbol}</h3>
                      <p className="text-sm text-slate-400 capitalize">{tx.blockchain}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-400">{formatValue(tx.value)}</div>
                    <div className="text-sm text-slate-400">{formatAmount(tx.amount, tx.symbol)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">From</div>
                    <div className="text-sm text-white font-mono break-all">{tx.from}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">To</div>
                    <div className="text-sm text-white font-mono break-all">{tx.to}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    <span>{getTimeAgo(tx.timestamp)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-1 hover:bg-slate-600/50 rounded transition-colors">
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfessionalCard>
    </div>
  );
};

export default WhaleTracker;
