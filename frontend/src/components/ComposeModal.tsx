import { useState, useEffect, useRef } from 'react'
import { composeUpStream, composeOpenFile } from '../api'

export default function ComposeModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [yaml, setYaml] = useState('')
  const [filePath, setFilePath] = useState('')
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const bottomRef = useRef<HTMLPreElement>(null)

  async function handleDeploy() {
    setRunning(true)
    setLogs([])
    const res = await composeUpStream(yaml, filePath || undefined, (line) => {
      setLogs(prev => [...prev, line])
    })
    setRunning(false)
    if (res === 'ok') {
      setLogs(prev => [...prev, '\n✓ Done'])
      setTimeout(onDone, 1000)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [logs])

  async function handleFile() {
    const path = await composeOpenFile()
    if (path) {
      setFilePath(path)
      setYaml('')
    }
  }

  const canDeploy = filePath || yaml.trim()

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={running ? undefined : onClose}>
      <div className="bg-zinc-900 rounded-lg w-[700px] flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-zinc-700">
          <span className="font-bold">Compose Up</span>
          <button className="px-2 py-1 text-xs bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" disabled={running} onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="p-3 flex-1 overflow-auto">
          {!running && logs.length === 0 && (
            <>
              <div className="mb-2 flex items-center gap-2">
                <button className="px-3 py-1.5 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={handleFile}>
                  <i className="fa-solid fa-folder-open mr-1" /> Open file...
                </button>
                {filePath && <span className="text-xs text-zinc-400 truncate">{filePath}</span>}
              </div>
              {!filePath && (
                <textarea
                  className="w-full h-64 bg-zinc-800 text-white text-xs font-mono border border-zinc-700 rounded-md p-2 resize-y"
                  placeholder="Or paste docker-compose.yml content here..."
                  value={yaml}
                  onChange={e => setYaml(e.target.value)}
                />
              )}
            </>
          )}
          {logs.length > 0 && (
            <pre className="bg-zinc-950 text-xs text-zinc-300 font-mono p-3 rounded-md whitespace-pre-wrap overflow-auto max-h-[50vh]">
              {logs.join('\n')}
              <span ref={bottomRef} />
            </pre>
          )}
        </div>
        <div className="flex justify-end gap-2 p-3 border-t border-zinc-700">
          {filePath && !running && logs.length === 0 && <button className="mr-auto px-3 py-1.5 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={() => setFilePath('')}>Clear file</button>}
          {!running && logs.length === 0 && (
            <>
              <button className="px-3 py-1.5 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={onClose}>Cancel</button>
              <button className="px-3 py-1.5 text-sm bg-blue-900/80 border-none rounded-md text-white cursor-pointer hover:bg-blue-800/80 disabled:opacity-50" disabled={!canDeploy} onClick={handleDeploy}>
                Deploy
              </button>
            </>
          )}
          {running && <span className="text-sm text-zinc-400"><i className="fa-solid fa-spinner fa-spin mr-1" />Deploying...</span>}
          {!running && logs.length > 0 && (
            <button className="px-3 py-1.5 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={onDone}>Close</button>
          )}
        </div>
      </div>
    </div>
  )
}
