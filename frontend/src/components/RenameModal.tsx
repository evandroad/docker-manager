import { useState, type ReactNode } from 'react'

type Props = {
  currentName: string
  title?: ReactNode
  submitLabel?: string
  onConfirm: (name: string) => void
  onAlt?: (name: string) => void
  altLabel?: string
  onCancel: () => void
}

export default function RenameModal({ currentName, title, submitLabel, onConfirm, onAlt, altLabel, onCancel }: Props) {
  const [name, setName] = useState(currentName)
  const valid = !!name.trim()
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-zinc-900 rounded-lg w-96 border border-zinc-700" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-700 font-bold">{title || 'Rename'}</div>
        <form className="p-4 flex flex-col gap-4" onSubmit={e => { e.preventDefault(); if (valid) onConfirm(name.trim()) }}>
          <input autoFocus className="bg-zinc-800 text-white border border-zinc-700 rounded px-3 py-2 text-sm"
            value={name} onChange={e => setName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={onCancel}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 border-none rounded-md text-white cursor-pointer hover:bg-blue-500" disabled={!valid}>{submitLabel || (title === 'Rename' || !title ? 'Rename' : 'Create')}</button>
            {onAlt && <button type="button" className="px-4 py-2 text-sm bg-green-700 border-none rounded-md text-white cursor-pointer hover:bg-green-600" disabled={!valid} onClick={() => { if (valid) onAlt(name.trim()) }}>{altLabel || 'Create'}</button>}
          </div>
        </form>
      </div>
    </div>
  )
}
