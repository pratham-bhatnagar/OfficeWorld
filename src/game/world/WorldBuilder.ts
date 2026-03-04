import Phaser from 'phaser'
import { TileData } from '../../types'
import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from '../../constants'
import { ROOMS, getDoorways } from './RoomDefinitions'
import { TileRenderer } from './TileRenderer'

export class WorldBuilder {
  private scene: Phaser.Scene
  private grid: TileData[][] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  buildWorld(): { texture: Phaser.GameObjects.RenderTexture; grid: TileData[][] } {
    // Initialize grid — all unwalkable by default
    this.grid = Array.from({ length: WORLD_HEIGHT }, () =>
      Array.from({ length: WORLD_WIDTH }, () => ({
        walkable: false,
        roomId: null,
        furnitureType: null,
      })),
    )

    // Create render texture for entire world
    const rt = this.scene.add.renderTexture(
      0,
      0,
      WORLD_WIDTH * TILE_SIZE,
      WORLD_HEIGHT * TILE_SIZE,
    )

    // Fill background
    const bgGfx = this.scene.add.graphics()
    bgGfx.fillStyle(0x0a0a1a)
    bgGfx.fillRect(0, 0, WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE)
    rt.draw(bgGfx)
    bgGfx.destroy()

    // Render rooms
    const renderer = new TileRenderer(this.scene)

    for (const room of ROOMS) {
      renderer.drawRoom(room, rt)

      // Mark walkable tiles (interior, not walls)
      for (let y = room.y + 2; y < room.y + room.height - 1; y++) {
        for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
          if (y < WORLD_HEIGHT && x < WORLD_WIDTH) {
            this.grid[y][x] = { walkable: true, roomId: room.id, furnitureType: null }
          }
        }
      }

      // Mark furniture as unwalkable
      for (const item of room.furniture) {
        for (let dy = 0; dy < item.height; dy++) {
          for (let dx = 0; dx < item.width; dx++) {
            const gx = item.x + dx
            const gy = item.y + dy
            if (gy < WORLD_HEIGHT && gx < WORLD_WIDTH) {
              this.grid[gy][gx] = { walkable: false, roomId: room.id, furnitureType: item.type }
            }
          }
        }
      }
    }

    // Draw doorways and mark walkable
    const doorways = getDoorways()
    for (const door of doorways) {
      // Make 3 tiles tall doorway
      for (let dy = -1; dy <= 1; dy++) {
        const gy = door.y + dy
        if (gy >= 0 && gy < WORLD_HEIGHT && door.x < WORLD_WIDTH) {
          this.grid[gy][door.x] = { walkable: true, roomId: 'doorway', furnitureType: null }
        }
      }
      renderer.drawDoorway(door.x, door.y, rt, 0x2a2a3e)
    }

    renderer.destroy()

    // Set origin so position makes sense with camera
    rt.setOrigin(0, 0)

    return { texture: rt, grid: this.grid }
  }

  getCollisionGrid(): TileData[][] {
    return this.grid
  }

  getDeskPositions(roomId: string): { x: number; y: number }[] {
    const room = ROOMS.find((r) => r.id === roomId)
    return room?.deskPositions ?? []
  }
}
