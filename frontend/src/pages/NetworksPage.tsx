import { useState, useEffect } from 'react'
import type { NetworkInfo } from '../types'
import { fetchNetworks, removeNetwork } from '../api'
import { useSort } from '../useSort'
import { useConfirm, useAlert } from '../components/ConfirmModal'

export default function NetworksPage() {
  const [networks, setNetworks] = useState<NetworkInfo[]>([])
  const { sorted, toggleSort, icon } = useSort(networks)
  const confirm = useConfirm()
  const showAlert = useAlert()

  useEffect(() => {
    fetchNetworks().then(setNetworks)
  }, [])

  function handleRemove(id: string, name: string) {
    confirm({ message: `Remove network "${name}"?`, onConfirm: async () => {
      const res = await removeNetwork(id)
      if (res === true) setNetworks(prev => prev.filter(n => n.ID !== id))
      else showAlert('Error: ' + res)
    }})
  }

  const th = "bg-zinc-700 p-2 text-left cursor-pointer select-none hover:bg-zinc-600"

  return (
    <table className="w-full border-collapse mt-4 bg-zinc-800 text-sm">
      <thead>
        <tr>
          <th className={th} onClick={() => toggleSort('ID')}>ID{icon('ID')}</th>
          <th className={th} onClick={() => toggleSort('Name')}>Name{icon('Name')}</th>
          <th className={th} onClick={() => toggleSort('Driver')}>Driver{icon('Driver')}</th>
          <th className={th} onClick={() => toggleSort('Scope')}>Scope{icon('Scope')}</th>
          <th className={th} onClick={() => toggleSort('Created')}>Created{icon('Created')}</th>
          <th className={th} onClick={() => toggleSort('UsedBy')}>Containers{icon('UsedBy')}</th>
          <th className="bg-zinc-700 p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(n => (
          <tr key={n.ID} className="hover:bg-zinc-700">
            <td className="p-2 text-lg font-light border-t border-zinc-600">{n.ID}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{n.Name}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{n.Driver}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{n.Scope}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{new Date(n.Created * 1000).toLocaleDateString()}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600 text-xs">
              {n.UsedBy?.length ? n.UsedBy.map(name => name.replace('/', '')).join(', ') : '—'}
            </td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              <button className="px-2 py-1 text-xs bg-red-700 border-none rounded-md text-white cursor-pointer hover:bg-red-600" onClick={() => handleRemove(n.ID, n.Name)}><i className="fa-solid fa-trash" /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
