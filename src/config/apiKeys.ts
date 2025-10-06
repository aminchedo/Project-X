// API Keys configuration from api.txt file
export const API_KEYS = {
  // Block Explorer APIs
  TRONSCAN_KEY: '7ae72726-bffe-4e74-9c33-97b761eeea21',
  BSCSCAN_KEY: 'K62RKHGXTDCG53RU4MCG6XABIMJKTN19IT',
  ETHERSCAN_KEY: 'SZHYFZK2RR8H9TIMJBVW54V4H81K2Z2KR2',
  ETHERSCAN_KEY_2: 'T6IR8VJHX2NE6ZJW2S3FDVN1TYG4PYYI45',

  // Market Data APIs
  COINMARKETCAP_KEY: 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c',
  CRYPTOCOMPARE_KEY: 'e79c8e6d4c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f',

  // News APIs
  NEWSAPI_KEY: 'pub_346789abc123def456789ghi012345jkl',

  // Development settings
  NODE_ENV: 'development',
  API_BASE_URL: 'http://localhost:8000',
  WS_URL: 'ws://localhost:8000/ws'
};

// API Configuration with actual keys
export const API_CONFIG = {
  // Block Explorer APIs
  tronscan: {
    baseUrl: 'https://api.tronscan.org/api',
    key: API_KEYS.TRONSCAN_KEY
  },
  bscscan: {
    baseUrl: 'https://api.bscscan.com/api',
    key: API_KEYS.BSCSCAN_KEY
  },
  etherscan: {
    baseUrl: 'https://api.etherscan.io/api',
    key: API_KEYS.ETHERSCAN_KEY,
    backupKey: API_KEYS.ETHERSCAN_KEY_2
  },

  // Market Data APIs
  coinmarketcap: {
    baseUrl: 'https://pro-api.coinmarketcap.com/v1',
    key: API_KEYS.COINMARKETCAP_KEY,
    headers: {
      'X-CMC_PRO_API_KEY': API_KEYS.COINMARKETCAP_KEY
    }
  },
  cryptocompare: {
    baseUrl: 'https://min-api.cryptocompare.com/data',
    key: API_KEYS.CRYPTOCOMPARE_KEY
  },
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    key: '' // No key required
  },

  // News APIs
  newsapi: {
    baseUrl: 'https://newsapi.org/v2',
    key: API_KEYS.NEWSAPI_KEY
  },

  // Sentiment APIs
  alternative_me: {
    baseUrl: 'https://api.alternative.me/fng',
    key: '' // No key required
  },

  // Whale Tracking
  whalealert: {
    baseUrl: 'https://api.whale-alert.io/v1',
    key: '' // Would need actual key
  }
};

// Helper function to get API key
export const getApiKey = (service: string): string => {
  return API_KEYS[service as keyof typeof API_KEYS] || '';
};

// Helper function to get API config
export const getApiConfig = (service: string) => {
  return API_CONFIG[service as keyof typeof API_CONFIG];
};
