import { useEffect, useState } from 'react'
import { strategy$, StrategyState } from './strategyStore'

export function useStrategy(): [StrategyState, typeof strategy$] {
  const [state, set] = useState(strategy$.get())
  useEffect(() => strategy$.subscribe(set), [])
  return [state, strategy$]
}