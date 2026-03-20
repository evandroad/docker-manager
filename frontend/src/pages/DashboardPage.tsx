import { useState, useEffect } from 'react'
import type { DashboardInfo } from '../types'
import { fetchDashboard } from '../api'

export default function DashboardPage() {
  const [info, setInfo] = useState<DashboardInfo | null>(null)

  useEffect(() => {
    fetchDashboard().then(setInfo)
  }, [])

  if (!info) return <div className="text-zinc-500">Carregando...</div>

  const cards = [
    { label: 'Images', value: info.Images, icon: 'fa-layer-group', color: 'border-purple-500' },
    { label: 'Volumes', value: info.Volumes, icon: 'fa-hard-drive', color: 'border-yellow-500' },
    { label: 'Networks', value: info.Networks, icon: 'fa-network-wired', color: 'border-cyan-500' },
  ]

  return (
    <div>
      <div className="bg-zinc-800 rounded-lg p-4 border-l-4 border-zinc-500 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-zinc-400 text-xs">Sistema</div>
          <i className="fa-solid fa-server text-2xl text-zinc-600" />
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-zinc-500">Docker</span>
            <div className="text-lg font-light">{info.DockerVersion}</div>
          </div>
          <div>
            <span className="text-zinc-500">OS</span>
            <div className="text-lg font-light">{info.OS}</div>
          </div>
          <div>
            <span className="text-zinc-500">Arch</span>
            <div className="text-lg font-light">{info.Architecture}</div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-800 rounded-lg p-4 border-l-4 border-blue-500 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-zinc-400 text-xs">Containers</div>
          <i className="fa-solid fa-box text-2xl text-zinc-600" />
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-zinc-500">Total</span>
            <div className="text-lg font-light">{info.Containers}</div>
          </div>
          <div>
            <span className="text-green-400">Running</span>
            <div className="text-lg font-light">{info.Running}</div>
          </div>
          <div>
            <span className="text-red-400">Stopped</span>
            <div className="text-lg font-light">{info.Stopped}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {cards.map(c => (
          <div key={c.label} className={`bg-zinc-800 rounded-lg p-4 border-l-4 ${c.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-zinc-400 text-xs mb-1">{c.label}</div>
                <div className="text-3xl font-light">{c.value}</div>
              </div>
              <i className={`fa-solid ${c.icon} text-2xl text-zinc-600`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
