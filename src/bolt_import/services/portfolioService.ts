import { createClient } from '@supabase/supabase-js';
import { PortfolioPosition } from '../types';

class PortfolioService {
    private supabase: any = null;
    private isInitialized = false;

    async initialize(): Promise<void> {
        try {
            // Initialize Supabase client
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

            if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project.supabase.co') {
                this.supabase = createClient(supabaseUrl, supabaseKey);
                this.isInitialized = true;
                console.log('Portfolio Service initialized with Supabase');
            } else {
                console.log('Portfolio Service initialized with local storage');
            }
        } catch (error) {
            console.error('Failed to initialize Portfolio Service:', error);
        }
    }

    async savePortfolio(positions: PortfolioPosition[]): Promise<void> {
        try {
            if (this.isInitialized && this.supabase) {
                // Save to Supabase
                const { error } = await this.supabase
                    .from('portfolio')
                    .upsert({
                        id: 'user-portfolio',
                        positions: positions,
                        updated_at: new Date().toISOString()
                    });

                if (error) {
                    console.error('Failed to save portfolio to Supabase:', error);
                    this.saveToLocalStorage(positions);
                }
            } else {
                // Fallback to localStorage
                this.saveToLocalStorage(positions);
            }
        } catch (error) {
            console.error('Failed to save portfolio:', error);
            this.saveToLocalStorage(positions);
        }
    }

    async loadPortfolio(): Promise<PortfolioPosition[]> {
        try {
            if (this.isInitialized && this.supabase) {
                // Load from Supabase
                const { data, error } = await this.supabase
                    .from('portfolio')
                    .select('positions')
                    .eq('id', 'user-portfolio')
                    .single();

                if (error) {
                    console.error('Failed to load portfolio from Supabase:', error);
                    return this.loadFromLocalStorage();
                }

                return data?.positions || this.getDefaultPortfolio();
            } else {
                // Fallback to localStorage
                return this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Failed to load portfolio:', error);
            return this.loadFromLocalStorage();
        }
    }

    private saveToLocalStorage(positions: PortfolioPosition[]): void {
        try {
            localStorage.setItem('crypto-portfolio', JSON.stringify(positions));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    private loadFromLocalStorage(): PortfolioPosition[] {
        try {
            const stored = localStorage.getItem('crypto-portfolio');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }

        return this.getDefaultPortfolio();
    }

    private getDefaultPortfolio(): PortfolioPosition[] {
        return [
            {
                symbol: 'BTC',
                quantity: 0.5,
                averagePrice: 41000,
                currentPrice: 43250,
                pnl: 0,
                pnlPercent: 0,
                allocation: 0
            },
            {
                symbol: 'ETH',
                quantity: 4.2,
                averagePrice: 2580,
                currentPrice: 2650,
                pnl: 0,
                pnlPercent: 0,
                allocation: 0
            },
            {
                symbol: 'SOL',
                quantity: 25,
                averagePrice: 95.50,
                currentPrice: 98.75,
                pnl: 0,
                pnlPercent: 0,
                allocation: 0
            }
        ];
    }

    async addPosition(position: Omit<PortfolioPosition, 'pnl' | 'pnlPercent' | 'allocation'>): Promise<void> {
        try {
            const currentPortfolio = await this.loadPortfolio();

            // Check if position already exists
            const existingIndex = currentPortfolio.findIndex(p => p.symbol === position.symbol);

            if (existingIndex >= 0) {
                // Update existing position
                const existing = currentPortfolio[existingIndex];
                const totalQuantity = existing.quantity + position.quantity;
                const totalCost = (existing.quantity * existing.averagePrice) + (position.quantity * position.averagePrice);
                const newAveragePrice = totalCost / totalQuantity;

                currentPortfolio[existingIndex] = {
                    ...existing,
                    quantity: totalQuantity,
                    averagePrice: newAveragePrice,
                    currentPrice: position.currentPrice
                };
            } else {
                // Add new position
                currentPortfolio.push({
                    ...position,
                    pnl: 0,
                    pnlPercent: 0,
                    allocation: 0
                });
            }

            await this.savePortfolio(currentPortfolio);
        } catch (error) {
            console.error('Failed to add position:', error);
            throw error;
        }
    }

    async removePosition(symbol: string): Promise<void> {
        try {
            const currentPortfolio = await this.loadPortfolio();
            const updatedPortfolio = currentPortfolio.filter(p => p.symbol !== symbol);
            await this.savePortfolio(updatedPortfolio);
        } catch (error) {
            console.error('Failed to remove position:', error);
            throw error;
        }
    }

    async updatePosition(symbol: string, updates: Partial<PortfolioPosition>): Promise<void> {
        try {
            const currentPortfolio = await this.loadPortfolio();
            const positionIndex = currentPortfolio.findIndex(p => p.symbol === symbol);

            if (positionIndex >= 0) {
                currentPortfolio[positionIndex] = {
                    ...currentPortfolio[positionIndex],
                    ...updates
                };
                await this.savePortfolio(currentPortfolio);
            }
        } catch (error) {
            console.error('Failed to update position:', error);
            throw error;
        }
    }
}

export const portfolioService = new PortfolioService();
