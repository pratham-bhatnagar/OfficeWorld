export interface AgentState {
  id: string
  name: string
  role: string
  rig: string
  status: 'working' | 'idle' | 'walking' | 'smoking' | 'eating' | 'bathroom' | 'offline'
  position: { x: number; y: number }
  targetPosition?: { x: number; y: number }
  currentRoom: string
  task?: string
}

export interface RoomConfig {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  type: 'department' | 'hallway' | 'breakroom' | 'smoke_area' | 'bathroom' | 'play_area'
  color: number
  furniture: FurnitureItem[]
  deskPositions: { x: number; y: number }[]
}

export interface FurnitureItem {
  type:
    | 'desk'
    | 'monitor'
    | 'plant'
    | 'toilet'
    | 'arcade_machine'
    | 'vending_machine'
    | 'table'
    | 'chair'
    | 'couch'
    | 'ashtray'
  x: number
  y: number
  width: number
  height: number
}

export interface AgentVisualTraits {
  skinTone: number
  hairColor: number
  hairStyle: number
  outfitColor: number
}

export interface TileData {
  walkable: boolean
  roomId: string | null
  furnitureType: string | null
}
