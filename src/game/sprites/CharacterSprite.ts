import Phaser from 'phaser'
import { AgentState } from '../../types'
import { TILE_SIZE } from '../../constants'
import { FRAME_W, FRAME_H } from './SpriteGenerator'
import { registerAnimations, getAnimKey, directionToAnim, AnimationName } from './AnimationController'

const STATUS_COLORS: Record<string, number> = {
  working: 0x00ff88,
  idle: 0x888888,
  walking: 0xffaa00,
  smoking: 0xff4444,
  eating: 0x44aaff,
  bathroom: 0xcccccc,
  offline: 0x333333,
}

export class CharacterSprite {
  container: Phaser.GameObjects.Container
  private sprite: Phaser.GameObjects.Sprite
  private nameLabel: Phaser.GameObjects.Text
  private statusDot: Phaser.GameObjects.Arc
  private selected = false
  private selectionBorder: Phaser.GameObjects.Rectangle
  private agentId: string
  private currentAnim: AnimationName = 'idle'

  constructor(
    scene: Phaser.Scene,
    agentId: string,
    name: string,
    textureKey: string,
    tileX: number,
    tileY: number,
  ) {
    this.agentId = agentId

    // Register animations
    registerAnimations(scene, agentId, textureKey)

    // Create sprite from generated spritesheet
    this.sprite = scene.add.sprite(0, 0, textureKey, 0)
    this.sprite.setDisplaySize(FRAME_W, FRAME_H)

    // Name label
    this.nameLabel = scene.add.text(0, FRAME_H / 2 + 2, name, {
      fontSize: '7px',
      color: '#ffffff',
      fontFamily: 'Courier New',
      stroke: '#000000',
      strokeThickness: 2,
    })
    this.nameLabel.setOrigin(0.5, 0)

    // Status dot
    this.statusDot = scene.add.circle(FRAME_W / 2 + 2, -FRAME_H / 2, 2, STATUS_COLORS.idle)

    // Selection border
    this.selectionBorder = scene.add.rectangle(0, 0, FRAME_W + 4, FRAME_H + 4)
    this.selectionBorder.setStrokeStyle(1, 0xffff00)
    this.selectionBorder.setFillStyle(0x000000, 0)
    this.selectionBorder.setVisible(false)

    // Container
    this.container = scene.add.container(
      tileX * TILE_SIZE + TILE_SIZE / 2,
      tileY * TILE_SIZE + TILE_SIZE / 2,
      [this.selectionBorder, this.sprite, this.nameLabel, this.statusDot],
    )

    // Make interactive
    this.container.setSize(FRAME_W + 4, FRAME_H + 4)
    this.container.setInteractive()

    // Play idle animation
    this.playAnim('idle')
  }

  select() {
    this.selected = true
    this.selectionBorder.setVisible(true)
  }

  deselect() {
    this.selected = false
    this.selectionBorder.setVisible(false)
  }

  isSelected(): boolean {
    return this.selected
  }

  updateStatus(status: AgentState['status']) {
    this.statusDot.setFillStyle(STATUS_COLORS[status] ?? STATUS_COLORS.idle)

    if (status === 'working' || status === 'eating' || status === 'smoking') {
      this.playAnim('action')
    } else if (status === 'idle' || status === 'offline') {
      this.playAnim('idle')
    }
  }

  /** Set direction for walk animation */
  setDirection(dx: number, dy: number) {
    if (dx === 0 && dy === 0) {
      this.playAnim('idle')
    } else {
      this.playAnim(directionToAnim(dx, dy))
    }
  }

  /** Move to a tile position */
  setTilePosition(tileX: number, tileY: number) {
    this.container.x = tileX * TILE_SIZE + TILE_SIZE / 2
    this.container.y = tileY * TILE_SIZE + TILE_SIZE / 2
  }

  /** Get world position */
  getPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y }
  }

  private playAnim(name: AnimationName) {
    if (name === this.currentAnim) return
    this.currentAnim = name
    const key = getAnimKey(this.agentId, name)
    this.sprite.play(key)
  }

  destroy() {
    this.container.destroy()
  }
}
