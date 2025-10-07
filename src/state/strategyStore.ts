import { Observable } from './observable'

export type StrategyState = {
  rtl: boolean
  smcEnabled: boolean
  showFVG: boolean
  showZones: boolean
  showLiquidity: boolean
  scores: { entry: number; conf: number; SMC_ZQS: number; FVG_ATR: number; LIQ: number }
  gates:  { rsi_macd: boolean; smc: boolean; sentiment: boolean; countertrend: boolean }
  risk:   { atr_pct: number; size: number; circuit: boolean }
  regime: { news: boolean; highVol: boolean; wideSpread: boolean; trend: boolean }
  reasons: string[]  // why_block or decision notes
}

export const strategy$ = new Observable<StrategyState>({
  rtl: true,
  smcEnabled: true,
  showFVG: true,
  showZones: true,
  showLiquidity: true,
  scores: { entry: 0, conf: 0, SMC_ZQS: 0, FVG_ATR: 0, LIQ: 0 },
  gates:  { rsi_macd: false, smc: false, sentiment: false, countertrend: false },
  risk:   { atr_pct: 0, size: 0, circuit: false },
  regime: { news: false, highVol: false, wideSpread: false, trend: true },
  reasons: []
})

export const setFlags = (p: Partial<Pick<StrategyState,'smcEnabled'|'showFVG'|'showZones'|'showLiquidity'|'rtl'>>) =>
  strategy$.update(s => ({ ...s, ...p }))

export const patchRuntime = (p: Partial<Omit<StrategyState,'rtl'|'smcEnabled'|'showFVG'|'showZones'|'showLiquidity'>>) =>
  strategy$.update(s => ({ ...s, ...p }))