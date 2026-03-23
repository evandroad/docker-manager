import { useState } from 'react'

type Props = {
  tags: string[]
  onConfirm: (source: string, newTag: string, keep: boolean) => void
  onDelete: (tag: string) => void
  onCancel: () => void
}

export default function TagModal({ tags, onConfirm, onDelete, onCancel }: Props) {
  const [selected, setSelected] = useState(tags[0] || '')
  const [name, setName] = useState(tags[0] || '')
  const valid = !!name.trim()

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-zinc-900 rounded-lg w-96 border border-zinc-700" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-700 font-bold">Edit Tag</div>
        <div className="p-4 flex flex-col gap-4">
          {tags.length > 1 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-400">Select tag to edit:</span>
              {tags.map(t => (
                <label key={t} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-zinc-800 rounded px-2 py-1">
                  <input type="radio" name="tag" checked={selected === t} onChange={() => { setSelected(t); setName(t) }} />
                  {t}
                </label>
              ))}
            </div>
          )}
          <input autoFocus className="bg-zinc-800 text-white border border-zinc-700 rounded px-3 py-2 text-sm"
            value={name} onChange={e => setName(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={onCancel}>Cancel</button>
            <button type="button" className="px-4 py-2 text-sm bg-red-700 border-none rounded-md text-white cursor-pointer hover:bg-red-600" disabled={!selected} onClick={() => onDelete(selected)}>Delete</button>
            <button type="button" className="px-4 py-2 text-sm bg-blue-600 border-none rounded-md text-white cursor-pointer hover:bg-blue-500" disabled={!valid} onClick={() => onConfirm(selected, name.trim(), false)}>Rename</button>
            <button type="button" className="px-4 py-2 text-sm bg-green-700 border-none rounded-md text-white cursor-pointer hover:bg-green-600" disabled={!valid} onClick={() => onConfirm(selected, name.trim(), true)}>Create</button>
          </div>
        </div>
      </div>
    </div>
  )
}
