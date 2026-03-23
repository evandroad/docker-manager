import { useState } from 'react'
import type { HostConfig } from '../api'

const btn = 'px-3 py-1.5 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600'

interface HostEditorProps {
  hosts: HostConfig[]
  onSave: (hosts: HostConfig[]) => void
  onClose: () => void
}

const empty: HostConfig = { name: '', ssh_addr: '', ssh_port: '22' }

export default function HostEditor({ hosts, onSave, onClose }: HostEditorProps) {
  const [list, setList] = useState<HostConfig[]>(() => [...hosts])
  const [editing, setEditing] = useState<number | null>(null)
  const [form, setForm] = useState<HostConfig>(empty)

  function startAdd() {
    setEditing(-1)
    setForm({ ...empty })
  }

  function startEdit(i: number) {
    setEditing(i)
    setForm({ ...list[i] })
  }

  function save() {
    if (!form.name || !form.ssh_addr) return
    if (editing === -1) {
      setList(prev => [...prev, form])
    } else if (editing !== null) {
      setList(prev => prev.map((h, j) => j === editing ? form : h))
    }
    setEditing(null)
  }

  function remove(i: number) {
    setList(prev => prev.filter((_, j) => j !== i))
    if (editing === i) setEditing(null)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-zinc-900 rounded-lg w-[500px] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-zinc-700">
          <span className="font-bold">Remote Hosts</span>
          <button className={btn} onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-auto">
          {editing !== null && (
            <div className="flex flex-col gap-2 p-3 bg-zinc-800 rounded-lg">
              <label className="flex flex-col text-sm text-zinc-400">
                Name
                <input className="bg-zinc-900 text-white border border-zinc-700 rounded px-3 py-2 text-sm mt-1"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="flex flex-col text-sm text-zinc-400">
                SSH (user@host)
                <input className="bg-zinc-900 text-white border border-zinc-700 rounded px-3 py-2 text-sm mt-1"
                  value={form.ssh_addr} onChange={e => setForm({ ...form, ssh_addr: e.target.value })} placeholder="root@10.1.1.202" />
              </label>
              <label className="flex flex-col text-sm text-zinc-400">
                Port
                <input className="bg-zinc-900 text-white border border-zinc-700 rounded px-3 py-2 text-sm mt-1"
                  value={form.ssh_port} onChange={e => setForm({ ...form, ssh_port: e.target.value })} />
              </label>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm bg-blue-600 border-none rounded-md text-white cursor-pointer hover:bg-blue-500" onClick={save}>
                  {editing === -1 ? 'Add' : 'Update'}
                </button>
                <button className={btn} onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          )}
          {editing === null && (
            <button className={`${btn} self-start`} onClick={startAdd}><i className="fa-solid fa-plus" /> Add Host</button>
          )}
          {list.length > 0 && (
            <div className="flex flex-col gap-2">
              {list.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <div className="flex flex-col text-sm">
                    <span className="text-white font-bold">{h.name}</span>
                    <span className="text-zinc-400">{h.ssh_addr}:{h.ssh_port}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className={btn} onClick={() => startEdit(i)}><i className="fa-solid fa-pen" /></button>
                    <button className="px-3 py-1.5 text-sm bg-red-700 border-none rounded-md text-white cursor-pointer hover:bg-red-600"
                      onClick={() => remove(i)}><i className="fa-solid fa-trash" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-zinc-700">
          <button className={btn} onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-blue-600 border-none rounded-md text-white cursor-pointer hover:bg-blue-500"
            onClick={() => onSave(list.filter(h => h.name && h.ssh_addr))}>Save</button>
        </div>
      </div>
    </div>
  )
}
