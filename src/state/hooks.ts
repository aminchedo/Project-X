/**
 * React hooks for store integration
 */

import { useState, useEffect } from 'react';
import { store, AppState, WeightConfig, ScanRules } from './store';

/**
 * Hook to subscribe to entire store state
 */
export function useStore(): AppState {
  const [state, setState] = useState<AppState>(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    return unsubscribe;
  }, []);

  return state;
}

/**
 * Hook for symbols management
 */
export function useSymbols() {
  const state = useStore();
  return {
    symbols: state.symbols,
    setSymbols: store.setSymbols.bind(store),
    addSymbol: store.addSymbol.bind(store),
    removeSymbol: store.removeSymbol.bind(store)
  };
}

/**
 * Hook for timeframes management
 */
export function useTimeframes() {
  const state = useStore();
  return {
    timeframes: state.timeframes,
    setTimeframes: store.setTimeframes.bind(store)
  };
}

/**
 * Hook for weights management
 */
export function useWeights() {
  const state = useStore();
  return {
    weights: state.weights,
    setWeights: store.setWeights.bind(store)
  };
}

/**
 * Hook for rules management
 */
export function useRules() {
  const state = useStore();
  return {
    rules: state.rules,
    setRules: store.setRules.bind(store)
  };
}

/**
 * Hook to get complete scanner configuration
 */
export function useScannerConfig() {
  const state = useStore();
  return {
    symbols: state.symbols,
    timeframes: state.timeframes,
    weights: state.weights,
    rules: state.rules,
    // Helper to get full scanner request payload
    getScanRequest: () => ({
      symbols: state.symbols,
      timeframes: state.timeframes,
      weights: state.weights,
      rules: {
        min_score: state.rules.any_tf,
        min_confidence: state.rules.majority_tf,
        max_risk_level: state.rules.mode === 'aggressive' ? 'HIGH' : 'MEDIUM'
      }
    })
  };
}

/**
 * Hook for store actions
 */
export function useStoreActions() {
  return {
    setSymbols: store.setSymbols.bind(store),
    addSymbol: store.addSymbol.bind(store),
    removeSymbol: store.removeSymbol.bind(store),
    setTimeframes: store.setTimeframes.bind(store),
    setWeights: store.setWeights.bind(store),
    setRules: store.setRules.bind(store),
    reset: store.reset.bind(store)
  };
}
