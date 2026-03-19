import { useState, useEffect, useCallback, useRef } from 'react'
import type { ContainerInfo } from '../types'
import { fetchContainers, startContainer, stopContainer, restartContainer, removeContainer, composeStart, composeStop } from '../api'
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

const btn = "px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600"
const btnDanger = "ml-2 px-2 py-1 text-xs bg-red-700 border-none rounded-md text-white cursor-pointer hover:bg-red-600"

export default function ContainersPage() {
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    JSON.parse(localStorage.getItem('groupState') || '{}')
  )
  const [logTarget, setLogTarget] = useState<{ id: string; name: string } | null>(null)

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

  async function handleRestart(id: string) {
    setLoading(prev => ({ ...prev, [id]: true }))
    await restartContainer(id)
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove container?')) return
    await removeContainer(id)
  }

  const groups = groupByProject(containers)

  return (
    <>
    {logTarget && <LogModal id={logTarget.id} name={logTarget.name} onClose={() => setLogTarget(null)} />}
    <table className="w-full border-collapse bg-zinc-800 text-sm">
      <thead>
        <tr>
          <th className="bg-zinc-700 p-1.5 text-left">ID</th>
          <th className="bg-zinc-700 p-1.5 text-left">Name</th>
          <th className="bg-zinc-700 p-1.5 text-left">Image</th>
          <th className="bg-zinc-700 p-1.5 text-left">Status</th>
          <th className="bg-zinc-700 p-1.5 text-left">Actions</th>
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
              onRestart={handleRestart}
              onRemove={handleRemove}
              onLogs={(id, name) => setLogTarget({ id, name })}
            />
          )
        })}
      </tbody>
    </table>
    </>
  )
}

function GroupRows({ project, list, open, loading, onToggle, onStart, onStop, onRestart, onRemove, onLogs }: {
  project: string
  list: ContainerInfo[]
  open: boolean
  loading: Record<string, boolean>
  onToggle: () => void
  onStart: (id: string) => void
  onStop: (id: string) => void
  onRestart: (id: string) => void
  onRemove: (id: string) => void
  onLogs: (id: string, name: string) => void
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
        <td colSpan={5} className="p-1.5 border-t border-zinc-600">
          <div className="flex items-center justify-between">
          <span className="cursor-pointer" onClick={onToggle}>
            <span className="mr-2 text-zinc-400">{open ? '▾' : '▸'}</span>
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${groupColor}`} />
            ({list.length}) <b className='text-lg font-light'>{project}</b>
          </span>
          {groupTarget
            ? <span className="text-zinc-400"><i className="fa-solid fa-spinner fa-spin" /></span>
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
            <td className="p-2 text-lg font-light border-t border-zinc-600">{c.ID}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{c.Name.replace('/', '')}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{c.Image}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600" title={c.Status}><span className={`inline-block w-3 h-3 rounded-full mr-2 ${statusColor(c.State)}`} />{c.State}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              {busy
                ? <i className="fa-solid fa-spinner fa-spin text-zinc-400" />
                : c.State === 'running'
                  ? <><button className={btn} onClick={() => onStop(c.ID)}><i className="fa-solid fa-stop" /></button>
                    <button className={"ml-2 " + btn} onClick={() => onRestart(c.ID)}><i className="fa-solid fa-rotate-right" /></button></>
                  : <><button className={btn} onClick={() => onStart(c.ID)}><i className="fa-solid fa-play" /></button>
                    <button className={btnDanger} onClick={() => onRemove(c.ID)}><i className="fa-solid fa-trash" /></button></>
              }
              <button className={"ml-2 " + btn} onClick={() => onLogs(c.ID, c.Name)}><i className="fa-solid fa-file-lines" /></button>
            </td>
          </tr>
        )
      })}
    </>
  )
}

function LogModal({ id, name, onClose }: { id: string; name: string; onClose: () => void }) {
  const [lines, setLines] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    const es = new EventSource(`/api/containers/logs?id=${id}`)
    es.onmessage = (e) => {
      setLines(prev => [...prev, JSON.parse(e.data)])
    }
    return () => es.close()
  }, [id])

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView()
  }, [lines, autoScroll])

  function handleScroll(e: React.UIEvent<HTMLPreElement>) {
    const el = e.currentTarget
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-zinc-900 rounded-lg w-[80vw] h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-zinc-700">
          <span className="font-bold">Logs — {name.replace('/', '')}</span>
          <span>
            <button className={btn} onClick={async () => {
              await fetch('/api/save-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: name.replace('/', '') + '.log', content: lines.join('') })
              })
            }}><i className="fa-solid fa-download" /> Save</button>
            <button className={"ml-2 " + btn} onClick={onClose}><i className="fa-solid fa-xmark" /></button>
          </span>
        </div>
        <pre className="flex-1 overflow-auto p-3 m-0 text-xs text-zinc-300 whitespace-pre-wrap" onScroll={handleScroll}>
          {lines.join('')}
          <div ref={bottomRef} />
        </pre>
      </div>
    </div>
  )
}
