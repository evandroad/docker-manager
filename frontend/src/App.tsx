import { useState, useEffect, useCallback } from 'react'
import type { ContainerInfo } from './types'
import { fetchContainers, startContainer, stopContainer } from './api'
import { useDockerEvents } from './useDockerEvents'
import './App.css'

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
  if (state === 'running') return 'green'
  if (state === 'exited') return 'red'
  return 'gray'
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
    <>
      <header>Docker Manager</header>

      <nav>
        {pages.map(p => (
          <button
            key={p}
            className={`link-nav ${p === page ? 'active' : ''}`}
            onClick={() => setPage(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </nav>

      <div className="content">
        {page === 'containers' && (
          <table>
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>Name</th>
                <th>Image</th>
                <th>Status</th>
                <th>Actions</th>
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
                    groupKey={key}
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
    </>
  )
}

function GroupRows({ project, groupKey: _gk, list, open, onToggle, onStart, onStop }: {
  project: string
  groupKey: string
  list: ContainerInfo[]
  open: boolean
  onToggle: () => void
  onStart: (id: string) => void
  onStop: (id: string) => void
}) {
  return (
    <>
      <tr className="group-header" onClick={onToggle} style={{ cursor: 'pointer' }}>
        <td colSpan={6}>
          <span>{open ? '▼' : '▶'}</span>{' '}
          <b>{project}</b> ({list.length})
        </td>
      </tr>
      {open && list.map(c => (
        <tr key={c.ID}>
          <td>
            <span className="status-dot" style={{ background: statusColor(c.State) }} />
          </td>
          <td>{c.ID}</td>
          <td>{c.Name.replace('/', '')}</td>
          <td>{c.Image}</td>
          <td title={c.Status}>{c.State}</td>
          <td>
            {c.State === 'running'
              ? <button onClick={() => onStop(c.ID)}>Stop</button>
              : <button onClick={() => onStart(c.ID)}>Start</button>
            }
          </td>
        </tr>
      ))}
    </>
  )
}

export default App
