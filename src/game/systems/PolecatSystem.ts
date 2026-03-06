import Phaser from 'phaser'
import { PolecatState, TileData } from '../../types'
import { TILE_SIZE, POLECAT_FADE_DURATION } from '../../constants'
import { findPath } from '../world/Pathfinding'
import { BeadSystem } from './BeadSystem'

/** Polecats are transient cleaners that appear, clean beads, and vanish */
export class PolecatSystem {
  private scene: Phaser.Scene
  private polecats = new Map<string, PolecatState>()
  private sprites = new Map<string, Phaser.GameObjects.Container>()
  private grid: TileData[][]
  private beadSystem: BeadSystem
  private nextId = 0

  constructor(scene: Phaser.Scene, grid: TileData[][], beadSystem: BeadSystem) {
    this.scene = scene
    this.grid = grid
    this.beadSystem = beadSystem
  }

  /** Spawn a polecat at an edge position to clean beads */
  spawnPolecat() {
    if (this.beadSystem.getBeadCount() === 0) return
    if (this.polecats.size >= 3) return // Max 3 concurrent polecats

    // Find nearest bead to assign
    const bead = this.beadSystem.getNearestBead(35, 25) // Start from hallway center
    if (!bead) return

    const id = `polecat_${this.nextId++}`

    // Spawn at a doorway/edge position
    const spawnPos = { x: 35, y: 2 } // Top of hallway
    const path = findPath(spawnPos, { x: bead.x, y: bead.y }, this.grid)
    if (path.length === 0) return

    const polecat: PolecatState = {
      id,
      position: { ...spawnPos },
      targetBead: bead.id,
      status: 'entering',
      opacity: 0,
      path,
      pathIndex: 0,
    }

    this.polecats.set(id, polecat)

    // Create sprite
    const container = this.createPolecatSprite(id)
    container.x = spawnPos.x * TILE_SIZE + TILE_SIZE / 2
    container.y = spawnPos.y * TILE_SIZE + TILE_SIZE / 2
    container.setAlpha(0)
    container.setDepth(10)
    this.sprites.set(id, container)

    // Fade in
    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      duration: 600,
      onComplete: () => {
        polecat.status = 'walking'
        polecat.opacity = 1
      },
    })
  }

  private createPolecatSprite(_id: string): Phaser.GameObjects.Container {
    const gfx = this.scene.add.graphics()

    // Polecat character - small, janitor-like
    // Hard hat
    gfx.fillStyle(0xffcc00)
    gfx.fillRect(-5, -11, 10, 3)
    gfx.fillStyle(0xddaa00)
    gfx.fillRect(-6, -9, 12, 2)

    // Head
    gfx.fillStyle(0xe8b88a)
    gfx.fillRect(-4, -8, 8, 6)

    // Eyes
    gfx.fillStyle(0x222222)
    gfx.fillRect(-3, -6, 2, 2)
    gfx.fillRect(1, -6, 2, 2)
    gfx.fillStyle(0xffffff)
    gfx.fillRect(-3, -6, 1, 1)
    gfx.fillRect(1, -6, 1, 1)

    // Overalls
    gfx.fillStyle(0x4466aa)
    gfx.fillRect(-4, -2, 8, 8)
    gfx.fillStyle(0x3355aa)
    gfx.fillRect(-4, -2, 1, 8)
    gfx.fillRect(-4, 4, 8, 2)

    // Broom/mop
    gfx.fillStyle(0x8b6f47)
    gfx.fillRect(4, -8, 2, 14)
    gfx.fillStyle(0xddcc88)
    gfx.fillRect(2, 5, 6, 3)
    gfx.fillStyle(0xccbb77)
    gfx.fillRect(3, 7, 4, 2)

    // Legs
    gfx.fillStyle(0x2a2a4a)
    gfx.fillRect(-3, 6, 2, 4)
    gfx.fillRect(1, 6, 2, 4)

    // Shoes
    gfx.fillStyle(0x1a1a2a)
    gfx.fillRect(-4, 9, 3, 2)
    gfx.fillRect(1, 9, 3, 2)

    // Name label
    const label = this.scene.add.text(0, 13, 'polecat', {
      fontSize: '6px',
      color: '#ffcc00',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 2,
    })
    label.setOrigin(0.5, 0)

    return this.scene.add.container(0, 0, [gfx, label])
  }

  update(delta: number) {
    for (const [id, polecat] of this.polecats) {
      const sprite = this.sprites.get(id)
      if (!sprite) continue

      switch (polecat.status) {
        case 'walking': {
          // Move along path
          if (polecat.pathIndex >= polecat.path.length) {
            // Arrived at bead
            polecat.status = 'cleaning'
            break
          }

          const target = polecat.path[polecat.pathIndex]
          const tx = target.x * TILE_SIZE + TILE_SIZE / 2
          const ty = target.y * TILE_SIZE + TILE_SIZE / 2
          const dx = tx - sprite.x
          const dy = ty - sprite.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const speed = (TILE_SIZE * delta) / 150 // pixels per frame

          if (dist < speed) {
            sprite.x = tx
            sprite.y = ty
            polecat.position = { ...target }
            polecat.pathIndex++
          } else {
            sprite.x += (dx / dist) * speed
            sprite.y += (dy / dist) * speed
          }
          break
        }

        case 'cleaning': {
          // Clean the bead
          if (polecat.targetBead) {
            this.beadSystem.removeBead(polecat.targetBead)
            polecat.targetBead = null

            // Look for next bead
            const nextBead = this.beadSystem.getNearestBead(polecat.position.x, polecat.position.y)
            if (nextBead) {
              const path = findPath(polecat.position, { x: nextBead.x, y: nextBead.y }, this.grid)
              if (path.length > 0 && path.length < 30) {
                polecat.targetBead = nextBead.id
                polecat.path = path
                polecat.pathIndex = 0
                polecat.status = 'walking'
                break
              }
            }

            // No more beads or too far - leave
            polecat.status = 'fading'
            this.scene.tweens.add({
              targets: sprite,
              alpha: 0,
              duration: POLECAT_FADE_DURATION,
              onComplete: () => {
                sprite.destroy()
                this.sprites.delete(id)
                this.polecats.delete(id)
              },
            })
          }
          break
        }
      }
    }
  }

  getActiveCount(): number {
    return this.polecats.size
  }
}
