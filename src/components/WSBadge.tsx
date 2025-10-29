import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export const WSBadge: React.FC = () => {
  // Read connection status from ZUSTAND store (managed by LiveDataContext)
  const { connectionStatus } = useAppStore();

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
    connecting: {
      label: 'Connecting...',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      icon: Wifi
    },
    reconnecting: {
      label: 'Reconnecting...',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      icon: Wifi
    },
    error: {
      label: 'Error',
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      icon: WifiOff
    }
  };

  const config = statusConfig[connectionStatus] || statusConfig.disconnected;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} border ${config.borderColor}`}>
      <Icon className={`w-4 h-4 ${config.color} ${connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'animate-pulse' : ''}`} />
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    </div>
  );
};

export default WSBadge;
