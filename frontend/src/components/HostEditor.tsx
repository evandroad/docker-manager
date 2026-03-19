import { useState } from 'react'
import type { HostConfig } from '../api'

type HostEditorProps = {
  hosts: HostConfig[]
  onSave: (hosts: HostConfig[]) => void
  onClose: () => void
}

const btn = "px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600"

export default function HostEditor({ hosts, onSave, onClose }: HostEditorProps) {
  const [list, setList] = useState<HostConfig[]>(() => hosts.length ? [...hosts] : [])

  function update(i: number, field: keyof HostConfig, value: string) {
    setList(prev => prev.map((h, j) => j === i ? { ...h, [field]: value } : h))
  }

  function add() {
    setList(prev => [...prev, { name: '', ssh_addr: '', ssh_port: '22' }])
  }

  function remove(i: number) {
    setList(prev => prev.filter((_, j) => j !== i))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-zinc-900 rounded-lg w-[500px] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-zinc-700">
          <span className="font-bold">Remote Hosts</span>
          <button className={btn} onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="p-4 flex flex-col gap-4 max-h-[60vh] overflow-auto">
          {list.map((h, i) => (
            <div key={i} className="flex flex-col gap-2 p-3 bg-zinc-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-300 font-bold">{h.name || `Host ${i + 1}`}</span>
                <button className="px-3 py-1.5 text-sm bg-red-700 border-none rounded-md text-white cursor-pointer hover:bg-red-600"
                  onClick={() => remove(i)}><i className="fa-solid fa-trash" /></button>
              </div>
              <label className="flex flex-col text-sm text-zinc-400">
                Name
                <input className="bg-zinc-900 text-white border border-zinc-700 rounded px-3 py-2 text-sm mt-1"
                  value={h.name} onChange={e => update(i, 'name', e.target.value)} />
              </label>
              <label className="flex flex-col text-sm text-zinc-400">
                SSH (user@host)
                <input className="bg-zinc-900 text-white border border-zinc-700 rounded px-3 py-2 text-sm mt-1"
                  value={h.ssh_addr} onChange={e => update(i, 'ssh_addr', e.target.value)} placeholder="root@10.1.1.202" />
              </label>
              <label className="flex flex-col text-sm text-zinc-400">
                Port
                <input className="bg-zinc-900 text-white border border-zinc-700 rounded px-3 py-2 text-sm mt-1"
                  value={h.ssh_port} onChange={e => update(i, 'ssh_port', e.target.value)} />
              </label>
            </div>
          ))}
          <button className="px-4 py-2 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600 self-start" onClick={add}><i className="fa-solid fa-plus" /> Add Host</button>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-zinc-700">
          <button className="px-4 py-2 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 text-sm bg-blue-600 border-none rounded-md text-white cursor-pointer hover:bg-blue-500"
            onClick={() => onSave(list.filter(h => h.name && h.ssh_addr))}>Save</button>
        </div>
      </div>
    </div>
  )
}
