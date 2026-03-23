import { useState, useEffect } from 'react'

export type StatsMap = Record<string, { cpu: number; mem: string }>

export function useContainerStats() {
  const [stats, setStats] = useState<StatsMap>({})

  useEffect(() => {
    const es = new EventSource('/api/containers/stats')
    es.onmessage = (msg) => {
      const list: { id: string; cpu: number; mem: string }[] = JSON.parse(msg.data)
      const map: StatsMap = {}
      for (const s of list) map[s.id] = { cpu: s.cpu, mem: s.mem }
      setStats(map)
    }
    return () => es.close()
  }, [])

  return stats
}
