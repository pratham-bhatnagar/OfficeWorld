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
  playing: 0xff44ff,
  meeting: 0x44ffaa,
  offline: 0x333333,
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
    this.sprite.setDisplaySize(FRAME_W, FRAME_H)

    // Name tag background
    const nameWidth = Math.max(name.length * 4 + 6, 24)
    this.statusBg = scene.add.rectangle(0, FRAME_H / 2 + 6, nameWidth, 9, 0x000000, 0.6)
    this.statusBg.setStrokeStyle(0.5, 0x333333)

    // Name label
    this.nameLabel = scene.add.text(0, FRAME_H / 2 + 3, name, {
      fontSize: '6px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 1,
    })
    this.nameLabel.setOrigin(0.5, 0)

    // Status dot
    this.statusDot = scene.add.circle(FRAME_W / 2 + 3, -FRAME_H / 2 - 1, 2.5, STATUS_COLORS.idle)
    this.statusDot.setStrokeStyle(0.5, 0x000000)

    // Selection glow effect
    this.selectionGlow = scene.add.rectangle(0, 0, FRAME_W + 6, FRAME_H + 6)
    this.selectionGlow.setStrokeStyle(1.5, 0xffff00, 0.8)
    this.selectionGlow.setFillStyle(0xffff00, 0.08)
    this.selectionGlow.setVisible(false)

    this.container = scene.add.container(
      tileX * TILE_SIZE + TILE_SIZE / 2,
      tileY * TILE_SIZE + TILE_SIZE / 2,
      [this.selectionGlow, this.sprite, this.statusBg, this.nameLabel, this.statusDot],
    )
    this.container.setDepth(5)

    this.container.setSize(FRAME_W + 4, FRAME_H + 4)
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
