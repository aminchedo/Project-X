import React, { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import { PredictionData, CorrelationData, MarketDepthData } from '../types';
import ScoreGauge from './showcase/ScoreGauge';
import DirectionPill from './showcase/DirectionPill';
import ConfidenceGauge from './showcase/ConfidenceGauge';
import ComponentBreakdown from './showcase/ComponentBreakdown';
import SimpleHeatmap from './showcase/SimpleHeatmap';
import MarketDepthBars from './showcase/MarketDepthBars';
import Loading from './Loading';
import ErrorBlock from './ErrorBlock';

interface SignalDetailsProps {
  symbol: string;
  onBack: () => void;
}

export const SignalDetails: React.FC<SignalDetailsProps> = ({ symbol, onBack }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationData | null>(null);
  const [marketDepth, setMarketDepth] = useState<MarketDepthData | null>(null);

  useEffect(() => {
    loadData();
  }, [symbol]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load all data in parallel
      const [predictionRes, correlationRes, depthRes] = await Promise.allSettled([
        api.get<PredictionData>(`/api/analytics/predictions/${symbol}`),
        api.get<CorrelationData>('/api/analytics/correlations'),
        api.get<MarketDepthData>(`/api/analytics/market-depth/${symbol}`)
      ]);

      // Handle prediction
      if (predictionRes.status === 'fulfilled') {
        setPrediction(predictionRes.value);
      } else {
        console.warn('Failed to load prediction:', predictionRes.reason);
      }

      // Handle correlation
      if (correlationRes.status === 'fulfilled') {
        setCorrelation(correlationRes.value);
      } else {
        console.warn('Failed to load correlation:', correlationRes.reason);
      }

      // Handle market depth
      if (depthRes.status === 'fulfilled') {
        setMarketDepth(depthRes.value);
      } else {
        console.warn('Failed to load market depth:', depthRes.reason);
      }

      // Only error if ALL requests failed
      if (
        predictionRes.status === 'rejected' &&
        correlationRes.status === 'rejected' &&
        depthRes.status === 'rejected'
      ) {
        throw new Error('خطا در بارگذاری اطلاعات');
      }

    } catch (err: any) {
      console.error('Signal details error:', err);
      setError(err.message || 'خطا در بارگذاری جزئیات سیگنال');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-lg transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت</span>
          </button>
          <h2 className="text-2xl font-bold text-white">{symbol}</h2>
        </div>
        <Loading message="در حال بارگذاری جزئیات سیگنال..." />
      </div>
    );
  }

  if (error && !prediction) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-lg transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت</span>
          </button>
          <h2 className="text-2xl font-bold text-white">{symbol}</h2>
        </div>
        <ErrorBlock message={error} onRetry={loadData} />
      </div>
    );
  }

  const score = prediction?.combined_score?.final_score ?? 0;
  const direction = prediction?.combined_score?.direction ?? 'NEUTRAL';
  const confidence = prediction?.confidence ?? prediction?.combined_score?.confidence ?? 0;
  const components = prediction?.component_scores ?? prediction?.combined_score?.components ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-lg transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت</span>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{symbol}</h2>
            <p className="text-sm text-slate-400">تحلیل کامل سیگنال</p>
          </div>
        </div>
        <DirectionPill direction={direction} size="md" />
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score Gauge */}
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-sm font-medium text-slate-400 mb-4">امتیاز نهایی</h3>
          <div className="flex items-center justify-center py-4">
            <ScoreGauge score={score} size="lg" showLabel={false} />
          </div>
          {prediction?.combined_score?.advice && (
            <p className="text-center text-sm text-slate-300 mt-4">
              {prediction.combined_score.advice}
            </p>
          )}
        </div>

        {/* Confidence */}
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-sm font-medium text-slate-400 mb-4">اطمینان سیگنال</h3>
          <ConfidenceGauge confidence={confidence} size="md" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            {prediction?.combined_score?.bull_mass !== undefined && (
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">توده صعودی</div>
                <div className="text-lg font-bold text-emerald-400">
                  {(prediction.combined_score.bull_mass * 100).toFixed(0)}%
                </div>
              </div>
            )}
            {prediction?.combined_score?.bear_mass !== undefined && (
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">توده نزولی</div>
                <div className="text-lg font-bold text-red-400">
                  {(prediction.combined_score.bear_mass * 100).toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 animate-pulse"></div>
            تحلیل اجزای سیگنال
          </h3>
          <span className="text-sm text-slate-400">{components.length} دتکتور</span>
        </div>
        <ComponentBreakdown components={components} />
      </div>

      {/* Market Depth */}
      {marketDepth && (
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            عمق بازار
          </h3>
          <MarketDepthBars data={marketDepth} />
        </div>
      )}

      {/* Correlation Heatmap */}
      {correlation && (
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-bold text-white mb-4">ماتریس همبستگی دارایی‌ها</h3>
          <SimpleHeatmap data={correlation} />
        </div>
      )}

      {/* Placeholder sections for future data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sentiment */}
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-bold text-white mb-4">احساسات بازار</h3>
          <div className="text-center text-slate-400 py-8">
            <p className="text-sm">داده‌های احساسات بازار به زودی...</p>
          </div>
        </div>

        {/* News */}
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-lg font-bold text-white mb-4">اخبار مرتبط</h3>
          <div className="text-center text-slate-400 py-8">
            <p className="text-sm">اخبار و تحلیل‌ها به زودی...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalDetails;
