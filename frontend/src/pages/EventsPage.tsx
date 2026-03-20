import { useEffect, useRef, useState } from 'react'
import type { DockerEvent } from '../types'

type EventsPageProps = {
  events: DockerEvent[]
  onClear: () => void
}

export default function EventsPage({ events, onClear }: EventsPageProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView()
  }, [events, autoScroll])

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40)
  }

  function actionColor(action: string) {
    if (action === 'start' || action === 'create') return 'text-green-400'
    if (action === 'die' || action === 'stop' || action === 'kill' || action === 'destroy') return 'text-red-400'
    if (action === 'pull' || action === 'push') return 'text-blue-400'
    return 'text-zinc-300'
  }

  function typeIcon(type: string) {
    if (type === 'container') return 'fa-box'
    if (type === 'image') return 'fa-layer-group'
    if (type === 'network') return 'fa-network-wired'
    if (type === 'volume') return 'fa-hard-drive'
    return 'fa-circle'
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-zinc-400">{events.length} eventos</span>
        <div className="flex gap-2">
          <button
            className="px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600"
            onClick={() => {
              const content = events.map(ev =>
                `${new Date(ev.Time * 1000).toLocaleTimeString()} ${ev.Type} ${ev.Action} ${ev.Name || ev.ID}`
              ).join('\n')
              fetch('/api/save-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: 'docker-events.log', content })
              })
            }}
          >
            <i className="fa-solid fa-download mr-1" /> Salvar
          </button>
          <button
            className="px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600"
            onClick={onClear}
          >
            <i className="fa-solid fa-trash mr-1" /> Limpar
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto" onScroll={handleScroll}>
        <table className="w-full border-collapse bg-zinc-800 text-sm">
          <thead>
            <tr>
              <th className="bg-zinc-700 p-2 text-left w-24">Hora</th>
              <th className="bg-zinc-700 p-2 text-left w-10" />
              <th className="bg-zinc-700 p-2 text-left w-24">Tipo</th>
              <th className="bg-zinc-700 p-2 text-left w-20">Ação</th>
              <th className="bg-zinc-700 p-2 text-left">Nome</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-zinc-500">Aguardando eventos...</td></tr>
            )}
            {events.map((ev, i) => (
              <tr key={i} className="hover:bg-zinc-700">
                <td className="p-2 text-xs text-zinc-500 border-t border-zinc-700 font-mono">
                  {new Date(ev.Time * 1000).toLocaleTimeString()}
                </td>
                <td className="p-2 text-zinc-400 border-t border-zinc-700 text-center">
                  <i className={`fa-solid ${typeIcon(ev.Type)}`} />
                </td>
                <td className="p-2 text-zinc-400 border-t border-zinc-700">{ev.Type}</td>
                <td className={`p-2 border-t border-zinc-700 ${actionColor(ev.Action)}`}>{ev.Action}</td>
                <td className="p-2 text-zinc-300 border-t border-zinc-700 truncate max-w-0">{ev.Name || ev.ID?.substring(0, 12)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
