import { useState, useEffect } from 'react'
import type { NetworkInfo } from '../types'
import { fetchNetworks } from '../api'
import { useSort } from '../useSort'

export default function NetworksPage() {
  const [networks, setNetworks] = useState<NetworkInfo[]>([])
  const { sorted, toggleSort, icon } = useSort(networks)

  useEffect(() => {
    fetchNetworks().then(setNetworks)
  }, [])

  const th = "bg-slate-700 p-2.5 text-left cursor-pointer select-none hover:bg-slate-600"

  return (
    <table className="w-full border-collapse mt-4 bg-slate-800 text-sm">
      <thead>
        <tr>
          <th className={th} onClick={() => toggleSort('ID')}>ID{icon('ID')}</th>
          <th className={th} onClick={() => toggleSort('Name')}>Name{icon('Name')}</th>
          <th className={th} onClick={() => toggleSort('Driver')}>Driver{icon('Driver')}</th>
          <th className={th} onClick={() => toggleSort('Scope')}>Scope{icon('Scope')}</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(n => (
          <tr key={n.ID} className="hover:bg-slate-700">
            <td className="p-2.5 border-t border-slate-600">{n.ID}</td>
            <td className="p-2.5 border-t border-slate-600">{n.Name}</td>
            <td className="p-2.5 border-t border-slate-600">{n.Driver}</td>
            <td className="p-2.5 border-t border-slate-600">{n.Scope}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
