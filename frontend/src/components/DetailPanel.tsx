import { useState, useEffect } from 'react'
import type { ContainerDetail } from '../api'
import { fetchContainerDetail } from '../api'

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

export default function DetailPanel({ id, name, onClose }: Props) {
  const [detail, setDetail] = useState<ContainerDetail | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetchContainerDetail(id).then(setDetail)
    requestAnimationFrame(() => setVisible(true))
  }, [id])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  return (
    <>
    <div className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />
    <div className={`fixed top-0 right-0 h-full w-[400px] bg-zinc-900 border-l border-zinc-700 z-40 flex flex-col shadow-2xl transition-transform duration-200 ${visible ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between p-4 border-b border-zinc-700">
        <div className="font-semibold truncate">{name.replace('/', '')}</div>
        <button className="text-zinc-400 hover:text-white cursor-pointer text-lg" onClick={handleClose}>✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-xs font-mono">
        {!detail ? <div className="text-zinc-400">Loading…</div> : <>
          <Section title="Ports">
            {detail.ports?.length ? detail.ports.map((p, i) => <div key={i} className="py-0.5">{p}</div>) : <div className="text-zinc-500">—</div>}
          </Section>
          <Section title="Environment">
            {detail.env?.length ? detail.env.map((e, i) => <div key={i} className="py-0.5 break-all">{e}</div>) : <div className="text-zinc-500">—</div>}
          </Section>
          <Section title="Mounts">
            {detail.mounts?.length ? detail.mounts.map((m, i) => (
              <div key={i} className="py-0.5 break-all">
                <span className="text-zinc-400">[{m.type}]</span> {m.source} → {m.dest}
              </div>
            )) : <div className="text-zinc-500">—</div>}
          </Section>
          <Section title="Networks">
            {detail.nets?.length ? detail.nets.map((n, i) => <div key={i} className="py-0.5">{n}</div>) : <div className="text-zinc-500">—</div>}
          </Section>
          <Section title="Labels">
            {detail.labels && Object.keys(detail.labels).length ? Object.entries(detail.labels).map(([k, v]) => (
              <div key={k} className="py-0.5 break-all"><span className="text-zinc-400">{k}:</span> {v}</div>
            )) : <div className="text-zinc-500">—</div>}
          </Section>
        </>}
      </div>
    </div>
    </>
  )
}
