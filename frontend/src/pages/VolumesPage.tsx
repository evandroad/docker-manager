import { useState, useEffect } from 'react'
import type { VolumeInfo } from '../types'
import { fetchVolumes, removeVolume, createVolume, copyVolume, exportVolume, importVolume } from '../api'
import { useSort } from '../useSort'
import { useConfirm, useAlert } from '../components/ConfirmModal'
import RenameModal from '../components/RenameModal'
import CopyVolumeModal from '../components/CopyVolumeModal'
import { useFilter } from '../useFilter'

export default function VolumesPage() {
  const [volumes, setVolumes] = useState<VolumeInfo[]>([])
  const { sorted, toggleSort, icon } = useSort(volumes, 'Name')
  const { filtered, input: filterInput } = useFilter(sorted)
  const confirm = useConfirm()
  const showAlert = useAlert()
  const [showCreate, setShowCreate] = useState(false)
  const [copyTarget, setCopyTarget] = useState<VolumeInfo | null>(null)
  const [copying, setCopying] = useState('')

  useEffect(() => {
    fetchVolumes().then(setVolumes)
  }, [])

  function handleRemove(name: string) {
    const label = name.length > 20 ? name.slice(0, 15) + '…' : name
    confirm({ message: `Remove volume "${label}"?`, onConfirm: async () => {
      const res = await removeVolume(name)
      if (res === true) setVolumes(prev => prev.filter(v => v.Name !== name))
      else showAlert('Error: ' + res)
    }})
  }

  async function handleCreate(name: string) {
    setShowCreate(false)
    const res = await createVolume(name)
    if (res === true) { showAlert('Volume created', 'success'); fetchVolumes().then(setVolumes) }
    else showAlert('Error: ' + res)
  }

  async function handleCopy(dest: string, overwrite: boolean) {
    const source = copyTarget!.Name
    setCopyTarget(null)
    setCopying(source)
    const res = await copyVolume(source, dest, overwrite)
    setCopying('')
    if (res === true) { showAlert('Volume copied successfully', 'success'); fetchVolumes().then(setVolumes) }
    else showAlert('Error: ' + res)
  }

  const th = "bg-zinc-700 p-2 text-left cursor-pointer select-none hover:bg-zinc-600"

  return (
    <>
    {showCreate && <RenameModal title="Create Volume" currentName="" onConfirm={handleCreate} onCancel={() => setShowCreate(false)} />}
    {copyTarget && <CopyVolumeModal
      sourceName={copyTarget.Name}
      sourceContainers={copyTarget.UsedBy || []}
      existingVolumes={volumes.filter(v => v.Name !== copyTarget.Name).map(v => v.Name)}
      onCopy={handleCopy}
      onCancel={() => setCopyTarget(null)}
    />}
    <div className="mb-3 flex items-center gap-2">
      <button className="px-3 py-1.5 text-sm bg-blue-900/80 border-none rounded-md text-white cursor-pointer hover:bg-blue-800/80" title="Create a new volume" onClick={() => setShowCreate(true)}>
        <i className="fa-solid fa-plus mr-1" /> Create Volume
      </button>
      {copying && <span className="text-sm text-zinc-400"><i className="fa-solid fa-spinner fa-spin mr-1" />Copying {copying}…</span>}
      {filterInput}
    </div>
    <table className="w-full border-separate border-spacing-0 bg-zinc-800 text-sm rounded-lg overflow-hidden">
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
        {filtered.map(v => (
          <tr key={v.Name} className="hover:bg-zinc-700">
            <td className="p-2 text-lg font-light border-t border-zinc-600">{v.Name}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{v.Driver}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600 break-all">{v.Mountpoint}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{v.Size}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{new Date(v.Created * 1000).toLocaleString('pt-BR')}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              {v.UsedBy?.length ? v.UsedBy.map(n => n.replace('/', '')).join(', ') : '—'}
            </td>
            <td className="p-2 text-lg font-light border-t border-zinc-600 whitespace-nowrap">
              <button className="px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" title="Copy volume to new or existing" onClick={() => setCopyTarget(v)}><i className="fa-solid fa-copy" /></button>
              <button className="ml-2 px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" title="Export volume as .tar.gz" onClick={async () => { const r = await exportVolume(v.Name); if (r === true) showAlert('Volume exported successfully', 'success'); else if (r) showAlert('Error: ' + r) }}><i className="fa-solid fa-file-export" /></button>
              <button className="ml-2 px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" title="Restore volume from .tar.gz" onClick={async () => { const r = await importVolume(v.Name); if (r === true) showAlert('Volume restored successfully', 'success'); else if (r) showAlert('Error: ' + r) }}><i className="fa-solid fa-file-import" /></button>
              <button className="ml-2 px-2 py-1 text-xs bg-red-700 border-none rounded-md text-white cursor-pointer hover:bg-red-600" title="Remove volume" onClick={() => handleRemove(v.Name)}><i className="fa-solid fa-trash" /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  )
}
