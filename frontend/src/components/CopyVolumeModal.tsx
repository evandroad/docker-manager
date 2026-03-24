import { useState } from 'react'

interface Props {
  sourceName: string
  sourceContainers: string[]
  existingVolumes: string[]
  onCopy: (dest: string, overwrite: boolean) => void
  onCancel: () => void
}

export default function CopyVolumeModal({ sourceName, sourceContainers, existingVolumes, onCopy, onCancel }: Props) {
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [newName, setNewName] = useState('volume_copy')
  const [selected, setSelected] = useState(existingVolumes[0] || '')

  const label = sourceName.length > 20 ? sourceName.slice(0, 15) + '…' : sourceName
  const containers = sourceContainers.length ? sourceContainers.map(c => c.replace('/', '')).join(', ') : ''
  const valid = mode === 'new' ? !!newName.trim() : !!selected

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-zinc-900 rounded-lg w-96 border border-zinc-700" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-700">
          <div className="font-bold">{label}</div>
          {containers && <div className="text-xs text-zinc-400 mt-1">{containers}</div>}
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <button type="button" className={`flex-1 px-3 py-1.5 text-sm rounded-md border-none cursor-pointer ${mode === 'new' ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`} onClick={() => setMode('new')}>New volume</button>
            <button type="button" className={`flex-1 px-3 py-1.5 text-sm rounded-md border-none cursor-pointer ${mode === 'existing' ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`} onClick={() => setMode('existing')}>Existing volume</button>
          </div>

          {mode === 'new' ? (
            <input autoFocus className="bg-zinc-800 text-white border border-zinc-700 rounded px-3 py-2 text-sm" placeholder="Volume name" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && valid && onCopy(newName.trim(), false)} />
          ) : (
            <select className="bg-zinc-800 text-white border border-zinc-700 rounded px-3 py-2 text-sm appearance-none" value={selected} onChange={e => setSelected(e.target.value)}>
              {existingVolumes.map(v => (
                <option key={v} value={v}>{v.length > 40 ? v.slice(0, 15) + '…' : v}</option>
              ))}
            </select>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={onCancel}>Cancel</button>
            <button type="button" className="px-4 py-2 text-sm bg-blue-600 border-none rounded-md text-white cursor-pointer hover:bg-blue-500 disabled:opacity-50" disabled={!valid} onClick={() => onCopy(mode === 'new' ? newName.trim() : selected, mode === 'existing')}>
              {mode === 'new' ? 'Copy' : 'Overwrite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
