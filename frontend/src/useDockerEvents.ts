import { useEffect, useRef } from 'react'
import type { DockerEvent } from './types'

export function useDockerEvents(onEvent: (e: DockerEvent) => void) {
  const callbackRef = useRef(onEvent)
  callbackRef.current = onEvent

  useEffect(() => {
    const es = new EventSource('/events')
    es.onmessage = (msg) => {
      const e: DockerEvent = JSON.parse(msg.data)
      if (e.Type === 'container') {
        callbackRef.current(e)
      }
    }
    return () => es.close()
  }, [])
}
