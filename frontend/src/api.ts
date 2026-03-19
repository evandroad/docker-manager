import type { ContainerInfo, ImageInfo, VolumeInfo, NetworkInfo } from './types'

export async function fetchContainers(): Promise<ContainerInfo[]> {
  const res = await fetch('/api/containers')
  return (await res.json()) || []
}

export async function fetchImages(): Promise<ImageInfo[]> {
  const res = await fetch('/api/images')
  return (await res.json()) || []
}

export async function fetchVolumes(): Promise<VolumeInfo[]> {
  const res = await fetch('/api/volumes')
  return (await res.json()) || []
}

export async function fetchNetworks(): Promise<NetworkInfo[]> {
  const res = await fetch('/api/networks')
  return (await res.json()) || []
}

export async function startContainer(id: string) {
  await fetch(`/api/containers/start?id=${id}`)
}

export async function stopContainer(id: string) {
  await fetch(`/api/containers/stop?id=${id}`)
}

export async function restartContainer(id: string) {
  await fetch(`/api/containers/restart?id=${id}`)
}

export async function removeContainer(id: string) {
  await fetch(`/api/containers/remove?id=${id}`)
}

export async function composeStart(project: string) {
  await fetch(`/api/compose/start?project=${encodeURIComponent(project)}`)
}

export async function composeStop(project: string) {
  await fetch(`/api/compose/stop?project=${encodeURIComponent(project)}`)
}

export async function removeImage(id: string): Promise<true | string> {
  const res = await fetch(`/api/images/remove?id=${id}`)
  const data = await res.json()
  return data.result === 'ok' ? true : data.result
}

export async function removeVolume(name: string): Promise<true | string> {
  const res = await fetch(`/api/volumes/remove?name=${encodeURIComponent(name)}`)
  const data = await res.json()
  return data.result === 'ok' ? true : data.result
}

export async function removeNetwork(id: string): Promise<true | string> {
  const res = await fetch(`/api/networks/remove?id=${encodeURIComponent(id)}`)
  const data = await res.json()
  return data.result === 'ok' ? true : data.result
}

export interface HostConfig {
  name: string
  ssh_addr: string
  ssh_port: string
}

export async function fetchHosts(): Promise<{ hosts: HostConfig[] | null; active: string }> {
  const res = await fetch('/api/hosts')
  return res.json()
}

export async function saveHosts(hosts: HostConfig[]) {
  await fetch('/api/hosts/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(hosts),
  })
}

export async function connectHost(name: string, password?: string) {
  let url = `/api/hosts/connect?name=${encodeURIComponent(name)}`
  if (password) url += `&password=${encodeURIComponent(password)}`
  const res = await fetch(url)
  return res.json()
}
