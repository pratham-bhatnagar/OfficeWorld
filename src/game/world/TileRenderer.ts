import Phaser from 'phaser'
import { RoomConfig, FurnitureItem } from '../../types'
import { TILE_SIZE } from '../../constants'

/** Draws rooms and furniture onto a RenderTexture */
export class TileRenderer {
  private gfx: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene) {
    this.gfx = scene.add.graphics()
  }

  drawRoom(room: RoomConfig, rt: Phaser.GameObjects.RenderTexture) {
    this.gfx.clear()

    const baseColor = room.color
    const altColor = this.shiftColor(baseColor, 8)
    const wallColor = this.darkenColor(baseColor, 40)
    const wallTopColor = this.darkenColor(baseColor, 25)

    // Floor tiles (checkerboard)
    for (let y = room.y + 2; y < room.y + room.height - 1; y++) {
      for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
        const checker = (x + y) % 2 === 0
        this.gfx.fillStyle(checker ? baseColor : altColor)
        this.gfx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }

    // Walls — top (2 tiles thick)
    for (let x = room.x; x < room.x + room.width; x++) {
      this.gfx.fillStyle(wallTopColor)
      this.gfx.fillRect(x * TILE_SIZE, room.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      this.gfx.fillStyle(wallColor)
      this.gfx.fillRect(x * TILE_SIZE, (room.y + 1) * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    }

    // Walls — bottom
    for (let x = room.x; x < room.x + room.width; x++) {
      this.gfx.fillStyle(wallColor)
      this.gfx.fillRect(x * TILE_SIZE, (room.y + room.height - 1) * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    }

    // Walls — left and right
    for (let y = room.y; y < room.y + room.height; y++) {
      this.gfx.fillStyle(wallColor)
      this.gfx.fillRect(room.x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      this.gfx.fillRect((room.x + room.width - 1) * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    }

    rt.draw(this.gfx)
    this.gfx.clear()

    // Draw furniture
    for (const item of room.furniture) {
      this.drawFurniture(item, rt)
    }
  }

  drawFurniture(item: FurnitureItem, rt: Phaser.GameObjects.RenderTexture) {
    this.gfx.clear()
    const px = item.x * TILE_SIZE
    const py = item.y * TILE_SIZE
    const pw = item.width * TILE_SIZE
    const ph = item.height * TILE_SIZE

    switch (item.type) {
      case 'desk':
        this.gfx.fillStyle(0x6d4c2a)
        this.gfx.fillRect(px, py, pw, ph)
        // Lighter top edge
        this.gfx.fillStyle(0x8b6f47)
        this.gfx.fillRect(px, py, pw, 3)
        break

      case 'monitor':
        // Screen
        this.gfx.fillStyle(0x111122)
        this.gfx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 6)
        // Screen glow
        this.gfx.fillStyle(0x3388ff)
        this.gfx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 8)
        // Stand
        this.gfx.fillStyle(0x444444)
        this.gfx.fillRect(px + TILE_SIZE / 2 - 2, py + TILE_SIZE - 4, 4, 4)
        break

      case 'plant':
        // Pot
        this.gfx.fillStyle(0x8b4513)
        this.gfx.fillRect(px + 4, py + 10, 8, 6)
        // Leaves
        this.gfx.fillStyle(0x228b22)
        this.gfx.fillRect(px + 3, py + 3, 10, 8)
        this.gfx.fillStyle(0x32cd32)
        this.gfx.fillRect(px + 5, py + 1, 6, 6)
        break

      case 'toilet':
        this.gfx.fillStyle(0xe8e8e8)
        this.gfx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4)
        this.gfx.fillStyle(0xcccccc)
        this.gfx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 8)
        // Tank
        this.gfx.fillStyle(0xdddddd)
        this.gfx.fillRect(px + 4, py, 8, 4)
        break

      case 'arcade_machine':
        // Cabinet body
        this.gfx.fillStyle(0x1a1a4a)
        this.gfx.fillRect(px + 1, py, TILE_SIZE - 2, ph)
        // Screen
        this.gfx.fillStyle(0x00ff88)
        this.gfx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 4)
        // Controls
        this.gfx.fillStyle(0xff4444)
        this.gfx.fillRect(px + 4, py + TILE_SIZE + 2, 4, 3)
        this.gfx.fillStyle(0x4444ff)
        this.gfx.fillRect(px + 9, py + TILE_SIZE + 2, 4, 3)
        break

      case 'vending_machine':
        this.gfx.fillStyle(0x333366)
        this.gfx.fillRect(px + 1, py, TILE_SIZE - 2, ph)
        // Product rows
        for (let r = 0; r < 3; r++) {
          const colors = [0xff4444, 0x44ff44, 0x4444ff]
          this.gfx.fillStyle(colors[r])
          this.gfx.fillRect(px + 3, py + 3 + r * 8, TILE_SIZE - 6, 6)
        }
        break

      case 'table':
        this.gfx.fillStyle(0x8b6f47)
        this.gfx.fillRect(px, py, pw, ph)
        this.gfx.fillStyle(0xa0845c)
        this.gfx.fillRect(px + 1, py + 1, pw - 2, 2)
        break

      case 'chair':
        this.gfx.fillStyle(0x4a4a6a)
        this.gfx.fillRect(px + 3, py + 4, TILE_SIZE - 6, TILE_SIZE - 6)
        // Back
        this.gfx.fillStyle(0x3a3a5a)
        this.gfx.fillRect(px + 3, py + 2, TILE_SIZE - 6, 3)
        break

      case 'couch':
        this.gfx.fillStyle(0x6a3a5a)
        this.gfx.fillRect(px + 1, py + 3, pw - 2, ph - 4)
        // Cushions
        this.gfx.fillStyle(0x7a4a6a)
        this.gfx.fillRect(px + 2, py + 4, pw - 4, ph - 6)
        // Arm rests
        this.gfx.fillStyle(0x5a2a4a)
        this.gfx.fillRect(px, py + 2, 3, ph - 3)
        this.gfx.fillRect(px + pw - 3, py + 2, 3, ph - 3)
        break

      case 'ashtray':
        this.gfx.fillStyle(0x555555)
        this.gfx.fillRect(px + 4, py + 5, 8, 6)
        // Ash
        this.gfx.fillStyle(0x888888)
        this.gfx.fillRect(px + 5, py + 6, 6, 4)
        break
    }

    rt.draw(this.gfx)
    this.gfx.clear()
  }

  drawDoorway(x: number, y: number, rt: Phaser.GameObjects.RenderTexture, floorColor: number) {
    this.gfx.clear()
    // Clear 3-tile-wide doorway
    for (let dy = -1; dy <= 1; dy++) {
      this.gfx.fillStyle(floorColor)
      this.gfx.fillRect(x * TILE_SIZE, (y + dy) * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    }
    rt.draw(this.gfx)
    this.gfx.clear()
  }

  destroy() {
    this.gfx.destroy()
  }

  private shiftColor(color: number, amount: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + amount)
    const g = Math.min(255, ((color >> 8) & 0xff) + amount)
    const b = Math.min(255, (color & 0xff) + amount)
    return (r << 16) | (g << 8) | b
  }

  private darkenColor(color: number, amount: number): number {
    const r = Math.max(0, ((color >> 16) & 0xff) - amount)
    const g = Math.max(0, ((color >> 8) & 0xff) - amount)
    const b = Math.max(0, (color & 0xff) - amount)
    return (r << 16) | (g << 8) | b
  }
}
