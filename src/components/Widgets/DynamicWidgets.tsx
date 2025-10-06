import React from 'react';
import { useAssetStore, useSymbolFetch } from '../../stores/assetStore';
import { Brain, Waves, Newspaper, Loader2, AlertCircle } from 'lucide-react';

interface WidgetFrameProps {
  title: string;
  loading: boolean;
  error: string | null;
  data: any;
  children?: React.ReactNode;
}

function WidgetFrame({ title, loading, error, data, children }: WidgetFrameProps) {
  if (loading) {
    return (
      <div className="card">
        <div className="widget-loading">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Loading {title}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="widget-error">
          <AlertCircle className="w-6 h-6" />
          <p>Error loading {title}</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <div className="widget-empty">
          <p>No data available for {title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">{title}</div>
      {children}
    </div>
  );
}

export function SentimentWidget() {
  const symbol = useAssetStore(s => s.selectedSymbol);
  const { data, loading, error } = useSymbolFetch<any>("/api/sentiment", symbol);

  return (
    <WidgetFrame title={`Sentiment — ${symbol ?? "Select Asset"}`} loading={loading} error={error} data={data}>
      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-300 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/25">
                      <Brain className="w-6 h-6 text-white icon-metal" />
                    </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Sentiment Score</h3>
                <p className="text-sm text-slate-400">Market mood analysis</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-pink-400">{data.score.toFixed(1)}/10</div>
              <div className="text-xs text-slate-400 capitalize">{data.trend}</div>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-pink-400 to-pink-600 h-3 rounded-full shadow-lg" 
              style={{ width: `${(data.score / 10) * 100}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Social Volume</div>
              <div className="text-lg font-semibold text-emerald-400">+{data.socialVolume.toFixed(0)}%</div>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">News Sentiment</div>
              <div className="text-lg font-semibold text-emerald-400 capitalize">{data.newsSentiment}</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      )}
    </WidgetFrame>
  );
}

export function WhalesWidget() {
  const symbol = useAssetStore(s => s.selectedSymbol);
  const { data, loading, error } = useSymbolFetch<any>("/api/whales", symbol);

  return (
    <WidgetFrame title={`Whales — ${symbol ?? "Select Asset"}`} loading={loading} error={error} data={data}>
      {data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-300 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <Waves className="w-6 h-6 text-white icon-metal" />
                    </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Whale Activity</h3>
                <p className="text-sm text-slate-400">Large transaction analysis</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">{data.score.toFixed(1)}/10</div>
              <div className="text-xs text-slate-400">High Activity</div>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full shadow-lg" 
              style={{ width: `${(data.score / 10) * 100}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Large Buys</div>
              <div className="text-lg font-semibold text-emerald-400">{data.largeBuys}</div>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Large Sells</div>
              <div className="text-lg font-semibold text-red-400">{data.largeSells}</div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      )}
    </WidgetFrame>
  );
}

export function NewsWidget() {
  const symbol = useAssetStore(s => s.selectedSymbol);
  const { data, loading, error } = useSymbolFetch<any>("/api/news", symbol);

  return (
    <WidgetFrame title={`News — ${symbol ?? "Select Asset"}`} loading={loading} error={error} data={data}>
      {data && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-300 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Newspaper className="w-6 h-6 text-white icon-metal" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Latest News</h3>
              <p className="text-sm text-slate-400">Market updates for {symbol}</p>
            </div>
          </div>
          <div className="space-y-3">
            {data.articles.map((article: any, index: number) => (
              <div key={index} className="p-4 bg-gradient-to-r from-slate-700/30 to-slate-600/20 rounded-xl border border-slate-600/30">
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    article.sentiment === 'positive' ? 'bg-emerald-400' : 
                    article.sentiment === 'negative' ? 'bg-red-400' : 'bg-amber-400'
                  }`}></div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">{article.title}</h4>
                    <p className="text-slate-300 text-sm mb-2">{article.summary}</p>
                    <div className="text-xs text-slate-400">
                      {new Date(article.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetFrame>
  );
}
