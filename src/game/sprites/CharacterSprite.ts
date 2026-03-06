import Phaser from 'phaser'
import { AgentState } from '../../types'
import { TILE_SIZE } from '../../constants'
import { FRAME_W, FRAME_H } from './SpriteGenerator'
import { registerAnimations, getAnimKey, directionToAnim, AnimationName } from './AnimationController'

// Phase 1: 32x48 sprites with 12 animations
const DISPLAY_SCALE = 2
const DISPLAY_W = 32 * DISPLAY_SCALE  // 64
const DISPLAY_H = 48 * DISPLAY_SCALE  // 96

const STATUS_COLORS: Record<string, number> = {
  working: 0x00ff88,
  idle: 0x888888,
  walking: 0xffaa00,
  smoking: 0xff4444,
  eating: 0x44aaff,
  bathroom: 0xcccccc,
  playing: 0xff44ff,
  meeting: 0x44ffaa,
  offline: 0x333333,
  oncall: 0xffff44,    // New: phone call
  celebrating: 0xff88ff, // New: celebrating
  waving: 0x88ffff,    // New: waving
}

export class CharacterSprite {
  container: Phaser.GameObjects.Container
  private sprite: Phaser.GameObjects.Sprite
  private nameLabel: Phaser.GameObjects.Text
  private statusDot: Phaser.GameObjects.Arc
  private statusBg: Phaser.GameObjects.Rectangle
  private selected = false
  private selectionGlow: Phaser.GameObjects.Rectangle
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

    registerAnimations(scene, agentId, textureKey)

    this.sprite = scene.add.sprite(0, 0, textureKey, 0)
    this.sprite.setDisplaySize(DISPLAY_W, DISPLAY_H)

    // Name tag background (warm plaque style)
    const nameWidth = Math.max(name.length * 6 + 12, 40)
    this.statusBg = scene.add.rectangle(0, DISPLAY_H / 2 + 10, nameWidth, 14, 0x1a1520, 0.85)
    this.statusBg.setStrokeStyle(1, 0x64477d)

    // Name label
    this.nameLabel = scene.add.text(0, DISPLAY_H / 2 + 5, name, {
      fontSize: '10px',
      color: '#ffd700',
      fontFamily: "'ArkPixel', monospace",
      stroke: '#000000',
      strokeThickness: 2,
    })
    this.nameLabel.setOrigin(0.5, 0)

    // Status dot (larger, with glow)
    this.statusDot = scene.add.circle(DISPLAY_W / 2 + 6, -DISPLAY_H / 2 - 2, 5, STATUS_COLORS.idle)
    this.statusDot.setStrokeStyle(1.5, 0x000000)

    // Selection glow effect
    this.selectionGlow = scene.add.rectangle(0, 0, DISPLAY_W + 10, DISPLAY_H + 10)
    this.selectionGlow.setStrokeStyle(2, 0xffff00, 0.8)
    this.selectionGlow.setFillStyle(0xffff00, 0.1)
    this.selectionGlow.setVisible(false)

    this.container = scene.add.container(
      tileX * TILE_SIZE + TILE_SIZE / 2,
      tileY * TILE_SIZE + TILE_SIZE / 2,
      [this.selectionGlow, this.sprite, this.statusBg, this.nameLabel, this.statusDot],
    )
    this.container.setDepth(5)

    // Larger hit area for easier clicking
    this.container.setSize(DISPLAY_W + 8, DISPLAY_H + 8)
    this.container.setInteractive()

    this.playAnim('idle')
  }

  select() {
    this.selected = true
    this.selectionGlow.setVisible(true)
  }

  deselect() {
    this.selected = false
    this.selectionGlow.setVisible(false)
  }

  isSelected(): boolean {
    return this.selected
  }

  updateStatus(status: AgentState['status']) {
    this.statusDot.setFillStyle(STATUS_COLORS[status] ?? STATUS_COLORS.idle)

    if (status === 'working' || status === 'eating') {
      this.playAnim('action')
    } else if (status === 'smoking') {
      this.playAnim('smoke')
    } else if (status === 'playing') {
      this.playAnim('play')
    } else if (status === 'oncall') {
      this.playAnim('phone')
    } else if (status === 'celebrating') {
      this.playAnim('dance')
    } else if (status === 'waving') {
      this.playAnim('wave')
    } else if (status === 'idle' || status === 'offline' || status === 'meeting') {
      this.playAnim('idle')
    }
  }

  setDirection(dx: number, dy: number) {
    if (dx === 0 && dy === 0) {
      this.playAnim('idle')
    } else {
      this.playAnim(directionToAnim(dx, dy))
    }
  }

  setTilePosition(tileX: number, tileY: number) {
    this.container.x = tileX * TILE_SIZE + TILE_SIZE / 2
    this.container.y = tileY * TILE_SIZE + TILE_SIZE / 2
  }

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
