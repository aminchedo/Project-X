import React, { useState } from 'react'
import { gaCalibrate, rlTrain, getAIConfig } from '../services/aiApi'
import { useStrategy } from '../state/useStrategy'

export default function AIControls() {
  const [s] = useStrategy()
  const [busy,setBusy]=useState(false)
  const [msg,setMsg]=useState('')

  async function refresh() {
    setBusy(true)
    try {
      const cfg = await getAIConfig()
      setMsg('Config loaded. thresholds: ' + JSON.stringify(cfg.thresholds||{}))
    } catch (error: any) {
      setMsg('Error loading config: ' + error.message)
    } finally {
      setBusy(false)
    }
  }

  async function doGA() {
    setBusy(true); setMsg('Calibrating...')
    try {
      // Sample educational data - in practice, send from backend/backtest
      const bars = [
        {"signals":{"RSI":0.3,"MACD":0.7,"SMC_ZQS":0.8,"FVG_ATR":0.2,"LIQ_GRAB":1,"Sentiment":0.6,"SAR":0.5},"ret":0.01},
        {"signals":{"RSI":0.8,"MACD":0.2,"SMC_ZQS":0.4,"FVG_ATR":0.1,"LIQ_GRAB":0,"Sentiment":0.4,"SAR":0.6},"ret":-0.02}
      ]
      const r = await gaCalibrate(bars)
      setMsg('GA done: ' + (r.ok?'OK':'FAIL'))
    } catch (error: any) {
      setMsg('GA error: ' + error.message)
    } finally { 
      setBusy(false) 
    }
  }

  async function doRL() {
    setBusy(true); setMsg('Training RL...')
    try {
      const r = await rlTrain([0.01,-0.02,0.03,0.00,0.04,-0.01])
      setMsg('RL done: ' + (r.ok?'OK':'FAIL'))
    } catch (error: any) {
      setMsg('RL error: ' + error.message)
    } finally { 
      setBusy(false) 
    }
  }

  return (
    <div dir={s.rtl ? 'rtl' : 'ltr'} className="p-4 space-y-3">
      <div className="text-lg font-semibold">AI Controls</div>
      <div className="flex gap-2 flex-wrap">
        <button 
          disabled={busy} 
          onClick={refresh} 
          className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Load Config
        </button>
        <button 
          disabled={busy} 
          onClick={doGA} 
          className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run GA Calibrate
        </button>
        <button 
          disabled={busy} 
          onClick={doRL} 
          className="px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run RL Train
        </button>
      </div>
      {msg && <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">{msg}</div>}
      <div className="text-xs text-gray-500">Note: Real GA/RL datasets should come from your backtest/feed.</div>
    </div>
  )
}