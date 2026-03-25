import { useState, useEffect, useRef } from 'react'
import ContainersPage from './pages/ContainersPage'
import ImagesPage from './pages/ImagesPage'
import VolumesPage from './pages/VolumesPage'
import NetworksPage from './pages/NetworksPage'
import EventsPage from './pages/EventsPage'
import DashboardPage from './pages/DashboardPage'
import { fetchHosts, saveHosts, connectHost } from './api'
import type { HostConfig } from './api'
import type { DockerEvent } from './types'
import PasswordModal from './components/PasswordModal'
import HostEditor from './components/HostEditor'
import { useAlert } from './components/ConfirmModal'

type Page = 'dashboard' | 'containers' | 'images' | 'volumes' | 'networks' | 'events'

const btn = "px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600"

function App() {
  const showAlert = useAlert()
  const pages: Page[] = ['dashboard', 'containers', 'images', 'volumes', 'networks', 'events']

  const [page, setPage] = useState<Page>('dashboard')
  const [version, setVersion] = useState('')
  const [hosts, setHosts] = useState<HostConfig[]>([])
  const [active, setActive] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [showHostEditor, setShowHostEditor] = useState(false)
  const [showHostMenu, setShowHostMenu] = useState(false)
  const hostMenuRef = useRef<HTMLDivElement>(null)
  const [dockerEvents, setDockerEvents] = useState<DockerEvent[]>([])
  const eventsRef = useRef(dockerEvents)
  eventsRef.current = dockerEvents

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (hostMenuRef.current && !hostMenuRef.current.contains(e.target as Node)) setShowHostMenu(false)
    }
    if (showHostMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showHostMenu])

  useEffect(() => {
    const es = new EventSource('/api/events')
    es.onmessage = (msg) => {
      const e: DockerEvent = JSON.parse(msg.data)
      setDockerEvents(prev => [...prev, e])
    }
    return () => es.close()
  }, [active])

  useEffect(() => {
    fetchHosts().then(data => {
      setHosts(data.hosts || [])
      setActive(data.active)
    })
    fetch('/api/version').then(r => r.json()).then(d => setVersion(d.version))
  }, [])

  function navigate(p: Page) {
    setPage(p)
  }

  const [pendingHost, setPendingHost] = useState<string | null>(null)

  async function handleConnect(name: string) {
    if (name === '') {
      setConnecting(true)
      try {
        const res = await connectHost('')
        if (res.error) showAlert(res.error)
        else setActive('')
      } catch { showAlert('Connection failed') }
      finally { setConnecting(false) }
      return
    }
    setPendingHost(name)
  }

  async function doConnect(password: string) {
    const name = pendingHost!
    setPendingHost(null)
    setConnecting(true)
    try {
      const res = await connectHost(name, password)
      if (res.error) showAlert(res.error)
      else setActive(name)
    } catch { showAlert('Connection failed') }
    finally { setConnecting(false) }
  }

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
              onClick={() => navigate(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-3 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 mb-2 flex items-center justify-between">
            Host
            <button className={btn} onClick={() => setShowHostEditor(true)}>
              <i className="fa-solid fa-gear" />
            </button>
          </div>
          <div className="relative" ref={hostMenuRef}>
            <button
              className="w-full bg-zinc-800 text-white text-sm border border-zinc-700 rounded-md p-1.5 cursor-pointer text-left flex items-center justify-between hover:bg-zinc-700"
              disabled={connecting}
              onClick={() => setShowHostMenu(v => !v)}
            >
              <span>{active || 'Local'}</span>
              <i className={`fa-solid fa-chevron-${showHostMenu ? 'up' : 'down'} text-zinc-400 text-xs`} />
            </button>
            {showHostMenu && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-zinc-800 border border-zinc-700 rounded-md overflow-hidden z-50">
                <button className={`w-full text-left px-3 py-1.5 text-sm border-none cursor-pointer ${active === '' ? 'bg-zinc-600 text-white' : 'bg-transparent text-zinc-300 hover:bg-zinc-700'}`}
                  onClick={() => { handleConnect(''); setShowHostMenu(false) }}>Local</button>
                {hosts.map(h => (
                  <button key={h.name} className={`w-full text-left px-3 py-1.5 text-sm border-none cursor-pointer ${active === h.name ? 'bg-zinc-600 text-white' : 'bg-transparent text-zinc-300 hover:bg-zinc-700'}`}
                    onClick={() => { handleConnect(h.name); setShowHostMenu(false) }}>{h.name}</button>
                ))}
              </div>
            )}
          </div>
          {connecting && <div className="text-xs text-zinc-400 mt-1"><i className="fa-solid fa-spinner fa-spin" /> Connecting...</div>}
        </div>
      </aside>

      <main className="flex-1 p-5 overflow-auto">
        {page === 'dashboard' && <DashboardPage key={active} />}
        {page === 'containers' && <ContainersPage key={active} />}
        {page === 'images' && <ImagesPage key={active} />}
        {page === 'volumes' && <VolumesPage key={active} />}
        {page === 'networks' && <NetworksPage key={active} />}
        {page === 'events' && <EventsPage events={dockerEvents} onClear={() => setDockerEvents([])} />}
      </main>

      {pendingHost && (
        <PasswordModal
          host={pendingHost}
          onConfirm={doConnect}
          onCancel={() => setPendingHost(null)}
        />
      )}

      {showHostEditor && (
        <HostEditor
          hosts={hosts}
          onSave={async (h) => { await saveHosts(h); setHosts(h); setShowHostEditor(false) }}
          onClose={() => setShowHostEditor(false)}
        />
      )}
    </div>
  )
}

export default App
