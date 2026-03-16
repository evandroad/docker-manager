export interface ContainerInfo {
  ID: string
  Name: string
  Image: string
  Status: string
  State: string
  Project: string
  Service: string
}

export interface ImageInfo {
  ID: string
  Tags: string[]
  Size: string
  Created: number
}

export interface DockerEvent {
  Type: string
  Action: string
  ID: string
  Time: number
}
