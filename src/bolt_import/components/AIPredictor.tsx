import React, { useState, useEffect } from 'react';
import { PredictionData } from '../types';
import { useFeature } from '../contexts/FeatureFlagContext';
import { Brain, Target, TrendingUp, TrendingDown, Minus, AlertTriangle, Lock } from 'lucide-react';

interface AIPredictorProps {
  predictions: Record<string, PredictionData>;
}

export const AIPredictor: React.FC<AIPredictorProps> = ({ predictions }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const isAIPredictionsEnabled = useFeature('ai-predictions');
  const isAdvancedChartsEnabled = useFeature('advanced-charts');
  const isAIOptimizationEnabled = useFeature('ai-optimization');
  
  const currentPrediction = predictions[selectedSymbol];
  const symbols = Object.keys(predictions);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 0.2) return 'text-green-400';
    if (risk <= 0.3) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'BULL': return <TrendingUp className="text-green-400" size={24} />;
      case 'BEAR': return <TrendingDown className="text-red-400" size={24} />;
      default: return <Minus className="text-gray-400" size={24} />;
    }
  };

  // Show disabled state if AI predictions are not enabled
  if (!isAIPredictionsEnabled) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="text-gray-500" size={28} />
            <h3 className="text-xl font-bold text-gray-400">AI Predictions</h3>
            <Lock className="text-gray-500" size={16} />
          </div>
        </div>
        
        <div className="text-center text-gray-500 py-8">
          <Lock size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">AI Predictions Disabled</p>
          <p className="text-sm">This feature is currently disabled. Enable it in the feature flags to access AI-powered predictions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="text-blue-400" size={28} />
          <h3 className="text-xl font-bold text-white">AI Predictions</h3>
          {isAIOptimizationEnabled && (
            <div className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              Optimized
            </div>
          )}
        </div>
        
        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        >
          {symbols.map(symbol => (
            <option key={symbol} value={symbol}>{symbol}</option>
          ))}
        </select>
      </div>

      {currentPrediction ? (
        <div className="space-y-6">
          {/* Main Prediction */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              {getPredictionIcon(currentPrediction.prediction)}
              <div>
                <div className="text-2xl font-bold text-white">
                  {currentPrediction.prediction}
                </div>
                <div className={`text-lg font-semibold ${getConfidenceColor(currentPrediction.confidence)}`}>
                  {(currentPrediction.confidence * 100).toFixed(1)}% Confidence
                </div>
              </div>
            </div>
          </div>

          {/* Probability Distribution */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-white mb-3">Probability Distribution</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-green-400 font-medium">Bullish</span>
                <span className="text-white">{(currentPrediction.bullishProbability * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${currentPrediction.bullishProbability * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-red-400 font-medium">Bearish</span>
                <span className="text-white">{(currentPrediction.bearishProbability * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-red-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${currentPrediction.bearishProbability * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Neutral</span>
                <span className="text-white">{(currentPrediction.neutralProbability * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gray-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${currentPrediction.neutralProbability * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={20} className="text-yellow-400" />
                <span className="text-white font-semibold">Risk Assessment</span>
              </div>
              <span className={`font-bold ${getRiskColor(currentPrediction.riskScore)}`}>
                {(currentPrediction.riskScore * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  currentPrediction.riskScore <= 0.2 ? 'bg-green-400' :
                  currentPrediction.riskScore <= 0.3 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${currentPrediction.riskScore * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Trading Signal */}
          <div className={`p-4 rounded-lg border-2 ${
            currentPrediction.prediction === 'BULL' ? 'bg-green-900/20 border-green-500' :
            currentPrediction.prediction === 'BEAR' ? 'bg-red-900/20 border-red-500' :
            'bg-gray-800 border-gray-600'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white mb-1">Trading Signal</div>
                <div className="text-sm text-gray-400">
                  Based on current market conditions and AI analysis
                </div>
              </div>
              <div className={`text-right ${
                currentPrediction.prediction === 'BULL' ? 'text-green-400' :
                currentPrediction.prediction === 'BEAR' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                <div className="font-bold text-lg">
                  {currentPrediction.prediction === 'BULL' ? 'LONG' :
                   currentPrediction.prediction === 'BEAR' ? 'SHORT' : 'HOLD'}
                </div>
                <div className="text-xs">
                  {new Date(currentPrediction.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          <Target size={48} className="mx-auto mb-4 opacity-50" />
          <p>Waiting for AI predictions...</p>
        </div>
      )}
    </div>
  );
};