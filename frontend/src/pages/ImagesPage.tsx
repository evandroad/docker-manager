import { useState, useEffect, useRef } from 'react'
import type { ImageInfo } from '../types'
import type { PullProgress } from '../api'
import { fetchImages, removeImage, tagImage, pullImage, exportImage, importImage } from '../api'
import { useSort } from '../useSort'
import { useConfirm, useAlert } from '../components/ConfirmModal'
import TagModal from '../components/TagModal'
import PullModal from '../components/PullModal'
import ImageDetailPanel from '../components/ImageDetailPanel'
import { useFilter } from '../useFilter'

export default function ImagesPage() {
  const [images, setImages] = useState<ImageInfo[]>([])
  const { sorted, toggleSort, icon } = useSort(images, 'Tags')
  const { filtered, input: filterInput } = useFilter(sorted)
  const confirm = useConfirm()
  const showAlert = useAlert()
  const [tagTarget, setTagTarget] = useState<string[] | null>(null)
  const [showPull, setShowPull] = useState(false)
  const [inspectTarget, setInspectTarget] = useState<{ id: string; name: string } | null>(null)
  const [pulling, setPulling] = useState('')
  const [pullLayers, setPullLayers] = useState<Record<string, PullProgress>>({})
  const [pullStatus, setPullStatus] = useState('')
  const [showProgress, setShowProgress] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchImages().then(setImages)
  }, [])

  function handleRemove(id: string, name: string) {
    confirm({ message: `Remove image "${name}"?`, onConfirm: async () => {
      const res = await removeImage(id)
      if (res === true) setImages(prev => prev.filter(img => img.ID !== id))
      else showAlert('Error: ' + res)
    }})
  }

  async function doTag(source: string, newTag: string, keep: boolean) {
    setTagTarget(null)
    if (source === newTag && !keep) return
    const res = await tagImage(source, newTag, keep)
    if (res === true) fetchImages().then(setImages)
    else showAlert('Error: ' + res)
  }

  async function doDeleteTag(tag: string) {
    setTagTarget(null)
    const res = await removeImage(tag)
    if (res === true) fetchImages().then(setImages)
    else showAlert('Error: ' + res)
  }

  async function handlePull(ref: string) {
    setShowPull(false)
    setPulling(ref)
    setPullLayers({})
    setPullStatus('')
    setShowProgress(true)
    const res = await pullImage(ref, (msg) => {
      if (msg.id) {
        setPullLayers(prev => ({ ...prev, [msg.id!]: msg }))
      } else {
        setPullStatus(msg.status)
      }
    })
    setPulling('')
    if (res === true) fetchImages().then(setImages)
    else showAlert('Error: ' + res)
  }

  const th = "bg-zinc-700 p-2 text-left cursor-pointer select-none hover:bg-zinc-600"

  return (
    <>
    {showPull && <PullModal onPull={handlePull} onCancel={() => setShowPull(false)} />}
    {tagTarget && <TagModal tags={tagTarget} onConfirm={doTag} onDelete={doDeleteTag} onCancel={() => setTagTarget(null)} />}
    {inspectTarget && <ImageDetailPanel id={inspectTarget.id} name={inspectTarget.name} onClose={() => setInspectTarget(null)} />}

    {showProgress && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => !pulling && setShowProgress(false)}>
        <div className="bg-zinc-800 rounded-lg p-5 w-[500px] max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <h2 className="text-lg font-semibold mb-3">
            {pulling ? `Pulling ${pulling}…` : 'Pull complete'}
          </h2>
          {pullStatus && <div className="text-xs text-zinc-400 mb-2">{pullStatus}</div>}
          <div className="overflow-y-auto flex-1 min-h-0 font-mono text-xs" ref={progressRef}>
            {Object.entries(pullLayers).map(([id, l]) => (
              <div key={id} className="grid grid-cols-[100px_130px_1fr] gap-1 py-0.5">
                <span className="text-zinc-400 truncate">{id}</span>
                <span className="truncate">{l.status}</span>
                <span className="text-zinc-500 truncate">{l.progress || ''}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4 pt-3 border-t border-zinc-700">
            <button className="px-4 py-1.5 text-sm bg-zinc-700 rounded text-white hover:bg-zinc-600 cursor-pointer" onClick={() => setShowProgress(false)}>
              {pulling ? 'Hide' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="mb-3 flex items-center gap-2">
      <button className="px-3 py-1.5 text-sm bg-blue-900/80 border-none rounded-md text-white cursor-pointer hover:bg-blue-800/80 disabled:opacity-50" disabled={!!pulling} onClick={() => setShowPull(true)} title="Search and pull image from Docker Hub">
        <i className="fa-solid fa-download mr-1" /> Pull Image
      </button>
      <button className="px-3 py-1.5 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" title="Import image from .tar file" onClick={async () => {
        const res = await importImage()
        if (res === true) { showAlert('Image imported successfully', 'success'); fetchImages().then(setImages) }
        else if (res) showAlert('Error: ' + res)
      }}>
        <i className="fa-solid fa-file-import mr-1" /> Import
      </button>
      {pulling && (
        <button className="px-3 py-1.5 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" onClick={() => setShowProgress(true)}>
          <i className="fa-solid fa-spinner fa-spin mr-1" /> {pulling}
        </button>
      )}
      {filterInput}
    </div>
    <table className="w-full border-separate border-spacing-0 bg-zinc-800 text-sm rounded-lg overflow-hidden">
      <thead>
        <tr>
          <th className={th} onClick={() => toggleSort('ID')}>ID{icon('ID')}</th>
          <th className={th} onClick={() => toggleSort('Tags')}>Tags{icon('Tags')}</th>
          <th className={th} onClick={() => toggleSort('Size')}>Size{icon('Size')}</th>
          <th className={th} onClick={() => toggleSort('Created')}>Created{icon('Created')}</th>
          <th className={th} onClick={() => toggleSort('UsedBy')}>Containers{icon('UsedBy')}</th>
          <th className="bg-zinc-700 p-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map(img => (
          <tr key={img.ID}>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{img.ID}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              {img.Tags?.length ? img.Tags.join(', ') : '<none>'}
            </td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{img.Size}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              {new Date(img.Created * 1000).toLocaleString('pt-BR')}
            </td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              {img.UsedBy?.length ? img.UsedBy.map(n => n.replace('/', '')).join(', ') : '—'}
            </td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              <button className="px-2.5 py-1.5 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" title="Inspect image" onClick={() => setInspectTarget({ id: img.ID, name: img.Tags?.[0] || img.ID })}><i className="text-base fa-solid fa-circle-info" /></button>
              <button className="ml-2 px-2.5 py-1.5 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" title="Export image to .tar file" onClick={async () => { const r = await exportImage(img.Tags?.[0] || img.ID); if (r === true) showAlert('Image exported successfully', 'success'); else if (r) showAlert('Error: ' + r) }}><i className="text-base fa-solid fa-file-export" /></button>
              <button className="ml-2 px-2.5 py-1.5 text-sm bg-zinc-700 border-none rounded-md text-white cursor-pointer hover:bg-zinc-600" title="Edit tags" onClick={() => setTagTarget(img.Tags?.length ? img.Tags : [])}><i className="text-base fa-solid fa-pen" /></button>
              <button className="ml-2 px-2.5 py-1.5 text-sm bg-red-700 border-none rounded-md text-white cursor-pointer hover:bg-red-600" title="Remove image" onClick={() => handleRemove(img.ID, img.Tags?.length ? img.Tags[0] : img.ID)}><i className="text-base fa-solid fa-trash" /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  )
}
