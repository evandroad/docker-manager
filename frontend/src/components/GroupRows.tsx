import { useState, useEffect } from 'react'
import type { ContainerInfo } from '../types'
import type { StatsMap } from '../useContainerStats'
import { composeDown, composeStart, composeStop } from '../api'
import { useConfirm } from './ConfirmModal'

const btn = "px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600"
const btnDanger = "ml-2 px-2 py-1 text-xs bg-red-700 border-none rounded-md text-white cursor-pointer hover:bg-red-600"

function statusColor(state: string) {
  if (state === 'running') return 'bg-green-500'
  if (state === 'exited') return 'bg-red-500'
  return 'bg-gray-500'
}

type GroupRowsProps = {
  project: string
  list: ContainerInfo[]
  open: boolean
  loading: Record<string, boolean>
  stats: StatsMap
  onToggle: () => void
  onStart: (id: string) => void
  onStop: (id: string, name: string) => void
  onRestart: (id: string) => void
  onRemove: (id: string, name: string) => void
  onRename: (id: string, name: string) => void
  onLogs: (id: string, name: string) => void
  onInspect: (id: string, name: string) => void
}

export default function GroupRows({ project, list, open, loading, stats, onToggle, onStart, onStop, onRestart, onRemove, onRename, onLogs, onInspect }: GroupRowsProps) {
  const [groupTarget, setGroupTarget] = useState<'running' | 'stopped' | null>(null)
  const allRunning = list.every(c => c.State === 'running')
  const allStopped = list.every(c => c.State !== 'running')
  const isCompose = project !== 'standalone'
  const confirm = useConfirm()

  useEffect(() => {
    if (groupTarget === 'running' && allRunning) setGroupTarget(null)
    if (groupTarget === 'stopped' && allStopped) setGroupTarget(null)
  }, [allRunning, allStopped, groupTarget])

  async function startAll() {
    setGroupTarget('running')
    if (isCompose) await composeStart(project)
    else list.filter(c => c.State !== 'running').forEach(c => onStart(c.ID))
  }

  function stopAll() {
    confirm({ message: `Stop all containers in ${project}?`, onConfirm: async () => {
      setGroupTarget('stopped')
      if (isCompose) await composeStop(project)
      else list.filter(c => c.State === 'running').forEach(c => onStop(c.ID, c.Name))
    }})
  }

  function downAll() {
    confirm({ message: `Down all containers in ${project}?`, onConfirm: async () => {
      setGroupTarget('running')
      if (isCompose) await composeDown(project)
      else list.filter(c => c.State === 'running').forEach(c => onStop(c.ID, c.Name))
    }})
  }

  const groupColor = allRunning ? 'bg-green-500' : allStopped ? 'bg-red-500' : 'bg-yellow-500'

  return (
    <>
      <tr>
        <td colSpan={8} className="p-1.5 border-t border-zinc-600">
          <div className="flex items-center justify-between">
          <span className="cursor-pointer" onClick={onToggle}>
            <span className="mr-2 text-zinc-400">{open ? '▾' : '▸'}</span>
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${groupColor}`} />
            ({list.length}) <b className='text-lg font-light'>{project}</b>
          </span>
          {groupTarget
            ? <span className="text-zinc-400"><i className="fa-solid fa-spinner fa-spin" /></span>
            : <span>
                <button className={btn} disabled={allRunning} style={{opacity: allRunning ? 0.3 : 1}} onClick={startAll}>
                  <i className="fa-solid fa-play" /> All
                </button>
                <button className={btnDanger} disabled={allRunning} style={{opacity: allRunning ? 0.3 : 1}} onClick={downAll}>
                  <i className="fa-solid fa-trash" /> All
                </button>
                <button className={"ml-2 " + btn} disabled={allStopped} style={{opacity: allStopped ? 0.3 : 1}} onClick={stopAll}>
                  <i className="fa-solid fa-stop" /> All
                </button>
              </span>
          }
          </div>
        </td>
      </tr>
      {open && list.map(c => {
        const busy = loading[c.ID]
        return (
          <tr key={c.ID}>
            <td className={`p-2 text-lg font-light border-t border-zinc-600${isCompose ? ' pl-12' : ''}`}>{c.ID}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{c.Name.replace('/', '')}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{c.Image}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{new Date(c.Created * 1000).toLocaleString('pt-BR')}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600" title={c.Status}><span className={`inline-block w-3 h-3 rounded-full mr-2 ${statusColor(c.State)}`} />{c.State}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600 text-right">{stats[c.ID] ? stats[c.ID].cpu.toFixed(1) + '%' : '-'}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600 text-right">{stats[c.ID]?.mem || '-'}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              {busy
                ? <i className="fa-solid fa-spinner fa-spin text-zinc-400" />
                : c.State === 'running'
                  ? <>
                      <button className={btn} onClick={() => onStop(c.ID, c.Name)} title="Stop container"><i className="fa-solid fa-stop" /></button>
                      <button className={'ml-2 ' + btn} onClick={() => onRestart(c.ID)} title="Restart container"><i className="fa-solid fa-rotate-right" /></button>
                    </>
                  : <>
                      <button className={btn} onClick={() => onStart(c.ID)} title="Start container"><i className="fa-solid fa-play" /></button>
                      <button className={btnDanger} onClick={() => onRemove(c.ID, c.Name)} title="Remove container"><i className="fa-solid fa-trash" /></button>
                    </>
              }
              <button className={"ml-2 " + btn} onClick={() => onLogs(c.ID, c.Name)} title="View logs"><i className="fa-solid fa-file-lines" /></button>
              <button className={"ml-2 " + btn} onClick={() => onRename(c.ID, c.Name)} title="Rename container"><i className="fa-solid fa-pen" /></button>
              <button className={"ml-2 " + btn} onClick={() => onInspect(c.ID, c.Name)} title="Inspect container"><i className="fa-solid fa-circle-info" /></button>
            </td>
          </tr>
        )
      })}
    </>
  )
}
