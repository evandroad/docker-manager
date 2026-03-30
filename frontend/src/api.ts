import type { ContainerInfo, ImageInfo, VolumeInfo, NetworkInfo, DashboardInfo } from './types'

export async function fetchDashboard(): Promise<DashboardInfo> {
  const res = await fetch('/api/dashboard')
  return res.json()
}

export async function fetchContainers(): Promise<ContainerInfo[]> {
  const res = await fetch('/api/containers')
  return (await res.json()) || []
}

export interface ContainerDetail {
  ports: string[]
  env: string[]
  mounts: { type: string; source: string; dest: string }[]
  nets: string[]
  labels: Record<string, string>
}

export async function fetchContainerDetail(id: string): Promise<ContainerDetail> {
  const res = await fetch(`/api/containers/inspect/${id}`)
  return res.json()
}

export interface ImageDetail {
  id: string
  tags: string[]
  size: string
  os: string
  arch: string
  created: string
  cmd: string[]
  env: string[]
  layers: string[]
  history: { created_by: string; size: string; created: number }[]
}

export async function fetchImageDetail(id: string): Promise<ImageDetail> {
  const res = await fetch(`/api/images/inspect/${encodeURIComponent(id)}`)
  return res.json()
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
  await fetch(`/api/containers/start/${id}`, { method: 'POST' })
}

export async function stopContainer(id: string) {
  await fetch(`/api/containers/stop/${id}`, { method: 'POST' })
}

export async function restartContainer(id: string) {
  await fetch(`/api/containers/restart/${id}`, { method: 'POST' })
}

export async function removeContainer(id: string) {
  await fetch(`/api/containers/remove/${id}`, { method: 'DELETE' })
}

export async function renameContainer(id: string, name: string): Promise<true | string> {
  const res = await fetch(`/api/containers/rename/${id}?name=${encodeURIComponent(name)}`, { method: 'PATCH' })
  const data = await res.json()
  return data.ok ? true : data.error
}

export async function composeStart(project: string) {
  await fetch(`/api/compose/start/${encodeURIComponent(project)}`, { method: 'POST' })
}

export async function composeStop(project: string) {
  await fetch(`/api/compose/stop/${encodeURIComponent(project)}`, { method: 'POST' })
}

export async function composeDown(project: string) {
  await fetch(`/api/compose/down/${encodeURIComponent(project)}`, { method: 'POST' })
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
  const res = await fetch(`/api/images/remove/${encodeURIComponent(id)}`, { method: 'DELETE' })
  const data = await res.json()
  return data.ok ? true : data.error
}

export interface PullProgress {
  status: string
  id?: string
  progress?: string
}

export async function pullImage(ref: string, onProgress?: (msg: PullProgress) => void): Promise<true | string> {
  const res = await fetch(`/api/images/pull?ref=${encodeURIComponent(ref)}`, { method: 'POST' })
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buf = '', error = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop()!
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6)
        if (raw.startsWith('ERROR:')) { error = raw.slice(6); continue }
        try { onProgress?.(JSON.parse(raw)) } catch {}
      }
    }
  }
  return error || true
}

export interface HubSearchResult {
  name: string
  description: string
  stars: number
  official: boolean
}

export async function searchHub(q: string): Promise<HubSearchResult[]> {
  const res = await fetch(`/api/images/search?q=${encodeURIComponent(q)}`)
  return res.json()
}

export async function searchHubTags(name: string): Promise<{ name: string; size: string }[]> {
  const res = await fetch(`/api/images/search/tags?name=${encodeURIComponent(name)}`)
  return res.json()
}

export async function exportImage(id: string): Promise<true | string> {
  const res = await fetch(`/api/images/export/${encodeURIComponent(id)}`)
  const data = await res.json()
  if (!data.ok) return data.error
  return true
}

export async function importImage(): Promise<true | string> {
  const res = await fetch('/api/images/import', { method: 'POST' })
  const data = await res.json()
  if (!data.ok) return data.error
  return true
}

export async function tagImage(id: string, tag: string, keep = false): Promise<true | string> {
  const res = await fetch(`/api/images/tag/${encodeURIComponent(id)}/${encodeURIComponent(tag)}/${keep ? '1' : '0'}`, { method: 'POST' })
  const data = await res.json()
  return data.ok ? true : data.error
}

export async function removeVolume(name: string): Promise<true | string> {
  const res = await fetch(`/api/volumes/remove/${encodeURIComponent(name)}`, { method: 'DELETE' })
  const data = await res.json()
  return data.ok ? true : data.error
}

export async function createVolume(name: string): Promise<true | string> {
  const res = await fetch(`/api/volumes/create/${encodeURIComponent(name)}`, { method: 'POST' })
  const data = await res.json()
  return data.ok ? true : data.error
}

export async function copyVolume(source: string, dest: string, overwrite = false): Promise<true | string> {
  const res = await fetch(`/api/volumes/copy/${encodeURIComponent(source)}/${encodeURIComponent(dest)}/${overwrite ? '1' : '0'}`, { method: 'POST' })
  const data = await res.json()
  return data.ok ? true : data.error
}

export async function exportVolume(name: string, onProgress?: (msg: string) => void): Promise<true | string> {
  const res = await fetch(`/api/volumes/export/${encodeURIComponent(name)}`)
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buf = '', result: true | string = true
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop()!
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const msg = line.slice(6)
        if (msg.startsWith('ERROR:')) result = msg.slice(6)
        else if (msg === 'CANCELLED') result = true
        else if (msg.startsWith('DONE')) result = true
        else onProgress?.(msg)
      }
    }
  }
  return result
}

export async function fetchVolumeTask(): Promise<{ active: boolean; type?: string; volume?: string }> {
  const res = await fetch('/api/volumes/task')
  return res.json()
}

export async function cancelVolumeTask(): Promise<void> {
  await fetch('/api/volumes/task/cancel', { method: 'POST' })
}

export async function importVolume(name: string, onProgress?: (msg: string) => void): Promise<true | string> {
  const res = await fetch(`/api/volumes/import/${encodeURIComponent(name)}`, { method: 'POST' })
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buf = '', result: true | string = true
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split('\n')
    buf = lines.pop()!
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const msg = line.slice(6)
        if (msg.startsWith('ERROR:')) result = msg.slice(6)
        else if (msg === 'DONE') result = true
        else onProgress?.(msg)
      }
    }
  }
  return result
}

export async function removeNetwork(id: string): Promise<true | string> {
  const res = await fetch(`/api/networks/remove/${encodeURIComponent(id)}`, { method: 'DELETE' })
  const data = await res.json()
  return data.ok ? true : data.error
}

export async function createNetwork(name: string, driver = 'bridge'): Promise<true | string> {
  const res = await fetch(`/api/networks/create/${encodeURIComponent(name)}/${encodeURIComponent(driver)}`, { method: 'POST' })
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
