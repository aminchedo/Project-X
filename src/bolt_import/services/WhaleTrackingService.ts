/**
 * WhaleTrackingService - Monitor large cryptocurrency transactions
 * 
 * Methods:
 * - Polling for whale transactions
 * - Fallback via Etherscan
 * - Real-time callbacks
 */

import { BaseApiService } from './BaseApiService';
import { API_CONFIG } from '../config/apiConfig';

export interface WhaleTransaction {
  id: string;
  blockchain: string;
  symbol: string;
  amount: number;
  amountUSD: number;
  from: string;
  to: string;
  timestamp: number;
  type: 'transfer' | 'deposit' | 'withdrawal';
  hash: string;
}

type TransactionCallback = (transaction: WhaleTransaction) => void;

export class WhaleTrackingService extends BaseApiService {
  private transactions: WhaleTransaction[] = [];
  private readonly MAX_TRANSACTIONS = 100;
  private pollingInterval: NodeJS.Timeout | null = null;
  private callbacks: TransactionCallback[] = [];

  /**
   * Start polling for whale transactions
   */
  startPolling(interval: number = 30000, callback?: TransactionCallback): void {
    if (callback) {
      this.addCallback(callback);
    }

    if (this.pollingInterval) {
      console.warn('Polling already started');
      return;
    }

    console.log(`Starting whale tracking with ${interval}ms interval`);

    // Initial fetch
    this.fetchWhaleTransactions();

    // Set up polling
    this.pollingInterval = setInterval(() => {
      this.fetchWhaleTransactions();
    }, interval);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Whale tracking stopped');
    }
  }

  /**
   * Add callback for new transactions
   */
  addCallback(callback: TransactionCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove callback
   */
  removeCallback(callback: TransactionCallback): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Fetch whale transactions
   */
  private async fetchWhaleTransactions(minValue: number = 1000000): Promise<void> {
    try {
      // Try Etherscan for large ETH transactions
      const ethTransactions = await this.getEtherscanWhaleTransactions(minValue);

      // Process new transactions
      ethTransactions.forEach(tx => {
        if (!this.transactions.find(t => t.id === tx.id)) {
          this.addTransaction(tx);
          this.notifyCallbacks(tx);
        }
      });
    } catch (error) {
      console.error('Failed to fetch whale transactions:', error);
    }
  }

  /**
   * Get whale transactions from Etherscan
   */
  private async getEtherscanWhaleTransactions(minValue: number): Promise<WhaleTransaction[]> {
    try {
      const config = API_CONFIG.etherscan.primary;
      const fallback = API_CONFIG.etherscan.fallback;

      // Known whale addresses (exchanges, large holders)
      const whaleAddresses = [
        '0x28c6c06298d514db089934071355e5743bf21d60', // Binance
        '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 2
        '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', // Binance 3
        '0x56eddb7aa87536c09ccc2793473599fd21a8b17f', // Binance 4
        '0x9696f59e4d72e237be84ffd425dcad154bf96976', // Binance 5
        '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67', // Kraken
        '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0', // Kraken 2
      ];

      const transactions: WhaleTransaction[] = [];

      // Fetch transactions for each whale address (limit to 2 to avoid rate limits)
      for (const address of whaleAddresses.slice(0, 2)) {
        try {
          const endpoint = `?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${config.key}`;

          const data = await this.request<any>(config, endpoint, {}, [fallback]);

          if (data.status === '1' && data.result) {
            data.result.forEach((tx: any) => {
              const valueInEth = parseFloat(tx.value) / 1e18;
              const valueInUSD = valueInEth * 2000; // Approximate ETH price

              if (valueInUSD >= minValue) {
                transactions.push({
                  id: tx.hash,
                  blockchain: 'Ethereum',
                  symbol: 'ETH',
                  amount: valueInEth,
                  amountUSD: valueInUSD,
                  from: tx.from,
                  to: tx.to,
                  timestamp: parseInt(tx.timeStamp) * 1000,
                  type: this.determineTransactionType(tx.from, tx.to),
                  hash: tx.hash,
                });
              }
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch transactions for ${address}:`, error);
        }

        // Small delay to respect rate limits
        await this.sleep(200);
      }

      return transactions;
    } catch (error) {
      console.error('Etherscan whale tracking failed:', error);
      return [];
    }
  }

  /**
   * Determine transaction type based on addresses
   */
  private determineTransactionType(from: string, to: string): 'transfer' | 'deposit' | 'withdrawal' {
    const exchangeAddresses = [
      '0x28c6c06298d514db089934071355e5743bf21d60',
      '0x21a31ee1afc51d94c2efccaa2092ad1028285549',
      '0xdfd5293d8e347dfe59e90efd55b2956a1343963d',
      '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67',
    ];

    const fromIsExchange = exchangeAddresses.some(addr =>
      from.toLowerCase() === addr.toLowerCase()
    );
    const toIsExchange = exchangeAddresses.some(addr =>
      to.toLowerCase() === addr.toLowerCase()
    );

    if (fromIsExchange && !toIsExchange) return 'withdrawal';
    if (!fromIsExchange && toIsExchange) return 'deposit';
    return 'transfer';
  }

  /**
   * Add transaction to storage
   */
  private addTransaction(transaction: WhaleTransaction): void {
    this.transactions.unshift(transaction);

    // Keep only last MAX_TRANSACTIONS
    if (this.transactions.length > this.MAX_TRANSACTIONS) {
      this.transactions = this.transactions.slice(0, this.MAX_TRANSACTIONS);
    }
  }

  /**
   * Notify all callbacks of new transaction
   */
  private notifyCallbacks(transaction: WhaleTransaction): void {
    this.callbacks.forEach(callback => {
      try {
        callback(transaction);
      } catch (error) {
        console.error('Callback error:', error);
      }
    });
  }

  /**
   * Get all stored transactions
   */
  getAllTransactions(): WhaleTransaction[] {
    return [...this.transactions];
  }

  /**
   * Get recent transactions
   */
  getRecentTransactions(limit: number = 20): WhaleTransaction[] {
    return this.transactions.slice(0, limit);
  }

  /**
   * Get transactions by blockchain
   */
  getTransactionsByBlockchain(blockchain: string): WhaleTransaction[] {
    return this.transactions.filter(tx =>
      tx.blockchain.toLowerCase() === blockchain.toLowerCase()
    );
  }

  /**
   * Get transactions by type
   */
  getTransactionsByType(type: 'transfer' | 'deposit' | 'withdrawal'): WhaleTransaction[] {
    return this.transactions.filter(tx => tx.type === type);
  }

  /**
   * Get transactions above certain value
   */
  getTransactionsAboveValue(minValueUSD: number): WhaleTransaction[] {
    return this.transactions.filter(tx => tx.amountUSD >= minValueUSD);
  }

  /**
   * Clear all transactions
   */
  clearTransactions(): void {
    this.transactions = [];
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalTransactions: number;
    totalVolumeUSD: number;
    averageValueUSD: number;
    byBlockchain: Record<string, number>;
    byType: Record<string, number>;
  } {
    const totalVolumeUSD = this.transactions.reduce((sum, tx) => sum + tx.amountUSD, 0);
    const averageValueUSD = this.transactions.length > 0
      ? totalVolumeUSD / this.transactions.length
      : 0;

    const byBlockchain: Record<string, number> = {};
    const byType: Record<string, number> = {};

    this.transactions.forEach(tx => {
      byBlockchain[tx.blockchain] = (byBlockchain[tx.blockchain] || 0) + 1;
      byType[tx.type] = (byType[tx.type] || 0) + 1;
    });

    return {
      totalTransactions: this.transactions.length,
      totalVolumeUSD,
      averageValueUSD,
      byBlockchain,
      byType,
    };
  }
}

// Export singleton instance
export const whaleTrackingService = new WhaleTrackingService();

