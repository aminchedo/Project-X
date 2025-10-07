import React from 'react'
import { useStrategy } from '../state/useStrategy'

const Badge = ({ok}:{ok:boolean}) =>
  <span style={{padding:'2px 6px', borderRadius:4, background: ok?'#e7f8ef':'#fdecea', color: ok?'#1b6c3b':'#8a1c1c'}}>
    {ok ? 'PASS' : 'BLOCK'}
  </span>

export function StrategyHUD() {
  const [s] = useStrategy()
  const dir = s.rtl ? 'rtl':'ltr'
  return (
    <div dir={dir} className="p-3 rounded border" style={{borderColor:'#e5e7eb'}}>
      <div className="font-semibold mb-2">Strategy HUD</div>
      <div className="grid" style={{gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:12}}>
        <div>
          <div className="text-xs text-gray-500 mb-1">Scores</div>
          <div>Entry: {s.scores.entry.toFixed(2)}</div>
          <div>Conf: {s.scores.conf.toFixed(2)}</div>
          <div>SMC_ZQS: {s.scores.SMC_ZQS.toFixed(2)}</div>
          <div>FVG_ATR: {s.scores.FVG_ATR.toFixed(2)}</div>
          <div>LIQ: {s.scores.LIQ.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Gates</div>
          <div className="flex items-center gap-2">RSI/MACD <Badge ok={s.gates.rsi_macd}/></div>
          <div className="flex items-center gap-2">SMC <Badge ok={s.gates.smc}/></div>
          <div className="flex items-center gap-2">Sentiment <Badge ok={s.gates.sentiment}/></div>
          <div>Countertrend: {s.gates.countertrend ? 'Yes':'No'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Risk</div>
          <div>ATR%: {(s.risk.atr_pct*100).toFixed(2)}%</div>
          <div>Size: {(s.risk.size*100).toFixed(1)}%</div>
          <div>Circuit: {s.risk.circuit ? 'TRIPPED':'OK'}</div>
        </div>
      </div>
    </div>
  )
}