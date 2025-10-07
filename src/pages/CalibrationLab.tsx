import React, { useState } from 'react'
import { calibratePlatt, getPlatt, resolveGoal } from '../services/aiExtras'

export default function CalibrationLab(){
  const [msg,setMsg]=useState('')
  const [goal,setGoal]=useState('auto')
  const [trend,setTrend]=useState(1)

  async function doFit(){
    const data = [
      {raw_score:0.2, label:0},
      {raw_score:0.3, label:0},
      {raw_score:0.7, label:1},
      {raw_score:0.9, label:1}
    ]
    const r = await calibratePlatt(data)
    setMsg('Fitted A='+r.A.toFixed(3)+' B='+r.B.toFixed(3))
  }
  async function doGet(){
    const r = await getPlatt()
    setMsg(r.ok? ('Loaded A='+r.A.toFixed(3)+' B='+r.B.toFixed(3)) : 'Not fitted')
  }
  async function doGoal(){
    const r = await resolveGoal(goal, trend)
    setMsg('Goal='+r.goal+' mul='+JSON.stringify(r.weight_multipliers))
  }

  return (
    <div className="p-4 space-y-3">
      <div className="font-semibold text-lg">Calibration Lab</div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={doFit} className="px-3 py-2 border rounded">Fit Platt</button>
        <button onClick={doGet} className="px-3 py-2 border rounded">Load Platt</button>
      </div>
      <div className="flex gap-2 items-center">
        <select value={goal} onChange={e=>setGoal(e.target.value)} className="border px-2 py-1">
          <option value="auto">auto</option>
          <option value="continuation">continuation</option>
          <option value="reversal">reversal</option>
        </select>
        <select value={trend} onChange={e=>setTrend(parseInt(e.target.value))} className="border px-2 py-1">
          <option value={-1}>HTF Down</option>
          <option value={0}>HTF Flat</option>
          <option value={1}>HTF Up</option>
        </select>
        <button onClick={doGoal} className="px-3 py-2 border rounded">Resolve Goal</button>
      </div>
      {msg && <div className="text-sm text-gray-600">{msg}</div>}
    </div>
  )
}
