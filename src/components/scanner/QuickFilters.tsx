import React from 'react';
import { TrendingUp, Star, Layers, DollarSign, Globe } from 'lucide-react';

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  symbols: string[];
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'popular',
    label: 'محبوب',
    icon: TrendingUp,
    symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT'],
  },
  {
    id: 'defi',
    label: 'دیفای',
    icon: Layers,
    symbols: ['UNIUSDT', 'AAVEUSDT', 'LINKUSDT', 'MKRUSDT', 'SUSHIUSDT'],
  },
  {
    id: 'layer1',
    label: 'لایه ۱',
    icon: Globe,
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'AVAXUSDT', 'DOTUSDT'],
  },
  {
    id: 'top10',
    label: 'ده برتر',
    icon: Star,
    symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'TRXUSDT', 'MATICUSDT', 'LTCUSDT'],
  },
  {
    id: 'stablecoins',
    label: 'استیبل‌کوین',
    icon: DollarSign,
    symbols: ['BUSDUSDT', 'USDCUSDT', 'DAIUSDT'],
  },
];

interface QuickFiltersProps {
  onSelectGroup: (symbols: string[]) => void;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({ onSelectGroup }) => {
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);

  const handleFilterClick = (filter: QuickFilter) => {
    setActiveFilter(filter.id);
    onSelectGroup(filter.symbols);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-300">
        🎯 فیلترهای سریع
      </label>
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          
          return (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                transition-all duration-200 border
                ${isActive 
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/20' 
                  : 'bg-slate-700/30 border-slate-600/30 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/50'
                }
              `}
              aria-pressed={isActive}
            >
              <Icon className="w-4 h-4" />
              <span>{filter.label}</span>
              <span className="text-xs opacity-70">({filter.symbols.length})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickFilters;
