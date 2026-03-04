import { AgentVisualTraits } from '../../types'

const PORTRAIT_W = 64
const PORTRAIT_H = 96

/** Generate a larger portrait for the info panel as a data URL */
export function generatePortrait(name: string, traits: AgentVisualTraits): string {
  const canvas = document.createElement('canvas')
  canvas.width = PORTRAIT_W
  canvas.height = PORTRAIT_H
  const ctx = canvas.getContext('2d')!

  ctx.imageSmoothingEnabled = false

  // Background
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, PORTRAIT_W, PORTRAIT_H)

  const skin = toCSS(traits.skinTone)
  const hair = toCSS(traits.hairColor)
  const outfit = toCSS(traits.outfitColor)

  // Head (24x24, centered)
  ctx.fillStyle = skin
  ctx.fillRect(20, 8, 24, 24)

  // Hair
  ctx.fillStyle = hair
  switch (traits.hairStyle) {
    case 0:
      ctx.fillRect(16, 4, 32, 10)
      break
    case 1:
      ctx.fillRect(18, 2, 28, 10)
      ctx.fillRect(14, 6, 8, 8)
      ctx.fillRect(42, 6, 8, 8)
      break
    case 2:
      ctx.fillRect(16, 4, 32, 10)
      ctx.fillRect(14, 10, 8, 16)
      break
    case 3:
      ctx.fillRect(18, 4, 28, 6)
      break
  }

  // Eyes
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(24, 18, 6, 5)
  ctx.fillRect(34, 18, 6, 5)
  ctx.fillStyle = '#111111'
  ctx.fillRect(26, 19, 3, 3)
  ctx.fillRect(36, 19, 3, 3)

  // Mouth
  ctx.fillStyle = '#cc8877'
  ctx.fillRect(28, 26, 8, 2)

  // Neck
  ctx.fillStyle = skin
  ctx.fillRect(28, 32, 8, 6)

  // Body
  ctx.fillStyle = outfit
  ctx.fillRect(14, 38, 36, 30)

  // Arms
  ctx.fillStyle = skin
  ctx.fillRect(8, 40, 8, 20)
  ctx.fillRect(48, 40, 8, 20)

  // Name plate
  ctx.fillStyle = '#0f3460'
  ctx.fillRect(0, PORTRAIT_H - 18, PORTRAIT_W, 18)
  ctx.fillStyle = '#e94560'
  ctx.font = '10px Courier New'
  ctx.textAlign = 'center'
  ctx.fillText(name, PORTRAIT_W / 2, PORTRAIT_H - 5)

  return canvas.toDataURL('image/png')
}

function toCSS(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`
}
