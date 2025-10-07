import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  LayoutList, 
  BarChart3, 
  Map,
  Download,
  RefreshCw,
  Filter,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

type ViewMode = 'table' | 'grid' | 'chart' | 'heatmap';

interface ResultsHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalResults: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  onRefresh?: () => void;
  onExport?: () => void;
  onToggleFilters?: () => void;
  isLoading?: boolean;
  showFilters?: boolean;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  viewMode,
  onViewModeChange,
  totalResults,
  bullishCount,
  bearishCount,
  neutralCount,
  onRefresh,
  onExport,
  onToggleFilters,
  isLoading = false,
  showFilters = false
}) => {
  const viewModes: { mode: ViewMode; icon: any; label: string }[] = [
    { mode: 'table', icon: LayoutList, label: 'Table' },
    { mode: 'grid', icon: LayoutGrid, label: 'Grid' },
    { mode: 'chart', icon: BarChart3, label: 'Chart' },
    { mode: 'heatmap', icon: Map, label: 'Heatmap' },
  ];

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Top Row - Stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-50 mb-2">Scan Results</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Total:</span>
              <span className="font-semibold text-slate-50">{totalResults}</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="font-semibold text-green-400">{bullishCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="font-semibold text-red-400">{bearishCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-400">{neutralCount}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onToggleFilters && (
            <motion.button
              onClick={onToggleFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showFilters
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </motion.button>
          )}

          {onRefresh && (
            <motion.button
              onClick={onRefresh}
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
          )}

          {onExport && (
            <motion.button
              onClick={onExport}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 rounded-lg font-medium transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Bottom Row - View Modes */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 mr-2">View:</span>
        {viewModes.map((mode, index) => {
          const Icon = mode.icon;
          const isActive = viewMode === mode.mode;
          
          return (
            <motion.button
              key={mode.mode}
              onClick={() => onViewModeChange(mode.mode)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{mode.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Sentiment Bar */}
      {totalResults > 0 && (
        <motion.div
          className="mt-6 relative h-2 bg-slate-800 rounded-full overflow-hidden"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="absolute left-0 top-0 h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${(bullishCount / totalResults) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute right-0 top-0 h-full bg-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${(bearishCount / totalResults) * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default ResultsHeader;
