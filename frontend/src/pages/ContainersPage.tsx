import { useState, useEffect, useCallback } from 'react'
import type { ContainerInfo } from '../types'
import { fetchContainers, startContainer, stopContainer, restartContainer, removeContainer, renameContainer, loadPrefs, savePrefs } from '../api'
import { useDockerEvents } from '../useDockerEvents'
import { useContainerStats } from '../useContainerStats'
import { useConfirm, useAlert } from '../components/ConfirmModal'
import ComposeModal from '../components/ComposeModal'
import LogModal from '../components/LogModal'
import RenameModal from '../components/RenameModal'
import GroupRows from '../components/GroupRows'
import DetailPanel from '../components/DetailPanel'
import { useFilter } from '../useFilter'

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
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null)
  const [inspectTarget, setInspectTarget] = useState<{ id: string; name: string } | null>(null)
  const confirm = useConfirm()
  const showAlert = useAlert()
  const stats = useContainerStats()
  const { filtered, input: filterInput } = useFilter(containers)

  useEffect(() => {
    fetchContainers().then(setContainers)
    loadPrefs().then(p => {
      if (p.groupState) setCollapsed(p.groupState)
    })
  }, [])

  useDockerEvents(useCallback((e) => {
    const id = e.ID.substring(0, 12)
    const action = e.Action
    if (action === 'create') {
      fetchContainers().then(setContainers)
      return
    }
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

  function handleRename(id: string, name: string) {
    setRenameTarget({ id, name: name.replace('/', '') })
  }

  async function doRename(newName: string) {
    const { id, name } = renameTarget!
    setRenameTarget(null)
    if (newName === name) return
    const res = await renameContainer(id, newName)
    if (res === true) fetchContainers().then(setContainers)
    else showAlert('Error: ' + res)
  }

  const groups = groupByProject(filtered)

  return (
    <>
    {logTarget && <LogModal id={logTarget.id} name={logTarget.name} onClose={() => setLogTarget(null)} />}
    {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onDone={() => { setShowCompose(false); fetchContainers().then(setContainers) }} />}
    {renameTarget && <RenameModal title="Rename Container" currentName={renameTarget.name} onConfirm={doRename} onCancel={() => setRenameTarget(null)} />}
    {inspectTarget && <DetailPanel id={inspectTarget.id} name={inspectTarget.name} onClose={() => setInspectTarget(null)} />}
    <div className="mb-3 flex gap-2">
      <button className="px-3 py-1.5 text-sm bg-blue-900/80 border-none rounded-md text-white cursor-pointer hover:bg-blue-800/80" onClick={() => setShowCompose(true)}>
        <i className="fa-solid fa-upload mr-1" /> Compose Up
      </button>
      <button className="px-3 py-1.5 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={() => fetchContainers().then(setContainers)}>
        <i className="fa-solid fa-rotate-right mr-1" /> Refresh
      </button>
      {filterInput}
    </div>
    <table className="w-full border-separate border-spacing-0 bg-zinc-800 text-sm rounded-lg overflow-hidden">
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
              onRename={handleRename}
              onLogs={(id, name) => setLogTarget({ id, name })}
              onInspect={(id, name) => setInspectTarget({ id, name })}
            />
          )
        })}
      </tbody>
    </table>
    </>
  )
}
