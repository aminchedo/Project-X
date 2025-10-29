import React from 'react'

type Row = { key: string; value: number }
type Props = {
  contributions: Row[]
  reasons?: string[]
  rtl?: boolean
}

export default function AttributionPanel({ contributions, reasons=[], rtl=false }: Props){
  const dir = rtl ? 'rtl':'ltr'
  return (
    <div dir={dir} className="p-3 rounded border" style={{borderColor:'#e5e7eb'}}>
      <div className="font-semibold mb-2">Attribution</div>
      <table className="w-full text-sm">
        <thead><tr><th className="text-left">Feature</th><th className="text-right">Weight/Impact</th></tr></thead>
        <tbody>
          {contributions.map((r, i)=>(
            <tr key={i}>
              <td>{r.key}</td>
              <td className="text-right">{r.value.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2">
        <div className="text-xs text-gray-500 mb-1">Reasons</div>
        {reasons.length ? (
          <ul className="list-disc ms-4 text-xs">
            {reasons.slice(0,6).map((r,i)=><li key={i}>{r}</li>)}
          </ul>
        ) : <div className="text-xs text-gray-400">None</div>}
      </div>
    </div>
  )
}
