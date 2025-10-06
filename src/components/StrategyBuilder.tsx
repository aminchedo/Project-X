import React, { useState } from 'react';
import { Save, RotateCcw, CheckCircle } from 'lucide-react';
import { useWeights, useRules, useStoreActions } from '../state/hooks';
import { api } from '../services/api';
import WeightSliders from './showcase/WeightSliders';
import RulesConfig from './showcase/RulesConfig';

export const StrategyBuilder: React.FC = () => {
  const { weights, setWeights } = useWeights();
  const { rules, setRules } = useRules();
  const { reset } = useStoreActions();
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Try to save to backend
      try {
        await api.trading.updateWeights(weights);
        setSaveMessage('✓ تنظیمات با موفقیت ذخیره شد');
      } catch (backendError) {
        console.warn('Backend save failed, falling back to localStorage:', backendError);
        setSaveMessage('✓ تنظیمات در مرورگر ذخیره شد (سرور در دسترس نیست)');
      }

      // Always persist to localStorage as backup
      localStorage.setItem('strategy_config', JSON.stringify({ weights, rules }));
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Save failed:', error);
      setSaveMessage('✗ خطا در ذخیره تنظیمات');
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('آیا از بازنشانی تنظیمات به حالت پیش‌فرض اطمینان دارید؟')) {
      reset();
      setSaveMessage('✓ تنظیمات به حالت پیش‌فرض بازگشتند');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">سازنده استراتژی</h2>
          <p className="text-slate-400 text-sm">
            تنظیم وزن دتکتورها و قوانین اسکن بازار
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>بازنشانی</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              isSaving
                ? 'bg-slate-600 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 hover:shadow-lg hover:shadow-cyan-500/25'
            } text-white`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}</span>
          </button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg border flex items-center gap-2 ${
          saveMessage.includes('✓')
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {saveMessage.includes('✓') && <CheckCircle className="w-5 h-5" />}
          <span className="font-medium">{saveMessage}</span>
        </div>
      )}

      {/* Detector Weights Section */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-2">وزن دتکتورها</h3>
          <p className="text-sm text-slate-400">
            مجموع وزن‌ها باید ۱۰۰٪ باشد. تغییرات به صورت خودکار نرمال‌سازی می‌شوند.
          </p>
        </div>
        <WeightSliders weights={weights} onChange={setWeights} />
      </div>

      {/* Scan Rules Section */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-2">قوانین اسکن</h3>
          <p className="text-sm text-slate-400">
            تعیین آستانه‌های امتیازدهی و حالت معاملاتی
          </p>
        </div>
        <RulesConfig rules={rules} onChange={setRules} />
      </div>

      {/* Info Card */}
      <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50">
        <h4 className="text-lg font-semibold text-white mb-3">💡 نکات مهم</h4>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">•</span>
            <span>تغییرات به صورت لحظه‌ای در اسکنر بازار اعمال می‌شوند</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">•</span>
            <span>حالت تهاجمی: ریسک بیشتر، فرصت‌های بیشتر</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">•</span>
            <span>حالت محافظه‌کارانه: ریسک کمتر، دقت بالاتر</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">•</span>
            <span>تنظیمات در مرورگر ذخیره می‌شوند و در سرور (در صورت دسترسی)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400 font-bold">•</span>
            <span>با دکمه بازنشانی می‌توانید به تنظیمات پیش‌فرض برگردید</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StrategyBuilder;
