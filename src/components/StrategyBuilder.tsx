import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  Plus, 
  X, 
  Save, 
  Play,
  TestTube,
  ChevronDown,
  ChevronRight,
  Code,
  Trash2
} from 'lucide-react';

interface StrategyCondition {
  id: string;
  indicator: string;
  operator: string;
  value: number;
}

interface StrategyRule {
  id: string;
  name: string;
  conditions: StrategyCondition[];
  action: 'BUY' | 'SELL' | 'HOLD';
}

interface Strategy {
  name: string;
  description: string;
  rules: StrategyRule[];
}

const StrategyBuilder: React.FC = () => {
  const [strategy, setStrategy] = useState<Strategy>({
    name: 'My Strategy',
    description: 'Custom trading strategy',
    rules: []
  });
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const indicators = [
    { value: 'rsi', label: 'RSI', type: 'oscillator' },
    { value: 'macd', label: 'MACD', type: 'momentum' },
    { value: 'ema_20', label: 'EMA 20', type: 'moving_average' },
    { value: 'ema_50', label: 'EMA 50', type: 'moving_average' },
    { value: 'volume', label: 'Volume', type: 'volume' },
    { value: 'atr', label: 'ATR', type: 'volatility' },
  ];

  const operators = [
    { value: '>', label: 'Greater than (>)' },
    { value: '<', label: 'Less than (<)' },
    { value: '==', label: 'Equal to (==)' },
    { value: '>=', label: 'Greater or equal (>=)' },
    { value: '<=', label: 'Less or equal (<=)' },
    { value: 'crosses_above', label: 'Crosses Above' },
    { value: 'crosses_below', label: 'Crosses Below' },
  ];

  const addRule = () => {
    const newRule: StrategyRule = {
      id: `rule-${Date.now()}`,
      name: `Rule ${strategy.rules.length + 1}`,
      conditions: [],
      action: 'BUY'
    };
    setStrategy({ ...strategy, rules: [...strategy.rules, newRule] });
    setExpandedRule(newRule.id);
  };

  const removeRule = (ruleId: string) => {
    setStrategy({
      ...strategy,
      rules: strategy.rules.filter(r => r.id !== ruleId)
    });
  };

  const addCondition = (ruleId: string) => {
    const newCondition: StrategyCondition = {
      id: `cond-${Date.now()}`,
      indicator: 'rsi',
      operator: '>',
      value: 50
    };
    
    setStrategy({
      ...strategy,
      rules: strategy.rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, conditions: [...rule.conditions, newCondition] }
          : rule
      )
    });
  };

  const removeCondition = (ruleId: string, conditionId: string) => {
    setStrategy({
      ...strategy,
      rules: strategy.rules.map(rule =>
        rule.id === ruleId
          ? { ...rule, conditions: rule.conditions.filter(c => c.id !== conditionId) }
          : rule
      )
    });
  };

  const updateCondition = (ruleId: string, conditionId: string, field: string, value: any) => {
    setStrategy({
      ...strategy,
      rules: strategy.rules.map(rule =>
        rule.id === ruleId
          ? {
              ...rule,
              conditions: rule.conditions.map(c =>
                c.id === conditionId ? { ...c, [field]: value } : c
              )
            }
          : rule
      )
    });
  };

  const updateRuleAction = (ruleId: string, action: 'BUY' | 'SELL' | 'HOLD') => {
    setStrategy({
      ...strategy,
      rules: strategy.rules.map(rule =>
        rule.id === ruleId ? { ...rule, action } : rule
      )
    });
  };

  const exportStrategy = () => {
    const json = JSON.stringify(strategy, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${strategy.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600">
            <Sliders className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Strategy Builder</h2>
            <p className="text-sm text-slate-400">Build custom trading strategies</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <motion.button
            onClick={exportStrategy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 rounded-lg font-medium"
          >
            <Code className="w-4 h-4" />
            Export JSON
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/20"
          >
            <Save className="w-4 h-4" />
            Save
          </motion.button>
        </div>
      </motion.div>

      {/* Strategy Info */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Strategy Name</label>
            <input
              id="strategy-name"
              name="strategy-name"
              type="text"
              value={strategy.name}
              onChange={(e) => setStrategy({ ...strategy, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <input
              id="strategy-description"
              name="strategy-description"
              type="text"
              value={strategy.description}
              onChange={(e) => setStrategy({ ...strategy, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </motion.div>

      {/* Rules */}
      <div className="space-y-4">
        {strategy.rules.map((rule, ruleIndex) => (
          <motion.div
            key={rule.id}
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + ruleIndex * 0.1 }}
          >
            {/* Rule Header */}
            <div 
              className="flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors"
              onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
            >
              <div className="flex items-center gap-3">
                {expandedRule === rule.id ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
                <input
                  id={`rule-name-${rule.id}`}
                  name={`rule-name-${rule.id}`}
                  type="text"
                  value={rule.name}
                  onChange={(e) => {
                    e.stopPropagation();
                    setStrategy({
                      ...strategy,
                      rules: strategy.rules.map(r => r.id === rule.id ? { ...r, name: e.target.value } : r)
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border-none text-slate-50 font-semibold focus:outline-none"
                />
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  rule.action === 'BUY' ? 'bg-green-500/20 text-green-400' :
                  rule.action === 'SELL' ? 'bg-red-500/20 text-red-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {rule.action}
                </span>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeRule(rule.id);
                }}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>

            {/* Rule Content */}
            <AnimatePresence>
              {expandedRule === rule.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    {/* Action Selector */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Action</label>
                      <div className="flex gap-2">
                        {(['BUY', 'SELL', 'HOLD'] as const).map(action => (
                          <button
                            key={action}
                            onClick={() => updateRuleAction(rule.id, action)}
                            className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                              rule.action === action
                                ? action === 'BUY' ? 'bg-green-500 text-white' :
                                  action === 'SELL' ? 'bg-red-500 text-white' :
                                  'bg-slate-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Conditions */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-slate-300">
                          Conditions ({rule.conditions.length})
                        </label>
                        <button
                          onClick={() => addCondition(rule.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400 rounded-lg text-sm font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          Add Condition
                        </button>
                      </div>

                      <div className="space-y-3">
                        {rule.conditions.map((condition, condIndex) => (
                          <motion.div
                            key={condition.id}
                            className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-700/30 rounded-lg"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: condIndex * 0.05 }}
                          >
                            <select
                              value={condition.indicator}
                              onChange={(e) => updateCondition(rule.id, condition.id, 'indicator', e.target.value)}
                              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 text-sm"
                            >
                              {indicators.map(ind => (
                                <option key={ind.value} value={ind.value}>{ind.label}</option>
                              ))}
                            </select>

                            <select
                              value={condition.operator}
                              onChange={(e) => updateCondition(rule.id, condition.id, 'operator', e.target.value)}
                              className="w-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 text-sm"
                            >
                              {operators.map(op => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                              ))}
                            </select>

                            <input
                              id={`condition-value-${condition.id}`}
                              name={`condition-value-${condition.id}`}
                              type="number"
                              value={condition.value}
                              onChange={(e) => updateCondition(rule.id, condition.id, 'value', parseFloat(e.target.value))}
                              className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 text-sm"
                            />

                            <button
                              onClick={() => removeCondition(rule.id, condition.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </motion.div>
                        ))}

                        {rule.conditions.length === 0 && (
                          <div className="text-center py-6 text-slate-500 text-sm">
                            No conditions yet. Add one to get started.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Add Rule Button */}
      <motion.button
        onClick={addRule}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 rounded-xl font-medium transition-all"
      >
        <Plus className="w-5 h-5" />
        <span>Add New Rule</span>
      </motion.button>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 rounded-xl font-semibold"
        >
          <TestTube className="w-5 h-5" />
          Backtest Strategy
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20"
        >
          <Play className="w-5 h-5" />
          Deploy Strategy
        </motion.button>
      </div>

      {/* Empty State */}
      {strategy.rules.length === 0 && (
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Sliders className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">No Rules Defined</h3>
          <p className="text-slate-400 mb-6">Start building your strategy by adding rules</p>
          <button
            onClick={addRule}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add First Rule
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default StrategyBuilder;
