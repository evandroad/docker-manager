import { useState, useEffect, useRef } from 'react'
import ContainersPage from './pages/ContainersPage'
import ImagesPage from './pages/ImagesPage'
import VolumesPage from './pages/VolumesPage'
import NetworksPage from './pages/NetworksPage'
import EventsPage from './pages/EventsPage'
import DashboardPage from './pages/DashboardPage'
import HostSelector from './components/HostSelector'
import type { DockerEvent } from './types'

type Page = 'dashboard' | 'containers' | 'images' | 'volumes' | 'networks' | 'events'

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
  }, [])

  return (
    <div className="min-h-screen bg-zinc-900 text-white font-sans flex">
      <aside className="w-52 bg-zinc-950 flex flex-col shrink-0">
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
      </aside>

      <main className="flex-1 p-5 overflow-auto">
        {page === 'dashboard' && <DashboardPage key={active} />}
        {page === 'containers' && <ContainersPage key={active} />}
        {page === 'images' && <ImagesPage key={active} />}
        {page === 'volumes' && <VolumesPage key={active} />}
        {page === 'networks' && <NetworksPage key={active} />}
        {page === 'events' && <EventsPage events={dockerEvents} onClear={() => setDockerEvents([])} />}
      </main>
    </div>
  )
}

export default App
