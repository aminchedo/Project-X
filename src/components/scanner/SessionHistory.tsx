import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import {
  History,
  Clock,
  TrendingUp,
  TrendingDown,
  Search,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  Filter
} from 'lucide-react';

interface ScanSession {
  id: string;
  name: string;
  created_at: string;
  symbols_scanned: number;
  signals_found: number;
  best_result: {
    symbol: string;
    score: number;
    direction: 'bullish' | 'bearish' | 'neutral';
  };
  filters_used: string[];
  duration: number;
}

interface SessionHistoryProps {
  onLoadSession?: (sessionId: string) => void;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ onLoadSession }) => {
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'signals' | 'symbols'>('date');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.scanner.getSessionHistory();
      setSessions(response || []);
    } catch (err) {
      setError('Failed to load session history');
      console.error('Session history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Delete this scan session?')) return;
    
    try {
      await api.scanner.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Delete session error:', err);
    }
  };

  const handleExportSession = async (session: ScanSession) => {
    try {
      const data = JSON.stringify(session, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-session-${session.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const filteredSessions = sessions
    .filter(session =>
      session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.best_result?.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'signals':
          return b.signals_found - a.signals_found;
        case 'symbols':
          return b.symbols_scanned - a.symbols_scanned;
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  if (loading) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading session history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchSessions}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Scan History</h2>
            <p className="text-sm text-slate-400">{sessions.length} saved sessions</p>
          </div>
        </div>

        <motion.button
          onClick={fetchSessions}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </motion.div>

      {/* Search and Sort */}
      <motion.div
        className="flex gap-4 flex-wrap"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sessions..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:border-cyan-500 focus:outline-none"
        >
          <option value="date">Sort by Date</option>
          <option value="signals">Sort by Signals</option>
          <option value="symbols">Sort by Symbols</option>
        </select>
      </motion.div>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <History className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">No Sessions Found</h3>
          <p className="text-slate-400">
            {searchTerm ? 'Try adjusting your search' : 'Run a scan to create your first session'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredSessions.map((session, index) => {
              const directionConfig = session.best_result?.direction === 'bullish'
                ? { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' }
                : session.best_result?.direction === 'bearish'
                ? { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' }
                : { icon: TrendingUp, color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' };
              
              const Icon = directionConfig.icon;

              return (
                <motion.div
                  key={session.id}
                  className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/10 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  {/* Header */}
                  <div className="p-6 border-b border-slate-800">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-50 mb-2">{session.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock size={14} />
                          <span>{new Date(session.created_at).toLocaleString()}</span>
                          <span>•</span>
                          <span>{session.duration}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Best Result */}
                    {session.best_result && (
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${directionConfig.bg} border ${directionConfig.border}`}>
                        <Icon className={`w-5 h-5 ${directionConfig.color}`} />
                        <div className="flex-1">
                          <div className="text-sm text-slate-400">Best Result</div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-50">{session.best_result.symbol}</span>
                            <span className={`text-lg font-bold ${directionConfig.color}`}>
                              {session.best_result.score.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-800">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Symbols Scanned</div>
                      <div className="text-2xl font-bold text-slate-50">{session.symbols_scanned}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Signals Found</div>
                      <div className="text-2xl font-bold text-cyan-400">{session.signals_found}</div>
                    </div>
                  </div>

                  {/* Filters */}
                  {session.filters_used && session.filters_used.length > 0 && (
                    <div className="p-6 border-b border-slate-800">
                      <div className="text-sm text-slate-400 mb-2">Filters Applied</div>
                      <div className="flex flex-wrap gap-2">
                        {session.filters_used.map((filter, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded text-xs"
                          >
                            {filter}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-4 flex gap-2">
                    <motion.button
                      onClick={() => onLoadSession?.(session.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-all"
                    >
                      <Eye size={16} />
                      <span>Load</span>
                    </motion.button>

                    <motion.button
                      onClick={() => handleExportSession(session)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all"
                    >
                      <Download size={16} />
                    </motion.button>

                    <motion.button
                      onClick={() => handleDeleteSession(session.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// Export function to add scan sessions
export const addScanSession = async (sessionData: Partial<ScanSession>) => {
  try {
    const response = await api.scanner.saveSession(sessionData);
    return response;
  } catch (error) {
    console.error('Failed to save scan session:', error);
    throw error;
  }
};

export default SessionHistory;
