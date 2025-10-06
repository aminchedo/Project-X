import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Star, Trash2, Download, Upload } from 'lucide-react';

interface Preset {
  id: string;
  name: string;
  symbols: string[];
  timeframes: string[];
  isFavorite?: boolean;
  createdAt: string;
}

interface PresetDropdownProps {
  symbols: string[];
  timeframes: string[];
  onLoad: (preset: Preset) => void;
}

const PresetDropdown: React.FC<PresetDropdownProps> = ({ symbols, timeframes, onLoad }) => {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [makeFavorite, setMakeFavorite] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('scanner_presets');
    if (stored) {
      try {
        setPresets(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load presets:', error);
      }
    }
  }, []);

  // Save presets to localStorage
  const savePresetsToStorage = (updatedPresets: Preset[]) => {
    localStorage.setItem('scanner_presets', JSON.stringify(updatedPresets));
    setPresets(updatedPresets);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: Preset = {
      id: Date.now().toString(),
      name: presetName,
      symbols,
      timeframes,
      isFavorite: makeFavorite,
      createdAt: new Date().toISOString(),
    };

    savePresetsToStorage([...presets, newPreset]);
    setShowSaveModal(false);
    setPresetName('');
    setMakeFavorite(false);
  };

  const handleDeletePreset = (id: string) => {
    if (confirm('آیا مطمئن هستید که می‌خواهید این پیش‌تنظیم را حذف کنید؟')) {
      savePresetsToStorage(presets.filter(p => p.id !== id));
    }
  };

  const handleToggleFavorite = (id: string) => {
    savePresetsToStorage(
      presets.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)
    );
  };

  const handleExportPresets = () => {
    const dataStr = JSON.stringify(presets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scanner-presets-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPresets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          savePresetsToStorage([...presets, ...imported]);
        }
      } catch (error) {
        alert('فایل نامعتبر است');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700/70 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors font-medium"
        >
          <FolderOpen className="w-4 h-4" />
          <span>پیش‌تنظیم‌ها</span>
        </button>

        {showMenu && (
          <div className="absolute left-0 top-full mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-20 overflow-hidden">
            {/* Save Current */}
            <button
              onClick={() => {
                setShowSaveModal(true);
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-right hover:bg-slate-700/50 text-slate-300 transition-colors border-b border-slate-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-cyan-400" />
              <span>ذخیره تنظیمات فعلی...</span>
            </button>

            {/* Presets List */}
            {presets.length > 0 && (
              <div className="max-h-64 overflow-y-auto border-b border-slate-700">
                {presets
                  .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
                  .map((preset) => (
                    <div
                      key={preset.id}
                      className="px-4 py-3 hover:bg-slate-700/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <button
                          onClick={() => {
                            onLoad(preset);
                            setShowMenu(false);
                          }}
                          className="flex-1 text-right"
                        >
                          <div className="flex items-center gap-2">
                            {preset.isFavorite && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                            <span className="text-slate-200 font-medium">{preset.name}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {preset.symbols.length} نماد • {preset.timeframes.length} بازه
                          </div>
                        </button>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(preset.id);
                            }}
                            className="p-1 hover:bg-slate-600 rounded"
                          >
                            <Star className={`w-3 h-3 ${preset.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePreset(preset.id);
                            }}
                            className="p-1 hover:bg-red-500/20 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Import/Export */}
            <div className="p-2 flex gap-2">
              <button
                onClick={handleExportPresets}
                className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded text-sm flex items-center justify-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>خروجی</span>
              </button>
              <label className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded text-sm flex items-center justify-center gap-1 transition-colors cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>ورودی</span>
                <input
                  id="import-presets"
                  name="import-presets"
                  type="file"
                  accept=".json"
                  onChange={handleImportPresets}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">ذخیره پیش‌تنظیم جدید</h3>
            
            <div className="space-y-2">
              <label htmlFor="preset-name" className="block text-sm font-medium text-slate-300">
                نام پیش‌تنظیم
              </label>
              <input
                id="preset-name"
                name="preset-name"
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="مثال: معاملات روزانه"
                autoFocus
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="makeFavorite"
                checked={makeFavorite}
                onChange={(e) => setMakeFavorite(e.target.checked)}
                className="w-4 h-4 accent-yellow-500"
              />
              <label htmlFor="makeFavorite" className="text-sm text-slate-300">
                علامت‌گذاری به عنوان محبوب
              </label>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ذخیره
              </button>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setPresetName('');
                  setMakeFavorite(false);
                }}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PresetDropdown;
