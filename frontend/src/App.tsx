import { useState, useEffect, useCallback } from 'react'
import type { ContainerInfo } from './types'
import { fetchContainers, startContainer, stopContainer } from './api'
import { useDockerEvents } from './useDockerEvents'

type Page = 'containers' | 'images' | 'volumes' | 'networks'

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

function App() {
  const [page, setPage] = useState<Page>(() =>
    (localStorage.getItem('activePage') as Page) || 'containers'
  )
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    JSON.parse(localStorage.getItem('groupState') || '{}')
  )

  useEffect(() => {
    localStorage.setItem('activePage', page)
    if (page === 'containers') {
      fetchContainers().then(setContainers)
    }
  }, [page])

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
  const pages: Page[] = ['containers', 'images', 'volumes', 'networks']

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <header className="bg-slate-950 p-4 text-xl">Docker Manager</header>

      <nav className="bg-slate-800 px-4 py-2 flex gap-4">
        {pages.map(p => (
          <button
            key={p}
            className={`bg-transparent border-none text-sm cursor-pointer px-0 py-1 ${
              p === page ? 'text-white font-bold underline' : 'text-slate-400 hover:underline'
            }`}
            onClick={() => setPage(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </nav>

      <div className="p-5">
        {page === 'containers' && (
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
        )}
      </div>
    </div>
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
      <tr
        className="cursor-pointer hover:bg-slate-700"
        onClick={onToggle}
      >
        <td colSpan={6} className="p-2.5 border-t border-slate-600">
          <span className="mr-2">{open ? '▼' : '▶'}</span>
          <b>{project}</b> ({list.length})
        </td>
      </tr>
      {open && list.map(c => (
        <tr key={c.ID} className="hover:bg-slate-700">
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

export default App
