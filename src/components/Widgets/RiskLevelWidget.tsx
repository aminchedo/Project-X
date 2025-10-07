import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { Shield, AlertTriangle } from 'lucide-react';

const RiskLevelWidget: React.FC = () => {
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW');
  const [riskScore, setRiskScore] = useState<number>(0);

  useEffect(() => {
    fetchRiskLevel();
    const interval = setInterval(fetchRiskLevel, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchRiskLevel = async () => {
    try {
      const response = await api.risk.getCurrentRisk();
      setRiskLevel(response.level);
      setRiskScore(response.score);
    } catch (err) {
      console.error('Risk level error:', err);
    }
  };

  const config = {
    LOW: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
    HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
    CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' }
  }[riskLevel];

  return (
    <motion.div
      className={`backdrop-blur-xl border shadow-xl rounded-xl p-6 ${config.bg} ${config.border}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          {riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? (
            <AlertTriangle className={`w-5 h-5 ${config.color}`} />
          ) : (
            <Shield className={`w-5 h-5 ${config.color}`} />
          )}
        </div>
        <h3 className="text-lg font-semibold text-slate-50">Risk Level</h3>
      </div>

      <div className={`text-3xl font-bold mb-2 ${config.color}`}>{riskLevel}</div>

      <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            riskLevel === 'LOW' ? 'bg-green-500' :
            riskLevel === 'MEDIUM' ? 'bg-yellow-500' :
            riskLevel === 'HIGH' ? 'bg-orange-500' :
            'bg-red-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${riskScore}%` }}
          transition={{ duration: 1 }}
        />
      </div>

      <div className="mt-2 text-sm text-slate-400">Risk Score: {riskScore}%</div>
    </motion.div>
  );
};

export default RiskLevelWidget;
