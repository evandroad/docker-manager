import { useState, useEffect } from 'react'
import type { ImageInfo } from '../types'
import { fetchImages, removeImage } from '../api'
import { useSort } from '../useSort'

export default function ImagesPage() {
  const [images, setImages] = useState<ImageInfo[]>([])
  const { sorted, toggleSort, icon } = useSort(images)

  useEffect(() => {
    fetchImages().then(setImages)
  }, [])

  async function handleRemove(id: string) {
    if (!confirm('Remove image?')) return
    const res = await removeImage(id)
    if (res === true) setImages(prev => prev.filter(img => img.ID !== id))
    else alert('Error: ' + res)
  }

  const th = "bg-slate-700 p-2.5 text-left cursor-pointer select-none hover:bg-slate-600"

  return (
    <table className="w-full border-collapse mt-4 bg-slate-800 text-sm">
      <thead>
        <tr>
          <th className={th} onClick={() => toggleSort('ID')}>ID{icon('ID')}</th>
          <th className={th} onClick={() => toggleSort('Tags')}>Tags{icon('Tags')}</th>
          <th className={th} onClick={() => toggleSort('Size')}>Size{icon('Size')}</th>
          <th className={th} onClick={() => toggleSort('Created')}>Created{icon('Created')}</th>
          <th className={th} onClick={() => toggleSort('UsedBy')}>Containers{icon('UsedBy')}</th>
          <th className="bg-slate-700 p-2.5 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(img => (
          <tr key={img.ID}>
            <td className="p-2.5 border-t border-slate-600">{img.ID}</td>
            <td className="p-2.5 border-t border-slate-600">
              {img.Tags?.length ? img.Tags.join(', ') : '<none>'}
            </td>
            <td className="p-2.5 border-t border-slate-600">{img.Size}</td>
            <td className="p-2.5 border-t border-slate-600">
              {new Date(img.Created * 1000).toLocaleDateString()}
            </td>
            <td className="p-2.5 border-t border-slate-600 text-xs">
              {img.UsedBy?.length ? img.UsedBy.map(n => n.replace('/', '')).join(', ') : '—'}
            </td>
            <td className="p-2.5 border-t border-slate-600">
              <button className="px-3 py-1.5 bg-red-700 border-none rounded-md text-white cursor-pointer hover:bg-red-600" onClick={() => handleRemove(img.ID)}><i className="fa-solid fa-trash" /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
