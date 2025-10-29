/**
 * Runtime Configuration
 * 
 * Reads from environment variables set in .env.local
 * Allows same code to run on localhost or VPS by changing these values
 */

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/market';

// Export for convenience
export const config = {
  apiBase: API_BASE,
  wsUrl: WS_URL,
};
