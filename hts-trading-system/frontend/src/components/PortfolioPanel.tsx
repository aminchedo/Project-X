/**
 * HTS Trading System - Portfolio Panel Component
 * Real-time portfolio tracking with P&L analytics and position management
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PieChart,
  Target,
  AlertTriangle,
  Plus,
  Minus,
  Activity,
  Clock,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Services
import { 
  apiClient, 
  PortfolioSummary, 
  Position,
  formatPrice,
  formatPercentage
} from '../services/api';

// Types
interface PortfolioPanelState {
  portfolio: PortfolioSummary | null;
  positions: Position[];
  performanceData: any[];
  loading: boolean;
  selectedPosition: Position | null;
  showAddPosition: boolean;
}

const PortfolioPanel: React.FC = () => {
  const [state, setState] = useState<PortfolioPanelState>({
    portfolio: null,
    positions: [],
    performanceData: [],
    loading: true,
    selectedPosition: null,
    showAddPosition: false
  });

  useEffect(() => {
    loadPortfolioData();
    const interval = setInterval(loadPortfolioData, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadPortfolioData = async () => {
    try {
      const [portfolioData, performanceData] = await Promise.all([
        apiClient.getPortfolioStatus(),
        generateMockPerformanceData() // In production, this would be an API call
      ]);

      // Mock positions data (in production, this would come from the API)
      const mockPositions: Position[] = [
        {
          id: 1,
          symbol: 'BTCUSDT',
          quantity: 0.5,
          avg_price: 45000,
          current_price: 47500,
          market_value: 23750,
          unrealized_pnl: 1250,
          realized_pnl: 0,
          total_pnl: 1250,
          pnl_pct: 5.56,
          weight: 47.5,
          entry_time: '2024-01-15T10:30:00Z',
          last_update: new Date().toISOString()
        },
        {
          id: 2,
          symbol: 'ETHUSDT',
          quantity: 8,
          avg_price: 2800,
          current_price: 2950,
          market_value: 23600,
          unrealized_pnl: 1200,
          realized_pnl: 0,
          total_pnl: 1200,
          pnl_pct: 5.36,
          weight: 47.2,
          entry_time: '2024-01-16T14:20:00Z',
          last_update: new Date().toISOString()
        },
        {
          id: 3,
          symbol: 'ADAUSDT',
          quantity: 5000,
          avg_price: 0.52,
          current_price: 0.48,
          market_value: 2400,
          unrealized_pnl: -200,
          realized_pnl: 0,
          total_pnl: -200,
          pnl_pct: -7.69,
          weight: 4.8,
          entry_time: '2024-01-17T09:15:00Z',
          last_update: new Date().toISOString()
        }
      ];

      setState(prev => ({
        ...prev,
        portfolio: portfolioData,
        positions: mockPositions,
        performanceData,
        loading: false
      }));
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const generateMockPerformanceData = () => {
    const data = [];
    const baseValue = 50000;
    let currentValue = baseValue;
    
    for (let i = 0; i < 30; i++) {
      const change = (Math.random() - 0.5) * 1000;
      currentValue += change;
      
      data.push({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: Math.round(currentValue),
        pnl: Math.round(currentValue - baseValue),
        pnlPct: ((currentValue - baseValue) / baseValue) * 100
      });
    }
    
    return data;
  };

  const handlePositionSelect = (position: Position) => {
    setState(prev => ({
      ...prev,
      selectedPosition: prev.selectedPosition?.id === position.id ? null : position
    }));
  };

  if (state.loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-dark-700 rounded mb-2"></div>
              <div className="h-8 bg-dark-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pieData = state.positions.map(pos => ({
    name: pos.symbol,
    value: pos.weight,
    pnl: pos.pnl_pct,
    color: pos.pnl_pct >= 0 ? '#10b981' : '#ef4444'
  }));

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      {state.portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="metric-card">
            <div className="metric-value text-neon-blue">
              {formatPrice(state.portfolio.total_value)}
            </div>
            <div className="metric-label">Total Value</div>
          </div>
          
          <div className="metric-card">
            <div className={`metric-value ${
              state.portfolio.total_pnl >= 0 ? 'text-bull-400' : 'text-bear-400'
            }`}>
              {state.portfolio.total_pnl >= 0 ? '+' : ''}{formatPrice(state.portfolio.total_pnl)}
            </div>
            <div className="metric-label">Total P&L</div>
          </div>
          
          <div className="metric-card">
            <div className={`metric-value ${
              state.portfolio.daily_pnl >= 0 ? 'text-bull-400' : 'text-bear-400'
            }`}>
              {state.portfolio.daily_pnl >= 0 ? '+' : ''}{formatPrice(state.portfolio.daily_pnl)}
            </div>
            <div className="metric-label">Daily P&L</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value text-yellow-400">
              {state.portfolio.win_rate.toFixed(1)}%
            </div>
            <div className="metric-label">Win Rate</div>
          </div>
        </div>
      )}

      {/* Portfolio Performance Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-neon-blue" />
            Portfolio Performance (30 Days)
          </h2>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={state.performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => formatPrice(value, 0)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value, name) => [
                  name === 'value' ? formatPrice(Number(value)) : `${Number(value).toFixed(2)}%`,
                  name === 'value' ? 'Portfolio Value' : 'P&L %'
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                fill="url(#colorValue)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Positions and Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Positions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center">
              <Target className="w-5 h-5 mr-2 text-neon-blue" />
              Current Positions
            </h2>
            <button
              onClick={() => setState(prev => ({ ...prev, showAddPosition: true }))}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Position
            </button>
          </div>

          <div className="space-y-3">
            {state.positions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                onSelect={handlePositionSelect}
                isSelected={state.selectedPosition?.id === position.id}
              />
            ))}
          </div>
        </div>

        {/* Portfolio Allocation */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-neon-blue" />
            Allocation
          </h3>
          
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${Number(value).toFixed(1)}%`, 'Weight']}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {state.positions.map((position) => (
              <div key={position.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: position.pnl_pct >= 0 ? '#10b981' : '#ef4444' }}
                  />
                  <span>{position.symbol}</span>
                </div>
                <span className="font-mono">{position.weight.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Position Details Modal */}
      {state.selectedPosition && (
        <PositionDetailsModal
          position={state.selectedPosition}
          onClose={() => setState(prev => ({ ...prev, selectedPosition: null }))}
        />
      )}
    </div>
  );
};

// Position Card Component
interface PositionCardProps {
  position: Position;
  onSelect: (position: Position) => void;
  isSelected: boolean;
}

const PositionCard: React.FC<PositionCardProps> = ({ position, onSelect, isSelected }) => {
  const pnlColor = position.pnl_pct >= 0 ? 'text-bull-400' : 'text-bear-400';
  const pnlIcon = position.pnl_pct >= 0 ? TrendingUp : TrendingDown;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`glass-card p-4 cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-bull-500/50' : ''
      }`}
      onClick={() => onSelect(position)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="font-semibold text-lg">{position.symbol}</h3>
            <div className="text-sm text-dark-400">
              {position.quantity} @ {formatPrice(position.avg_price)}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-semibold">{formatPrice(position.market_value)}</div>
          <div className={`text-sm flex items-center ${pnlColor}`}>
            {React.createElement(pnlIcon, { className: 'w-3 h-3 mr-1' })}
            {formatPercentage(position.pnl_pct)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-dark-400">Current</div>
          <div className="font-semibold">{formatPrice(position.current_price)}</div>
        </div>
        <div>
          <div className="text-dark-400">P&L</div>
          <div className={`font-semibold ${pnlColor}`}>
            {position.unrealized_pnl >= 0 ? '+' : ''}{formatPrice(position.unrealized_pnl)}
          </div>
        </div>
        <div>
          <div className="text-dark-400">Weight</div>
          <div className="font-semibold">{position.weight.toFixed(1)}%</div>
        </div>
      </div>
    </motion.div>
  );
};

// Position Details Modal Component
interface PositionDetailsModalProps {
  position: Position;
  onClose: () => void;
}

const PositionDetailsModal: React.FC<PositionDetailsModalProps> = ({ position, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">{position.symbol} Position Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700/50 rounded-lg transition-colors"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Position Info */}
          <div className="space-y-4">
            <div className="glass-light p-4 rounded-lg">
              <div className="text-sm text-dark-400 mb-1">Quantity</div>
              <div className="text-xl font-bold">{position.quantity}</div>
            </div>

            <div className="glass-light p-4 rounded-lg">
              <div className="text-sm text-dark-400 mb-1">Average Price</div>
              <div className="text-xl font-bold">{formatPrice(position.avg_price)}</div>
            </div>

            <div className="glass-light p-4 rounded-lg">
              <div className="text-sm text-dark-400 mb-1">Current Price</div>
              <div className="text-xl font-bold">{formatPrice(position.current_price)}</div>
            </div>

            <div className="glass-light p-4 rounded-lg">
              <div className="text-sm text-dark-400 mb-1">Market Value</div>
              <div className="text-xl font-bold">{formatPrice(position.market_value)}</div>
            </div>
          </div>

          {/* P&L Info */}
          <div className="space-y-4">
            <div className="glass-light p-4 rounded-lg">
              <div className="text-sm text-dark-400 mb-1">Unrealized P&L</div>
              <div className={`text-xl font-bold ${
                position.unrealized_pnl >= 0 ? 'text-bull-400' : 'text-bear-400'
              }`}>
                {position.unrealized_pnl >= 0 ? '+' : ''}{formatPrice(position.unrealized_pnl)}
              </div>
            </div>

            <div className="glass-light p-4 rounded-lg">
              <div className="text-sm text-dark-400 mb-1">P&L Percentage</div>
              <div className={`text-xl font-bold ${
                position.pnl_pct >= 0 ? 'text-bull-400' : 'text-bear-400'
              }`}>
                {formatPercentage(position.pnl_pct)}
              </div>
            </div>

            <div className="glass-light p-4 rounded-lg">
              <div className="text-sm text-dark-400 mb-1">Portfolio Weight</div>
              <div className="text-xl font-bold">{position.weight.toFixed(1)}%</div>
            </div>

            <div className="glass-light p-4 rounded-lg">
              <div className="text-sm text-dark-400 mb-1">Entry Time</div>
              <div className="text-lg font-bold">
                {new Date(position.entry_time).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-dark-700/50">
          <button className="btn-secondary">
            Edit Position
          </button>
          <button className="btn-danger">
            Close Position
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PortfolioPanel;