import { HAT_STYLES, HAIR_STYLES, FACE_STYLES } from './constants'

export interface AgentState {
  id: string
  name: string
  role: string
  rig: string
  status: 'working' | 'idle' | 'walking' | 'smoking' | 'eating' | 'bathroom' | 'playing' | 'meeting' | 'offline'
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
  type: 'department' | 'hallway' | 'breakroom' | 'smoke_area' | 'bathroom' | 'play_area' | 'meeting_room'
  color: number
  furniture: FurnitureItem[]
  deskPositions: { x: number; y: number }[]
  decorations?: DecorationItem[]
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
    | 'ping_pong'
    | 'whiteboard'
    | 'bookshelf'
    | 'coffee_machine'
    | 'water_cooler'
    | 'trash_can'
    | 'projector_screen'
    | 'meeting_table'
    | 'server_rack'
    | 'filing_cabinet'
    | 'rug'
  x: number
  y: number
  width: number
  height: number
}

export interface DecorationItem {
  type: 'poster' | 'clock' | 'window' | 'sign' | 'painting' | 'board'
  x: number
  y: number
  label?: string
}

export interface AgentVisualTraits {
  skinTone: number
  hairColor: number
  hairStyle: number
  outfitColor: number
  hatStyle?: typeof HAT_STYLES[number]
  faceStyle?: typeof FACE_STYLES[number]
  accessoryColor?: number
}

export interface CharacterCustomization {
  hatStyle: typeof HAT_STYLES[number]
  hairStyle: typeof HAIR_STYLES[number]
  faceStyle: typeof FACE_STYLES[number]
  skinTone: number
  hairColor: number
  outfitColor: number
  accessoryColor: number
}

export interface TileData {
  walkable: boolean
  roomId: string | null
  furnitureType: string | null
}

export interface Bead {
  id: string
  x: number
  y: number
  roomId: string
  age: number
  type: 'cigarette_butt' | 'coffee_cup' | 'paper'
}

export interface PolecatState {
  id: string
  position: { x: number; y: number }
  targetBead: string | null
  status: 'entering' | 'walking' | 'cleaning' | 'leaving' | 'fading'
  opacity: number
  path: { x: number; y: number }[]
  pathIndex: number
}
