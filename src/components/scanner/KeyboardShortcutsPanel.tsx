import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: ['↑', '↓'], description: 'پیمایش بین نتایج', category: 'پیمایش' },
  { keys: ['Enter'], description: 'باز کردن جزئیات نماد', category: 'پیمایش' },
  { keys: ['Space'], description: 'انتخاب/عدم انتخاب نماد', category: 'پیمایش' },
  { keys: ['Esc'], description: 'پاک کردن فیلترها / بستن مودال', category: 'پیمایش' },
  { keys: ['Tab'], description: 'جابجایی بین کنترل‌ها', category: 'پیمایش' },
  
  // Actions
  { keys: ['Ctrl', 'S'], description: 'اجرای اسکن عمیق', category: 'عملیات' },
  { keys: ['Ctrl', 'Q'], description: 'اجرای اسکن سریع', category: 'عملیات' },
  { keys: ['Ctrl', 'E'], description: 'خروجی گرفتن از نتایج', category: 'عملیات' },
  { keys: ['Ctrl', 'F'], description: 'فوکوس روی جستجو', category: 'عملیات' },
  { keys: ['Ctrl', 'A'], description: 'انتخاب همه نتایج', category: 'عملیات' },
  { keys: ['Ctrl', 'D'], description: 'حذف انتخاب همه', category: 'عملیات' },
  
  // View Modes
  { keys: ['1'], description: 'نمای لیست', category: 'نماها' },
  { keys: ['2'], description: 'نمای شبکه', category: 'نماها' },
  { keys: ['3'], description: 'نمای نمودار', category: 'نماها' },
  
  // Filters
  { keys: ['F'], description: 'باز کردن فیلترهای پیشرفته', category: 'فیلترها' },
  { keys: ['B'], description: 'فقط نمادهای صعودی', category: 'فیلترها' },
  { keys: ['N'], description: 'فقط نمادهای نزولی', category: 'فیلترها' },
  { keys: ['R'], description: 'بازنشانی فیلترها', category: 'فیلترها' },
  
  // Help
  { keys: ['?'], description: 'نمایش این راهنما', category: 'راهنما' },
];

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = Array.from(new Set(SHORTCUTS.map(s => s.category)));

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">میانبرهای صفحه‌کلید</h2>
              <p className="text-sm text-slate-400 mt-1">
                برای افزایش سرعت کار با اسکنر از این میانبرها استفاده کنید
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="بستن"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category) => (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                  {category}
                </h3>
                <div className="space-y-2">
                  {SHORTCUTS.filter(s => s.category === category).map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                    >
                      <span className="text-slate-300 text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <React.Fragment key={i}>
                            <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs font-mono text-white shadow-sm min-w-[2rem] text-center">
                              {key}
                            </kbd>
                            {i < shortcut.keys.length - 1 && (
                              <span className="text-slate-500 text-xs">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
            <h4 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
              💡 نکات
            </h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• برای استفاده از میانبرها، ابتدا مطمئن شوید فوکوس روی صفحه است</li>
              <li>• در نمای لیست، می‌توانید با فلش‌ها بین نتایج حرکت کنید</li>
              <li>• برای انتخاب چند نماد، Space را روی هر کدام بزنید</li>
              <li>• Ctrl+S مانند کلیک روی دکمه "اسکن عمیق" عمل می‌کند</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between bg-slate-900/50">
          <div className="text-xs text-slate-400">
            برای چاپ این راهنما: <kbd className="px-2 py-1 bg-slate-700 rounded text-white">Ctrl+P</kbd>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all"
          >
            فهمیدم!
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsPanel;
