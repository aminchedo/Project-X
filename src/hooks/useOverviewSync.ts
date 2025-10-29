/**
 * useOverviewSync - Dashboard Data Polling Hook
 * 
 * Continuously refreshes dashboard data from the backend.
 * Updates: portfolio status, PnL, risk, last signal
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import {
  getPortfolioStatus,
  getPnL,
  getRiskLive,
  getSignals,
  handleApiError,
} from '../services/api';

const POLL_INTERVAL = 5000; // 5 seconds

export const useOverviewSync = (enabled: boolean = true) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    setPortfolioSummary,
    setPnlSummary,
    setRiskSnapshot,
    setLastSignal,
  } = useAppStore();

  const syncData = async () => {
    try {
      // Fetch all overview data in parallel
      const [portfolio, pnl, risk, signal] = await Promise.all([
        getPortfolioStatus().catch((e) => {
          console.error('Portfolio status error:', handleApiError(e));
          return null;
        }),
        getPnL().catch((e) => {
          console.error('PnL error:', handleApiError(e));
          return null;
        }),
        getRiskLive().catch((e) => {
          console.error('Risk error:', handleApiError(e));
          return null;
        }),
        getSignals().catch((e) => {
          console.error('Signal error:', handleApiError(e));
          return null;
        }),
      ]);

      // Update store with fetched data
      if (portfolio) setPortfolioSummary(portfolio);
      if (pnl) setPnlSummary(pnl);
      if (risk) setRiskSnapshot(risk);
      if (signal) setLastSignal(signal);

      console.log('[useOverviewSync] Sync completed');
    } catch (error) {
      console.error('[useOverviewSync] Sync failed:', handleApiError(error));
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

    console.log('[useOverviewSync] Starting polling...');

    // Initial sync
    syncData();

    // Start polling
    intervalRef.current = setInterval(syncData, POLL_INTERVAL);

    // Cleanup
    return () => {
      console.log('[useOverviewSync] Stopping polling');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  return { syncData };
};
