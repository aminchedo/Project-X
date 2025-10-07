import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Table, Check, X } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'json' | 'pdf', options: any) => void;
  title?: string;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ 
  isOpen, 
  onClose, 
  onExport,
  title = 'Export Data'
}) => {
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [options, setOptions] = useState({
    includeHeaders: true,
    dateFormat: 'iso',
    includeMetadata: false
  });

  const handleExport = () => {
    onExport(format, options);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-xl font-bold text-slate-50">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-3 block">
                  Select Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'csv', label: 'CSV', icon: Table },
                    { value: 'json', label: 'JSON', icon: FileText },
                    { value: 'pdf', label: 'PDF', icon: FileText }
                  ].map((fmt) => {
                    const Icon = fmt.icon;
                    return (
                      <button
                        key={fmt.value}
                        onClick={() => setFormat(fmt.value as any)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          format === fmt.value
                            ? 'border-cyan-500 bg-cyan-500/20'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${
                          format === fmt.value ? 'text-cyan-400' : 'text-slate-400'
                        }`} />
                        <div className={`text-sm font-medium ${
                          format === fmt.value ? 'text-cyan-400' : 'text-slate-300'
                        }`}>
                          {fmt.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300 block">
                  Export Options
                </label>

                {Object.entries(options).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                    <span className="text-slate-300 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    {typeof value === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
                        className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                      />
                    ) : (
                      <select
                        value={value}
                        onChange={(e) => setOptions({ ...options, [key]: e.target.value })}
                        className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-slate-50 text-sm focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="iso">ISO 8601</option>
                        <option value="us">US Format</option>
                        <option value="eu">EU Format</option>
                      </select>
                    )}
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/20"
                >
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExportDialog;
