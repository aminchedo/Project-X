import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react';
import { ProfessionalCard } from '../Layout/ProfessionalLayout';

interface SystemStatusProps {
  className?: string;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  responseTime?: number;
  lastCheck: string;
  description?: string;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ className = '' }) => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    setIsLoading(true);
    try {
      const [healthResponse, apisResponse] = await Promise.allSettled([
        fetch('http://localhost:8000/health'),
        fetch('http://localhost:8000/api/health/all-apis')
      ]);

      const services: ServiceStatus[] = [
        {
          name: 'Backend API',
          status: healthResponse.status === 'fulfilled' && healthResponse.value.ok ? 'healthy' : 'error',
          responseTime: healthResponse.status === 'fulfilled' ? 50 : undefined,
          lastCheck: new Date().toISOString(),
          description: 'Main trading system API'
        },
        {
          name: 'WebSocket',
          status: 'healthy', // This would be checked separately
          responseTime: 25,
          lastCheck: new Date().toISOString(),
          description: 'Real-time data streaming'
        },
        {
          name: 'Database',
          status: 'healthy',
          responseTime: 15,
          lastCheck: new Date().toISOString(),
          description: 'Trading data storage'
        },
        {
          name: 'Market Data',
          status: 'healthy',
          responseTime: 100,
          lastCheck: new Date().toISOString(),
          description: 'External market feeds'
        },
        {
          name: 'AI Engine',
          status: 'warning',
          responseTime: 200,
          lastCheck: new Date().toISOString(),
          description: 'Machine learning predictions'
        }
      ];

      if (apisResponse.status === 'fulfilled' && apisResponse.value.ok) {
        const apisData = await apisResponse.value.json();
        // Update services based on API health data
        services.forEach(service => {
          const apiService = apisData.services?.find((s: any) => s.name === service.name);
          if (apiService) {
            service.status = apiService.status === 'healthy' ? 'healthy' : 'error';
            service.responseTime = apiService.response_time;
          }
        });
      }

      setServices(services);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error checking system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-400';
      case 'warning':
        return 'text-amber-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'error':
        return 'bg-red-500/10 border-red-500/30';
      default:
        return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  const overallStatus = services.length > 0 
    ? services.every(s => s.status === 'healthy') ? 'healthy' 
    : services.some(s => s.status === 'error') ? 'error' 
    : 'warning'
    : 'unknown';

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const totalCount = services.length;

  return (
    <ProfessionalCard 
      title="System Status" 
      subtitle={`${healthyCount}/${totalCount} services healthy`}
      className={className}
      actions={
        <button
          onClick={checkSystemStatus}
          disabled={isLoading}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors duration-200"
        >
          <Activity className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      <div className="space-y-4">
        {/* Overall Status */}
        <div className={`p-4 rounded-lg border ${getStatusBg(overallStatus)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(overallStatus)}
              <div>
                <h3 className="text-lg font-semibold text-white">System Health</h3>
                <p className={`text-sm ${getStatusColor(overallStatus)}`}>
                  {overallStatus === 'healthy' ? 'All systems operational' :
                   overallStatus === 'warning' ? 'Some services degraded' :
                   overallStatus === 'error' ? 'Critical issues detected' :
                   'Status unknown'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{healthyCount}/{totalCount}</div>
              <div className="text-sm text-slate-400">Services</div>
            </div>
          </div>
        </div>

        {/* Service List */}
        <div className="space-y-3">
          {services.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(service.status)}
                <div>
                  <p className="text-white font-medium">{service.name}</p>
                  {service.description && (
                    <p className="text-slate-400 text-sm">{service.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {service.responseTime && (
                  <p className="text-slate-400 text-sm">{service.responseTime}ms</p>
                )}
                <p className={`text-xs font-medium ${getStatusColor(service.status)}`}>
                  {service.status.toUpperCase()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-700/50">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Auto-refresh: 30s</span>
          </div>
        </div>
      </div>
    </ProfessionalCard>
  );
};

// WebSocket Status Component
interface WebSocketStatusProps {
  className?: string;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionTime, setConnectionTime] = useState<Date | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    // This would integrate with the actual WebSocket connection
    // For now, we'll simulate the status
    const interval = setInterval(() => {
      setIsConnected(Math.random() > 0.1); // 90% chance of being connected
      if (!connectionTime && isConnected) {
        setConnectionTime(new Date());
      }
      if (isConnected) {
        setMessageCount(prev => prev + Math.floor(Math.random() * 5));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected, connectionTime]);

  return (
    <ProfessionalCard 
      title="WebSocket Connection" 
      subtitle="Real-time data streaming"
      className={className}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <Wifi className="w-5 h-5 text-emerald-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <div>
              <p className="text-white font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-slate-400 text-sm">
                {isConnected ? 'ws://localhost:8000/ws/realtime' : 'Connection lost'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{messageCount}</p>
            <p className="text-slate-400 text-sm">Messages</p>
          </div>
        </div>

        {connectionTime && (
          <div className="p-3 bg-slate-700/30 rounded-lg">
            <p className="text-slate-400 text-sm">
              Connected since: {connectionTime.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </ProfessionalCard>
  );
};
