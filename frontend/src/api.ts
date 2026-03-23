import type { ContainerInfo, ImageInfo, VolumeInfo, NetworkInfo, DashboardInfo } from './types'

export async function fetchDashboard(): Promise<DashboardInfo> {
  const res = await fetch('/api/dashboard')
  return res.json()
}

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
  await fetch(`/api/containers/start/${id}`)
}

export async function stopContainer(id: string) {
  await fetch(`/api/containers/stop/${id}`)
}

export async function restartContainer(id: string) {
  await fetch(`/api/containers/restart/${id}`)
}

export async function removeContainer(id: string) {
  await fetch(`/api/containers/remove/${id}`)
}

export async function renameContainer(id: string, name: string): Promise<true | string> {
  const res = await fetch(`/api/containers/rename/${id}?name=${encodeURIComponent(name)}`)
  const data = await res.json()
  return data.ok ? true : data.error
}

export async function composeStart(project: string) {
  await fetch(`/api/compose/start/${encodeURIComponent(project)}`)
}

export async function composeStop(project: string) {
  await fetch(`/api/compose/stop/${encodeURIComponent(project)}`)
}

export async function composeDown(project: string) {
  await fetch(`/api/compose/down/${encodeURIComponent(project)}`)
}

export async function composeUpStream(yaml: string, path?: string, onLine?: (line: string) => void): Promise<string> {
  const res = await fetch('/api/compose/up', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(path ? { Path: path } : { Yaml: yaml }),
  })
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let result = 'ok'

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop()!
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        onLine?.(data)
      }
      if (line.startsWith('event: error')) {
        result = 'error'
      }
    }
  }
  return result
}

export async function composeOpenFile(): Promise<string> {
  const res = await fetch('/api/compose/open-file')
  const data = await res.json()
  return data.path || ''
}

export async function removeImage(id: string): Promise<true | string> {
  const res = await fetch(`/api/images/remove/${encodeURIComponent(id)}`)
  const data = await res.json()
  return data.ok ? true : data.error
}

export async function tagImage(id: string, tag: string, keep = false): Promise<true | string> {
  const res = await fetch(`/api/images/tag/${encodeURIComponent(id)}/${encodeURIComponent(tag)}/${keep ? '1' : '0'}`)
  const data = await res.json()
  return data.ok ? true : data.error
}

export async function removeVolume(name: string): Promise<true | string> {
  const res = await fetch(`/api/volumes/remove/${encodeURIComponent(name)}`)
  const data = await res.json()
  return data.ok ? true : data.error
}

export async function removeNetwork(id: string): Promise<true | string> {
  const res = await fetch(`/api/networks/remove/${encodeURIComponent(id)}`)
  const data = await res.json()
  return data.ok ? true : data.error
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

export async function loadPrefs(): Promise<Record<string, any>> {
  const res = await fetch('/api/prefs')
  return res.json()
}

export async function savePrefs(prefs: Record<string, any>) {
  await fetch('/api/prefs/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  })
}
