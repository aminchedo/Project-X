import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { connectWs } from '../services/websocket';

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

interface WSBadgeProps {
  endpoint?: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export const WSBadge: React.FC<WSBadgeProps> = ({ 
  endpoint = '/ws/realtime',
  autoReconnect = true,
  reconnectDelay = 2000
}) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const connect = () => {
      try {
        // Clean up previous connection
        if (wsRef.current) {
          wsRef.current.close();
        }

        const ws = connectWs(
          endpoint,
          (event) => {
            // Handle incoming messages
            try {
              const data = JSON.parse(event.data);
              console.log('WS message:', data);
            } catch (error) {
              console.error('Failed to parse WS message:', error);
            }
          },
          { autoReconnect: false } // We handle reconnection manually
        );

        ws.addEventListener('open', () => {
          console.log('WebSocket connected');
          setStatus('connected');
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        });

        ws.addEventListener('close', () => {
          console.log('WebSocket disconnected');
          setStatus('disconnected');
          
          if (autoReconnect) {
            setStatus('reconnecting');
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectDelay);
          }
        });

        ws.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
          setStatus('disconnected');
        });

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setStatus('disconnected');
        
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      }
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [endpoint, autoReconnect, reconnectDelay]);

  const statusConfig = {
    connected: {
      label: 'Connected',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      icon: Wifi
    },
    disconnected: {
      label: 'Disconnected',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      icon: WifiOff
    },
    reconnecting: {
      label: 'Connecting...',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      icon: Wifi
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} border ${config.borderColor}`}>
      <Icon className={`w-4 h-4 ${config.color} ${status === 'reconnecting' ? 'animate-pulse' : ''}`} />
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
};

export default WSBadge;
