import React, { useEffect } from 'react'
import { useStrategy } from '../state/useStrategy'
import { patchRuntime } from '../state/strategyStore'

/**
 * Demo panel to simulate live strategy updates
 * این پنل نمونه‌ای برای شبیه‌سازی به‌روزرسانی‌های زنده استراتژی است
 */
export function SMCDemoPanel() {
  const [state] = useStrategy()

  // Simulate live updates every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Random scores
      const entry = Math.random()
      const conf = Math.random()
      const smc_zqs = Math.random()
      const fvg_atr = Math.random()
      const liq = Math.random()

      // Random gates (70% chance to pass)
      const rsi_macd = Math.random() > 0.3
      const smc = Math.random() > 0.3
      const sentiment = Math.random() > 0.3

      // Random risk
      const atr_pct = Math.random() * 0.02
      const size = Math.random() * 0.1
      const circuit = Math.random() > 0.9 // 10% chance to trip

      // Random regime
      const news = Math.random() > 0.8
      const highVol = Math.random() > 0.7
      const wideSpread = Math.random() > 0.8

      patchRuntime({
        scores: { entry, conf, SMC_ZQS: smc_zqs, FVG_ATR: fvg_atr, LIQ: liq },
        gates: { rsi_macd, smc, sentiment, countertrend: Math.random() > 0.5 },
        risk: { atr_pct, size, circuit },
        regime: { news, highVol, wideSpread, trend: true }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <div className="text-sm font-semibold mb-2 text-blue-700 dark:text-blue-300">
        🎬 Live Demo Mode
      </div>
      <div className="text-xs text-blue-600 dark:text-blue-400">
        Scores, gates, and regime data update every 3 seconds to simulate real trading conditions.
        <br />
        <span className="text-blue-500 dark:text-blue-500">
          امتیازها، گیت‌ها و داده‌های رژیم هر ۳ ثانیه به‌روزرسانی می‌شوند تا شرایط معاملات واقعی را شبیه‌سازی کنند.
        </span>
      </div>
    </div>
  )
}