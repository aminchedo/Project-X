import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Table, Image, ChevronDown } from 'lucide-react';

interface ExportMenuProps {
  data: any[];
  onExport?: (format: 'csv' | 'json' | 'pdf') => void;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ data, onExport }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export implementation
      exportData(format);
    }
    setIsOpen(false);
  };

  const exportData = (format: 'csv' | 'json' | 'pdf') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `scan-results-${timestamp}`;

    switch (format) {
      case 'csv':
        exportCSV(filename);
        break;
      case 'json':
        exportJSON(filename);
        break;
      case 'pdf':
        alert('PDF export coming soon!');
        break;
    }
  };

  const exportCSV = (filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportJSON = (filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={data.length === 0}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          data.length === 0
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20'
        }`}
      >
        <Download className="w-4 h-4" />
        <span>Export</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <motion.div
              className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Export Format
                </div>

                {/* CSV Export */}
                <motion.button
                  onClick={() => handleExport('csv')}
                  whileHover={{ x: 4 }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-slate-50 transition-all group"
                >
                  <Table className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left flex-1">
                    <div className="font-medium">CSV</div>
                    <div className="text-xs text-slate-500">Spreadsheet format</div>
                  </div>
                </motion.button>

                {/* JSON Export */}
                <motion.button
                  onClick={() => handleExport('json')}
                  whileHover={{ x: 4 }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-slate-50 transition-all group"
                >
                  <FileText className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left flex-1">
                    <div className="font-medium">JSON</div>
                    <div className="text-xs text-slate-500">Data interchange</div>
                  </div>
                </motion.button>

                {/* PDF Export */}
                <motion.button
                  onClick={() => handleExport('pdf')}
                  whileHover={{ x: 4 }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-slate-50 transition-all group"
                >
                  <Image className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left flex-1">
                    <div className="font-medium">PDF</div>
                    <div className="text-xs text-slate-500">Document format</div>
                  </div>
                </motion.button>
              </div>

              {/* Footer */}
              <div className="px-3 py-2 bg-slate-800/50 border-t border-slate-700">
                <div className="text-xs text-slate-500">
                  {data.length} {data.length === 1 ? 'result' : 'results'} to export
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExportMenu;
