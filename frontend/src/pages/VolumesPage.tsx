import { useState, useEffect } from 'react'
import type { VolumeInfo } from '../types'
import { fetchVolumes } from '../api'

export default function VolumesPage() {
  const [volumes, setVolumes] = useState<VolumeInfo[]>([])

  useEffect(() => {
    fetchVolumes().then(setVolumes)
  }, [])

  return (
    <table className="w-full border-collapse mt-4 bg-slate-800 text-sm">
      <thead>
        <tr>
          <th className="bg-slate-700 p-2.5 text-left">Name</th>
          <th className="bg-slate-700 p-2.5 text-left">Driver</th>
          <th className="bg-slate-700 p-2.5 text-left">Mountpoint</th>
        </tr>
      </thead>
      <tbody>
        {volumes.map(v => (
          <tr key={v.Name} className="hover:bg-slate-700">
            <td className="p-2.5 border-t border-slate-600">{v.Name}</td>
            <td className="p-2.5 border-t border-slate-600">{v.Driver}</td>
            <td className="p-2.5 border-t border-slate-600 text-xs text-slate-400 break-all">{v.Mountpoint}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
