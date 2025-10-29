import { BaseApiService } from './BaseApiService';
import {
  BlockchainTransaction,
  BlockData,
  AddressBalance,
  ApiResponse,
  ServiceHealth
} from '@/types/crypto.types';
import { API_CONFIG, CACHE_CONFIG } from '@/config/cryptoApiConfig';

/**
 * Blockchain Service
 * Handles blockchain explorer APIs for Ethereum, BSC, and Tron
 */
export class BlockchainService extends BaseApiService {
  constructor() {
    super('BlockchainService');
  }

  /**
   * Get transaction details by hash
   */
  async getTransaction(
    hash: string,
    blockchain: 'ethereum' | 'bsc' | 'tron'
  ): Promise<ApiResponse<BlockchainTransaction>> {
    const cacheKey = this.generateCacheKey('transaction', { hash, blockchain });

    const config = API_CONFIG.blockExplorers[blockchain];

    return this.makeRequest(
      config.primary,
      '',
      {
        module: 'proxy',
        action: 'eth_getTransactionByHash',
        txhash: hash,
        apikey: config.primary.getKey()
      },
      cacheKey,
      CACHE_CONFIG.PRICES_TTL
    );
  }

  /**
   * Get block details by number
   */
  async getBlock(
    blockNumber: number,
    blockchain: 'ethereum' | 'bsc' | 'tron'
  ): Promise<ApiResponse<BlockData>> {
    const cacheKey = this.generateCacheKey('block', { blockNumber, blockchain });

    const config = API_CONFIG.blockExplorers[blockchain];

    return this.makeRequest(
      config.primary,
      '',
      {
        module: 'proxy',
        action: 'eth_getBlockByNumber',
        tag: `0x${blockNumber.toString(16)}`,
        boolean: 'true',
        apikey: config.primary.getKey()
      },
      cacheKey,
      CACHE_CONFIG.HISTORICAL_TTL
    );
  }

  /**
   * Get address balance
   */
  async getAddressBalance(
    address: string,
    blockchain: 'ethereum' | 'bsc' | 'tron'
  ): Promise<ApiResponse<AddressBalance>> {
    const cacheKey = this.generateCacheKey('balance', { address, blockchain });

    const config = API_CONFIG.blockExplorers[blockchain];

    return this.makeRequest(
      config.primary,
      '',
      {
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
        apikey: config.primary.getKey()
      },
      cacheKey,
      CACHE_CONFIG.PRICES_TTL
    );
  }

  /**
   * Get token balances for an address
   */
  async getTokenBalances(
    address: string,
    blockchain: 'ethereum' | 'bsc' | 'tron'
  ): Promise<ApiResponse<Array<{
    contract_address: string;
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
    balance_formatted: number;
    balance_usd: number;
  }>>> {
    const cacheKey = this.generateCacheKey('token-balances', { address, blockchain });

    const config = API_CONFIG.blockExplorers[blockchain];

    return this.makeRequest(
      config.primary,
      '',
      {
        module: 'account',
        action: 'tokenlist',
        address,
        apikey: config.primary.getKey()
      },
      cacheKey,
      CACHE_CONFIG.PRICES_TTL
    );
  }

  /**
   * Get recent transactions for an address
   */
  async getAddressTransactions(
    address: string,
    blockchain: 'ethereum' | 'bsc' | 'tron',
    limit: number = 20
  ): Promise<ApiResponse<BlockchainTransaction[]>> {
    const cacheKey = this.generateCacheKey('address-transactions', { address, blockchain, limit });

    const config = API_CONFIG.blockExplorers[blockchain];

    return this.makeRequest(
      config.primary,
      '',
      {
        module: 'account',
        action: 'txlist',
        address,
        startblock: 0,
        endblock: 99999999,
        page: 1,
        offset: limit,
        sort: 'desc',
        apikey: config.primary.getKey()
      },
      cacheKey,
      CACHE_CONFIG.PRICES_TTL
    );
  }

  /**
   * Get gas price for Ethereum/BSC
   */
  async getGasPrice(blockchain: 'ethereum' | 'bsc'): Promise<ApiResponse<{
    slow: number;
    standard: number;
    fast: number;
    instant: number;
  }>> {
    const cacheKey = this.generateCacheKey('gas-price', { blockchain });

    const config = API_CONFIG.blockExplorers[blockchain];

    return this.makeRequest(
      config.primary,
      '',
      {
        module: 'gastracker',
        action: 'gasoracle',
        apikey: config.primary.getKey()
      },
      cacheKey,
      30 * 1000 // 30 seconds cache for gas prices
    );
  }

  /**
   * Get network statistics
   */
  async getNetworkStats(blockchain: 'ethereum' | 'bsc' | 'tron'): Promise<ApiResponse<{
    total_supply: string;
    total_transactions: string;
    total_addresses: string;
    difficulty: string;
    hash_rate: string;
    block_time: number;
    block_reward: string;
  }>> {
    const cacheKey = this.generateCacheKey('network-stats', { blockchain });

    const config = API_CONFIG.blockExplorers[blockchain];

    return this.makeRequest(
      config.primary,
      '',
      {
        module: 'stats',
        action: 'ethsupply',
        apikey: config.primary.getKey()
      },
      cacheKey,
      CACHE_CONFIG.HISTORICAL_TTL
    );
  }

  /**
   * Get contract information
   */
  async getContractInfo(
    contractAddress: string,
    blockchain: 'ethereum' | 'bsc' | 'tron'
  ): Promise<ApiResponse<{
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    total_supply: string;
    contract_type: string;
    verified: boolean;
  }>> {
    const cacheKey = this.generateCacheKey('contract-info', { contractAddress, blockchain });

    const config = API_CONFIG.blockExplorers[blockchain];

    return this.makeRequest(
      config.primary,
      '',
      {
        module: 'token',
        action: 'tokeninfo',
        contractaddress: contractAddress,
        apikey: config.primary.getKey()
      },
      cacheKey,
      CACHE_CONFIG.HISTORICAL_TTL
    );
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(
    hash: string,
    blockchain: 'ethereum' | 'bsc' | 'tron'
  ): Promise<ApiResponse<{
    transactionHash: string;
    transactionIndex: string;
    blockHash: string;
    blockNumber: string;
    from: string;
    to: string;
    gasUsed: string;
    cumulativeGasUsed: string;
    status: string;
    logs: any[];
  }>> {
    const cacheKey = this.generateCacheKey('transaction-receipt', { hash, blockchain });

    const config = API_CONFIG.blockExplorers[blockchain];

    return this.makeRequest(
      config.primary,
      '',
      {
        module: 'proxy',
        action: 'eth_getTransactionReceipt',
        txhash: hash,
        apikey: config.primary.getKey()
      },
      cacheKey,
      CACHE_CONFIG.PRICES_TTL
    );
  }

  /**
   * Get latest block number
   */
  async getLatestBlockNumber(blockchain: 'ethereum' | 'bsc' | 'tron'): Promise<ApiResponse<number>> {
    const cacheKey = this.generateCacheKey('latest-block', { blockchain });

    const config = API_CONFIG.blockExplorers[blockchain];

    return this.makeRequest(
      config.primary,
      '',
      {
        module: 'proxy',
        action: 'eth_blockNumber',
        apikey: config.primary.getKey()
      },
      cacheKey,
      10 * 1000 // 10 seconds cache for latest block
    );
  }

  /**
   * Get service dependencies for health monitoring
   */
  protected getDependencies(): Array<{
    name: string;
    status: 'healthy' | 'unhealthy';
    responseTime: number;
  }> {
    return [
      {
        name: 'Etherscan API',
        status: this.isAvailable() ? 'healthy' : 'unhealthy',
        responseTime: this.metrics.averageLatency
      },
      {
        name: 'BscScan API',
        status: 'healthy',
        responseTime: 0
      },
      {
        name: 'TronScan API',
        status: 'healthy',
        responseTime: 0
      }
    ];
  }

  /**
   * Get service-specific health status
   */
  getServiceHealth(): ServiceHealth {
    const baseHealth = this.getHealth();

    return {
      ...baseHealth,
      dependencies: this.getDependencies()
    };
  }
}

// Export singleton instance
export default new BlockchainService();
