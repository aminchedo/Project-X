import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Save } from 'lucide-react';

interface ScanButtonsProps {
  isScanning: boolean;
  onScan: () => void;
  onStopScan: () => void;
  onReset: () => void;
  onSavePreset?: () => void;
  disabled?: boolean;
}

const ScanButtons: React.FC<ScanButtonsProps> = ({
  isScanning,
  onScan,
  onStopScan,
  onReset,
  onSavePreset,
  disabled = false
}) => {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Main Scan Button */}
      {!isScanning ? (
        <motion.button
          onClick={onScan}
          disabled={disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
            disabled
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/25'
          }`}
        >
          <Play className="w-5 h-5" />
          <span>Run Scan</span>
        </motion.button>
      ) : (
        <motion.button
          onClick={onStopScan}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/25"
        >
          <Pause className="w-5 h-5" />
          <span>Stop Scan</span>
        </motion.button>
      )}

      {/* Reset Button */}
      <motion.button
        onClick={onReset}
        disabled={disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <RotateCcw className="w-5 h-5" />
      </motion.button>

      {/* Save Preset Button */}
      {onSavePreset && (
        <motion.button
          onClick={onSavePreset}
          disabled={disabled}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          <span className="hidden sm:inline">Save Preset</span>
        </motion.button>
      )}
    </div>
  );
};

export default ScanButtons;
