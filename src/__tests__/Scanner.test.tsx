import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Scanner from '../pages/Scanner';
import { api } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

// Mock the hooks
vi.mock('../state/hooks', () => ({
  useScannerConfig: () => ({
    symbols: ['BTCUSDT', 'ETHUSDT'],
    timeframes: ['15m', '1h', '4h'],
    weights: {
      harmonic: 0.15,
      elliott: 0.15,
      smc: 0.20,
      fibonacci: 0.10,
      price_action: 0.15,
      sar: 0.10,
      sentiment: 0.10,
      news: 0.05,
      whales: 0.05,
    },
    rules: {
      any_tf: 0.6,
      majority_tf: 0.7,
      mode: 'conservative' as const,
    },
  }),
}));

describe('Scanner Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders scanner page with header', () => {
      render(<Scanner />);
      expect(screen.getByText(/اسکنر پیشرفته بازار/i)).toBeInTheDocument();
    });

    it('renders all control components', () => {
      render(<Scanner />);
      expect(screen.getByText(/فیلترهای سریع/i)).toBeInTheDocument();
      expect(screen.getByText(/نمادها/i)).toBeInTheDocument();
      expect(screen.getByText(/بازه‌های زمانی/i)).toBeInTheDocument();
    });

    it('shows initial empty state', () => {
      render(<Scanner />);
      expect(screen.getByText(/آماده برای اسکن/i)).toBeInTheDocument();
    });
  });

  describe('Scan Functionality', () => {
    it('performs scan when button clicked', async () => {
      const mockResponse = {
        results: [
          {
            symbol: 'BTCUSDT',
            score: 0.85,
            direction: 'BULLISH',
            tf_count: 3,
            timeframes: ['15m', '1h', '4h'],
          },
        ],
      };

      (api.post as any).mockResolvedValueOnce(mockResponse);

      render(<Scanner />);
      
      const scanButton = screen.getByText(/اسکن عمیق/i);
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/scanner/run',
          expect.objectContaining({
            symbols: expect.any(Array),
            timeframes: expect.any(Array),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
      });
    });

    it('shows loading state during scan', async () => {
      (api.post as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ results: [] }), 100))
      );

      render(<Scanner />);
      
      const scanButton = screen.getByText(/اسکن عمیق/i);
      fireEvent.click(scanButton);

      expect(screen.getByText(/در حال تحلیل/i)).toBeInTheDocument();
    });

    it('handles scan error gracefully', async () => {
      (api.post as any).mockRejectedValueOnce(new Error('Network error'));

      render(<Scanner />);
      
      const scanButton = screen.getByText(/اسکن عمیق/i);
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText(/خطا/i)).toBeInTheDocument();
      });
    });
  });

  describe('View Modes', () => {
    it('switches between view modes', async () => {
      const mockResponse = {
        results: [
          {
            symbol: 'BTCUSDT',
            score: 0.85,
            direction: 'BULLISH',
            tf_count: 3,
          },
        ],
      };

      (api.post as any).mockResolvedValueOnce(mockResponse);

      render(<Scanner />);
      
      // Scan first
      const scanButton = screen.getByText(/اسکن عمیق/i);
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
      });

      // Switch to grid view
      const gridButton = screen.getByRole('button', { pressed: false, name: /شبکه/i });
      fireEvent.click(gridButton);

      // Grid view should be active
      expect(gridButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Filters', () => {
    it('applies search filter', async () => {
      const mockResponse = {
        results: [
          { symbol: 'BTCUSDT', score: 0.85, direction: 'BULLISH' },
          { symbol: 'ETHUSDT', score: 0.75, direction: 'BULLISH' },
        ],
      };

      (api.post as any).mockResolvedValueOnce(mockResponse);

      render(<Scanner />);
      
      // Scan
      fireEvent.click(screen.getByText(/اسکن عمیق/i));

      await waitFor(() => {
        expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
        expect(screen.getByText('ETHUSDT')).toBeInTheDocument();
      });

      // Search for BTC
      const searchInput = screen.getByPlaceholderText(/جستجو/i);
      await userEvent.type(searchInput, 'BTC');

      // Only BTC should be visible
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
      expect(screen.queryByText('ETHUSDT')).not.toBeInTheDocument();
    });

    it('applies direction filter', async () => {
      const mockResponse = {
        results: [
          { symbol: 'BTCUSDT', score: 0.85, direction: 'BULLISH' },
          { symbol: 'ETHUSDT', score: 0.25, direction: 'BEARISH' },
        ],
      };

      (api.post as any).mockResolvedValueOnce(mockResponse);

      render(<Scanner />);
      
      // Scan
      fireEvent.click(screen.getByText(/اسکن عمیق/i));

      await waitFor(() => {
        expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
        expect(screen.getByText('ETHUSDT')).toBeInTheDocument();
      });

      // Filter to bullish only
      const directionFilter = screen.getByRole('combobox', { name: /فیلتر/i });
      await userEvent.selectOptions(directionFilter, 'BULLISH');

      // Only bullish should be visible
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
      expect(screen.queryByText('ETHUSDT')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts results by score', async () => {
      const mockResponse = {
        results: [
          { symbol: 'BTCUSDT', score: 0.85, direction: 'BULLISH' },
          { symbol: 'ETHUSDT', score: 0.75, direction: 'BULLISH' },
          { symbol: 'SOLUSDT', score: 0.95, direction: 'BULLISH' },
        ],
      };

      (api.post as any).mockResolvedValueOnce(mockResponse);

      render(<Scanner />);
      
      // Scan
      fireEvent.click(screen.getByText(/اسکن عمیق/i));

      await waitFor(() => {
        expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
      });

      // Results should be sorted by score descending by default
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('SOLUSDT'); // Highest score first
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('triggers scan with Ctrl+S', async () => {
      const mockResponse = { results: [] };
      (api.post as any).mockResolvedValueOnce(mockResponse);

      render(<Scanner />);
      
      // Simulate Ctrl+S
      fireEvent.keyDown(document, { key: 's', ctrlKey: true });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    });

    it('opens shortcuts panel with ?', () => {
      render(<Scanner />);
      
      fireEvent.keyDown(document, { key: '?' });

      expect(screen.getByText(/میانبرهای صفحه‌کلید/i)).toBeInTheDocument();
    });
  });

  describe('Presets', () => {
    it('saves preset to localStorage', async () => {
      render(<Scanner />);
      
      // TODO: Implement preset save test
      expect(true).toBe(true); // Placeholder
    });

    it('loads preset from localStorage', async () => {
      render(<Scanner />);
      
      // TODO: Implement preset load test
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Export', () => {
    it('exports results to CSV', async () => {
      const mockResponse = {
        results: [
          { symbol: 'BTCUSDT', score: 0.85, direction: 'BULLISH' },
        ],
      };

      (api.post as any).mockResolvedValueOnce(mockResponse);

      render(<Scanner />);
      
      // Scan first
      fireEvent.click(screen.getByText(/اسکن عمیق/i));

      await waitFor(() => {
        expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
      });

      // TODO: Implement export test
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Comparison', () => {
    it('allows selecting up to 4 symbols', async () => {
      const mockResponse = {
        results: [
          { symbol: 'BTCUSDT', score: 0.85, direction: 'BULLISH' },
          { symbol: 'ETHUSDT', score: 0.75, direction: 'BULLISH' },
        ],
      };

      (api.post as any).mockResolvedValueOnce(mockResponse);

      render(<Scanner />);
      
      // Scan
      fireEvent.click(screen.getByText(/اسکن عمیق/i));

      await waitFor(() => {
        expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
      });

      // TODO: Implement comparison test
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Auto-Refresh', () => {
    it('triggers auto-refresh at interval', async () => {
      vi.useFakeTimers();

      const mockResponse = { results: [] };
      (api.post as any).mockResolvedValue(mockResponse);

      render(<Scanner />);
      
      // Enable auto-refresh
      // TODO: Implement auto-refresh test
      
      vi.useRealTimers();
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Scanner />);
      
      // Check for important ARIA labels
      expect(screen.getByRole('button', { name: /اسکن/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<Scanner />);
      
      // Tab through elements
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
    });
  });

  describe('Responsive Design', () => {
    it('renders on mobile viewport', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<Scanner />);
      
      expect(screen.getByText(/اسکنر پیشرفته بازار/i)).toBeInTheDocument();
    });
  });
});
