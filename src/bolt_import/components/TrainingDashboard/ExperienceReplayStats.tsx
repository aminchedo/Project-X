import React from 'react';
import { Database, TrendingUp, Zap, Clock } from 'lucide-react';

interface ExperienceBufferStats {
  total_experiences: number;
  buffer_utilization: number;
  avg_priority: number;
  critical_events_count: number;
  sampling_efficiency: number;
  oldest_experience_age: number;
}

interface ExperienceReplayStatsProps {
  bufferStats: ExperienceBufferStats | null;
  className?: string;
}

const ExperienceReplayStats: React.FC<ExperienceReplayStatsProps> = ({ 
  bufferStats, 
  className = '' 
}) => {
  if (!bufferStats) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <div className="text-lg mb-1">No buffer data available</div>
          <div className="text-sm">Experience replay buffer is empty</div>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number, decimals: number = 0) => {
    if (num >= 1e6) {
      return `${(num / 1e6).toFixed(1)}M`;
    } else if (num >= 1e3) {
      return `${(num / 1e3).toFixed(1)}K`;
    }
    return num.toFixed(decimals);
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    } else {
      return `${Math.round(hours / 24)}d`;
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 0.9) return 'text-red-600 bg-red-50';
    if (utilization >= 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 0.8) return 'text-green-600';
    if (efficiency >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Buffer Overview */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Experiences */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">
              {formatNumber(bufferStats.total_experiences)}
            </span>
          </div>
          <div className="text-sm text-blue-700 font-medium">Total Experiences</div>
          <div className="text-xs text-blue-600 mt-1">
            Stored in circular buffer
          </div>
        </div>

        {/* Buffer Utilization */}
        <div className={`rounded-lg p-4 ${getUtilizationColor(bufferStats.buffer_utilization)}`}>
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-2xl font-bold">
              {(bufferStats.buffer_utilization * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-sm font-medium">Buffer Utilization</div>
          <div className="text-xs mt-1">
            {bufferStats.buffer_utilization >= 0.9 ? 'Nearly full' : 
             bufferStats.buffer_utilization >= 0.7 ? 'Filling up' : 'Available space'}
          </div>
        </div>
      </div>

      {/* Priority & Efficiency Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {/* Average Priority */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <span className="text-2xl font-bold text-purple-600">
              {bufferStats.avg_priority.toFixed(3)}
            </span>
          </div>
          <div className="text-sm text-purple-700 font-medium">Average Priority</div>
          <div className="text-xs text-purple-600 mt-1">
            Prioritized sampling weight
          </div>
        </div>

        {/* Sampling Efficiency */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <span className={`text-2xl font-bold ${getEfficiencyColor(bufferStats.sampling_efficiency)}`}>
              {(bufferStats.sampling_efficiency * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-sm text-gray-700 font-medium">Sampling Efficiency</div>
          <div className="text-xs text-gray-600 mt-1">
            Diversity in sampling
          </div>
        </div>
      </div>

      {/* Critical Events & Age */}
      <div className="grid grid-cols-2 gap-4">
        {/* Critical Events */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-5 h-5 text-orange-600" />
            <span className="text-2xl font-bold text-orange-600">
              {bufferStats.critical_events_count}
            </span>
          </div>
          <div className="text-sm text-orange-700 font-medium">Critical Events</div>
          <div className="text-xs text-orange-600 mt-1">
            High-priority experiences
          </div>
        </div>

        {/* Oldest Experience Age */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span className="text-2xl font-bold text-gray-600">
              {formatDuration(bufferStats.oldest_experience_age)}
            </span>
          </div>
          <div className="text-sm text-gray-700 font-medium">Oldest Experience</div>
          <div className="text-xs text-gray-600 mt-1">
            Data retention time
          </div>
        </div>
      </div>

      {/* Buffer Health Indicator */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800">Buffer Health</h4>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            bufferStats.buffer_utilization > 0.95 ? 'bg-red-100 text-red-700' :
            bufferStats.sampling_efficiency < 0.6 ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {bufferStats.buffer_utilization > 0.95 ? 'Overloaded' :
             bufferStats.sampling_efficiency < 0.6 ? 'Suboptimal' : 'Healthy'}
          </div>
        </div>

        {/* Health Metrics */}
        <div className="space-y-2">
          {/* Utilization Bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Utilization</span>
              <span>{(bufferStats.buffer_utilization * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  bufferStats.buffer_utilization >= 0.9 ? 'bg-red-500' :
                  bufferStats.buffer_utilization >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${bufferStats.buffer_utilization * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Efficiency Bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Efficiency</span>
              <span>{(bufferStats.sampling_efficiency * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  bufferStats.sampling_efficiency >= 0.8 ? 'bg-green-500' :
                  bufferStats.sampling_efficiency >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${bufferStats.sampling_efficiency * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            {bufferStats.buffer_utilization > 0.95 && (
              <div className="text-red-600">⚠️ Buffer nearly full - consider increasing capacity</div>
            )}
            {bufferStats.sampling_efficiency < 0.6 && (
              <div className="text-yellow-600">⚠️ Low sampling diversity - check priority distribution</div>
            )}
            {bufferStats.critical_events_count === 0 && (
              <div className="text-blue-600">ℹ️ No critical events detected recently</div>
            )}
            {bufferStats.buffer_utilization <= 0.95 && bufferStats.sampling_efficiency >= 0.6 && (
              <div className="text-green-600">✓ Buffer operating optimally</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceReplayStats;
