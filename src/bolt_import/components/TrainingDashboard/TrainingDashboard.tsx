import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Database,
  Zap,
  Target,
  Clock,
  BarChart3,
  LineChart
} from 'lucide-react';
import MetricsChart from './MetricsChart';
import GradientNormChart from './GradientNormChart';
import ExperienceReplayStats from './ExperienceReplayStats';
import InstabilityTimeline from './InstabilityTimeline';

interface TrainingMetrics {
  epoch: number;
  loss: number;
  val_loss: number;
  accuracy: number;
  val_accuracy: number;
  r2_score: number;
  val_r2_score: number;
  mse: number;
  mae: number;
  directional_accuracy: number;
  learning_rate: number;
  gradient_norm: number;
  timestamp: string;
}

interface TrainingStatus {
  is_training: boolean;
  current_epoch: number;
  max_epochs: number;
  stage: string;
  model_version: string;
  training_time: number;
  samples_processed: number;
  instability_events: number;
  last_checkpoint: string;
}

interface InstabilityEvent {
  timestamp: string;
  type: 'nan_loss' | 'gradient_spike' | 'loss_spike' | 'validation_collapse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recovery_action: string;
  epoch: number;
}

interface ExperienceBufferStats {
  total_experiences: number;
  buffer_utilization: number;
  avg_priority: number;
  critical_events_count: number;
  sampling_efficiency: number;
  oldest_experience_age: number;
}

const TrainingDashboard: React.FC = () => {
  const [trainingMetrics, setTrainingMetrics] = useState<TrainingMetrics[]>([]);
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null);
  const [instabilityEvents, setInstabilityEvents] = useState<InstabilityEvent[]>([]);
  const [bufferStats, setBufferStats] = useState<ExperienceBufferStats | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('loss');
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchTrainingData, 2000); // Update every 2 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const fetchTrainingData = async () => {
    try {
      const [metricsRes, statusRes, eventsRes, bufferRes] = await Promise.all([
        fetch(`/api/training/metrics?range=${timeRange}`),
        fetch('/api/training/status'),
        fetch('/api/training/instability-events'),
        fetch('/api/training/buffer-stats')
      ]);

      if (metricsRes.ok) {
        const metrics = await metricsRes.json();
        setTrainingMetrics(metrics);
      }

      if (statusRes.ok) {
        const status = await statusRes.json();
        setTrainingStatus(status);
      }

      if (eventsRes.ok) {
        const events = await eventsRes.json();
        setInstabilityEvents(events);
      }

      if (bufferRes.ok) {
        const buffer = await bufferRes.json();
        setBufferStats(buffer);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch training data:', error);
      setLoading(false);
    }
  };

  const handleTrainingControl = async (action: 'start' | 'pause' | 'stop' | 'reset') => {
    try {
      const response = await fetch(`/api/training/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        fetchTrainingData(); // Refresh data after action
      }
    } catch (error) {
      console.error(`Failed to ${action} training:`, error);
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-gray-600';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number, decimals: number = 4) => {
    return num.toFixed(decimals);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Brain className="w-8 h-8 mr-3 text-blue-600" />
            Training Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Real-time neural network training monitoring</p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
            <span className="text-sm">Auto Refresh</span>
          </button>

          {/* Training Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleTrainingControl(trainingStatus?.is_training ? 'pause' : 'start')}
              className={`p-2 rounded-lg transition-colors ${
                trainingStatus?.is_training
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              title={trainingStatus?.is_training ? 'Pause Training' : 'Start Training'}
            >
              {trainingStatus?.is_training ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => handleTrainingControl('stop')}
              className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
              title="Stop Training"
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleTrainingControl('reset')}
              className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Reset Training"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Training Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Training Status</h3>
            <div className={`flex items-center space-x-1 ${getStatusColor(trainingStatus?.is_training || false)}`}>
              {getStatusIcon(trainingStatus?.is_training || false)}
              <span className="text-sm font-medium">
                {trainingStatus?.is_training ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Epoch</span>
              <span className="font-semibold">
                {trainingStatus?.current_epoch || 0} / {trainingStatus?.max_epochs || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Stage</span>
              <span className="font-semibold">{trainingStatus?.stage || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration</span>
              <span className="font-semibold">
                {formatDuration(trainingStatus?.training_time || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Samples</span>
              <span className="font-semibold">
                {(trainingStatus?.samples_processed || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Current Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Current Metrics</h3>
          </div>
          <div className="space-y-2">
            {trainingMetrics.length > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loss</span>
                  <span className="font-semibold">
                    {formatNumber(trainingMetrics[trainingMetrics.length - 1].loss)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Val Loss</span>
                  <span className="font-semibold">
                    {formatNumber(trainingMetrics[trainingMetrics.length - 1].val_loss)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accuracy</span>
                  <span className="font-semibold">
                    {formatNumber(trainingMetrics[trainingMetrics.length - 1].accuracy * 100, 2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">R² Score</span>
                  <span className="font-semibold">
                    {formatNumber(trainingMetrics[trainingMetrics.length - 1].r2_score)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stability Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-800">Stability</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Instability Events</span>
              <span className={`font-semibold ${
                (trainingStatus?.instability_events || 0) > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {trainingStatus?.instability_events || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gradient Norm</span>
              <span className="font-semibold">
                {trainingMetrics.length > 0 
                  ? formatNumber(trainingMetrics[trainingMetrics.length - 1].gradient_norm)
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Learning Rate</span>
              <span className="font-semibold">
                {trainingMetrics.length > 0 
                  ? trainingMetrics[trainingMetrics.length - 1].learning_rate.toExponential(2)
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Checkpoint</span>
              <span className="font-semibold text-xs">
                {trainingStatus?.last_checkpoint 
                  ? new Date(trainingStatus.last_checkpoint).toLocaleTimeString()
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Experience Buffer */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">Experience Buffer</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Experiences</span>
              <span className="font-semibold">
                {bufferStats?.total_experiences.toLocaleString() || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Utilization</span>
              <span className="font-semibold">
                {bufferStats ? `${(bufferStats.buffer_utilization * 100).toFixed(1)}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Priority</span>
              <span className="font-semibold">
                {bufferStats ? formatNumber(bufferStats.avg_priority) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Critical Events</span>
              <span className="font-semibold text-orange-600">
                {bufferStats?.critical_events_count || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Training Metrics Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <LineChart className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">Training Metrics</h3>
            </div>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="loss">Loss</option>
              <option value="accuracy">Accuracy</option>
              <option value="r2_score">R² Score</option>
              <option value="directional_accuracy">Directional Accuracy</option>
            </select>
          </div>
          <MetricsChart 
            data={trainingMetrics} 
            metric={selectedMetric}
            className="h-80"
          />
        </div>

        {/* Gradient Norm Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Gradient Norm</h3>
          </div>
          <GradientNormChart 
            data={trainingMetrics}
            className="h-80"
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Experience Replay Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">Experience Replay Statistics</h3>
          </div>
          <ExperienceReplayStats 
            bufferStats={bufferStats}
            className="h-64"
          />
        </div>

        {/* Instability Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800">Instability Events</h3>
          </div>
          <InstabilityTimeline 
            events={instabilityEvents}
            className="h-64"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Training Data</span>
            </div>
            <span>Model Version: {trainingStatus?.model_version || 'N/A'}</span>
            <span>Last Update: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="text-right">
            <p>Auto-refresh: {autoRefresh ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingDashboard;
