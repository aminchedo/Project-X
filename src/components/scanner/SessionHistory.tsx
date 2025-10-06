import React, { useState, useEffect } from 'react';
import { History, Clock, X, Pin, Trash2 } from 'lucide-react';

interface ScanSession {
  id: string;
  timestamp: string;
  symbols: string[];
  timeframes: string[];
  resultsCount: number;
  topResults: { symbol: string; score: number }[];
  isPinned: boolean;
}

interface SessionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (session: ScanSession) => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ isOpen, onClose, onRestore }) => {
  const [sessions, setSessions] = useState<ScanSession[]>([]);

  // Load sessions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('scanner_session_history');
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load session history:', error);
      }
    }
  }, [isOpen]);

  const saveSessions = (updatedSessions: ScanSession[]) => {
    // Keep only last 50 sessions
    const limited = updatedSessions.slice(0, 50);
    localStorage.setItem('scanner_session_history', JSON.stringify(limited));
    setSessions(limited);
  };

  const handleTogglePin = (id: string) => {
    const updated = sessions.map(s => 
      s.id === id ? { ...s, isPinned: !s.isPinned } : s
    );
    // Sort: pinned first
    updated.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    saveSessions(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('آیا مطمئن هستید که می‌خواهید این جلسه را حذف کنید؟')) {
      saveSessions(sessions.filter(s => s.id !== id));
    }
  };

  const handleClearAll = () => {
    if (confirm('آیا مطمئن هستید که می‌خواهید تمام تاریخچه را پاک کنید؟')) {
      localStorage.removeItem('scanner_session_history');
      setSessions([]);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'همین الان';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} روز پیش`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">تاریخچه اسکن‌ها</h2>
              <p className="text-sm text-slate-400 mt-1">
                {sessions.length} جلسه ذخیره شده
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-2 text-sm bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                پاک کردن همه
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="بستن"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">
                هنوز هیچ اسکنی انجام نشده
              </h3>
              <p className="text-sm text-slate-500">
                اسکن‌های شما به صورت خودکار در اینجا ذخیره می‌شوند
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`
                    bg-slate-900/50 border rounded-xl p-4 transition-all hover:border-slate-600/50
                    ${session.isPinned ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-slate-700/50'}
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {session.isPinned && (
                          <Pin className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        )}
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400">
                          {formatTimeAgo(session.timestamp)}
                        </span>
                        <span className="text-xs text-slate-500">
                          • {new Date(session.timestamp).toLocaleString('fa-IR')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">نمادها:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {session.symbols.slice(0, 5).map((symbol) => (
                              <span
                                key={symbol}
                                className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded text-xs"
                              >
                                {symbol}
                              </span>
                            ))}
                            {session.symbols.length > 5 && (
                              <span className="px-2 py-0.5 text-slate-400 text-xs">
                                +{session.symbols.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-slate-400">بازه‌ها:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {session.timeframes.map((tf) => (
                              <span
                                key={tf}
                                className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded text-xs font-mono"
                              >
                                {tf}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {session.topResults.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                          <span className="text-xs text-slate-400 mb-2 block">
                            نتایج برتر ({session.resultsCount} فرصت):
                          </span>
                          <div className="flex gap-3">
                            {session.topResults.map((result) => (
                              <div
                                key={result.symbol}
                                className="flex items-center gap-2 text-xs"
                              >
                                <span className="text-slate-300 font-medium">
                                  {result.symbol}
                                </span>
                                <span className="text-emerald-400 font-mono">
                                  {(result.score * 100).toFixed(0)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleTogglePin(session.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          session.isPinned
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                        }`}
                        title={session.isPinned ? 'حذف پین' : 'پین کردن'}
                      >
                        <Pin className={`w-4 h-4 ${session.isPinned ? 'fill-current' : ''}`} />
                      </button>
                      
                      <button
                        onClick={() => {
                          onRestore(session);
                          onClose();
                        }}
                        className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/30 transition-colors whitespace-nowrap"
                      >
                        بازیابی
                      </button>
                      
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>تاریخچه به صورت خودکار ذخیره می‌شود (حداکثر ۵۰ جلسه)</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;

// Helper function to add a session (call this after successful scan)
export const addScanSession = (
  symbols: string[],
  timeframes: string[],
  results: any[]
) => {
  const stored = localStorage.getItem('scanner_session_history');
  const sessions: ScanSession[] = stored ? JSON.parse(stored) : [];
  
  const newSession: ScanSession = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    symbols,
    timeframes,
    resultsCount: results.length,
    topResults: results
      .sort((a, b) => (b.score || b.final_score || 0) - (a.score || a.final_score || 0))
      .slice(0, 3)
      .map(r => ({
        symbol: r.symbol,
        score: r.score || r.final_score || 0
      })),
    isPinned: false
  };
  
  sessions.unshift(newSession);
  localStorage.setItem('scanner_session_history', JSON.stringify(sessions.slice(0, 50)));
};
