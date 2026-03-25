import { useState, useMemo } from 'react'

export function useFilter<T>(data: T[]) {
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    if (!filter.trim()) return data
    const q = filter.toLowerCase()
    return data.filter(item =>
      Object.values(item as Record<string, unknown>).some(v =>
        String(v ?? '').toLowerCase().includes(q)
      )
    )
  }, [data, filter])

  const input = (
    <input
      className="px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-md text-white outline-none w-52 placeholder-zinc-500"
      placeholder="Filter…"
      value={filter}
      onChange={e => setFilter(e.target.value)}
    />
  )

  return { filtered, input }
}
