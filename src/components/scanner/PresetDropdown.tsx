import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, ChevronDown, Star, Trash2, Edit } from 'lucide-react';

interface ScanPreset {
  id: string;
  name: string;
  description: string;
  symbols: string[];
  timeframes: string[];
  filters: any;
  isFavorite?: boolean;
}

interface PresetDropdownProps {
  presets: ScanPreset[];
  selectedPreset?: string;
  onSelectPreset: (preset: ScanPreset) => void;
  onDeletePreset?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

const PresetDropdown: React.FC<PresetDropdownProps> = ({
  presets,
  selectedPreset,
  onSelectPreset,
  onDeletePreset,
  onToggleFavorite
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentPreset = presets.find(p => p.id === selectedPreset);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-xl font-medium transition-all"
      >
        <div className="flex items-center gap-3">
          <Bookmark className="w-5 h-5 text-purple-400" />
          <div className="text-left">
            <div className="font-semibold">{currentPreset?.name || 'Select Preset'}</div>
            {currentPreset && (
              <div className="text-xs text-slate-400">{currentPreset.description}</div>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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

            {/* Dropdown */}
            <motion.div
              className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20 max-h-96 overflow-y-auto"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Saved Presets ({presets.length})
                </div>

                {presets.length === 0 ? (
                  <div className="px-3 py-8 text-center text-slate-400">
                    <Bookmark className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm">No saved presets</p>
                    <p className="text-xs text-slate-500 mt-1">Save your first preset to get started</p>
                  </div>
                ) : (
                  presets.map((preset) => (
                    <motion.div
                      key={preset.id}
                      className={`group rounded-lg transition-all ${
                        selectedPreset === preset.id
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : 'hover:bg-slate-800'
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      <button
                        onClick={() => {
                          onSelectPreset(preset);
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-3 py-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-50">{preset.name}</span>
                              {preset.isFavorite && (
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mb-2">{preset.description}</p>
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                                {preset.symbols.length} symbols
                              </span>
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                                {preset.timeframes.length} timeframes
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onToggleFavorite && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFavorite(preset.id);
                                }}
                                className="p-1 hover:bg-slate-700 rounded"
                              >
                                <Star className={`w-4 h-4 ${preset.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'}`} />
                              </button>
                            )}
                            {onDeletePreset && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete preset "${preset.name}"?`)) {
                                    onDeletePreset(preset.id);
                                  }
                                }}
                                className="p-1 hover:bg-red-500/20 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PresetDropdown;
