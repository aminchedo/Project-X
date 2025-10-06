import React from 'react';

interface Pattern {
  name: string;
  type: 'harmonic' | 'chart' | 'candlestick' | 'smc';
  strength: number; // 0-1
  emoji: string;
}

interface PatternBadgesProps {
  patterns?: Pattern[];
  maxShow?: number;
}

const PatternBadges: React.FC<PatternBadgesProps> = ({ patterns = [], maxShow = 3 }) => {
  if (!patterns || patterns.length === 0) return null;

  const typeColors = {
    harmonic: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300',
    chart: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300',
    candlestick: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300',
    smc: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-300',
  };

  const visiblePatterns = patterns.slice(0, maxShow);
  const hiddenCount = Math.max(0, patterns.length - maxShow);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visiblePatterns.map((pattern, index) => (
        <div
          key={index}
          className={`
            inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border
            bg-gradient-to-r ${typeColors[pattern.type]}
            transition-all hover:scale-105
          `}
          title={`${pattern.name} - قدرت: ${(pattern.strength * 100).toFixed(0)}%`}
        >
          <span>{pattern.emoji}</span>
          <span>{pattern.name}</span>
          {pattern.strength > 0.8 && (
            <span className="text-xs opacity-75">★</span>
          )}
        </div>
      ))}
      
      {hiddenCount > 0 && (
        <span 
          className="px-2 py-1 bg-slate-700/30 border border-slate-600/30 text-slate-400 rounded-md text-xs"
          title={`${hiddenCount} الگوی دیگر`}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};

export default PatternBadges;

// Mock data generator for testing (remove in production)
export const generateMockPatterns = (): Pattern[] => {
  const allPatterns = [
    { name: 'Bat', type: 'harmonic' as const, strength: 0.92, emoji: '🦇' },
    { name: 'Gartley', type: 'harmonic' as const, strength: 0.85, emoji: '🎯' },
    { name: 'Butterfly', type: 'harmonic' as const, strength: 0.78, emoji: '🦋' },
    { name: 'H&S', type: 'chart' as const, strength: 0.88, emoji: '👤' },
    { name: 'Triangle', type: 'chart' as const, strength: 0.75, emoji: '📐' },
    { name: 'Doji', type: 'candlestick' as const, strength: 0.82, emoji: '🕯️' },
    { name: 'Hammer', type: 'candlestick' as const, strength: 0.90, emoji: '🔨' },
    { name: 'Engulfing', type: 'candlestick' as const, strength: 0.86, emoji: '📊' },
    { name: 'Order Block', type: 'smc' as const, strength: 0.95, emoji: '🧱' },
    { name: 'FVG', type: 'smc' as const, strength: 0.88, emoji: '📍' },
    { name: 'BOS', type: 'smc' as const, strength: 0.91, emoji: '⚡' },
  ];
  
  // Randomly select 2-5 patterns
  const count = Math.floor(Math.random() * 4) + 2;
  const shuffled = [...allPatterns].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
