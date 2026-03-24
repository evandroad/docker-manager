import { useState, useEffect, useRef } from 'react'
import type { HubSearchResult } from '../api'
import { searchHub, searchHubTags } from '../api'

interface Props {
  onPull: (ref: string) => void
  onCancel: () => void
}

export default function PullModal({ onPull, onCancel }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<HubSearchResult[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [tags, setTags] = useState<{ name: string; size: string }[]>([])
  const [loadingTags, setLoadingTags] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [tagFilter, setTagFilter] = useState('')
  const [tagFilters, setTagFilters] = useState<string[]>([])

  useEffect(() => {
    clearTimeout(timer.current)
    if (!query.trim()) { setResults([]); return }
    timer.current = setTimeout(() => {
      searchHub(query.trim()).then(setResults)
    }, 400)
  }, [query])

  function selectImage(name: string) {
    setSelected(name)
    setTagFilter('')
    setTagFilters([])
    setLoadingTags(true)
    searchHubTags(name).then(t => { setTags(t); setLoadingTags(false) })
  }

  function formatStars(n: number) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-zinc-800 rounded-lg p-5 w-[540px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-3">Pull Image</h2>
        <input
          className="w-full p-2 rounded bg-zinc-700 text-white border border-zinc-600 outline-none mb-3"
          placeholder="Search Docker Hub…"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          autoFocus
        />

        {!selected && results.length > 0 && (
          <div className="overflow-y-auto flex-1 min-h-0">
            {results.map(r => (
              <div key={r.name} className="flex items-center gap-2 p-2 hover:bg-zinc-700 rounded cursor-pointer" onClick={() => selectImage(r.name)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{r.name}</span>
                    {r.official && <span className="text-[10px] px-1.5 py-0.5 bg-blue-600 rounded text-white shrink-0">official</span>}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">{r.description}</div>
                </div>
                <span className="text-xs text-zinc-400 shrink-0">★ {formatStars(r.stars)}</span>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <button className="text-xs text-blue-400 hover:underline mb-2" onClick={() => setSelected(null)}>← back to results</button>
            <div className="text-sm font-medium mb-2">{selected} — select a tag:</div>
            {loadingTags ? <div className="text-sm text-zinc-400">Loading tags…</div> : (<>
              <input
                className="w-full p-1.5 rounded bg-zinc-700 text-white border border-zinc-600 outline-none mb-2 text-xs"
                placeholder="Filter tags…"
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && tagFilter.trim()) {
                    setTagFilters(prev => [...prev, tagFilter.trim()])
                    setTagFilter('')
                  }
                }}
              />
              {tagFilters.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tagFilters.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-900/80 rounded text-white">
                      {f}
                      <button className="hover:text-red-400 cursor-pointer" onClick={() => setTagFilters(prev => prev.filter((_, j) => j !== i))}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {tags.filter(t => [...tagFilters, tagFilter].every(f => !f || t.name.includes(f))).map(tag => (
                  <button key={tag.name} className="px-2.5 py-1 text-xs bg-zinc-700 rounded hover:bg-blue-600 text-white cursor-pointer" onClick={() => onPull(selected + ':' + tag.name)}>
                    {tag.name} <span className="text-zinc-400">({tag.size})</span>
                  </button>
                ))}
              </div>
            </>)}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-700">
          <button className="px-4 py-1.5 text-sm bg-zinc-700 rounded text-white hover:bg-zinc-600" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
