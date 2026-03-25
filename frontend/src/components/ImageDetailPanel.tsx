import { useState, useEffect } from 'react'
import type { ImageDetail } from '../api'
import { fetchImageDetail } from '../api'

interface Props {
  id: string
  name: string
  onClose: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-xs font-semibold text-zinc-400 uppercase mb-1">{title}</div>
      {children}
    </div>
  )
}

export default function ImageDetailPanel({ id, name, onClose }: Props) {
  const [detail, setDetail] = useState<ImageDetail | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetchImageDetail(id).then(setDetail)
    requestAnimationFrame(() => setVisible(true))
  }, [id])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  return (
    <>
    <div className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
    <div className={`fixed top-0 right-0 h-full w-[450px] bg-zinc-900 border-l border-zinc-700 z-40 flex flex-col shadow-2xl transition-transform duration-200 ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between p-4 border-b border-zinc-700">
        <div className="font-semibold truncate">{name}</div>
        <button className="text-zinc-400 hover:text-white cursor-pointer text-lg" onClick={handleClose}>✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-xs font-mono">
        {!detail ? <div className="text-zinc-400">Loading…</div> : <>
          <Section title="Info">
            <div className="py-0.5"><span className="text-zinc-400">OS/Arch:</span> {detail.os}/{detail.arch}</div>
            <div className="py-0.5"><span className="text-zinc-400">Size:</span> {detail.size}</div>
            <div className="py-0.5"><span className="text-zinc-400">Created:</span> {new Date(detail.created).toLocaleString('pt-BR')}</div>
            <div className="py-0.5"><span className="text-zinc-400">ID:</span> {detail.id}</div>
          </Section>
          <Section title="CMD">
            <div className="py-0.5 break-all">{detail.cmd?.join(' ') || '—'}</div>
          </Section>
          <Section title="Environment">
            {detail.env?.length ? detail.env.map((e, i) => <div key={i} className="py-0.5 break-all">{e}</div>) : <div className="text-zinc-500">—</div>}
          </Section>
          <Section title={`Layers (${detail.layers?.length || 0})`}>
            {detail.layers?.length ? detail.layers.map((l, i) => (
              <div key={i} className="py-0.5 break-all text-zinc-400">{l.slice(7, 19)}</div>
            )) : <div className="text-zinc-500">—</div>}
          </Section>
          <Section title="Build History">
            {detail.history?.length ? detail.history.map((h, i) => (
              <div key={i} className="py-1 border-b border-zinc-800">
                <div className="break-all">{h.created_by}</div>
                <div className="text-zinc-500 mt-0.5">{h.size} — {new Date(h.created * 1000).toLocaleString('pt-BR')}</div>
              </div>
            )) : <div className="text-zinc-500">—</div>}
          </Section>
        </>}
      </div>
    </div>
    </>
  )
}
