import React from 'react';
import { useAssetStore } from '../../stores/assetStore';
import { SentimentWidget, WhalesWidget, NewsWidget } from '../Widgets/DynamicWidgets';
import { DollarSign, TrendingUp, PieChart, Shield } from 'lucide-react';

export function OverviewPage() {
  const { selectedSymbol } = useAssetStore();

  const mockMetrics = [
    {
      title: 'Portfolio Value',
      value: '$125,750.50',
      change: 2.31,
      changeLabel: '24h',
      icon: DollarSign,
      color: 'success',
      trend: 'up'
    },
    {
      title: 'Active Signals',
      value: '6',
      change: 12.5,
      changeLabel: '1h',
      icon: TrendingUp,
      color: 'primary',
      trend: 'up'
    },
    {
      title: 'Win Rate',
      value: '68.9%',
      change: -2.1,
      changeLabel: '7d',
      icon: PieChart,
      color: 'warning',
      trend: 'down'
    },
    {
      title: 'Risk Score',
      value: '6.8/10',
      change: 0.5,
      changeLabel: '1h',
      icon: Shield,
      color: 'info',
      trend: 'up'
    }
  ];

  return (
    <>
      {/* Key Metrics */}
      <section className="cards">
        {mockMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="card-title">{metric.title}</div>
                  <div className="card-value">{metric.value}</div>
                  {metric.change !== undefined && (
                    <div className={`flex items-center space-x-1 text-sm mt-2 ${
                      metric.trend === 'up' ? 'kpi-up' :
                      metric.trend === 'down' ? 'kpi-down' :
                      'text-slate-400'
                    }`}>
                      <span>{metric.change >= 0 ? '+' : ''}{metric.change}%</span>
                      {metric.changeLabel && <span className="text-slate-500">({metric.changeLabel})</span>}
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${
                  metric.color === 'primary' ? 'bg-gradient-to-br from-pink-500/20 to-pink-600/10' :
                  metric.color === 'success' ? 'bg-gradient-to-br from-emerald-500/20 to-green-600/10' :
                  metric.color === 'warning' ? 'bg-gradient-to-br from-amber-500/20 to-yellow-600/10' :
                  'bg-gradient-to-br from-blue-500/20 to-indigo-600/10'
                }`}>
                  <Icon className={`w-6 h-6 icon-metal`} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Dynamic Widgets */}
      <section className="section-grid">
        <SentimentWidget />
        <WhalesWidget />
        <NewsWidget />
      </section>
    </>
  );
}
