import { useState } from 'react'

interface Props {
  onConfirm: (name: string, driver: string) => void
  onCancel: () => void
}

export default function CreateNetworkModal({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('')
  const [driver, setDriver] = useState('bridge')

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-zinc-900 rounded-lg w-96 border border-zinc-700" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-700 font-bold">Create Network</div>
        <form className="p-4 flex flex-col gap-3" onSubmit={e => { e.preventDefault(); if (name.trim()) onConfirm(name.trim(), driver) }}>
          <input autoFocus className="bg-zinc-800 text-white border border-zinc-700 rounded px-3 py-2 text-sm" placeholder="Network name" value={name} onChange={e => setName(e.target.value)} />
          <select className="bg-zinc-800 text-white border border-zinc-700 rounded px-3 py-2 text-sm appearance-none" value={driver} onChange={e => setDriver(e.target.value)}>
            <option value="bridge">bridge</option>
            <option value="host">host</option>
            <option value="overlay">overlay</option>
            <option value="macvlan">macvlan</option>
            <option value="none">none</option>
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={onCancel}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 border-none rounded-md text-white cursor-pointer hover:bg-blue-500 disabled:opacity-50" disabled={!name.trim()}>Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}
