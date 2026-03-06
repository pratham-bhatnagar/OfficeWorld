import Phaser from 'phaser'
import { AgentVisualTraits } from '../../types'
import { SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS, HAT_STYLES, FACE_STYLES } from '../../constants'

const FRAME_W = 16
const FRAME_H = 24
const COLS = 4  // animation frames per row
const ROWS = 8  // idle, walk-down, walk-up, walk-left, walk-right, action, smoke, play
const SHEET_W = FRAME_W * COLS
const SHEET_H = FRAME_H * ROWS

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function traitsFromName(name: string, rig?: string): AgentVisualTraits {
  const h = hashString(name)
  return {
    skinTone: SKIN_TONES[h % SKIN_TONES.length],
    hairColor: HAIR_COLORS[(h >> 4) % HAIR_COLORS.length],
    hairStyle: (h >> 8) % 8,
    outfitColor: rig ? (OUTFIT_COLORS[rig] ?? OUTFIT_COLORS.default) : OUTFIT_COLORS.default,
    hatStyle: HAT_STYLES[(h >> 12) % HAT_STYLES.length],
    faceStyle: FACE_STYLES[(h >> 16) % FACE_STYLES.length],
    accessoryColor: HAIR_COLORS[(h >> 20) % HAIR_COLORS.length],
  }
}

export function generateSpritesheet(
  scene: Phaser.Scene,
  textureKey: string,
  traits: AgentVisualTraits,
): void {
  const canvas = document.createElement('canvas')
  canvas.width = SHEET_W
  canvas.height = SHEET_H
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, SHEET_W, SHEET_H)

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      drawFrame(ctx, col * FRAME_W, row * FRAME_H, row, col, traits)
    }
  }

  if (scene.textures.exists(textureKey)) {
    scene.textures.remove(textureKey)
  }
  const texture = scene.textures.addCanvas(textureKey, canvas)
  if (!texture) return

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
  const skinDark = toCSS(darken(traits.skinTone, 20))
  const skinLight = toCSS(lighten(traits.skinTone, 15))
  const hair = toCSS(traits.hairColor)
  const hairDark = toCSS(darken(traits.hairColor, 25))
  const outfit = toCSS(traits.outfitColor)
  const outfitDark = toCSS(darken(traits.outfitColor, 30))
  const outfitLight = toCSS(lighten(traits.outfitColor, 20))

  const isWalking = row >= 1 && row <= 4
  const isSmoking = row === 6
  const isPlaying = row === 7
  const bobY = isWalking ? (col % 2 === 0 ? 0 : -1) : 0
  const legOffset = isWalking ? (col % 2 === 0 ? 1 : -1) : 0
  const armSwing = isWalking ? (col % 2 === 0 ? 1 : -1) : 0
  const facingBack = row === 2 // walk-up

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.fillRect(x + 4, y + 21, 8, 2)
  ctx.fillStyle = 'rgba(0,0,0,0.1)'
  ctx.fillRect(x + 3, y + 22, 10, 1)

  // === LEGS ===
  const legBase = y + 17 + bobY
  // Left leg
  ctx.fillStyle = '#2a2a4a'
  ctx.fillRect(x + 5, legBase, 2, 4 + legOffset)
  ctx.fillStyle = '#222240'
  ctx.fillRect(x + 5, legBase, 2, 1) // waist shadow
  // Right leg
  ctx.fillStyle = '#2a2a4a'
  ctx.fillRect(x + 9, legBase, 2, 4 - legOffset)
  ctx.fillStyle = '#222240'
  ctx.fillRect(x + 9, legBase, 2, 1)

  // Shoes
  ctx.fillStyle = '#1a1a2a'
  ctx.fillRect(x + 4, legBase + 4 + legOffset, 3, 2)
  ctx.fillRect(x + 9, legBase + 4 - legOffset, 3, 2)
  // Shoe highlights
  ctx.fillStyle = '#2a2a3a'
  ctx.fillRect(x + 4, legBase + 4 + legOffset, 3, 1)
  ctx.fillRect(x + 9, legBase + 4 - legOffset, 3, 1)

  // === BODY / OUTFIT ===
  // Main body
  ctx.fillStyle = outfit
  ctx.fillRect(x + 4, y + 9 + bobY, 8, 8)
  // Outfit shading
  ctx.fillStyle = outfitDark
  ctx.fillRect(x + 4, y + 9 + bobY, 1, 8) // left shadow
  ctx.fillRect(x + 4, y + 15 + bobY, 8, 2) // bottom shadow
  // Outfit highlight
  ctx.fillStyle = outfitLight
  ctx.fillRect(x + 5, y + 9 + bobY, 6, 1) // top highlight
  ctx.fillRect(x + 11, y + 10 + bobY, 1, 5) // right highlight

  // Collar
  ctx.fillStyle = '#fff'
  ctx.fillRect(x + 6, y + 9 + bobY, 4, 1)

  // Belt
  ctx.fillStyle = '#3a3a3a'
  ctx.fillRect(x + 4, y + 16 + bobY, 8, 1)
  // Belt buckle
  ctx.fillStyle = '#8a8a4a'
  ctx.fillRect(x + 7, y + 16 + bobY, 2, 1)

  // === ARMS ===
  if (isSmoking) {
    // Right arm forward with cigarette
    ctx.fillStyle = skin
    ctx.fillRect(x + 3, y + 10 + bobY, 2, 5)
    ctx.fillStyle = skinDark
    ctx.fillRect(x + 3, y + 10 + bobY, 1, 5)
    // Left arm holding cigarette out
    ctx.fillStyle = skin
    ctx.fillRect(x + 11, y + 10 + bobY, 2, 4)
    ctx.fillRect(x + 13, y + 10 + bobY, 2, 1) // extended hand
    // Cigarette
    ctx.fillStyle = '#eee'
    ctx.fillRect(x + 14, y + 10 + bobY, 2, 1)
    ctx.fillStyle = '#ff6633'
    ctx.fillRect(x + 15, y + 10 + bobY, 1, 1) // lit end
    // Smoke particles
    if (col % 2 === 0) {
      ctx.fillStyle = 'rgba(180,180,180,0.4)'
      ctx.fillRect(x + 15, y + 8 + bobY, 1, 1)
      ctx.fillRect(x + 14, y + 6 + bobY, 1, 1)
    } else {
      ctx.fillStyle = 'rgba(180,180,180,0.3)'
      ctx.fillRect(x + 14, y + 7 + bobY, 1, 1)
      ctx.fillRect(x + 15, y + 5 + bobY, 1, 1)
      ctx.fillRect(x + 13, y + 4 + bobY, 1, 1)
    }
  } else if (isPlaying) {
    // Playing animation - arms up/active
    const armY = col % 2 === 0 ? 0 : -2
    ctx.fillStyle = skin
    ctx.fillRect(x + 2, y + 10 + bobY + armY, 2, 5)
    ctx.fillRect(x + 12, y + 10 + bobY - armY, 2, 5)
    ctx.fillStyle = skinDark
    ctx.fillRect(x + 2, y + 10 + bobY + armY, 1, 5)
    ctx.fillRect(x + 12, y + 10 + bobY - armY, 1, 5)
  } else if (row === 5) {
    // Action pose (working at desk) - arms at keyboard
    ctx.fillStyle = outfit
    ctx.fillRect(x + 2, y + 10 + bobY, 2, 4)
    ctx.fillRect(x + 12, y + 10 + bobY, 2, 4)
    ctx.fillStyle = skin
    ctx.fillRect(x + 1, y + 13 + bobY, 2, 2) // left hand forward
    ctx.fillRect(x + 13, y + 13 + bobY, 2, 2) // right hand forward
  } else {
    // Normal arms with swing
    ctx.fillStyle = skin
    ctx.fillRect(x + 3, y + 10 + bobY, 2, 5 + (armSwing > 0 ? 1 : 0))
    ctx.fillRect(x + 11, y + 10 + bobY, 2, 5 + (armSwing < 0 ? 1 : 0))
    // Arm shadows
    ctx.fillStyle = skinDark
    ctx.fillRect(x + 3, y + 10 + bobY, 1, 5 + (armSwing > 0 ? 1 : 0))
    ctx.fillRect(x + 11, y + 10 + bobY, 1, 5 + (armSwing < 0 ? 1 : 0))
    // Hands
    ctx.fillStyle = skin
    ctx.fillRect(x + 3, y + 14 + bobY + (armSwing > 0 ? 1 : 0), 2, 1)
    ctx.fillRect(x + 11, y + 14 + bobY + (armSwing < 0 ? 1 : 0), 2, 1)
  }

  // === HEAD ===
  // Head shape (rounded)
  ctx.fillStyle = skin
  ctx.fillRect(x + 5, y + 2 + bobY, 6, 7)
  ctx.fillRect(x + 4, y + 3 + bobY, 8, 5) // wider middle
  // Face shading
  ctx.fillStyle = skinDark
  ctx.fillRect(x + 4, y + 7 + bobY, 8, 1) // chin shadow
  ctx.fillRect(x + 4, y + 3 + bobY, 1, 5) // left face shadow
  // Face highlight
  ctx.fillStyle = skinLight
  ctx.fillRect(x + 6, y + 3 + bobY, 3, 1)

  // Neck
  ctx.fillStyle = skinDark
  ctx.fillRect(x + 6, y + 8 + bobY, 4, 2)

  // === HAIR ===
  ctx.fillStyle = hair
  const hs = traits.hairStyle % 8
  switch (hs) {
    case 0: // Short flat
      ctx.fillRect(x + 4, y + 1 + bobY, 8, 3)
      ctx.fillStyle = hairDark
      ctx.fillRect(x + 4, y + 3 + bobY, 2, 1)
      ctx.fillRect(x + 10, y + 3 + bobY, 2, 1)
      break
    case 1: // Spiky
      ctx.fillRect(x + 5, y + bobY, 6, 3)
      ctx.fillRect(x + 4, y + 1 + bobY, 2, 2)
      ctx.fillRect(x + 10, y + 1 + bobY, 2, 2)
      // Spikes
      ctx.fillRect(x + 4, y - 1 + bobY, 1, 2)
      ctx.fillRect(x + 7, y - 1 + bobY, 1, 2)
      ctx.fillRect(x + 10, y - 1 + bobY, 1, 2)
      ctx.fillStyle = hairDark
      ctx.fillRect(x + 5, y + 2 + bobY, 6, 1)
      break
    case 2: // Side part
      ctx.fillRect(x + 4, y + 1 + bobY, 8, 3)
      ctx.fillRect(x + 3, y + 2 + bobY, 2, 5) // long left side
      ctx.fillStyle = hairDark
      ctx.fillRect(x + 3, y + 5 + bobY, 2, 2)
      break
    case 3: // Bald (very minimal)
      ctx.fillRect(x + 5, y + 1 + bobY, 6, 2)
      break
    case 4: // Long hair
      ctx.fillRect(x + 4, y + 1 + bobY, 8, 3)
      ctx.fillRect(x + 3, y + 2 + bobY, 2, 7) // left side
      ctx.fillRect(x + 11, y + 2 + bobY, 2, 7) // right side
      ctx.fillStyle = hairDark
      ctx.fillRect(x + 3, y + 6 + bobY, 2, 3)
      ctx.fillRect(x + 11, y + 6 + bobY, 2, 3)
      break
    case 5: // Mohawk
      ctx.fillRect(x + 6, y - 1 + bobY, 4, 4)
      ctx.fillStyle = hairDark
      ctx.fillRect(x + 6, y + 2 + bobY, 4, 1)
      break
    case 6: // Ponytail
      ctx.fillRect(x + 4, y + 1 + bobY, 8, 3)
      // Ponytail extending back
      if (!facingBack) {
        ctx.fillRect(x + 11, y + 2 + bobY, 2, 6)
        ctx.fillRect(x + 12, y + 6 + bobY, 2, 3)
      } else {
        ctx.fillRect(x + 6, y + 2 + bobY, 4, 2)
        ctx.fillRect(x + 7, y + 4 + bobY, 2, 5)
      }
      break
    case 7: // Curly
      ctx.fillRect(x + 4, y + bobY, 8, 4)
      ctx.fillRect(x + 3, y + 1 + bobY, 1, 4)
      ctx.fillRect(x + 12, y + 1 + bobY, 1, 4)
      // Curl texture
      ctx.fillStyle = hairDark
      ctx.fillRect(x + 5, y + 1 + bobY, 1, 1)
      ctx.fillRect(x + 7, y + bobY, 1, 1)
      ctx.fillRect(x + 9, y + 1 + bobY, 1, 1)
      ctx.fillRect(x + 11, y + bobY, 1, 1)
      break
  }

  // === FACE DETAILS ===
  if (!facingBack) {
    // Eyes
    ctx.fillStyle = '#fff'
    ctx.fillRect(x + 5, y + 4 + bobY, 3, 2)
    ctx.fillRect(x + 9, y + 4 + bobY, 3, 2)
    // Pupils (shift with direction)
    const eyeShiftX = row === 3 ? -1 : row === 4 ? 1 : 0
    ctx.fillStyle = '#222'
    ctx.fillRect(x + 6 + eyeShiftX, y + 4 + bobY, 2, 2)
    ctx.fillRect(x + 10 + eyeShiftX, y + 4 + bobY, 2, 2)
    // Pupil highlights
    ctx.fillStyle = '#fff'
    ctx.fillRect(x + 6 + eyeShiftX, y + 4 + bobY, 1, 1)
    ctx.fillRect(x + 10 + eyeShiftX, y + 4 + bobY, 1, 1)

    // Mouth
    if (isSmoking) {
      ctx.fillStyle = '#999'
      ctx.fillRect(x + 7, y + 7 + bobY, 3, 1) // grimace
    } else if (isPlaying) {
      ctx.fillStyle = '#cc7766'
      ctx.fillRect(x + 7, y + 7 + bobY, 2, 1) // open mouth (excited)
      ctx.fillStyle = '#aa5544'
      ctx.fillRect(x + 7, y + 7 + bobY, 2, 1)
    } else if (row === 5) {
      // Working - neutral
      ctx.fillStyle = '#bb8877'
      ctx.fillRect(x + 7, y + 7 + bobY, 2, 1)
    } else {
      // Slight smile
      ctx.fillStyle = '#cc8877'
      ctx.fillRect(x + 7, y + 7 + bobY, 3, 1)
    }

    // Face accessories
    const face = traits.faceStyle ?? 'default'
    if (face === 'glasses' || face === 'both') {
      ctx.fillStyle = '#444'
      // Left lens frame
      ctx.fillRect(x + 4, y + 4 + bobY, 4, 1)
      ctx.fillRect(x + 4, y + 6 + bobY, 4, 1)
      ctx.fillRect(x + 4, y + 4 + bobY, 1, 3)
      ctx.fillRect(x + 7, y + 4 + bobY, 1, 3)
      // Bridge
      ctx.fillRect(x + 7, y + 5 + bobY, 2, 1)
      // Right lens frame
      ctx.fillRect(x + 8, y + 4 + bobY, 4, 1)
      ctx.fillRect(x + 8, y + 6 + bobY, 4, 1)
      ctx.fillRect(x + 8, y + 4 + bobY, 1, 3)
      ctx.fillRect(x + 11, y + 4 + bobY, 1, 3)
      // Lens shine
      ctx.fillStyle = 'rgba(120,160,255,0.15)'
      ctx.fillRect(x + 5, y + 5 + bobY, 2, 1)
      ctx.fillRect(x + 9, y + 5 + bobY, 2, 1)
    }
    if (face === 'beard' || face === 'both') {
      ctx.fillStyle = hair
      ctx.fillRect(x + 5, y + 7 + bobY, 6, 2)
      ctx.fillRect(x + 6, y + 8 + bobY, 4, 1)
      ctx.fillStyle = hairDark
      ctx.fillRect(x + 6, y + 8 + bobY, 4, 1)
    }
    if (face === 'freckles') {
      ctx.fillStyle = darkenCSS(skin, 30)
      ctx.fillRect(x + 5, y + 6 + bobY, 1, 1)
      ctx.fillRect(x + 7, y + 5 + bobY, 1, 1)
      ctx.fillRect(x + 10, y + 6 + bobY, 1, 1)
    }
    if (face === 'scar') {
      ctx.fillStyle = skinLight
      ctx.fillRect(x + 10, y + 4 + bobY, 1, 3)
      ctx.fillStyle = skinDark
      ctx.fillRect(x + 11, y + 4 + bobY, 1, 3)
    }
  }

  // === HAT ===
  const hat = traits.hatStyle ?? 'none'
  if (hat !== 'none') {
    const hatColor = toCSS(traits.accessoryColor ?? traits.hairColor)
    const hatDark = toCSS(darken(traits.accessoryColor ?? traits.hairColor, 25))
    ctx.fillStyle = hatColor
    switch (hat) {
      case 'cap':
        ctx.fillRect(x + 3, y + bobY, 10, 3)
        ctx.fillRect(x + 2, y + 2 + bobY, 3, 2) // brim
        ctx.fillStyle = hatDark
        ctx.fillRect(x + 3, y + 2 + bobY, 10, 1)
        break
      case 'beanie':
        ctx.fillRect(x + 4, y - 1 + bobY, 8, 4)
        ctx.fillRect(x + 6, y - 2 + bobY, 4, 2) // top pom
        ctx.fillStyle = hatDark
        ctx.fillRect(x + 4, y + 2 + bobY, 8, 1) // rim
        break
      case 'tophat':
        ctx.fillRect(x + 5, y - 3 + bobY, 6, 5)
        ctx.fillRect(x + 3, y + 1 + bobY, 10, 2) // brim
        ctx.fillStyle = hatDark
        ctx.fillRect(x + 5, y + bobY, 6, 1) // band
        break
      case 'headband':
        ctx.fillRect(x + 4, y + 1 + bobY, 8, 2)
        break
      case 'bandana':
        ctx.fillRect(x + 4, y + bobY, 8, 3)
        ctx.fillRect(x + 11, y + 2 + bobY, 3, 2) // tail
        ctx.fillStyle = hatDark
        ctx.fillRect(x + 4, y + 2 + bobY, 8, 1)
        break
    }
  }
}

function toCSS(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`
}

function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) - amount)
  const g = Math.max(0, ((color >> 8) & 0xff) - amount)
  const b = Math.max(0, (color & 0xff) - amount)
  return (r << 16) | (g << 8) | b
}

function lighten(color: number, amount: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + amount)
  const g = Math.min(255, ((color >> 8) & 0xff) + amount)
  const b = Math.min(255, (color & 0xff) + amount)
  return (r << 16) | (g << 8) | b
}

function darkenCSS(css: string, amount: number): string {
  const hex = parseInt(css.slice(1), 16)
  return toCSS(darken(hex, amount))
}

export { FRAME_W, FRAME_H, COLS as SHEET_COLS, ROWS as SHEET_ROWS }
