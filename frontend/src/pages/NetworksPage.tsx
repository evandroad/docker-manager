import { useState, useEffect } from 'react'
import type { NetworkInfo } from '../types'
import { fetchNetworks } from '../api'

export default function NetworksPage() {
  const [networks, setNetworks] = useState<NetworkInfo[]>([])

  useEffect(() => {
    fetchNetworks().then(setNetworks)
  }, [])

  return (
    <table className="w-full border-collapse mt-4 bg-slate-800 text-sm">
      <thead>
        <tr>
          <th className="bg-slate-700 p-2.5 text-left">ID</th>
          <th className="bg-slate-700 p-2.5 text-left">Name</th>
          <th className="bg-slate-700 p-2.5 text-left">Driver</th>
          <th className="bg-slate-700 p-2.5 text-left">Scope</th>
        </tr>
      </thead>
      <tbody>
        {networks.map(n => (
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
