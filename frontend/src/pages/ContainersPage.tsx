import { useState, useEffect, useCallback } from 'react'
import type { ContainerInfo } from '../types'
import { fetchContainers, startContainer, stopContainer } from '../api'
import { useDockerEvents } from '../useDockerEvents'

function groupByProject(list: ContainerInfo[]) {
  const groups: Record<string, ContainerInfo[]> = {}
  for (const c of list) {
    const key = c.Project || 'standalone'
    if (!groups[key]) groups[key] = []
    groups[key].push(c)
  }
  return groups
}

function statusColor(state: string) {
  if (state === 'running') return 'bg-green-500'
  if (state === 'exited') return 'bg-red-500'
  return 'bg-gray-500'
}

export default function ContainersPage() {
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    JSON.parse(localStorage.getItem('groupState') || '{}')
  )

  useEffect(() => {
    fetchContainers().then(setContainers)
  }, [])

  useDockerEvents(useCallback((e) => {
    const id = e.ID.substring(0, 12)
    const action = e.Action
    if (action === 'start' || action === 'die' || action === 'stop') {
      setContainers(prev =>
        prev.map(c =>
          c.ID === id
            ? { ...c, State: action === 'start' ? 'running' : 'exited' }
            : c
        )
      )
    }
  }, []))

  function toggleGroup(key: string) {
    setCollapsed(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('groupState', JSON.stringify(next))
      return next
    })
  }

  async function handleStart(id: string) {
    await startContainer(id)
  }

  async function handleStop(id: string) {
    if (!confirm('Stop container?')) return
    await stopContainer(id)
  }

  const groups = groupByProject(containers)

  return (
    <table className="w-full border-collapse mt-4 bg-slate-800 text-sm">
      <thead>
        <tr>
          <th className="bg-slate-700 p-2.5 text-left w-8"></th>
          <th className="bg-slate-700 p-2.5 text-left">ID</th>
          <th className="bg-slate-700 p-2.5 text-left">Name</th>
          <th className="bg-slate-700 p-2.5 text-left">Image</th>
          <th className="bg-slate-700 p-2.5 text-left">Status</th>
          <th className="bg-slate-700 p-2.5 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(groups).sort().map(project => {
          const key = project.replace(/[^a-zA-Z0-9]/g, '')
          const list = groups[project]
          const open = !collapsed[key]

          return (
            <GroupRows
              key={key}
              project={project}
              list={list}
              open={open}
              onToggle={() => toggleGroup(key)}
              onStart={handleStart}
              onStop={handleStop}
            />
          )
        })}
      </tbody>
    </table>
  )
}

function GroupRows({ project, list, open, onToggle, onStart, onStop }: {
  project: string
  list: ContainerInfo[]
  open: boolean
  onToggle: () => void
  onStart: (id: string) => void
  onStop: (id: string) => void
}) {
  return (
    <>
      <tr className="cursor-pointer" onClick={onToggle}>
        <td colSpan={6} className="p-2.5 border-t border-slate-600">
          <span className="mr-2 text-slate-400">{open ? '▾' : '▸'}</span>
          <b>{project}</b> ({list.length})
        </td>
      </tr>
      {open && list.map(c => (
        <tr key={c.ID}>
          <td className="p-2.5 border-t border-slate-600">
            <span className={`inline-block w-3 h-3 rounded-full ${statusColor(c.State)}`} />
          </td>
          <td className="p-2.5 border-t border-slate-600">{c.ID}</td>
          <td className="p-2.5 border-t border-slate-600">{c.Name.replace('/', '')}</td>
          <td className="p-2.5 border-t border-slate-600">{c.Image}</td>
          <td className="p-2.5 border-t border-slate-600" title={c.Status}>{c.State}</td>
          <td className="p-2.5 border-t border-slate-600">
            {c.State === 'running'
              ? <button className="px-3 py-1.5 bg-slate-700 border-none rounded-md text-white cursor-pointer hover:bg-slate-600" onClick={() => onStop(c.ID)}>Stop</button>
              : <button className="px-3 py-1.5 bg-slate-700 border-none rounded-md text-white cursor-pointer hover:bg-slate-600" onClick={() => onStart(c.ID)}>Start</button>
            }
          </td>
        </tr>
      ))}
    </>
  )
}
