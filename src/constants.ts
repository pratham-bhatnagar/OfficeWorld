export const TILE_SIZE = 16
export const WORLD_WIDTH = 120
export const WORLD_HEIGHT = 80
export const CANVAS_WIDTH = 1280
export const CANVAS_HEIGHT = 720

// Warm color palette (Star Office inspired)
export const THEME = {
  // Backgrounds
  bgDark: '#0e1119',
  bgPanel: '#141722',
  bgBody: '#1a1a2e',
  bgCanvas: '#12101e',
  bgHeader: '#1a1533',

  // Accents
  gold: '#ffd700',
  goldDim: '#b8960f',
  green: '#22c55e',
  greenDim: '#0f9b58',
  red: '#e94560',
  orange: '#ffaa00',
  cyan: '#53d8fb',
  purple: '#64477d',

  // Text
  textBright: '#fff',
  textPrimary: '#e5e7eb',
  textSecondary: '#9ca3af',
  textMuted: '#555',

  // Borders
  borderDark: '#0e1119',
  borderPanel: '#2a2040',
  borderAccent: '#64477d',

  // Font
  fontFamily: "'ArkPixel', 'Courier New', monospace",
} as const

export const SKIN_TONES = [0xfce4c0, 0xf5d0a9, 0xe8b88a, 0xd4956b, 0xb07050, 0x8b5e3c, 0x6b4226, 0x5c3a1e]

export const HAIR_COLORS = [
  0x2c1810, 0x4a3728, 0x8b6f47, 0xd4a76a, 0xf5deb3,
  0xc41e3a, 0x1e6090, 0x6b4e8b, 0x2e8b57, 0x1a1a1a,
]

export const HAT_STYLES = ['none', 'cap', 'beanie', 'tophat', 'headband', 'bandana'] as const
export const HAIR_STYLES = ['short', 'spiky', 'sidepart', 'bald', 'long', 'mohawk', 'ponytail', 'curly'] as const
export const FACE_STYLES = ['default', 'glasses', 'beard', 'both', 'freckles', 'scar'] as const

export const ROOM_COLORS: Record<string, number> = {
  planogram: 0x2a4a6e,
  alc_ai: 0x2a5a4a,
  arcade: 0x4a2a6e,
  mayor_office: 0x5a4a2e,
  hallway: 0x3a3a50,
  breakroom: 0x5a5a2e,
  smoke_area: 0x3e3e3e,
  bathroom: 0x2e4a4a,
  play_area: 0x4a2a4a,
  meeting_room: 0x3a4a3a,
}

export const FLOOR_STYLES: Record<string, 'wood' | 'carpet' | 'tile' | 'concrete' | 'grass'> = {
  planogram: 'carpet',
  alc_ai: 'carpet',
  arcade: 'carpet',
  mayor_office: 'wood',
  hallway: 'tile',
  breakroom: 'tile',
  smoke_area: 'concrete',
  bathroom: 'tile',
  play_area: 'wood',
  meeting_room: 'carpet',
}

export const BREAK_TIMING = {
  minWorkTime: 30000,
  maxWorkTime: 120000,
  breakDuration: 15000,
  smokeDuration: 20000,
  bathroomDuration: 10000,
}

export const OUTFIT_COLORS: Record<string, number> = {
  planogram: 0x3a7bd5,
  alc_ai: 0x4caf50,
  arcade: 0x9c27b0,
  mayor: 0xd4af37,
  deacon: 0xff9800,
  witness: 0xe91e63,
  refinery: 0xff5722,
  default: 0x607d8b,
}

export const BEAD_SPAWN_CHANCE = 0.003
export const POLECAT_SPAWN_INTERVAL = 15000
export const POLECAT_CLEAN_SPEED = 800
export const POLECAT_FADE_DURATION = 1500
