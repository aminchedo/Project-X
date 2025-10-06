import { create } from 'zustand';

interface AssetStore {
  selectedSymbol: string | null;
  setSymbol: (symbol: string) => void;
  clearSymbol: () => void;
}

export const useAssetStore = create<AssetStore>((set) => ({
  selectedSymbol: 'BTCUSDT', // Default to BTC
  setSymbol: (symbol: string) => set({ selectedSymbol: symbol }),
  clearSymbol: () => set({ selectedSymbol: null }),
}));

// Hook for fetching data based on selected symbol
export function useSymbolFetch<T>(path: string, symbol: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    // Simulate API call with mock data
    const fetchData = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data based on symbol and path
        let mockData: any = null;
        
        if (path.includes('news')) {
          mockData = {
            symbol,
            articles: [
              {
                title: `${symbol} Market Analysis Update`,
                summary: `Latest market developments for ${symbol} show positive momentum`,
                timestamp: new Date().toISOString(),
                sentiment: 'positive'
              },
              {
                title: `${symbol} Technical Indicators`,
                summary: `Technical analysis suggests bullish trend continuation`,
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                sentiment: 'neutral'
              }
            ]
          };
        } else if (path.includes('sentiment')) {
          mockData = {
            symbol,
            score: Math.random() * 10,
            trend: Math.random() > 0.5 ? 'up' : 'down',
            socialVolume: Math.random() * 100,
            newsSentiment: Math.random() > 0.5 ? 'positive' : 'negative',
            lastUpdated: new Date().toISOString()
          };
        } else if (path.includes('whales')) {
          mockData = {
            symbol,
            score: Math.random() * 10,
            largeBuys: Math.floor(Math.random() * 20),
            largeSells: Math.floor(Math.random() * 15),
            totalVolume: Math.random() * 1000000,
            lastUpdated: new Date().toISOString()
          };
        }

        if (controller.signal.aborted) return;
        
        setData(mockData);
        setLoading(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [path, symbol]);

  return { data, loading, error };
}

// Import React hooks
import { useState, useEffect } from 'react';
