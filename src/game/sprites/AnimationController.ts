import Phaser from 'phaser'
import { SHEET_COLS } from './SpriteGenerator'

/** Animation row indices */
const ANIM_ROWS = {
  idle: 0,
  'walk-down': 1,
  'walk-up': 2,
  'walk-left': 3,
  'walk-right': 4,
  action: 5,
} as const

export type AnimationName = keyof typeof ANIM_ROWS

/** Register all animations for an agent's spritesheet */
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
      frameRate: isWalk ? 8 : 4,
      repeat: -1,
    })
  }
}

/** Get the animation key for a given agent and animation name */
export function getAnimKey(agentId: string, name: AnimationName): string {
  return `${agentId}_${name}`
}

/** Determine animation name from movement direction */
export function directionToAnim(dx: number, dy: number): AnimationName {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 'walk-left' : 'walk-right'
  }
  if (dy !== 0) {
    return dy < 0 ? 'walk-up' : 'walk-down'
  }
  return 'idle'
}
