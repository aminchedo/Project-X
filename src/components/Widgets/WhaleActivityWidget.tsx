import React from 'react';
import { Waves, AlertCircle } from 'lucide-react';

interface WhaleActivityWidgetProps {
  selectedSymbol: string;
}

/**
 * WhaleActivityWidget
 *
 * NOTE: This widget is currently disabled because whale data sources
 * (WhaleAlert, Arkham, Nansen) are not enabled in the backend configuration.
 *
 * This component shows a placeholder message until a real data source is connected.
 *
 * IMPORTANT: Do NOT show fake whale scores, buy/sell counts, or activity levels.
 * Only show real data when the backend provides it.
 */
export const WhaleActivityWidget: React.FC<WhaleActivityWidgetProps> = ({ selectedSymbol }) => {

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="badge-metal p-2 rounded-lg">
          <Waves className="w-6 h-6 text-slate-500" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Whale Activity</h3>
          <p className="text-xs text-slate-400">
            {selectedSymbol.replace('USDT', '')} • Data source not configured
          </p>
        </div>
      </div>

      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm mb-2">No whale activity data available</p>
        <p className="text-slate-500 text-xs">
          Whale tracking requires API keys for WhaleAlert, Arkham, or Nansen
        </p>
        <p className="text-slate-500 text-xs mt-1">
          Configure data sources in backend to enable this feature
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="text-center p-3 bg-slate-700/30 rounded-lg opacity-50">
          <div className="text-xs text-slate-400 mb-1">Large Buys</div>
          <div className="text-lg font-semibold text-slate-500">--</div>
        </div>
        <div className="text-center p-3 bg-slate-700/30 rounded-lg opacity-50">
          <div className="text-xs text-slate-400 mb-1">Large Sells</div>
          <div className="text-lg font-semibold text-slate-500">--</div>
        </div>
      </div>
    </div>
  );
};

export default WhaleActivityWidget;

