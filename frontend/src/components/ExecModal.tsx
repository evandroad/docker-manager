import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface Props {
  id: string
  name: string
  onClose: () => void
}

export default function ExecModal({ id, name, onClose }: Props) {
  const termRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const term = new Terminal({ cursorBlink: true, fontSize: 13, fontFamily: '"Ubuntu Sans Mono", "Ubuntu Mono", monospace', fontWeight: '300', theme: { background: '#18181b' } })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(termRef.current!)
    fit.fit()

    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${location.host}/api/containers/exec/${id}`)

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
    }
    ws.onmessage = (e) => term.write(e.data)
    ws.onclose = () => term.write('\r\n\x1b[90m[disconnected]\x1b[0m\r\n')
    term.onData((data) => ws.readyState === WebSocket.OPEN && ws.send(data))
    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'resize', cols, rows }))
    })

    const ro = new ResizeObserver(() => fit.fit())
    ro.observe(termRef.current!)

    return () => { ws.close(); term.dispose(); ro.disconnect() }
  }, [id])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-zinc-900 rounded-lg w-[80vw] h-[70vh] flex flex-col border border-zinc-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
          <span className="text-sm font-semibold">{name.replace('/', '')} — shell</span>
          <button className="text-zinc-400 hover:text-white cursor-pointer text-lg" onClick={onClose}>✕</button>
        </div>
        <div ref={termRef} className="flex-1 p-1 overflow-hidden" />
      </div>
    </div>
  )
}
