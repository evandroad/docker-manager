import { useState } from 'react'

type PasswordModalProps = {
  host: string
  onConfirm: (password: string) => void
  onCancel: () => void
}

export default function PasswordModal({ host, onConfirm, onCancel }: PasswordModalProps) {
  const [pw, setPw] = useState('')
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-zinc-900 rounded-lg w-96 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-700 font-bold">Connect to {host}</div>
        <form className="p-4 flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onConfirm(pw) }}>
          <label className="flex flex-col text-sm text-zinc-400">
            Password (empty for key auth)
            <input type="password" autoFocus className="bg-zinc-800 text-white border border-zinc-700 rounded px-3 py-2 text-sm mt-1"
              value={pw} onChange={e => setPw(e.target.value)} />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="px-4 py-2 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={onCancel}>Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 border-none rounded-md text-white cursor-pointer hover:bg-blue-500">Connect</button>
          </div>
        </form>
      </div>
    </div>
  )
}
