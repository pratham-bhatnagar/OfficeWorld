import Phaser from 'phaser'
import { SHEET_COLS } from './SpriteGenerator'

// Phase 1: 12 animations total
const ANIM_ROWS = {
  idle: 0,
  'walk-down': 1,
  'walk-up': 2,
  'walk-left': 3,
  'walk-right': 4,
  action: 5,
  smoke: 6,
  play: 7,
  eat: 8,      // New: eating animation
  phone: 9,    // New: on phone animation
  wave: 10,    // New: waving animation
  dance: 11,   // New: celebrating/dancing
} as const

export type AnimationName = keyof typeof ANIM_ROWS

export function registerAnimations(scene: Phaser.Scene, agentId: string, textureKey: string) {
  const anims = scene.anims

  for (const [name, row] of Object.entries(ANIM_ROWS)) {
    const animKey = `${agentId}_${name}`
    if (anims.exists(animKey)) continue

    const startFrame = row * SHEET_COLS
    const endFrame = startFrame + SHEET_COLS - 1
    const isWalk = name.startsWith('walk-')

    anims.create({
      key: animKey,
      frames: anims.generateFrameNumbers(textureKey, {
        start: startFrame,
        end: endFrame,
      }),
      frameRate: isWalk ? 8 : (name === 'play' ? 6 : 4),
      repeat: -1,
    })
  }
}

export function getAnimKey(agentId: string, name: AnimationName): string {
  return `${agentId}_${name}`
}

export function directionToAnim(dx: number, dy: number): AnimationName {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 'walk-left' : 'walk-right'
  }
  if (dy !== 0) {
    return dy < 0 ? 'walk-up' : 'walk-down'
  }
  return 'idle'
}
