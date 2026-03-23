import { useState, useEffect, useRef } from 'react'

const btn = "px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600"

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
                body: JSON.stringify({ filename: name.replace('/', '') + '.log', content: lines.join('') })
              })
            }}><i className="fa-solid fa-download" /> Save</button>
            <button className={"ml-2 " + btn} onClick={onClose}><i className="fa-solid fa-xmark" /></button>
          </span>
        </div>
        <pre className="flex-1 overflow-auto p-3 m-0 text-xs text-zinc-300 whitespace-pre-wrap" onScroll={handleScroll}>
          {lines.join('')}
          <div ref={bottomRef} />
        </pre>
      </div>
    </div>
  )
}
