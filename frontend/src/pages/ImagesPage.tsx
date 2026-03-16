import { useState, useEffect } from 'react'
import type { ImageInfo } from '../types'
import { fetchImages } from '../api'

export default function ImagesPage() {
  const [images, setImages] = useState<ImageInfo[]>([])

  useEffect(() => {
    fetchImages().then(setImages)
  }, [])

  return (
    <table className="w-full border-collapse mt-4 bg-slate-800 text-sm">
      <thead>
        <tr>
          <th className="bg-slate-700 p-2.5 text-left">ID</th>
          <th className="bg-slate-700 p-2.5 text-left">Tags</th>
          <th className="bg-slate-700 p-2.5 text-left">Size</th>
          <th className="bg-slate-700 p-2.5 text-left">Created</th>
        </tr>
      </thead>
      <tbody>
        {images.map(img => (
          <tr key={img.ID}>
            <td className="p-2.5 border-t border-slate-600">{img.ID}</td>
            <td className="p-2.5 border-t border-slate-600">
              {img.Tags?.length ? img.Tags.join(', ') : '<none>'}
            </td>
            <td className="p-2.5 border-t border-slate-600">{img.Size}</td>
            <td className="p-2.5 border-t border-slate-600">
              {new Date(img.Created * 1000).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
