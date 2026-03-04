import Phaser from 'phaser'
import { AgentVisualTraits } from '../../types'
import { SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS } from '../../constants'

const FRAME_W = 16
const FRAME_H = 24
const COLS = 4  // animation frames
const ROWS = 6  // idle, walk-down, walk-up, walk-left, walk-right, action
const SHEET_W = FRAME_W * COLS
const SHEET_H = FRAME_H * ROWS

/** Simple deterministic hash from a string */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/** Derive visual traits from agent name deterministically */
export function traitsFromName(name: string, rig?: string): AgentVisualTraits {
  const h = hashString(name)
  return {
    skinTone: SKIN_TONES[h % SKIN_TONES.length],
    hairColor: HAIR_COLORS[(h >> 4) % HAIR_COLORS.length],
    hairStyle: (h >> 8) % 4,
    outfitColor: rig ? (OUTFIT_COLORS[rig] ?? OUTFIT_COLORS.default) : OUTFIT_COLORS.default,
  }
}

/** Generate a spritesheet texture for an agent */
export function generateSpritesheet(
  scene: Phaser.Scene,
  textureKey: string,
  traits: AgentVisualTraits,
): void {
  // Create a canvas to draw the spritesheet
  const canvas = document.createElement('canvas')
  canvas.width = SHEET_W
  canvas.height = SHEET_H
  const ctx = canvas.getContext('2d')!

  // Clear
  ctx.clearRect(0, 0, SHEET_W, SHEET_H)

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      drawFrame(ctx, col * FRAME_W, row * FRAME_H, row, col, traits)
    }
  }

  // Add to Phaser texture manager
  if (scene.textures.exists(textureKey)) {
    scene.textures.remove(textureKey)
  }
  const texture = scene.textures.addCanvas(textureKey, canvas)
  if (!texture) return

  // Add frames for animation
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const frameIdx = row * COLS + col
      texture.add(frameIdx, 0, col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H)
    }
  }
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  row: number,
  col: number,
  traits: AgentVisualTraits,
) {
  const skin = toCSS(traits.skinTone)
  const hair = toCSS(traits.hairColor)
  const outfit = toCSS(traits.outfitColor)

  // Animation offsets
  const bobY = row >= 1 && row <= 4 ? (col % 2 === 0 ? 0 : -1) : 0
  const legOffset = row >= 1 && row <= 4 ? (col % 2 === 0 ? 1 : -1) : 0

  // Head (6x6, centered)
  ctx.fillStyle = skin
  ctx.fillRect(x + 5, y + 2 + bobY, 6, 6)

  // Hair (varies by style)
  ctx.fillStyle = hair
  switch (traits.hairStyle) {
    case 0: // Short flat
      ctx.fillRect(x + 4, y + 1 + bobY, 8, 3)
      break
    case 1: // Spiky
      ctx.fillRect(x + 5, y + bobY, 6, 3)
      ctx.fillRect(x + 4, y + 1 + bobY, 2, 2)
      ctx.fillRect(x + 10, y + 1 + bobY, 2, 2)
      break
    case 2: // Side part
      ctx.fillRect(x + 4, y + 1 + bobY, 8, 3)
      ctx.fillRect(x + 4, y + 3 + bobY, 2, 4)
      break
    case 3: // Bald (minimal)
      ctx.fillRect(x + 5, y + 1 + bobY, 6, 2)
      break
  }

  // Eyes (2px dots)
  ctx.fillStyle = '#111'
  if (row === 2) {
    // Walking up — no eyes visible
  } else {
    ctx.fillRect(x + 6, y + 5 + bobY, 1, 1)
    ctx.fillRect(x + 9, y + 5 + bobY, 1, 1)
  }

  // Body / outfit (8x8)
  ctx.fillStyle = outfit
  ctx.fillRect(x + 4, y + 9 + bobY, 8, 8)

  // Arms
  if (row === 5) {
    // Action pose — arms forward
    ctx.fillRect(x + 2, y + 10 + bobY, 2, 5)
    ctx.fillRect(x + 12, y + 10 + bobY, 2, 5)
  } else {
    ctx.fillStyle = skin
    ctx.fillRect(x + 3, y + 10 + bobY, 2, 5 + (legOffset > 0 ? 1 : 0))
    ctx.fillRect(x + 11, y + 10 + bobY, 2, 5 + (legOffset < 0 ? 1 : 0))
  }

  // Legs (2px wide each)
  ctx.fillStyle = '#2a2a4a'
  const legBase = y + 17 + bobY
  ctx.fillRect(x + 5, legBase, 2, 5 + legOffset)
  ctx.fillRect(x + 9, legBase, 2, 5 - legOffset)

  // Feet
  ctx.fillStyle = '#1a1a2a'
  ctx.fillRect(x + 4, legBase + 5 + legOffset, 3, 2)
  ctx.fillRect(x + 9, legBase + 5 - legOffset, 3, 2)
}

function toCSS(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`
}

export { FRAME_W, FRAME_H, COLS as SHEET_COLS, ROWS as SHEET_ROWS }
