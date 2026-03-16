import { useState, useEffect, useCallback } from 'react'
import type { ContainerInfo } from '../types'
import { fetchContainers, startContainer, stopContainer, removeContainer, composeStart, composeStop } from '../api'
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

const btn = "px-3 py-1.5 bg-slate-700 border-none rounded-md text-white cursor-pointer hover:bg-slate-600"
const btnDanger = "ml-2 px-3 py-1.5 bg-red-700 border-none rounded-md text-white cursor-pointer hover:bg-red-600"

export default function ContainersPage() {
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})
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
      setLoading(prev => ({ ...prev, [id]: false }))
    }
    if (action === 'destroy') {
      setContainers(prev => prev.filter(c => c.ID !== id))
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
    setLoading(prev => ({ ...prev, [id]: true }))
    await startContainer(id)
  }

  async function handleStop(id: string) {
    if (!confirm('Stop container?')) return
    setLoading(prev => ({ ...prev, [id]: true }))
    await stopContainer(id)
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove container?')) return
    await removeContainer(id)
  }

  const groups = groupByProject(containers)

  return (
    <table className="w-full border-collapse bg-slate-800 text-sm">
      <thead>
        <tr>
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
              loading={loading}
              onToggle={() => toggleGroup(key)}
              onStart={handleStart}
              onStop={handleStop}
              onRemove={handleRemove}
            />
          )
        })}
      </tbody>
    </table>
  )
}

function GroupRows({ project, list, open, loading, onToggle, onStart, onStop, onRemove }: {
  project: string
  list: ContainerInfo[]
  open: boolean
  loading: Record<string, boolean>
  onToggle: () => void
  onStart: (id: string) => void
  onStop: (id: string) => void
  onRemove: (id: string) => void
}) {
  const [groupTarget, setGroupTarget] = useState<'running' | 'stopped' | null>(null)
  const allRunning = list.every(c => c.State === 'running')
  const allStopped = list.every(c => c.State !== 'running')
  const isCompose = project !== 'standalone'

  useEffect(() => {
    if (groupTarget === 'running' && allRunning) setGroupTarget(null)
    if (groupTarget === 'stopped' && allStopped) setGroupTarget(null)
  }, [allRunning, allStopped, groupTarget])

  async function startAll() {
    setGroupTarget('running')
    if (isCompose) await composeStart(project)
    else list.filter(c => c.State !== 'running').forEach(c => onStart(c.ID))
  }
  async function stopAll() {
    if (!confirm('Stop all containers in ' + project + '?')) return
    setGroupTarget('stopped')
    if (isCompose) await composeStop(project)
    else list.filter(c => c.State === 'running').forEach(c => onStop(c.ID))
  }

  const groupColor = allRunning ? 'bg-green-500' : allStopped ? 'bg-red-500' : 'bg-yellow-500'

  return (
    <>
      <tr>
        <td colSpan={5} className="p-2.5 border-t border-slate-600">
          <div className="flex items-center justify-between">
          <span className="cursor-pointer" onClick={onToggle}>
            <span className="mr-2 text-slate-400">{open ? '▾' : '▸'}</span>
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${groupColor}`} />
            <b>{project}</b> ({list.length})
          </span>
          {groupTarget
            ? <span className="text-slate-400"><i className="fa-solid fa-spinner fa-spin" /></span>
            : <span>
                <button className={btn} disabled={allRunning} style={{opacity: allRunning ? 0.3 : 1}} onClick={startAll}><i className="fa-solid fa-play" /> All</button>
                <button className={"ml-2 " + btn} disabled={allStopped} style={{opacity: allStopped ? 0.3 : 1}} onClick={stopAll}><i className="fa-solid fa-stop" /> All</button>
              </span>
          }
          </div>
        </td>
      </tr>
      {open && list.map(c => {
        const busy = loading[c.ID]
        return (
          <tr key={c.ID}>
            <td className="p-2.5 border-t border-slate-600">{c.ID}</td>
            <td className="p-2.5 border-t border-slate-600">{c.Name.replace('/', '')}</td>
            <td className="p-2.5 border-t border-slate-600">{c.Image}</td>
            <td className="p-2.5 border-t border-slate-600" title={c.Status}><span className={`inline-block w-3 h-3 rounded-full mr-2 ${statusColor(c.State)}`} />{c.State}</td>
            <td className="p-2.5 border-t border-slate-600">
              {busy
                ? <i className="fa-solid fa-spinner fa-spin text-slate-400" />
                : c.State === 'running'
                  ? <button className={btn} onClick={() => onStop(c.ID)}><i className="fa-solid fa-stop" /></button>
                  : <><button className={btn} onClick={() => onStart(c.ID)}><i className="fa-solid fa-play" /></button>
                    <button className={btnDanger} onClick={() => onRemove(c.ID)}><i className="fa-solid fa-trash" /></button></>
              }
            </td>
          </tr>
        )
      })}
    </>
  )
}
