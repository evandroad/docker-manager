import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { fetchVolumeTask, cancelVolumeTask } from './api'

const TaskContext = createContext<{
  message: string
  setMessage: (msg: string) => void
  cancel: () => void
}>({ message: '', setMessage: () => {}, cancel: () => {} })

export const useTask = () => useContext(TaskContext)

async function resumeTask(setMessage: (msg: string) => void, abortSignal: AbortSignal): Promise<void> {
  try {
    const res = await fetch('/api/volumes/task/resume', { method: 'POST', signal: abortSignal })
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop()!
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const msg = line.slice(6)
          if (msg.startsWith('DONE') || msg.startsWith('ERROR:')) {
            setMessage('')
            return
          }
          setMessage(msg)
        }
      }
    }
  } catch {}
  setMessage('')
}

export function TaskProvider({ children, hostKey }: { children: ReactNode; hostKey: string }) {
  const [message, setMessage] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  function cancel() {
    abortRef.current?.abort()
    abortRef.current = null
    setMessage('')
    cancelVolumeTask()
  }

  useEffect(() => {
    fetchVolumeTask().then(task => {
      if (task.active) {
        const label = task.type === 'export' ? 'Exporting' : 'Importing'
        const name = task.volume && task.volume.length > 20 ? task.volume.slice(0, 15) + '…' : task.volume
        setMessage(`${label} ${name}… (resuming)`)
        const ctrl = new AbortController()
        abortRef.current = ctrl
        resumeTask(setMessage, ctrl.signal)
      }
    })
  }, [hostKey])

  return (
    <TaskContext.Provider value={{ message, setMessage, cancel }}>
      {children}
    </TaskContext.Provider>
  )
}
