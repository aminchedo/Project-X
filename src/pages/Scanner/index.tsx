import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useScannerConfig } from '../../state/hooks';
import { api } from '../../services/api';
import { ScanResponse, ScanResult } from '../../types';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import QuickFilters from '../../components/scanner/QuickFilters';
import SymbolInput from '../../components/scanner/SymbolInput';
import TimeframeSelector from '../../components/scanner/TimeframeSelector';
import AdvancedFilters from '../../components/scanner/AdvancedFilters';
import ScanButtons from '../../components/scanner/ScanButtons';
import PresetDropdown from '../../components/scanner/PresetDropdown';
import ResultsHeader from '../../components/scanner/ResultsHeader';
import ResultsTable from '../../components/scanner/ResultsTable';
import ResultsGrid from '../../components/scanner/ResultsGrid';
import ResultsChart from '../../components/scanner/ResultsChart';
import ScannerHeatmap from '../../components/scanner/ScannerHeatmap';
import ExportMenu from '../../components/scanner/ExportMenu';
import ComparisonPanel from '../../components/scanner/ComparisonPanel';
import KeyboardShortcutsPanel from '../../components/scanner/KeyboardShortcutsPanel';
import SessionHistory, { addScanSession } from '../../components/scanner/SessionHistory';
import Loading from '../../components/Loading';
import Empty from '../../components/Empty';
import ErrorBlock from '../../components/ErrorBlock';

export type ViewMode = 'list' | 'grid' | 'chart' | 'heatmap';
export type SortField = 'score' | 'symbol' | 'change' | 'volume';
export type SortDirection = 'asc' | 'desc';
export type DirectionFilter = 'all' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface AdvancedFilterConfig {
  scoreMin: number;
  scoreMax: number;
  priceChange: 'any' | 'gainers' | 'losers' | 'bigmovers';
  volumeMin: number;
  signalCountMin: number;
  tfAgreement: 'any' | 'majority' | 'full';
}

export interface ScannerState {
  symbols: string[];
  timeframes: string[];
  isScanning: boolean;
  results: ScanResult[];
  error: string | null;
  hasScanned: boolean;
  scanTime: string | null;
  
  // View state
  viewMode: ViewMode;
  sortBy: SortField;
  sortDirection: SortDirection;
  directionFilter: DirectionFilter;
  searchQuery: string;
  
  // Advanced features
  advancedFilters: AdvancedFilterConfig;
  showAdvancedFilters: boolean;
  autoRefresh: boolean;
  autoRefreshInterval: number; // seconds
  selectedSymbols: Set<string>; // for comparison
  showComparison: boolean;
}

const Scanner: React.FC = () => {
  const config = useScannerConfig();
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [state, setState] = useState<ScannerState>({
    symbols: config.symbols,
    timeframes: config.timeframes,
    isScanning: false,
    results: [],
    error: null,
    hasScanned: false,
    scanTime: null,
    
    viewMode: 'list',
    sortBy: 'score',
    sortDirection: 'desc',
    directionFilter: 'all',
    searchQuery: '',
    
    advancedFilters: {
      scoreMin: 0,
      scoreMax: 1,
      priceChange: 'any',
      volumeMin: 0,
      signalCountMin: 0,
      tfAgreement: 'any',
    },
    showAdvancedFilters: false,
    autoRefresh: false,
    autoRefreshInterval: 300, // 5 minutes default
    selectedSymbols: new Set(),
    showComparison: false,
  });

  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Helper to extract score from result (tolerant to backend variations)
  const getScore = useCallback((result: ScanResult): number => {
    return result.overall_score ?? result.final_score ?? result.score ?? 0;
  }, []);

  // Helper to extract direction
  const getDirection = useCallback((result: ScanResult): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
    return result.overall_direction ?? result.direction ?? 'NEUTRAL';
  }, []);

  // Perform scan
  const handleScan = useCallback(async (quick: boolean = false) => {
    setState(prev => ({ ...prev, isScanning: true, error: null, hasScanned: true }));

    try {
      if (state.symbols.length === 0) {
        throw new Error('لطفاً حداقل یک نماد انتخاب کنید');
      }
      if (state.timeframes.length === 0) {
        throw new Error('لطفاً حداقل یک بازه زمانی انتخاب کنید');
      }

      const scanRequest = {
        symbols: state.symbols,
        timeframes: state.timeframes,
        weights: config.weights,
        rules: {
          min_score: config.rules.any_tf,
          min_confidence: config.rules.majority_tf,
          max_risk_level: config.rules.mode === 'aggressive' ? 'HIGH' : 'MEDIUM',
          quick_scan: quick, // Optional backend parameter
        }
      };

      console.log('Scanner request:', scanRequest);
      const response = await api.post<ScanResponse>('/api/scanner/run', scanRequest);
      
      // Be tolerant to backend response variations
      const scanResults = response.results || response.result || [];
      
      setState(prev => ({
        ...prev,
        results: scanResults,
        error: null,
        isScanning: false,
        scanTime: new Date().toISOString(),
      }));
      
      // Add to session history
      addScanSession(state.symbols, state.timeframes, scanResults);
    } catch (err: any) {
      console.error('Scanner error:', err);
      setState(prev => ({
        ...prev,
        error: err.message || 'خطا در اسکن بازار',
        results: [],
        isScanning: false,
      }));
    }
  }, [state.symbols, state.timeframes, config.weights, config.rules]);

  // Auto-refresh management
  useEffect(() => {
    if (state.autoRefresh && state.hasScanned) {
      // Clear existing timer
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
      
      // Set new timer
      autoRefreshTimerRef.current = setInterval(() => {
        console.log('Auto-refresh triggered');
        handleScan(true); // Use quick scan for auto-refresh
      }, state.autoRefreshInterval * 1000);
      
      return () => {
        if (autoRefreshTimerRef.current) {
          clearInterval(autoRefreshTimerRef.current);
        }
      };
    }
  }, [state.autoRefresh, state.autoRefreshInterval, state.hasScanned, handleScan]);

  // Filter results based on search and filters
  const filteredResults = useMemo(() => {
    let filtered = [...state.results];
    
    // Search filter
    if (state.searchQuery) {
      filtered = filtered.filter(r => 
        r.symbol.toLowerCase().includes(state.searchQuery.toLowerCase())
      );
    }
    
    // Direction filter
    if (state.directionFilter !== 'all') {
      filtered = filtered.filter(r => getDirection(r) === state.directionFilter);
    }
    
    // Advanced filters
    const { scoreMin, scoreMax, signalCountMin, tfAgreement, priceChange } = state.advancedFilters;
    
    filtered = filtered.filter(r => {
      const score = getScore(r);
      if (score < scoreMin || score > scoreMax) return false;
      
      // Signal count (if available)
      const signalCount = r.sample_components ? Object.keys(r.sample_components).length : 0;
      if (signalCount < signalCountMin) return false;
      
      // TF agreement (if data available)
      if (tfAgreement === 'full' && r.tf_count !== state.timeframes.length) return false;
      if (tfAgreement === 'majority' && r.tf_count && r.tf_count < Math.ceil(state.timeframes.length / 2)) return false;
      
      return true;
    });
    
    return filtered;
  }, [state.results, state.searchQuery, state.directionFilter, state.advancedFilters, state.timeframes.length, getScore, getDirection]);

  // Sort results
  const sortedResults = useMemo(() => {
    const sorted = [...filteredResults];
    
    sorted.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (state.sortBy) {
        case 'score':
          aVal = getScore(a);
          bVal = getScore(b);
          break;
        case 'symbol':
          aVal = a.symbol;
          bVal = b.symbol;
          break;
        case 'change':
          // TODO: Add 24h change when available from backend
          aVal = 0;
          bVal = 0;
          break;
        case 'volume':
          // TODO: Add volume when available from backend
          aVal = 0;
          bVal = 0;
          break;
        default:
          return 0;
      }
      
      const comparison = typeof aVal === 'string' 
        ? aVal.localeCompare(bVal)
        : aVal - bVal;
      
      return state.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredResults, state.sortBy, state.sortDirection, getScore]);

  // Handlers
  const handleSymbolsChange = useCallback((symbols: string[]) => {
    setState(prev => ({ ...prev, symbols }));
  }, []);

  const handleTimeframesChange = useCallback((timeframes: string[]) => {
    setState(prev => ({ ...prev, timeframes }));
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const handleSortChange = useCallback((field: SortField) => {
    setState(prev => ({
      ...prev,
      sortBy: field,
      sortDirection: prev.sortBy === field && prev.sortDirection === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  const handleDirectionFilterChange = useCallback((filter: DirectionFilter) => {
    setState(prev => ({ ...prev, directionFilter: filter }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const handleAdvancedFiltersChange = useCallback((filters: Partial<AdvancedFilterConfig>) => {
    setState(prev => ({
      ...prev,
      advancedFilters: { ...prev.advancedFilters, ...filters },
    }));
  }, []);

  const handleAutoRefreshToggle = useCallback((enabled: boolean, interval?: number) => {
    setState(prev => ({
      ...prev,
      autoRefresh: enabled,
      autoRefreshInterval: interval ?? prev.autoRefreshInterval,
    }));
  }, []);

  const handleSymbolToggleSelection = useCallback((symbol: string) => {
    setState(prev => {
      const selected = new Set(prev.selectedSymbols);
      if (selected.has(symbol)) {
        selected.delete(symbol);
      } else {
        if (selected.size >= 4) {
          // Max 4 symbols for comparison
          return prev;
        }
        selected.add(symbol);
      }
      return { ...prev, selectedSymbols: selected };
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedSymbols: new Set() }));
  }, []);

  const handleToggleComparison = useCallback(() => {
    setState(prev => ({ ...prev, showComparison: !prev.showComparison }));
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 's',
      ctrlKey: true,
      handler: (e) => {
        e.preventDefault();
        if (!state.isScanning) handleScan(false);
      },
      description: 'اجرای اسکن عمیق'
    },
    {
      key: 'q',
      ctrlKey: true,
      handler: () => {
        if (!state.isScanning) handleScan(true);
      },
      description: 'اجرای اسکن سریع'
    },
    {
      key: '1',
      handler: () => handleViewModeChange('list'),
      description: 'نمای لیست'
    },
    {
      key: '2',
      handler: () => handleViewModeChange('grid'),
      description: 'نمای شبکه'
    },
    {
      key: '3',
      handler: () => handleViewModeChange('chart'),
      description: 'نمای نمودار'
    },
    {
      key: '4',
      handler: () => handleViewModeChange('heatmap'),
      description: 'نقشه حرارتی'
    },
    {
      key: 'f',
      handler: () => setState(prev => ({ ...prev, showAdvancedFilters: !prev.showAdvancedFilters })),
      description: 'فیلترهای پیشرفته'
    },
    {
      key: 'b',
      handler: () => handleDirectionFilterChange('BULLISH'),
      description: 'فقط صعودی'
    },
    {
      key: 'n',
      handler: () => handleDirectionFilterChange('BEARISH'),
      description: 'فقط نزولی'
    },
    {
      key: 'r',
      handler: () => handleDirectionFilterChange('all'),
      description: 'بازنشانی فیلتر جهت'
    },
    {
      key: '?',
      handler: () => setShowShortcuts(true),
      description: 'نمایش راهنمای میانبرها'
    },
    {
      key: 'Escape',
      handler: () => {
        if (showShortcuts) setShowShortcuts(false);
        else if (state.showComparison) handleToggleComparison();
      },
      description: 'بستن مودال‌ها'
    }
  ], !showShortcuts && !state.showComparison);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              🔍 اسکنر پیشرفته بازار
              <button
                onClick={() => setShowShortcuts(true)}
                className="text-sm px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-1"
                title="میانبرهای صفحه‌کلید"
              >
                <span>?</span>
                <span className="hidden sm:inline">میانبرها</span>
              </button>
            </h1>
            <p className="text-slate-400">
              اسکن چند بازه زمانی با تحلیل ترکیبی ۹ الگوریتم حرفه‌ای
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/70 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              <span>📜</span>
              <span className="hidden sm:inline">تاریخچه</span>
            </button>
            <ExportMenu results={sortedResults} />
            <PresetDropdown 
              symbols={state.symbols}
              timeframes={state.timeframes}
              onLoad={(preset) => {
                setState(prev => ({
                  ...prev,
                  symbols: preset.symbols,
                  timeframes: preset.timeframes,
                }));
              }}
            />
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 space-y-6">
          {/* Quick Filters */}
          <QuickFilters onSelectGroup={handleSymbolsChange} />
          
          {/* Main Inputs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SymbolInput 
              symbols={state.symbols}
              onChange={handleSymbolsChange}
              disabled={state.isScanning}
            />
            
            <TimeframeSelector 
              timeframes={state.timeframes}
              onChange={handleTimeframesChange}
              disabled={state.isScanning}
            />
          </div>
          
          {/* Advanced Filters (Collapsible) */}
          <AdvancedFilters 
            filters={state.advancedFilters}
            onChange={handleAdvancedFiltersChange}
            isExpanded={state.showAdvancedFilters}
            onToggle={() => setState(prev => ({ ...prev, showAdvancedFilters: !prev.showAdvancedFilters }))}
          />
          
          {/* Scan Buttons */}
          <ScanButtons 
            onDeepScan={() => handleScan(false)}
            onQuickScan={() => handleScan(true)}
            isScanning={state.isScanning}
            autoRefresh={state.autoRefresh}
            autoRefreshInterval={state.autoRefreshInterval}
            onAutoRefreshToggle={handleAutoRefreshToggle}
          />
        </div>

        {/* Results Section */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 space-y-6">
          <ResultsHeader 
            resultsCount={sortedResults.length}
            scanTime={state.scanTime}
            viewMode={state.viewMode}
            onViewModeChange={handleViewModeChange}
            sortBy={state.sortBy}
            onSortChange={handleSortChange}
            directionFilter={state.directionFilter}
            onDirectionFilterChange={handleDirectionFilterChange}
            searchQuery={state.searchQuery}
            onSearchChange={handleSearchChange}
            selectedCount={state.selectedSymbols.size}
            onToggleComparison={handleToggleComparison}
            showComparison={state.showComparison}
          />
          
          {/* Loading State */}
          {state.isScanning && <Loading message="در حال تحلیل نمادها..." />}
          
          {/* Error State */}
          {!state.isScanning && state.error && (
            <ErrorBlock message={state.error} onRetry={() => handleScan(false)} />
          )}
          
          {/* Empty States */}
          {!state.isScanning && !state.error && !state.hasScanned && (
            <Empty 
              icon="📊"
              title="آماده برای اسکن"
              description="نمادها و بازه‌های زمانی را انتخاب کنید و دکمه اسکن را بزنید"
            />
          )}
          
          {!state.isScanning && !state.error && state.hasScanned && sortedResults.length === 0 && (
            <Empty 
              icon="🔍"
              title="نتیجه‌ای یافت نشد"
              description="با معیارهای انتخاب شده، فرصتی شناسایی نشد. فیلترها را تغییر دهید یا نمادهای بیشتری امتحان کنید"
            />
          )}
          
          {/* Results Display */}
          {!state.isScanning && !state.error && sortedResults.length > 0 && (
            <>
              {state.viewMode === 'list' && (
                <ResultsTable 
                  results={sortedResults}
                  selectedSymbols={state.selectedSymbols}
                  onToggleSelection={handleSymbolToggleSelection}
                />
              )}
              
              {state.viewMode === 'grid' && (
                <ResultsGrid 
                  results={sortedResults}
                  selectedSymbols={state.selectedSymbols}
                  onToggleSelection={handleSymbolToggleSelection}
                />
              )}
              
              {state.viewMode === 'chart' && (
                <ResultsChart 
                  results={sortedResults}
                />
              )}
              
              {state.viewMode === 'heatmap' && (
                <ScannerHeatmap 
                  results={sortedResults}
                />
              )}
            </>
          )}
        </div>

        {/* Comparison Panel (Slide-in) */}
        {state.showComparison && state.selectedSymbols.size > 0 && (
          <ComparisonPanel 
            symbols={Array.from(state.selectedSymbols)}
            results={sortedResults.filter(r => state.selectedSymbols.has(r.symbol))}
            onClose={() => setState(prev => ({ ...prev, showComparison: false }))}
          />
        )}

        {/* Keyboard Shortcuts Panel */}
        <KeyboardShortcutsPanel 
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />

        {/* Session History Panel */}
        <SessionHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onRestore={(session) => {
            setState(prev => ({
              ...prev,
              symbols: session.symbols,
              timeframes: session.timeframes,
            }));
          }}
        />
      </div>
    </div>
  );
};

export default Scanner;
