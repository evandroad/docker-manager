import { useState, useEffect, useRef } from 'react'
import ContainersPage from './pages/ContainersPage'
import ImagesPage from './pages/ImagesPage'
import VolumesPage from './pages/VolumesPage'
import NetworksPage from './pages/NetworksPage'
import EventsPage from './pages/EventsPage'
import DashboardPage from './pages/DashboardPage'
import HostSelector from './components/HostSelector'
import { useTask, TaskProvider } from './useTask'
import { loadPrefs, savePrefs } from './api'
import type { DockerEvent } from './types'

type Page = 'dashboard' | 'containers' | 'images' | 'volumes' | 'networks' | 'events'

function TaskStatus() {
  const { message, cancel } = useTask()
  if (!message) return null
  return (
    <div className="px-3 py-2 border-t border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
      <i className="fa-solid fa-spinner fa-spin" />
      <span className="flex-1 truncate">{message}</span>
      <button className="text-red-400 hover:text-red-300 cursor-pointer" title="Cancel" onClick={cancel}>✕</button>
    </div>
  )
}

function App() {
  const pages: Page[] = ['dashboard', 'containers', 'images', 'volumes', 'networks', 'events']

  const [page, setPage] = useState<Page>('dashboard')
  const [version, setVersion] = useState('')
  const [active, setActive] = useState('')
  const [dockerEvents, setDockerEvents] = useState<DockerEvent[]>([])
  const eventsRef = useRef(dockerEvents)
  eventsRef.current = dockerEvents

  useEffect(() => {
    const es = new EventSource('/api/events')
    es.onmessage = (msg) => {
      const e: DockerEvent = JSON.parse(msg.data)
      setDockerEvents(prev => [...prev, e])
    }
    return () => es.close()
  }, [active])

  useEffect(() => {
    fetch('/api/version').then(r => r.json()).then(d => setVersion(d.version))
    loadPrefs().then(p => { if (p.sidebarWidth) setSidebarWidth(p.sidebarWidth) })
  }, [])

  const [sidebarWidth, setSidebarWidth] = useState(208)
  const dragging = useRef(false)

  function onMouseDown() {
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (e: MouseEvent) => {
      if (dragging.current) setSidebarWidth(Math.max(160, Math.min(400, e.clientX)))
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      setSidebarWidth(w => { savePrefs({ sidebarWidth: w }); return w })
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <TaskProvider hostKey={active}>
    <div className="min-h-screen bg-zinc-900 text-white font-sans flex">
      <aside className="bg-zinc-950 flex flex-col shrink-0" style={{ width: sidebarWidth }}>
        <div className="p-4 text-xl font-bold">Docker Manager <span className="text-xs font-normal text-zinc-500">{version}</span></div>
        <nav className="flex flex-col gap-1 px-2">
          {pages.map(p => (
            <button
              key={p}
              className={`text-left text-base px-3 py-2 rounded-md border-none cursor-pointer ${
                p === page ? 'bg-zinc-700 text-white font-bold' : 'bg-transparent text-zinc-400 hover:bg-zinc-800'
              }`}
              onClick={() => setPage(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </nav>
        <HostSelector onActiveChange={setActive} />
        <TaskStatus />
      </aside>
      <div className="w-1 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500/50" onMouseDown={onMouseDown} />
      <main className="flex-1 p-5 overflow-auto">
        {page === 'dashboard' && <DashboardPage key={active} />}
        {page === 'containers' && <ContainersPage key={active} />}
        {page === 'images' && <ImagesPage key={active} />}
        {page === 'volumes' && <VolumesPage key={active} />}
        {page === 'networks' && <NetworksPage key={active} />}
        {page === 'events' && <EventsPage events={dockerEvents} onClear={() => setDockerEvents([])} />}
      </main>
    </div>
    </TaskProvider>
  )
}

export default App
