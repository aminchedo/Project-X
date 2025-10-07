import React from 'react'

export function NewsBanner({ news, highVol, wideSpread }:{ news:boolean; highVol:boolean; wideSpread:boolean }) {
  if (!news && !highVol && !wideSpread) return null
  return (
    <div className="p-2 rounded mb-2 text-sm"
         style={{background:'#fff3cd', color:'#6b5200', border:'1px solid #ffe6a1'}}>
      <strong>⚠️ Regime:</strong>
      {news && <span> High-Impact News window</span>}
      {highVol && <span> • High Volatility</span>}
      {wideSpread && <span> • Wide Spread</span>}
      <span> — weights & risk auto-adjusted</span>
    </div>
  )
}