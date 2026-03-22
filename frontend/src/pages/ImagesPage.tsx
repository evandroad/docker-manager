import { useState, useEffect } from 'react'
import type { ImageInfo } from '../types'
import { fetchImages, removeImage } from '../api'
import { useSort } from '../useSort'
import { useConfirm, useAlert } from '../components/ConfirmModal'

export default function ImagesPage() {
  const [images, setImages] = useState<ImageInfo[]>([])
  const { sorted, toggleSort, icon } = useSort(images)
  const confirm = useConfirm()
  const showAlert = useAlert()

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

  const th = "bg-zinc-700 p-2 text-left cursor-pointer select-none hover:bg-zinc-600"

  return (
    <table className="w-full border-collapse bg-zinc-800 text-sm">
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
        {sorted.map(img => (
          <tr key={img.ID}>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{img.ID}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              {img.Tags?.length ? img.Tags.join(', ') : '<none>'}
            </td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">{img.Size}</td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              {new Date(img.Created * 1000).toLocaleDateString('pt-BR')}
            </td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              {img.UsedBy?.length ? img.UsedBy.map(n => n.replace('/', '')).join(', ') : '—'}
            </td>
            <td className="p-2 text-lg font-light border-t border-zinc-600">
              <button className="px-2 py-1 text-xs bg-red-700 border-none rounded-md text-white cursor-pointer hover:bg-red-600" onClick={() => handleRemove(img.ID, img.Tags?.length ? img.Tags[0] : img.ID)}><i className="fa-solid fa-trash" /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
