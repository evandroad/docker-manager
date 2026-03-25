import { useState, useEffect, useRef } from 'react'
import type { HostConfig } from '../api'
import { fetchHosts, saveHosts, connectHost } from '../api'
import { useAlert } from './ConfirmModal'
import PasswordModal from './PasswordModal'
import HostEditor from './HostEditor'

const btn = "px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600"

interface Props {
  onActiveChange: (name: string) => void
}

export default function HostSelector({ onActiveChange }: Props) {
  const showAlert = useAlert()
  const [hosts, setHosts] = useState<HostConfig[]>([])
  const [active, setActive] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [pendingHost, setPendingHost] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchHosts().then(data => {
      setHosts(data.hosts || [])
      setActive(data.active)
    })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  async function handleConnect(name: string) {
    if (name === '') {
      setConnecting(true)
      try {
        const res = await connectHost('')
        if (res.error) showAlert(res.error)
        else { setActive(''); onActiveChange('') }
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
      else { setActive(name); onActiveChange(name) }
    } catch { showAlert('Connection failed') }
    finally { setConnecting(false) }
  }

  return (
    <>
    <div className="mt-auto p-3 border-t border-zinc-800">
      <div className="text-xs text-zinc-500 mb-2 flex items-center justify-between">
        Host
        <button className={btn} onClick={() => setShowEditor(true)}>
          <i className="fa-solid fa-gear" />
        </button>
      </div>
      <div className="relative" ref={menuRef}>
        <button
          className="w-full bg-zinc-800 text-white text-sm border border-zinc-700 rounded-md p-1.5 cursor-pointer text-left flex items-center justify-between hover:bg-zinc-700"
          disabled={connecting}
          onClick={() => setShowMenu(v => !v)}
        >
          <span>{active || 'Local'}</span>
          <i className={`fa-solid fa-chevron-${showMenu ? 'up' : 'down'} text-zinc-400 text-xs`} />
        </button>
        {showMenu && (
          <div className="absolute bottom-full left-0 w-full mb-1 bg-zinc-800 border border-zinc-700 rounded-md overflow-hidden z-50">
            <button className={`w-full text-left px-3 py-1.5 text-sm border-none cursor-pointer ${active === '' ? 'bg-zinc-600 text-white' : 'bg-transparent text-zinc-300 hover:bg-zinc-700'}`}
              onClick={() => { handleConnect(''); setShowMenu(false) }}>Local</button>
            {hosts.map(h => (
              <button key={h.name} className={`w-full text-left px-3 py-1.5 text-sm border-none cursor-pointer ${active === h.name ? 'bg-zinc-600 text-white' : 'bg-transparent text-zinc-300 hover:bg-zinc-700'}`}
                onClick={() => { handleConnect(h.name); setShowMenu(false) }}>{h.name}</button>
            ))}
          </div>
        )}
      </div>
      {connecting && <div className="text-xs text-zinc-400 mt-1"><i className="fa-solid fa-spinner fa-spin" /> Connecting...</div>}
    </div>

    {pendingHost && <PasswordModal host={pendingHost} onConfirm={doConnect} onCancel={() => setPendingHost(null)} />}
    {showEditor && <HostEditor hosts={hosts} onSave={async (h) => { await saveHosts(h); setHosts(h); setShowEditor(false) }} onClose={() => setShowEditor(false)} />}
    </>
  )
}
