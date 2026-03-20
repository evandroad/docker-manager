export interface ContainerInfo {
  ID: string
  Name: string
  Image: string
  Status: string
  State: string
  Project: string
  Service: string
  Created: number
}

export interface ImageInfo {
  ID: string
  Tags: string[]
  Size: string
  Created: number
  UsedBy: string[] | null
}

export interface VolumeInfo {
  Name: string
  Driver: string
  Mountpoint: string
  Size: string
  Created: number
  UsedBy: string[] | null
}

export interface NetworkInfo {
  ID: string
  Name: string
  Driver: string
  Scope: string
  Created: number
  UsedBy: string[] | null
}

export interface DockerEvent {
  Type: string
  Action: string
  ID: string
  Name: string
  Time: number
}
