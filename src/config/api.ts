const isDevelopment = import.meta.env.MODE === 'development';

export const API_CONFIG = {
  BASE_URL: isDevelopment 
    ? 'http://localhost:8000' 
    : import.meta.env.VITE_API_URL || '/api',
  WS_URL: isDevelopment
    ? 'ws://localhost:8000/ws'
    : import.meta.env.VITE_WS_URL || '/ws'
};

export default API_CONFIG;
