import { AgentVisualTraits } from '../../types'

const PORTRAIT_W = 64
const PORTRAIT_H = 96

export function generatePortrait(name: string, traits: AgentVisualTraits): string {
  const canvas = document.createElement('canvas')
  canvas.width = PORTRAIT_W
  canvas.height = PORTRAIT_H
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  const skin = toCSS(traits.skinTone)
  const skinDark = toCSS(darken(traits.skinTone, 20))
  const skinLight = toCSS(lighten(traits.skinTone, 15))
  const hair = toCSS(traits.hairColor)
  const hairDark = toCSS(darken(traits.hairColor, 25))
  const outfit = toCSS(traits.outfitColor)
  const outfitDark = toCSS(darken(traits.outfitColor, 30))
  const outfitLight = toCSS(lighten(traits.outfitColor, 20))

  // Background gradient
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, PORTRAIT_W, PORTRAIT_H)
  // Subtle vignette
  for (let y = 0; y < PORTRAIT_H; y++) {
    for (let x = 0; x < PORTRAIT_W; x++) {
      const dx = (x - PORTRAIT_W / 2) / PORTRAIT_W
      const dy = (y - PORTRAIT_H / 2) / PORTRAIT_H
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 0.4) {
        ctx.fillStyle = `rgba(0,0,0,${(dist - 0.4) * 0.3})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  // Body
  ctx.fillStyle = outfit
  ctx.fillRect(14, 44, 36, 30)
  ctx.fillStyle = outfitDark
  ctx.fillRect(14, 44, 4, 30)
  ctx.fillRect(14, 68, 36, 6)
  ctx.fillStyle = outfitLight
  ctx.fillRect(18, 44, 28, 2)

  // Collar
  ctx.fillStyle = '#fff'
  ctx.fillRect(24, 44, 16, 3)
  ctx.fillStyle = '#eee'
  ctx.fillRect(26, 44, 12, 2)

  // Arms
  ctx.fillStyle = skin
  ctx.fillRect(8, 48, 8, 20)
  ctx.fillRect(48, 48, 8, 20)
  ctx.fillStyle = skinDark
  ctx.fillRect(8, 48, 3, 20)
  ctx.fillRect(48, 48, 3, 20)

  // Neck
  ctx.fillStyle = skinDark
  ctx.fillRect(28, 36, 8, 10)

  // Head
  ctx.fillStyle = skin
  ctx.fillRect(20, 8, 24, 28)
  ctx.fillRect(18, 12, 28, 22)
  // Face shading
  ctx.fillStyle = skinDark
  ctx.fillRect(18, 32, 28, 4)
  ctx.fillRect(18, 12, 3, 22)
  ctx.fillStyle = skinLight
  ctx.fillRect(22, 10, 16, 4)

  // Hair
  ctx.fillStyle = hair
  const hs = traits.hairStyle % 8
  switch (hs) {
    case 0:
      ctx.fillRect(16, 4, 32, 12)
      ctx.fillStyle = hairDark
      ctx.fillRect(16, 14, 6, 4)
      ctx.fillRect(42, 14, 6, 4)
      break
    case 1:
      ctx.fillRect(18, 2, 28, 12)
      ctx.fillRect(14, 6, 8, 10)
      ctx.fillRect(42, 6, 8, 10)
      ctx.fillRect(16, 0, 6, 4)
      ctx.fillRect(28, 0, 6, 4)
      ctx.fillRect(40, 0, 6, 4)
      break
    case 2:
      ctx.fillRect(16, 4, 32, 12)
      ctx.fillRect(14, 10, 8, 20)
      ctx.fillStyle = hairDark
      ctx.fillRect(14, 24, 8, 6)
      break
    case 3:
      ctx.fillRect(18, 4, 28, 8)
      break
    case 4:
      ctx.fillRect(16, 4, 32, 12)
      ctx.fillRect(12, 10, 8, 26)
      ctx.fillRect(44, 10, 8, 26)
      ctx.fillStyle = hairDark
      ctx.fillRect(12, 28, 8, 8)
      ctx.fillRect(44, 28, 8, 8)
      break
    case 5:
      ctx.fillRect(24, 0, 16, 12)
      ctx.fillStyle = hairDark
      ctx.fillRect(24, 10, 16, 2)
      break
    case 6:
      ctx.fillRect(16, 4, 32, 12)
      ctx.fillRect(44, 10, 8, 20)
      ctx.fillRect(48, 24, 8, 12)
      break
    case 7:
      ctx.fillRect(14, 2, 36, 14)
      ctx.fillRect(12, 6, 6, 14)
      ctx.fillRect(46, 6, 6, 14)
      ctx.fillStyle = hairDark
      ctx.fillRect(20, 4, 4, 4)
      ctx.fillRect(28, 2, 4, 4)
      ctx.fillRect(36, 4, 4, 4)
      ctx.fillRect(44, 2, 4, 4)
      break
  }

  // Eyes
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(22, 18, 8, 6)
  ctx.fillRect(34, 18, 8, 6)
  ctx.fillStyle = '#222'
  ctx.fillRect(26, 19, 4, 4)
  ctx.fillRect(38, 19, 4, 4)
  // Highlights
  ctx.fillStyle = '#fff'
  ctx.fillRect(26, 19, 2, 2)
  ctx.fillRect(38, 19, 2, 2)

  // Eyebrows
  ctx.fillStyle = hairDark
  ctx.fillRect(22, 16, 8, 2)
  ctx.fillRect(34, 16, 8, 2)

  // Nose
  ctx.fillStyle = skinDark
  ctx.fillRect(30, 24, 4, 4)
  ctx.fillStyle = skinLight
  ctx.fillRect(31, 24, 2, 2)

  // Mouth
  ctx.fillStyle = '#cc8877'
  ctx.fillRect(28, 30, 8, 2)
  ctx.fillStyle = '#bb7766'
  ctx.fillRect(28, 31, 8, 1)

  // Face accessories
  const face = traits.faceStyle ?? 'default'
  if (face === 'glasses' || face === 'both') {
    ctx.fillStyle = '#444'
    ctx.strokeStyle = '#444'
    ctx.lineWidth = 2
    ctx.strokeRect(21, 17, 10, 8)
    ctx.strokeRect(33, 17, 10, 8)
    ctx.fillRect(30, 20, 4, 2) // bridge
    ctx.fillStyle = 'rgba(120,160,255,0.1)'
    ctx.fillRect(22, 18, 8, 6)
    ctx.fillRect(34, 18, 8, 6)
  }
  if (face === 'beard' || face === 'both') {
    ctx.fillStyle = hair
    ctx.fillRect(22, 30, 20, 6)
    ctx.fillRect(26, 34, 12, 4)
    ctx.fillStyle = hairDark
    ctx.fillRect(28, 36, 8, 2)
  }

  // Hat
  const hat = traits.hatStyle ?? 'none'
  if (hat !== 'none') {
    const hatColor = toCSS(traits.accessoryColor ?? traits.hairColor)
    const hatDarkC = toCSS(darken(traits.accessoryColor ?? traits.hairColor, 25))
    ctx.fillStyle = hatColor
    switch (hat) {
      case 'cap':
        ctx.fillRect(14, 2, 36, 10)
        ctx.fillRect(10, 10, 14, 6)
        ctx.fillStyle = hatDarkC
        ctx.fillRect(14, 10, 36, 3)
        break
      case 'beanie':
        ctx.fillRect(16, 0, 32, 12)
        ctx.fillRect(24, -4, 16, 6)
        ctx.fillStyle = hatDarkC
        ctx.fillRect(16, 10, 32, 3)
        break
      case 'tophat':
        ctx.fillRect(20, -8, 24, 16)
        ctx.fillRect(14, 6, 36, 6)
        ctx.fillStyle = hatDarkC
        ctx.fillRect(20, 2, 24, 3)
        break
      case 'headband':
        ctx.fillRect(16, 6, 32, 6)
        break
      case 'bandana':
        ctx.fillRect(16, 2, 32, 10)
        ctx.fillRect(44, 8, 10, 6)
        ctx.fillStyle = hatDarkC
        ctx.fillRect(16, 10, 32, 3)
        break
    }
  }

  // Name plate
  ctx.fillStyle = 'rgba(10,10,30,0.85)'
  ctx.fillRect(0, PORTRAIT_H - 20, PORTRAIT_W, 20)
  ctx.fillStyle = '#53d8fb'
  ctx.font = 'bold 10px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(name, PORTRAIT_W / 2, PORTRAIT_H - 6)
  ctx.textAlign = 'start'

  // Border
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, PORTRAIT_W, PORTRAIT_H)

  return canvas.toDataURL('image/png')
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
