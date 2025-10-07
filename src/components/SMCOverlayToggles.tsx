import React from 'react'
import { useStrategy } from '../state/useStrategy'
import { setFlags } from '../state/strategyStore'

export function SMCOverlayToggles() {
  const [s] = useStrategy()
  return (
    <div className="flex gap-3 items-center flex-wrap">
      <label className="flex items-center gap-1 cursor-pointer">
        <input type="checkbox" checked={s.smcEnabled} onChange={e=>setFlags({smcEnabled:e.target.checked})}/>
        <span>SMC</span>
      </label>
      <label className="flex items-center gap-1 cursor-pointer">
        <input type="checkbox" checked={s.showFVG} onChange={e=>setFlags({showFVG:e.target.checked})}/>
        <span>FVG</span>
      </label>
      <label className="flex items-center gap-1 cursor-pointer">
        <input type="checkbox" checked={s.showZones} onChange={e=>setFlags({showZones:e.target.checked})}/>
        <span>Zones</span>
      </label>
      <label className="flex items-center gap-1 cursor-pointer">
        <input type="checkbox" checked={s.showLiquidity} onChange={e=>setFlags({showLiquidity:e.target.checked})}/>
        <span>Liquidity</span>
      </label>
      <label className="flex items-center gap-1 cursor-pointer">
        <input type="checkbox" checked={s.rtl} onChange={e=>setFlags({rtl:e.target.checked})}/>
        <span>RTL</span>
      </label>
    </div>
  )
}