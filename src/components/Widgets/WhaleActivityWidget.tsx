import React, { useState, useEffect } from 'react';
import { Waves } from 'lucide-react';

interface WhaleActivityWidgetProps {
  selectedSymbol: string;
}

interface WhaleData {
  score: number;
  activity: string;
  largeBuys: number;
  largeSells: number;
}

const MOCK_WHALE_DATA: Record<string, WhaleData> = {
  BTCUSDT: {
    score: 8.5,
    activity: 'High Activity',
    largeBuys: 12,
    largeSells: 8,
  },
  ETHUSDT: {
    score: 7.8,
    activity: 'Moderate Activity',
    largeBuys: 15,
    largeSells: 10,
  },
  BNBUSDT: {
    score: 6.2,
    activity: 'Low Activity',
    largeBuys: 5,
    largeSells: 7,
  },
  DEFAULT: {
    score: 5.0,
    activity: 'Low Activity',
    largeBuys: 3,
    largeSells: 4,
  },
};

export const WhaleActivityWidget: React.FC<WhaleActivityWidgetProps> = ({ selectedSymbol }) => {
  const [whaleData, setWhaleData] = useState<WhaleData>(MOCK_WHALE_DATA.DEFAULT);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => {
      const data = MOCK_WHALE_DATA[selectedSymbol] || MOCK_WHALE_DATA.DEFAULT;
      setWhaleData(data);
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 450);

    return () => clearTimeout(timeout);
  }, [selectedSymbol]);

  const scorePercentage = (whaleData.score / 10) * 100;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="badge-metal p-2 rounded-lg">
            <Waves className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Whale Activity</h3>
            <p className="text-xs text-slate-400">
              {selectedSymbol.replace('USDT', '')} • Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">{whaleData.score.toFixed(1)}/10</div>
          <div className="text-xs text-slate-400">{whaleData.activity}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="widget-loading">
          <div className="animate-pulse h-3 bg-slate-700/50 rounded-full"></div>
        </div>
      ) : (
        <>
          <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full shadow-lg transition-all duration-500"
              style={{ width: `${scorePercentage}%` }}
              role="progressbar"
              aria-valuenow={whaleData.score}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-label={`Whale activity score: ${whaleData.score} out of 10`}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Large Buys</div>
              <div className="text-lg font-semibold text-emerald-400">{whaleData.largeBuys}</div>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Large Sells</div>
              <div className="text-lg font-semibold text-red-400">{whaleData.largeSells}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WhaleActivityWidget;

