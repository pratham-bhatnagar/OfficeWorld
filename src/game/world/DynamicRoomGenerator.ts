import { Room, RoomType, TileMap } from '../../types'
import { TILE_SIZE } from '../../constants'

// Dynamic room layout constants
const DEPT_ROOM_WIDTH = 12  // tiles
const DEPT_ROOM_HEIGHT = 10 // tiles
const SHARED_ROOM_WIDTH = 10
const SHARED_ROOM_HEIGHT = 8
const HALLWAY_HEIGHT = 4
const ROOM_SPACING = 2

export interface RigInfo {
  id: string
  name: string
  crewCount: number
}

export interface GeneratedWorld {
  rooms: Room[]
  tileMap: TileMap
  width: number
  height: number
  agentSpawnPoints: Array<{ x: number; y: number; roomId: string }>
}

export class DynamicRoomGenerator {
  private rigs: RigInfo[]
  private sharedRooms: RoomType[] = ['breakroom', 'meeting', 'smoke', 'bathroom', 'play']

  constructor(rigs: RigInfo[]) {
    this.rigs = rigs
  }

  generate(): GeneratedWorld {
    const rooms: Room[] = []
    const agentSpawnPoints: Array<{ x: number; y: number; roomId: string }> = []
    
    // Calculate dimensions
    const deptRowY = 0
    const hallwayY = DEPT_ROOM_HEIGHT + ROOM_SPACING
    const sharedRowY = hallwayY + HALLWAY_HEIGHT + ROOM_SPACING
    
    // Generate department rooms (top row)
    let currentX = 0
    
    // Mayor office first
    const mayorRoom = this.createRoom(
      'mayor-office',
      'mayor',
      currentX,
      deptRowY,
      DEPT_ROOM_WIDTH,
      DEPT_ROOM_HEIGHT,
      'Mayor Office'
    )
    rooms.push(mayorRoom)
    agentSpawnPoints.push({ x: currentX + 2, y: deptRowY + 2, roomId: 'mayor-office' })
    currentX += DEPT_ROOM_WIDTH + ROOM_SPACING
    
    // Department rooms for each rig
    this.rigs.forEach((rig, index) => {
      const roomId = `dept-${rig.id}`
      const deskCount = Math.max(2, Math.min(8, Math.ceil(rig.crewCount / 2)))
      
      const room = this.createRoom(
        roomId,
        'department',
        currentX,
        deptRowY,
        DEPT_ROOM_WIDTH,
        DEPT_ROOM_HEIGHT,
        rig.name,
        { rigId: rig.id, deskCount }
      )
      rooms.push(room)
      
      // Add spawn points for each desk
      for (let i = 0; i < deskCount; i++) {
        agentSpawnPoints.push({
          x: currentX + 2 + (i % 4) * 2,
          y: deptRowY + 3 + Math.floor(i / 4) * 2,
          roomId
        })
      }
      
      currentX += DEPT_ROOM_WIDTH + ROOM_SPACING
    })
    
    // Calculate total width
    const totalWidth = currentX
    
    // Generate hallway spine (middle)
    const hallway = this.createRoom(
      'main-hallway',
      'hallway',
      0,
      hallwayY,
      totalWidth,
      HALLWAY_HEIGHT,
      'Main Hallway'
    )
    rooms.push(hallway)
    
    // Generate shared rooms (bottom row)
    currentX = 0
    this.sharedRooms.forEach((roomType) => {
      const room = this.createRoom(
        `${roomType}-room`,
        roomType,
        currentX,
        sharedRowY,
        SHARED_ROOM_WIDTH,
        SHARED_ROOM_HEIGHT,
        this.formatRoomName(roomType)
      )
      rooms.push(room)
      currentX += SHARED_ROOM_WIDTH + ROOM_SPACING
    })
    
    // Generate tile map
    const tileMap = this.generateTileMap(rooms, totalWidth, sharedRowY + SHARED_ROOM_HEIGHT)
    
    return {
      rooms,
      tileMap,
      width: totalWidth * TILE_SIZE,
      height: (sharedRowY + SHARED_ROOM_HEIGHT) * TILE_SIZE,
      agentSpawnPoints
    }
  }

  private createRoom(
    id: string,
    type: RoomType,
    x: number,
    y: number,
    width: number,
    height: number,
    name: string,
    metadata?: Record<string, unknown>
  ): Room {
    return {
      id,
      type,
      x: x * TILE_SIZE,
      y: y * TILE_SIZE,
      width: width * TILE_SIZE,
      height: height * TILE_SIZE,
      name,
      doors: this.calculateDoors(x, y, width, height),
      ...metadata
    }
  }

  private calculateDoors(x: number, y: number, width: number, height: number): Array<{ x: number; y: number; direction: 'n' | 's' | 'e' | 'w' }> {
    const doors: Array<{ x: number; y: number; direction: 'n' | 's' | 'e' | 'w' }> = []
    
    // Bottom door (connects to hallway)
    doors.push({
      x: (x + Math.floor(width / 2)) * TILE_SIZE,
      y: (y + height) * TILE_SIZE,
      direction: 's'
    })
    
    // Top door (for hallway)
    if (y > 0) {
      doors.push({
        x: (x + Math.floor(width / 2)) * TILE_SIZE,
        y: y * TILE_SIZE,
        direction: 'n'
      })
    }
    
    return doors
  }

  private generateTileMap(rooms: Room[], width: number, height: number): TileMap {
    const cols = width + 10
    const rows = height + 10
    const tiles: number[][] = []
    
    // Initialize with floor (0)
    for (let y = 0; y < rows; y++) {
      tiles[y] = []
      for (let x = 0; x < cols; x++) {
        tiles[y][x] = 0 // floor
      }
    }
    
    // Add walls for each room
    rooms.forEach((room) => {
      const startX = Math.floor(room.x / TILE_SIZE)
      const startY = Math.floor(room.y / TILE_SIZE)
      const endX = startX + Math.floor(room.width / TILE_SIZE)
      const endY = startY + Math.floor(room.height / TILE_SIZE)
      
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          // Walls on edges
          if (x === startX || x === endX - 1 || y === startY || y === endY - 1) {
            // Check if it's a door position
            const isDoor = room.doors.some((door) => {
              const doorX = Math.floor(door.x / TILE_SIZE)
              const doorY = Math.floor(door.y / TILE_SIZE)
              return x === doorX && y === doorY
            })
            
            if (!isDoor) {
              tiles[y][x] = 1 // wall
            } else {
              tiles[y][x] = 2 // door
            }
          }
        }
      }
    })
    
    return {
      tiles,
      width: cols,
      height: rows
    }
  }

  private formatRoomName(type: RoomType): string {
    const names: Record<RoomType, string> = {
      mayor: 'Mayor Office',
      department: 'Department',
      breakroom: 'Break Room',
      meeting: 'Meeting Room',
      smoke: 'Smoke Area',
      bathroom: 'Bathroom',
      play: 'Play Area',
      hallway: 'Hallway'
    }
    return names[type] || type
  }

  // Method to add a new rig dynamically
  addRig(rig: RigInfo): GeneratedWorld {
    this.rigs.push(rig)
    return this.generate()
  }

  // Method to remove a rig
  removeRig(rigId: string): GeneratedWorld {
    this.rigs = this.rigs.filter((r) => r.id !== rigId)
    return this.generate()
  }
}
