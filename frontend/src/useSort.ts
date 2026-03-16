import { useState, useMemo } from 'react'

type SortDir = 'asc' | 'desc' | null

export function useSort<T>(data: T[]) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  function toggleSort(key: keyof T) {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return }
    if (sortDir === 'asc') setSortDir('desc')
    else if (sortDir === 'desc') { setSortKey(null); setSortDir(null) }
  }

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data
    return [...data].sort((a, b) => {
      const va = String(a[sortKey] ?? ''), vb = String(b[sortKey] ?? '')
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
  }, [data, sortKey, sortDir])

  function icon(key: keyof T) {
    if (sortKey !== key || !sortDir) return ' ⇅'
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  return { sorted, toggleSort, icon }
}
