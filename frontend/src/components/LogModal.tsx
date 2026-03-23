import { useState, useEffect, useRef } from 'react'

const btn = "px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600"

const ansiColors: Record<number, string> = {
  30: '#63636e', 31: '#b07070', 32: '#6a9e7e', 33: '#a89860',
  34: '#7088a8', 35: '#8878a0', 36: '#5e9ea8', 37: '#8e8e96',
  90: '#7e7e88', 91: '#c08080', 92: '#7aae8e', 93: '#b8a870',
  94: '#8098b8', 95: '#9888b0', 96: '#6eaeb8', 97: '#a0a0a8',
}

function ansiToHtml(text: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  let open = false
  return esc.replace(/\x1b\[([0-9;]*)m/g, (_, codes: string) => {
    const parts = codes.split(';').map(Number)
    let close = open ? '</span>' : ''
    for (const c of parts) {
      if (c === 0 || c === 39) { open = false; return close }
      const color = ansiColors[c]
      if (color) { open = true; return close + `<span style="color:${color}">` }
      if (c === 1) { open = true; return close + '<span style="font-weight:bold">' }
    }
    return close
  }) + (open ? '</span>' : '')
}

type LogModalProps = {
  id: string
  name: string
  onClose: () => void
}

export default function LogModal({ id, name, onClose }: LogModalProps) {
  const [lines, setLines] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    const es = new EventSource(`/api/containers/logs/${id}`)
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

  const raw = lines.join('')

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
                body: JSON.stringify({ filename: name.replace('/', '') + '.log', content: raw })
              })
            }}><i className="fa-solid fa-download" /> Save</button>
            <button className={"ml-2 " + btn} onClick={onClose}><i className="fa-solid fa-xmark" /></button>
          </span>
        </div>
        <pre className="flex-1 overflow-auto p-3 m-0 text-xs text-zinc-300 whitespace-pre-wrap" onScroll={handleScroll}
          dangerouslySetInnerHTML={{ __html: ansiToHtml(raw) + '<div></div>' }} />
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
