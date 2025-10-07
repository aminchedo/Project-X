export async function calibratePlatt(history: {raw_score:number,label:number}[]) {
  const r = await fetch('/ai/extras/calibrate/platt', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(history) })
  return r.json()
}
export async function getPlatt() {
  const r = await fetch('/ai/extras/calibrate/platt'); return r.json()
}
export async function resolveGoal(goal: string, htfTrend: number){
  const r = await fetch('/ai/extras/goal/resolve', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({goal, htf_trend: htfTrend}) })
  return r.json()
}
