import type { ContainerInfo, ImageInfo } from './types'

export async function fetchContainers(): Promise<ContainerInfo[]> {
  const res = await fetch('/api/containers')
  return res.json()
}

export async function fetchImages(): Promise<ImageInfo[]> {
  const res = await fetch('/api/images')
  return res.json()
}

export async function startContainer(id: string) {
  await fetch(`/api/containers/start?id=${id}`)
}

export async function stopContainer(id: string) {
  await fetch(`/api/containers/stop?id=${id}`)
}
