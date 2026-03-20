import { useState, useEffect } from 'react'
import type { VolumeInfo } from '../types'
import { fetchVolumes, removeVolume } from '../api'
import { useSort } from '../useSort'
import { useConfirm, useAlert } from '../components/ConfirmModal'

export default function VolumesPage() {
  const [volumes, setVolumes] = useState<VolumeInfo[]>([])
  const { sorted, toggleSort, icon } = useSort(volumes)
  const confirm = useConfirm()
  const showAlert = useAlert()

  useEffect(() => {
    fetchVolumes().then(setVolumes)
  }, [])

  function handleRemove(name: string) {
    confirm({ message: `Remove volume "${name}"?`, onConfirm: async () => {
      const res = await removeVolume(name)
      if (res === true) setVolumes(prev => prev.filter(v => v.Name !== name))
      else showAlert('Error: ' + res)
    }})
  }

  const th = "bg-zinc-700 p-2 text-left cursor-pointer select-none hover:bg-zinc-600"

  return (
    <table className="w-full border-collapse mt-4 bg-zinc-800 text-sm">
      <thead>
        <tr>
          <th className={th} onClick={() => toggleSort('Name')}>Name{icon('Name')}</th>
          <th className={th} onClick={() => toggleSort('Driver')}>Driver{icon('Driver')}</th>
          <th className={th} onClick={() => toggleSort('Mountpoint')}>Mountpoint{icon('Mountpoint')}</th>
          <th className={th} onClick={() => toggleSort('Size')}>Size{icon('Size')}</th>
          <th className={th} onClick={() => toggleSort('Created')}>Created{icon('Created')}</th>
          <th className={th} onClick={() => toggleSort('UsedBy')}>Containers{icon('UsedBy')}</th>
          <th className="bg-zinc-700 p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(v => (
          <tr key={v.Name} className="hover:bg-zinc-700">
            <td className="p-2 text-lg font-light border-t border-zinc-600">{v.Name}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{v.Driver}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600 text-xs text-zinc-400 break-all">{v.Mountpoint}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{v.Size}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{new Date(v.Created * 1000).toLocaleDateString()}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600 text-xs">
              {v.UsedBy?.length ? v.UsedBy.map(n => n.replace('/', '')).join(', ') : '—'}
            </td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              <button className="px-2 py-1 text-xs bg-red-700 border-none rounded-md text-white cursor-pointer hover:bg-red-600" onClick={() => handleRemove(v.Name)}><i className="fa-solid fa-trash" /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
