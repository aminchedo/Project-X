import { strategy$, setFlags, patchRuntime } from '../../state/strategyStore'
import { expect, it, describe, beforeEach } from 'vitest'

describe('Strategy Store', () => {
  beforeEach(() => {
    // Reset to initial state before each test
    strategy$.set({
      rtl: true,
      smcEnabled: true,
      showFVG: true,
      showZones: true,
      showLiquidity: true,
      scores: { entry: 0, conf: 0, SMC_ZQS: 0, FVG_ATR: 0, LIQ: 0 },
      gates:  { rsi_macd: false, smc: false, sentiment: false, countertrend: false },
      risk:   { atr_pct: 0, size: 0, circuit: false },
      regime: { news: false, highVol: false, wideSpread: false, trend: true }
    })
  })

  it('updates flags safely', () => {
    const s0 = strategy$.get()
    setFlags({ showFVG: !s0.showFVG })
    expect(strategy$.get().showFVG).toBe(!s0.showFVG)
  })

  it('updates runtime data safely', () => {
    const s0 = strategy$.get()
    patchRuntime({ risk: { ...s0.risk, size: 0.12 } })
    expect(strategy$.get().risk.size).toBe(0.12)
  })

  it('notifies subscribers on update', () => {
    let notified = false
    const unsub = strategy$.subscribe(() => { notified = true })
    
    setFlags({ rtl: false })
    expect(notified).toBe(true)
    
    unsub()
  })

  it('allows multiple subscribers', () => {
    let count1 = 0
    let count2 = 0
    
    const unsub1 = strategy$.subscribe(() => { count1++ })
    const unsub2 = strategy$.subscribe(() => { count2++ })
    
    setFlags({ smcEnabled: false })
    
    expect(count1).toBe(1)
    expect(count2).toBe(1)
    
    unsub1()
    unsub2()
  })

  it('unsubscribes correctly', () => {
    let count = 0
    const unsub = strategy$.subscribe(() => { count++ })
    
    setFlags({ showZones: false })
    expect(count).toBe(1)
    
    unsub()
    
    setFlags({ showZones: true })
    expect(count).toBe(1) // Should not increment after unsubscribe
  })

  it('preserves other state when patching', () => {
    setFlags({ showFVG: false })
    const beforePatch = strategy$.get()
    
    patchRuntime({ scores: { entry: 1, conf: 0.8, SMC_ZQS: 0.5, FVG_ATR: 0.3, LIQ: 0.7 } })
    
    const afterPatch = strategy$.get()
    expect(afterPatch.showFVG).toBe(beforePatch.showFVG)
    expect(afterPatch.scores.entry).toBe(1)
  })
})