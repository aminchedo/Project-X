import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Brain, Target } from 'lucide-react';

interface PredictionData {
  bullish_probability: number;
  bearish_probability: number;
  neutral_probability: number;
  confidence: number;
  prediction: 'BULL' | 'BEAR' | 'NEUTRAL';
  uncertainty: number;
  timestamp: string;
}

interface PredictionPanelProps {
  symbol: string;
  className?: string;
}

const PredictionPanel: React.FC<PredictionPanelProps> = ({ symbol, className = '' }) => {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/predictions/${symbol}`);
        if (!response.ok) {
          throw new Error('Failed to fetch prediction');
        }
        const data = await response.json();
        setPrediction(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
    const interval = setInterval(fetchPrediction, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [symbol]);

  const getPredictionIcon = (predictionType: string) => {
    switch (predictionType) {
      case 'BULL':
        return <TrendingUp className="w-6 h-6 text-green-500" />;
      case 'BEAR':
        return <TrendingDown className="w-6 h-6 text-red-500" />;
      case 'NEUTRAL':
        return <Minus className="w-6 h-6 text-gray-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getPredictionColor = (predictionType: string) => {
    switch (predictionType) {
      case 'BULL':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'BEAR':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'NEUTRAL':
        return 'text-gray-500 bg-gray-50 border-gray-200';
      default:
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">AI Prediction</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-3"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">AI Prediction</h3>
        </div>
        <div className="text-center py-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">AI Prediction</h3>
        </div>
        <p className="text-gray-500 text-center">No prediction data available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">AI Prediction</h3>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(prediction.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Main Prediction */}
      <div className={`flex items-center justify-center p-4 rounded-lg border-2 mb-4 ${getPredictionColor(prediction.prediction)}`}>
        {getPredictionIcon(prediction.prediction)}
        <span className="ml-2 text-xl font-bold">{prediction.prediction}</span>
      </div>

      {/* Confidence Meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Confidence</span>
          <span className={`text-sm font-bold ${getConfidenceColor(prediction.confidence)}`}>
            {formatPercentage(prediction.confidence)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              prediction.confidence >= 0.8 ? 'bg-green-500' :
              prediction.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${prediction.confidence * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Probability Distribution */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center">
          <Target className="w-4 h-4 mr-1" />
          Probability Distribution
        </h4>
        
        {/* Bullish Probability */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-700">Bullish</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${prediction.bullish_probability * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700 w-12 text-right">
              {formatPercentage(prediction.bullish_probability)}
            </span>
          </div>
        </div>

        {/* Bearish Probability */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-700">Bearish</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 bg-red-500 rounded-full"
                style={{ width: `${prediction.bearish_probability * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700 w-12 text-right">
              {formatPercentage(prediction.bearish_probability)}
            </span>
          </div>
        </div>

        {/* Neutral Probability */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Minus className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Neutral</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 bg-gray-500 rounded-full"
                style={{ width: `${prediction.neutral_probability * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700 w-12 text-right">
              {formatPercentage(prediction.neutral_probability)}
            </span>
          </div>
        </div>
      </div>

      {/* Uncertainty Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Model Uncertainty</span>
          <span className="text-xs font-medium text-gray-700">
            {formatPercentage(prediction.uncertainty)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
          <div
            className="h-1 bg-orange-400 rounded-full"
            style={{ width: `${prediction.uncertainty * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          ⚠️ Not financial advice. AI predictions for informational purposes only.
        </p>
      </div>
    </div>
  );
};

export default PredictionPanel;
