export interface ContainerInfo {
  ID: string
  Name: string
  Image: string
  Status: string
  State: string
  Project: string
  Service: string
}

export interface DockerEvent {
  Type: string
  Action: string
  ID: string
  Time: number
}
