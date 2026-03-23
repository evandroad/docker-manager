import { useState, useEffect, useCallback } from 'react'
import type { ContainerInfo } from '../types'
import { fetchContainers, startContainer, stopContainer, restartContainer, removeContainer, loadPrefs, savePrefs } from '../api'
import { useDockerEvents } from '../useDockerEvents'
import { useContainerStats } from '../useContainerStats'
import { useConfirm } from '../components/ConfirmModal'
import ComposeModal from '../components/ComposeModal'
import LogModal from '../components/LogModal'
import GroupRows from '../components/GroupRows'

function groupByProject(list: ContainerInfo[]) {
  const groups: Record<string, ContainerInfo[]> = {}
  for (const c of list) {
    const key = c.Project || 'standalone'
    if (!groups[key]) groups[key] = []
    groups[key].push(c)
  }
  return groups
}

export default function ContainersPage() {
  const [containers, setContainers] = useState<ContainerInfo[]>([])
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [logTarget, setLogTarget] = useState<{ id: string; name: string } | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const confirm = useConfirm()
  const stats = useContainerStats()

  useEffect(() => {
    fetchContainers().then(setContainers)
    loadPrefs().then(p => {
      if (p.groupState) setCollapsed(p.groupState)
    })
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
      savePrefs({ groupState: next })
      return next
    })
  }

  async function handleStart(id: string) {
    setLoading(prev => ({ ...prev, [id]: true }))
    await startContainer(id)
  }

  function handleStop(id: string, name: string) {
    confirm({ message: `Stop container "${name}"?`, onConfirm: async () => {
      setLoading(prev => ({ ...prev, [id]: true }))
      await stopContainer(id)
    }})
  }

  async function handleRestart(id: string) {
    setLoading(prev => ({ ...prev, [id]: true }))
    await restartContainer(id)
  }

  function handleRemove(id: string, name: string) {
    confirm({ message: `Remove container "${name}"?`, onConfirm: () => removeContainer(id) })
  }

  const groups = groupByProject(containers)

  return (
    <>
    {logTarget && <LogModal id={logTarget.id} name={logTarget.name} onClose={() => setLogTarget(null)} />}
    {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onDone={() => { setShowCompose(false); fetchContainers().then(setContainers) }} />}
    <div className="mb-3">
      <button className="px-3 py-1.5 text-sm bg-blue-900/80 border-none rounded-md text-white cursor-pointer hover:bg-blue-800/80" onClick={() => setShowCompose(true)}>
        <i className="fa-solid fa-upload mr-1" /> Compose Up
      </button>
    </div>
    <table className="w-full border-collapse bg-zinc-800 text-sm">
      <thead>
        <tr>
          <th className="bg-zinc-700 p-1.5 text-left">ID</th>
          <th className="bg-zinc-700 p-1.5 text-left">Name</th>
          <th className="bg-zinc-700 p-1.5 text-left">Image</th>
          <th className="bg-zinc-700 p-1.5 text-left">Created</th>
          <th className="bg-zinc-700 p-1.5 text-left">Status</th>
          <th className="bg-zinc-700 p-1.5 text-left">CPU</th>
          <th className="bg-zinc-700 p-1.5 text-left">MEM</th>
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
              stats={stats}
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
