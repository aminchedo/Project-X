/**
 * usePortfolioSync - Portfolio Data Polling Hook
 * 
 * Continuously refreshes portfolio details from the backend.
 * Updates: portfolio summary, PnL summary, risk snapshot
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import {
  getPortfolioStatus,
  getPnL,
  getRiskLive,
  handleApiError,
} from '../services/api';

const POLL_INTERVAL = 3000; // 3 seconds (more frequent for portfolio monitoring)

export const usePortfolioSync = (enabled: boolean = true) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    setPortfolioSummary,
    setPnlSummary,
    setRiskSnapshot,
  } = useAppStore();

  const syncData = async () => {
    try {
      // Fetch portfolio data in parallel
      const [portfolio, pnl, risk] = await Promise.all([
        getPortfolioStatus().catch((e) => {
          console.error('Portfolio sync error:', handleApiError(e));
          return null;
        }),
        getPnL().catch((e) => {
          console.error('PnL sync error:', handleApiError(e));
          return null;
        }),
        getRiskLive().catch((e) => {
          console.error('Risk sync error:', handleApiError(e));
          return null;
        }),
      ]);

      // Update store with fetched data
      if (portfolio) setPortfolioSummary(portfolio);
      if (pnl) setPnlSummary(pnl);
      if (risk) setRiskSnapshot(risk);

      console.log('[usePortfolioSync] Sync completed');
    } catch (error) {
      console.error('[usePortfolioSync] Sync failed:', handleApiError(error));
    }
  };

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log('[usePortfolioSync] Starting polling...');

    // Initial sync
    syncData();

    // Start polling
    intervalRef.current = setInterval(syncData, POLL_INTERVAL);

    // Cleanup
    return () => {
      console.log('[usePortfolioSync] Stopping polling');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  return { syncData };
};
