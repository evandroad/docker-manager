import { useState, useEffect } from 'react'
import type { VolumeInfo } from '../types'
import { fetchVolumes } from '../api'
import { useSort } from '../useSort'

export default function VolumesPage() {
  const [volumes, setVolumes] = useState<VolumeInfo[]>([])
  const { sorted, toggleSort, icon } = useSort(volumes)

  useEffect(() => {
    fetchVolumes().then(setVolumes)
  }, [])

  const th = "bg-slate-700 p-2.5 text-left cursor-pointer select-none hover:bg-slate-600"

  return (
    <table className="w-full border-collapse bg-slate-800 text-sm">
      <thead>
        <tr>
          <th className={th} onClick={() => toggleSort('Name')}>Name{icon('Name')}</th>
          <th className={th} onClick={() => toggleSort('Driver')}>Driver{icon('Driver')}</th>
          <th className={th} onClick={() => toggleSort('Mountpoint')}>Mountpoint{icon('Mountpoint')}</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(v => (
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
