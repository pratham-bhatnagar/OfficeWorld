export const TILE_SIZE = 16
export const WORLD_WIDTH = 120
export const WORLD_HEIGHT = 80
export const CANVAS_WIDTH = 960
export const CANVAS_HEIGHT = 640

export const SKIN_TONES = [0xffdbb4, 0xe8b88a, 0xd4956b, 0xb07050, 0x8b5e3c, 0x5c3a1e]

export const HAIR_COLORS = [0x2c1810, 0x4a3728, 0x8b6f47, 0xd4a76a, 0xc41e3a, 0x1e90ff, 0x7b68ee, 0x2e8b57]

export const ROOM_COLORS: Record<string, number> = {
  planogram: 0x1a3a5c,
  alc_ai: 0x1a4a3a,
  arcade: 0x3a1a5c,
  hallway: 0x2a2a3e,
  breakroom: 0x3a3a1e,
  smoke_area: 0x2e2e2e,
  bathroom: 0x1e3a3a,
  play_area: 0x3a1a3a,
}

export const BREAK_TIMING = {
  minWorkTime: 30000,
  maxWorkTime: 120000,
  breakDuration: 15000,
  smokeDuration: 20000,
  bathroomDuration: 10000,
}

export const OUTFIT_COLORS: Record<string, number> = {
  planogram: 0x2196f3,
  alc_ai: 0x4caf50,
  arcade: 0x9c27b0,
  mayor: 0x53d8fb,
  deacon: 0xff9800,
  witness: 0xe91e63,
  refinery: 0xff5722,
  default: 0x607d8b,
}
