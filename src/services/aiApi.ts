export async function getAIConfig() {
  const r = await fetch('/ai/config'); return r.json()
}

export async function gaCalibrate(bars: any[]) {
  const r = await fetch('/ai/ga/calibrate', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(bars) 
  })
  return r.json()
}

export async function rlTrain(weeklyPnL: number[]) {
  const r = await fetch('/ai/rl/train', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ weekly_pnl: weeklyPnL }) 
  })
  return r.json()
}