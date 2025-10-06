import React from 'react';
import { List, Grid3x3, LineChart, ArrowUpDown, Filter, Search, X, GitCompare } from 'lucide-react';
import { ViewMode, SortField, DirectionFilter } from '../../pages/Scanner';
import { formatDistanceToNow } from 'date-fns';
// import { fa } from 'date-fns/locale'; // fa locale not available in date-fns

interface ResultsHeaderProps {
  resultsCount: number;
  scanTime: string | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortField;
  onSortChange: (field: SortField) => void;
  directionFilter: DirectionFilter;
  onDirectionFilterChange: (filter: DirectionFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  onToggleComparison: () => void;
  showComparison: boolean;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  resultsCount,
  scanTime,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  directionFilter,
  onDirectionFilterChange,
  searchQuery,
  onSearchChange,
  selectedCount,
  onToggleComparison,
  showComparison,
}) => {
  const viewModes: { mode: ViewMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { mode: 'list', icon: List, label: 'لیست' },
    { mode: 'grid', icon: Grid3x3, label: 'شبکه' },
    { mode: 'chart', icon: LineChart, label: 'نمودار' },
    { mode: 'heatmap', icon: Filter, label: 'نقشه' },
  ];

  const sortFields: { field: SortField; label: string }[] = [
    { field: 'score', label: 'امتیاز' },
    { field: 'symbol', label: 'نماد' },
    { field: 'change', label: 'تغییر ۲۴ ساعت' },
    { field: 'volume', label: 'حجم' },
  ];

  const directionFilters: { filter: DirectionFilter; label: string; color: string }[] = [
    { filter: 'all', label: 'همه', color: 'slate' },
    { filter: 'BULLISH', label: 'صعودی', color: 'emerald' },
    { filter: 'BEARISH', label: 'نزولی', color: 'red' },
    { filter: 'NEUTRAL', label: 'خنثی', color: 'slate' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Row: Count, Time, View Modes */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 animate-pulse"></div>
          <h3 className="text-lg font-bold text-white">
            {resultsCount} فرصت پیدا شد
          </h3>
          {scanTime && (
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(scanTime), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-700/30 p-1 rounded-lg border border-slate-600/30">
          {viewModes.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all
                ${viewMode === mode
                  ? 'bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
                }
              `}
              aria-pressed={viewMode === mode}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Row: Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 flex-1 md:flex-initial">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortField)}
            className="flex-1 md:w-auto px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none"
          >
            <option value="" disabled>مرتب‌سازی بر اساس</option>
            {sortFields.map(({ field, label }) => (
              <option key={field} value={field}>{label}</option>
            ))}
          </select>
        </div>

        {/* Direction Filter */}
        <div className="flex items-center gap-2 flex-1 md:flex-initial">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={directionFilter}
            onChange={(e) => onDirectionFilterChange(e.target.value as DirectionFilter)}
            className="flex-1 md:w-auto px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none"
          >
            {directionFilters.map(({ filter, label }) => (
              <option key={filter} value={filter}>{label}</option>
            ))}
          </select>
        </div>

        {/* Search Box */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="جستجوی نماد..."
            className="w-full px-4 py-2 pr-10 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 text-sm focus:border-cyan-500/50 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-600/50 rounded transition-colors"
            >
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>

        {/* Comparison Button */}
        {selectedCount > 0 && (
          <button
            onClick={onToggleComparison}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border
              ${showComparison
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700'
              }
            `}
          >
            <GitCompare className="w-4 h-4" />
            <span>مقایسه ({selectedCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ResultsHeader;
