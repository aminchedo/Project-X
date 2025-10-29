import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff, Activity, Database, Brain, Shield } from 'lucide-react';
import { api } from '../services/api';
import { realtimeWs } from '../services/websocket';

interface IntegrationStatusProps {
  isBackendConnected: boolean;
  backendStatus?: any;
}

interface ServiceStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  icon: React.ComponentType<any>;
  description: string;
  lastCheck?: Date;
}

const IntegrationStatus: React.FC<IntegrationStatusProps> = ({ isBackendConnected, backendStatus }) => {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Backend API',
      status: 'disconnected',
      icon: Database,
      description: 'Main trading system backend'
    },
    {
      name: 'WebSocket',
      status: 'disconnected',
      icon: Wifi,
      description: 'Real-time data streaming'
    },
    {
      name: 'AI Analytics',
      status: 'disconnected',
      icon: Brain,
      description: 'Machine learning predictions'
    },
    {
      name: 'Risk Management',
      status: 'disconnected',
      icon: Shield,
      description: 'Portfolio risk controls'
    }
  ]);

  const [overallStatus, setOverallStatus] = useState<'healthy' | 'degraded' | 'offline'>('offline');

  useEffect(() => {
    updateServiceStatus();
    const interval = setInterval(updateServiceStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [isBackendConnected, backendStatus]);

  const updateServiceStatus = async () => {
    const updatedServices = [...services];

    // Check Backend API
    try {
      const health = await api.get('/health');
      updatedServices[0] = {
        ...updatedServices[0],
        status: 'connected',
        lastCheck: new Date()
      };
    } catch (error) {
      updatedServices[0] = {
        ...updatedServices[0],
        status: 'disconnected',
        lastCheck: new Date()
      };
    }

    // Check WebSocket
    const wsState = realtimeWs.getState();
    updatedServices[1] = {
      ...updatedServices[1],
      status: wsState === 'connected' ? 'connected' : 'disconnected',
      lastCheck: new Date()
    };

    // Check AI Analytics (if backend is connected)
    if (isBackendConnected) {
      try {
        await api.trading.getPhase3Status();
        updatedServices[2] = {
          ...updatedServices[2],
          status: 'connected',
          lastCheck: new Date()
        };
      } catch (error) {
        updatedServices[2] = {
          ...updatedServices[2],
          status: 'error',
          lastCheck: new Date()
        };
      }
    } else {
      updatedServices[2] = {
        ...updatedServices[2],
        status: 'disconnected',
        lastCheck: new Date()
      };
    }

    // Check Risk Management
    if (isBackendConnected) {
      try {
        await api.trading.getRiskMetrics();
        updatedServices[3] = {
          ...updatedServices[3],
          status: 'connected',
          lastCheck: new Date()
        };
      } catch (error) {
        updatedServices[3] = {
          ...updatedServices[3],
          status: 'error',
          lastCheck: new Date()
        };
      }
    } else {
      updatedServices[3] = {
        ...updatedServices[3],
        status: 'disconnected',
        lastCheck: new Date()
      };
    }

    setServices(updatedServices);

    // Calculate overall status
    const connectedCount = updatedServices.filter(s => s.status === 'connected').length;
    const totalCount = updatedServices.length;
    
    if (connectedCount === totalCount) {
      setOverallStatus('healthy');
    } else if (connectedCount > 0) {
      setOverallStatus('degraded');
    } else {
      setOverallStatus('offline');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-emerald-400';
      case 'error': return 'text-amber-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return CheckCircle;
      case 'error': return AlertTriangle;
      case 'disconnected': return XCircle;
      default: return Activity;
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'healthy': return 'text-emerald-400';
      case 'degraded': return 'text-amber-400';
      case 'offline': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Integration Status
          </h3>
          <p className="text-sm text-slate-400">Frontend-Backend Cooperation</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
          overallStatus === 'healthy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
          overallStatus === 'degraded' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
          'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            overallStatus === 'healthy' ? 'bg-emerald-400' :
            overallStatus === 'degraded' ? 'bg-amber-400 animate-pulse' :
            'bg-red-400'
          }`} />
          <span className="capitalize">{overallStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service, index) => {
          const StatusIcon = getStatusIcon(service.status);
          const ServiceIcon = service.icon;
          
          return (
            <div key={index} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-700/50 rounded-lg">
                    <ServiceIcon className="w-4 h-4 text-slate-300" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{service.name}</h4>
                    <p className="text-xs text-slate-400">{service.description}</p>
                  </div>
                </div>
                <StatusIcon className={`w-5 h-5 ${getStatusColor(service.status)}`} />
              </div>
              
              {service.lastCheck && (
                <div className="text-xs text-slate-500">
                  Last check: {service.lastCheck.toLocaleTimeString()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Backend Status Details */}
      {backendStatus && (
        <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <h4 className="text-sm font-semibold text-white mb-3">Backend Details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Version:</span>
              <span className="text-white ml-2">{backendStatus.version || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400">Active Signals:</span>
              <span className="text-white ml-2">{backendStatus.active_signals || 0}</span>
            </div>
            <div>
              <span className="text-slate-400">WebSocket Connections:</span>
              <span className="text-white ml-2">{backendStatus.websocket_connections || 0}</span>
            </div>
            <div>
              <span className="text-slate-400">Data Source:</span>
              <span className="text-white ml-2">{backendStatus.data_source || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Integration Tips */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <h4 className="text-sm font-semibold text-blue-400 mb-2">💡 Integration Tips</h4>
        <ul className="text-xs text-slate-300 space-y-1">
          <li>• All services connected = Full functionality with real-time data</li>
          <li>• Partial connection = Limited features, some data may be cached</li>
          <li>• Offline mode = Frontend-only with mock data for demonstration</li>
          <li>• WebSocket enables real-time updates and live trading signals</li>
        </ul>
      </div>
    </div>
  );
};

export default IntegrationStatus;
