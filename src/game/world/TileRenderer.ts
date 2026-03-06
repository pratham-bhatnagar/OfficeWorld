import Phaser from 'phaser'
import { RoomConfig, FurnitureItem, DecorationItem } from '../../types'
import { TILE_SIZE, FLOOR_STYLES } from '../../constants'
import {
  drawWoodFloor, drawCarpetFloor, drawTileFloor, drawConcreteFloor,
  drawWall, drawShadow, lighten, darken, seededRandom, colorToRGB,
} from './PixelArtUtils'

export class TileRenderer {
  private scene: Phaser.Scene
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false
  }

  drawRoom(room: RoomConfig, rt: Phaser.GameObjects.RenderTexture) {
    const T = TILE_SIZE
    const floorStyle = FLOOR_STYLES[room.id] || 'tile'

    // Size canvas for this room
    this.canvas.width = room.width * T
    this.canvas.height = room.height * T
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw floor tiles with texture
    const floorColor = room.color
    for (let ty = 2; ty < room.height - 1; ty++) {
      for (let tx = 1; tx < room.width - 1; tx++) {
        switch (floorStyle) {
          case 'wood': drawWoodFloor(this.ctx, tx, ty, T, lighten(floorColor, 30)); break
          case 'carpet': drawCarpetFloor(this.ctx, tx, ty, T, floorColor); break
          case 'tile': drawTileFloor(this.ctx, tx, ty, T, lighten(floorColor, 20)); break
          case 'concrete': drawConcreteFloor(this.ctx, tx, ty, T, lighten(floorColor, 10)); break
          default: drawTileFloor(this.ctx, tx, ty, T, floorColor)
        }
      }
    }

    // Draw walls with brick/depth texture
    const wallColor = darken(room.color, 15)

    // Top wall (2 tiles thick with depth)
    drawWall(this.ctx, 0, 0, room.width * T, 2 * T, wallColor, 'top')

    // Bottom wall
    drawWall(this.ctx, 0, (room.height - 1) * T, room.width * T, T, darken(wallColor, 15), 'bottom')

    // Left wall
    for (let y = 0; y < room.height; y++) {
      drawWall(this.ctx, 0, y * T, T, T, darken(wallColor, 10), 'left')
    }

    // Right wall
    for (let y = 0; y < room.height; y++) {
      drawWall(this.ctx, (room.width - 1) * T, y * T, T, T, darken(wallColor, 10), 'right')
    }

    // Wall shadow cast onto floor (top wall)
    this.ctx.fillStyle = 'rgba(0,0,0,0.15)'
    this.ctx.fillRect(T, 2 * T, (room.width - 2) * T, 4)

    // Room name sign on top wall
    this.drawRoomSign(room.name, Math.floor(room.width / 2) * T, T * 0.3)

    // Draw decorations
    if (room.decorations) {
      for (const deco of room.decorations) {
        this.drawDecoration(deco, room.x, room.y)
      }
    }

    // Blit to render texture at room position
    const key = `room_${room.id}_${Date.now()}`
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key)
    this.scene.textures.addCanvas(key, this.canvas)
    const img = this.scene.add.image(room.x * T, room.y * T, key)
    img.setOrigin(0, 0)
    rt.draw(img)
    img.destroy()
    this.scene.textures.remove(key)

    // Draw furniture on top
    for (const item of room.furniture) {
      this.drawFurniture(item, rt)
    }
  }

  private drawRoomSign(name: string, x: number, y: number) {
    const ctx = this.ctx
    // Sign background
    const textWidth = name.length * 5 + 8
    const signX = x - textWidth / 2
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(signX, y, textWidth, 10)
    ctx.fillStyle = '#2a2a4e'
    ctx.fillRect(signX, y, textWidth, 1)
    ctx.fillStyle = '#0a0a1e'
    ctx.fillRect(signX, y + 9, textWidth, 1)
    // Text
    ctx.fillStyle = '#88aacc'
    ctx.font = '7px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(name, x, y + 8)
    ctx.textAlign = 'start'
  }

  drawFurniture(item: FurnitureItem, rt: Phaser.GameObjects.RenderTexture) {
    const T = TILE_SIZE
    const pw = item.width * T
    const ph = item.height * T

    this.canvas.width = pw + 4  // extra for shadow
    this.canvas.height = ph + 4
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.imageSmoothingEnabled = false

    switch (item.type) {
      case 'desk': this.drawDesk(pw, ph); break
      case 'monitor': this.drawMonitor(T); break
      case 'plant': this.drawPlant(T); break
      case 'toilet': this.drawToilet(T); break
      case 'arcade_machine': this.drawArcadeMachine(T, ph); break
      case 'vending_machine': this.drawVendingMachine(T, ph); break
      case 'table': this.drawTable(pw, ph); break
      case 'chair': this.drawChair(T); break
      case 'couch': this.drawCouch(pw, ph); break
      case 'ashtray': this.drawAshtray(T); break
      case 'ping_pong': this.drawPingPong(pw, ph); break
      case 'whiteboard': this.drawWhiteboard(pw, ph); break
      case 'bookshelf': this.drawBookshelf(pw, ph); break
      case 'coffee_machine': this.drawCoffeeMachine(T); break
      case 'water_cooler': this.drawWaterCooler(T); break
      case 'trash_can': this.drawTrashCan(T); break
      case 'projector_screen': this.drawProjectorScreen(pw, ph); break
      case 'meeting_table': this.drawMeetingTable(pw, ph); break
      case 'server_rack': this.drawServerRack(T, ph); break
      case 'filing_cabinet': this.drawFilingCabinet(T, ph); break
      case 'rug': this.drawRug(pw, ph); break
    }

    const key = `furn_${item.type}_${item.x}_${item.y}_${Date.now()}`
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key)
    this.scene.textures.addCanvas(key, this.canvas)
    const img = this.scene.add.image(item.x * T, item.y * T, key)
    img.setOrigin(0, 0)
    rt.draw(img)
    img.destroy()
    this.scene.textures.remove(key)
  }

  private drawDesk(w: number, h: number) {
    const ctx = this.ctx
    // Desk top - warm wood
    const woodBase = 0x8b6f47
    for (let y = 0; y < h - 3; y++) {
      for (let x = 0; x < w; x++) {
        const noise = seededRandom(x, y, 11)
        const grain = Math.sin(x * 0.4 + noise) * 4
        const [r, g, b] = colorToRGB(woodBase)
        ctx.fillStyle = `rgb(${clamp(r + grain + noise * 6)},${clamp(g + grain * 0.8 + noise * 4)},${clamp(b + grain * 0.4 + noise * 2)})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
    // Front edge (darker)
    for (let x = 0; x < w; x++) {
      const noise = seededRandom(x, 99, 11)
      ctx.fillStyle = `rgb(${clamp(90 + noise * 8)},${clamp(72 + noise * 6)},${clamp(45 + noise * 4)})`
      ctx.fillRect(x, h - 3, 1, 3)
    }
    // Highlight on top edge
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(0, 0, w, 1)
    // Legs
    ctx.fillStyle = '#5a4530'
    ctx.fillRect(1, h - 2, 2, 2)
    ctx.fillRect(w - 3, h - 2, 2, 2)
    // Shadow
    drawShadow(ctx, 0, 0, w, h, 0.2)
  }

  private drawMonitor(T: number) {
    const ctx = this.ctx
    // Screen bezel
    ctx.fillStyle = '#1a1a2a'
    ctx.fillRect(1, 1, T - 2, T - 5)
    // Screen
    ctx.fillStyle = '#1e3a5e'
    ctx.fillRect(2, 2, T - 4, T - 7)
    // Screen content (code-like lines)
    const colors = ['#4488cc', '#66cc88', '#cc8844', '#88aacc']
    for (let line = 0; line < 4; line++) {
      const lineWidth = 3 + seededRandom(line, 0) * 6
      ctx.fillStyle = colors[line % colors.length]
      ctx.fillRect(3, 3 + line * 2, lineWidth, 1)
    }
    // Screen glow
    ctx.fillStyle = 'rgba(50,120,200,0.15)'
    ctx.fillRect(0, 0, T, T - 3)
    // Stand
    ctx.fillStyle = '#333'
    ctx.fillRect(T / 2 - 2, T - 4, 4, 2)
    ctx.fillStyle = '#444'
    ctx.fillRect(T / 2 - 3, T - 2, 6, 2)
    // Stand highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(T / 2 - 2, T - 4, 4, 1)
    drawShadow(ctx, 1, 1, T - 2, T - 2, 0.15)
  }

  private drawPlant(_T: number) {
    const ctx = this.ctx
    // Pot
    ctx.fillStyle = '#8b4513'
    ctx.fillRect(4, 10, 8, 5)
    ctx.fillStyle = '#a0522d'
    ctx.fillRect(3, 10, 10, 2)
    // Soil
    ctx.fillStyle = '#3e2a1a'
    ctx.fillRect(4, 10, 8, 1)
    // Stem
    ctx.fillStyle = '#2e6b2e'
    ctx.fillRect(7, 4, 2, 7)
    // Leaves (detailed)
    const leafColors = ['#228b22', '#32cd32', '#2e8b2e', '#3cb043']
    // Left leaf cluster
    ctx.fillStyle = leafColors[0]; ctx.fillRect(2, 3, 5, 4)
    ctx.fillStyle = leafColors[1]; ctx.fillRect(3, 2, 3, 3)
    ctx.fillStyle = leafColors[2]; ctx.fillRect(1, 5, 4, 2)
    // Right leaf cluster
    ctx.fillStyle = leafColors[0]; ctx.fillRect(9, 3, 5, 4)
    ctx.fillStyle = leafColors[3]; ctx.fillRect(10, 1, 3, 4)
    ctx.fillStyle = leafColors[1]; ctx.fillRect(11, 5, 3, 2)
    // Top leaves
    ctx.fillStyle = leafColors[2]; ctx.fillRect(5, 0, 6, 3)
    ctx.fillStyle = leafColors[3]; ctx.fillRect(6, -1, 4, 3)
    // Leaf highlights
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(3, 2, 2, 1)
    ctx.fillRect(10, 1, 2, 1)
    ctx.fillRect(6, 0, 2, 1)
    drawShadow(ctx, 3, 10, 10, 5, 0.2)
  }

  private drawToilet(_T: number) {
    const ctx = this.ctx
    // Tank
    ctx.fillStyle = '#e0e0e0'
    ctx.fillRect(4, 0, 8, 5)
    ctx.fillStyle = '#d0d0d0'
    ctx.fillRect(5, 1, 6, 3)
    // Flush handle
    ctx.fillStyle = '#aaa'
    ctx.fillRect(10, 2, 2, 1)
    // Bowl
    ctx.fillStyle = '#eee'
    ctx.fillRect(3, 5, 10, 8)
    ctx.fillStyle = '#ddd'
    ctx.fillRect(4, 6, 8, 6)
    // Water
    ctx.fillStyle = '#b8d8f0'
    ctx.fillRect(5, 7, 6, 4)
    // Seat
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(3, 5, 10, 2)
    // Rim highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(3, 5, 10, 1)
    drawShadow(ctx, 3, 5, 10, 8, 0.15)
  }

  private drawArcadeMachine(T: number, ph: number) {
    const ctx = this.ctx
    // Cabinet
    ctx.fillStyle = '#1a1a4a'
    ctx.fillRect(1, 0, T - 2, ph)
    // Side panels
    ctx.fillStyle = '#12123a'
    ctx.fillRect(1, 0, 2, ph)
    ctx.fillRect(T - 3, 0, 2, ph)
    // Top marquee
    ctx.fillStyle = '#ff4444'
    ctx.fillRect(2, 1, T - 4, 4)
    ctx.fillStyle = '#ff6666'
    ctx.fillRect(3, 2, T - 6, 2)
    // Screen
    ctx.fillStyle = '#001a00'
    ctx.fillRect(3, 6, T - 6, T - 4)
    // Animated screen content
    const screenColors = ['#00ff88', '#00cc66', '#009944', '#00ff44']
    for (let sy = 0; sy < 8; sy++) {
      for (let sx = 0; sx < 8; sx++) {
        if (seededRandom(sx, sy, 55) > 0.6) {
          ctx.fillStyle = screenColors[Math.floor(seededRandom(sx, sy, 77) * 4)]
          ctx.fillRect(4 + sx, 7 + sy, 1, 1)
        }
      }
    }
    // Screen glow
    ctx.fillStyle = 'rgba(0,255,100,0.1)'
    ctx.fillRect(2, 5, T - 4, T - 2)
    // Controls panel
    ctx.fillStyle = '#2a2a5a'
    ctx.fillRect(3, T + 2, T - 6, 6)
    // Joystick
    ctx.fillStyle = '#ff4444'
    ctx.fillRect(5, T + 3, 2, 4)
    ctx.fillStyle = '#ff6666'
    ctx.fillRect(5, T + 3, 2, 1)
    // Buttons
    ctx.fillStyle = '#4444ff'
    ctx.fillRect(9, T + 4, 2, 2)
    ctx.fillStyle = '#44ff44'
    ctx.fillRect(11, T + 3, 2, 2)
    drawShadow(ctx, 1, 0, T - 2, ph, 0.25)
  }

  private drawVendingMachine(T: number, ph: number) {
    const ctx = this.ctx
    // Body
    ctx.fillStyle = '#2a3a6a'
    ctx.fillRect(1, 0, T - 2, ph)
    // Front panel
    ctx.fillStyle = '#354a7a'
    ctx.fillRect(2, 1, T - 4, ph - 3)
    // Product window
    ctx.fillStyle = '#1a2a4a'
    ctx.fillRect(3, 2, T - 6, ph - 10)
    // Products (colored rows)
    const products = [0xff4444, 0x44ff44, 0x4444ff, 0xffaa44, 0xff44ff]
    for (let r = 0; r < Math.min(5, Math.floor((ph - 10) / 4)); r++) {
      ctx.fillStyle = `#${products[r].toString(16).padStart(6, '0')}`
      ctx.fillRect(4, 3 + r * 4, T - 8, 3)
      // Can highlights
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.fillRect(4, 3 + r * 4, T - 8, 1)
    }
    // Dispenser slot
    ctx.fillStyle = '#111'
    ctx.fillRect(3, ph - 7, T - 6, 4)
    ctx.fillStyle = '#222'
    ctx.fillRect(4, ph - 6, T - 8, 2)
    // Coin slot
    ctx.fillStyle = '#888'
    ctx.fillRect(T - 5, ph / 2, 2, 3)
    drawShadow(ctx, 1, 0, T - 2, ph, 0.25)
  }

  private drawTable(w: number, h: number) {
    const ctx = this.ctx
    // Table top
    for (let y = 0; y < h - 2; y++) {
      for (let x = 0; x < w; x++) {
        const noise = seededRandom(x, y, 33)
        const grain = Math.sin(x * 0.5) * 3
        ctx.fillStyle = `rgb(${clamp(160 + grain + noise * 4)},${clamp(132 + grain * 0.7 + noise * 3)},${clamp(92 + grain * 0.3 + noise * 2)})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
    // Edge
    ctx.fillStyle = '#7a5f37'
    ctx.fillRect(0, h - 2, w, 2)
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fillRect(0, 0, w, 1)
    // Legs
    ctx.fillStyle = '#6a5030'
    ctx.fillRect(1, h - 2, 2, 2)
    ctx.fillRect(w - 3, h - 2, 2, 2)
    drawShadow(ctx, 0, 0, w, h, 0.18)
  }

  private drawChair(T: number) {
    const ctx = this.ctx
    // Seat
    ctx.fillStyle = '#5a5a7a'
    ctx.fillRect(3, 6, T - 6, 6)
    ctx.fillStyle = '#6a6a8a'
    ctx.fillRect(4, 7, T - 8, 4)
    // Back
    ctx.fillStyle = '#4a4a6a'
    ctx.fillRect(3, 2, T - 6, 5)
    ctx.fillStyle = '#5a5a7a'
    ctx.fillRect(4, 3, T - 8, 3)
    // Legs
    ctx.fillStyle = '#3a3a5a'
    ctx.fillRect(3, 12, 2, 3)
    ctx.fillRect(T - 5, 12, 2, 3)
    // Seat cushion highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(4, 7, T - 8, 1)
    drawShadow(ctx, 3, 6, T - 6, 9, 0.12)
  }

  private drawCouch(w: number, h: number) {
    const ctx = this.ctx
    // Base
    ctx.fillStyle = '#7a3a5a'
    ctx.fillRect(2, 3, w - 4, h - 4)
    // Cushions
    const cushionW = Math.floor((w - 6) / 2)
    ctx.fillStyle = '#8a4a6a'
    ctx.fillRect(3, 4, cushionW, h - 6)
    ctx.fillRect(4 + cushionW, 4, cushionW, h - 6)
    // Cushion highlights
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(3, 4, cushionW, 2)
    ctx.fillRect(4 + cushionW, 4, cushionW, 2)
    // Arm rests
    ctx.fillStyle = '#6a2a4a'
    ctx.fillRect(0, 2, 3, h - 3)
    ctx.fillRect(w - 3, 2, 3, h - 3)
    // Arm rest highlights
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(0, 2, 3, 1)
    ctx.fillRect(w - 3, 2, 3, 1)
    // Back
    ctx.fillStyle = '#5a1a3a'
    ctx.fillRect(1, 0, w - 2, 4)
    drawShadow(ctx, 0, 2, w, h - 2, 0.2)
  }

  private drawAshtray(_T: number) {
    const ctx = this.ctx
    // Ashtray body
    ctx.fillStyle = '#666'
    ctx.fillRect(4, 6, 8, 5)
    ctx.fillStyle = '#777'
    ctx.fillRect(3, 6, 10, 2)
    // Ash
    ctx.fillStyle = '#999'
    ctx.fillRect(5, 7, 6, 3)
    ctx.fillStyle = '#aaa'
    ctx.fillRect(6, 8, 4, 1)
    // Cigarette
    ctx.fillStyle = '#eee'
    ctx.fillRect(3, 7, 4, 1)
    ctx.fillStyle = '#ff6633'
    ctx.fillRect(2, 7, 2, 1)
    // Smoke wisps
    ctx.fillStyle = 'rgba(180,180,180,0.3)'
    ctx.fillRect(3, 5, 1, 2)
    ctx.fillRect(4, 3, 1, 3)
    ctx.fillRect(2, 4, 1, 2)
  }

  private drawPingPong(w: number, h: number) {
    const ctx = this.ctx
    // Table body (dark green)
    ctx.fillStyle = '#1a5a2a'
    ctx.fillRect(0, 2, w, h - 3)
    // Table surface
    ctx.fillStyle = '#2a7a3a'
    ctx.fillRect(1, 3, w - 2, h - 5)
    // White border lines
    ctx.fillStyle = '#fff'
    ctx.fillRect(1, 3, w - 2, 1)
    ctx.fillRect(1, h - 3, w - 2, 1)
    ctx.fillRect(1, 3, 1, h - 6)
    ctx.fillRect(w - 2, 3, 1, h - 6)
    // Center line
    ctx.fillRect(1, Math.floor(h / 2), w - 2, 1)
    // Net
    ctx.fillStyle = '#ccc'
    ctx.fillRect(Math.floor(w / 2) - 1, 2, 2, h - 3)
    ctx.fillStyle = '#ddd'
    for (let y = 2; y < h - 1; y += 2) {
      ctx.fillRect(Math.floor(w / 2) - 1, y, 2, 1)
    }
    // Net posts
    ctx.fillStyle = '#888'
    ctx.fillRect(Math.floor(w / 2), 1, 1, 2)
    ctx.fillRect(Math.floor(w / 2), h - 2, 1, 2)
    // Ball
    ctx.fillStyle = '#fff'
    ctx.fillRect(Math.floor(w * 0.3), Math.floor(h * 0.3), 2, 2)
    // Legs
    ctx.fillStyle = '#444'
    ctx.fillRect(2, h - 1, 2, 2)
    ctx.fillRect(w - 4, h - 1, 2, 2)
    drawShadow(ctx, 0, 2, w, h - 2, 0.2)
  }

  private drawWhiteboard(w: number, h: number) {
    const ctx = this.ctx
    // Frame
    ctx.fillStyle = '#888'
    ctx.fillRect(0, 0, w, h)
    // Board surface
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(1, 1, w - 2, h - 2)
    // Written content (squiggly lines)
    const colors = ['#333', '#2255cc', '#cc2255', '#22aa55']
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = colors[i % colors.length]
      const lineY = 3 + i * 3
      const lineW = 4 + seededRandom(i, 0) * (w - 10)
      ctx.fillRect(3, lineY, lineW, 1)
    }
    // Tray
    ctx.fillStyle = '#666'
    ctx.fillRect(2, h - 1, w - 4, 1)
    // Markers
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(4, h - 2, 2, 1)
    ctx.fillStyle = '#0000ff'
    ctx.fillRect(7, h - 2, 2, 1)
  }

  private drawBookshelf(w: number, h: number) {
    const ctx = this.ctx
    // Shelf frame
    ctx.fillStyle = '#5a3a20'
    ctx.fillRect(0, 0, w, h)
    // Shelves
    const shelfCount = Math.floor(h / 6)
    for (let s = 0; s < shelfCount; s++) {
      const sy = s * 6 + 1
      // Books on this shelf
      let bx = 1
      while (bx < w - 2) {
        const bookW = 2 + Math.floor(seededRandom(bx, s, 99) * 2)
        const bookH = 4 + Math.floor(seededRandom(bx, s, 88) * 2)
        const bookColors = [0x8b2252, 0x225588, 0x228b22, 0xcd8500, 0x8b0000, 0x4a4a8b]
        const color = bookColors[Math.floor(seededRandom(bx, s, 77) * bookColors.length)]
        const [r, g, b] = colorToRGB(color)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(bx, sy + (5 - bookH), bookW, bookH)
        // Spine highlight
        ctx.fillStyle = `rgba(255,255,255,0.15)`
        ctx.fillRect(bx, sy + (5 - bookH), 1, bookH)
        bx += bookW + 1
      }
      // Shelf board
      ctx.fillStyle = '#6b4a30'
      ctx.fillRect(0, sy + 5, w, 1)
    }
    drawShadow(ctx, 0, 0, w, h, 0.2)
  }

  private drawCoffeeMachine(T: number) {
    const ctx = this.ctx
    // Body
    ctx.fillStyle = '#333'
    ctx.fillRect(2, 2, T - 4, T - 4)
    ctx.fillStyle = '#444'
    ctx.fillRect(3, 3, T - 6, T - 6)
    // Water tank (top)
    ctx.fillStyle = '#556'
    ctx.fillRect(4, 1, T - 8, 4)
    ctx.fillStyle = 'rgba(100,150,200,0.3)'
    ctx.fillRect(5, 2, T - 10, 2)
    // Spout
    ctx.fillStyle = '#222'
    ctx.fillRect(T / 2 - 1, 6, 2, 3)
    // Cup
    ctx.fillStyle = '#eee'
    ctx.fillRect(T / 2 - 2, 9, 4, 4)
    ctx.fillStyle = '#ddd'
    ctx.fillRect(T / 2 - 1, 10, 2, 2)
    // Coffee in cup
    ctx.fillStyle = '#4a2a1a'
    ctx.fillRect(T / 2 - 1, 10, 2, 1)
    // Power light
    ctx.fillStyle = '#00ff00'
    ctx.fillRect(T - 4, 4, 1, 1)
    drawShadow(ctx, 2, 2, T - 4, T - 2, 0.15)
  }

  private drawWaterCooler(_T: number) {
    const ctx = this.ctx
    // Bottle (top)
    ctx.fillStyle = '#a0c0e0'
    ctx.fillRect(4, 0, 8, 6)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(5, 1, 2, 4)
    // Bottle neck
    ctx.fillStyle = '#90b0d0'
    ctx.fillRect(5, 5, 6, 2)
    // Body
    ctx.fillStyle = '#ddd'
    ctx.fillRect(3, 7, 10, 7)
    ctx.fillStyle = '#eee'
    ctx.fillRect(4, 8, 8, 5)
    // Spigots
    ctx.fillStyle = '#4488ff'
    ctx.fillRect(5, 10, 2, 2)
    ctx.fillStyle = '#ff4444'
    ctx.fillRect(9, 10, 2, 2)
    // Base
    ctx.fillStyle = '#bbb'
    ctx.fillRect(2, 14, 12, 2)
    drawShadow(ctx, 3, 7, 10, 9, 0.15)
  }

  private drawTrashCan(_T: number) {
    const ctx = this.ctx
    // Can body
    ctx.fillStyle = '#555'
    ctx.fillRect(3, 4, 10, 10)
    ctx.fillStyle = '#666'
    ctx.fillRect(4, 5, 8, 8)
    // Lid
    ctx.fillStyle = '#5a5a5a'
    ctx.fillRect(2, 3, 12, 2)
    // Handle
    ctx.fillStyle = '#777'
    ctx.fillRect(6, 2, 4, 2)
    // Rim
    ctx.fillStyle = '#4a4a4a'
    ctx.fillRect(3, 13, 10, 1)
    drawShadow(ctx, 3, 4, 10, 10, 0.15)
  }

  private drawProjectorScreen(w: number, h: number) {
    const ctx = this.ctx
    // Mount bar
    ctx.fillStyle = '#666'
    ctx.fillRect(0, 0, w, 2)
    // Screen
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(1, 2, w - 2, h - 3)
    // Screen content (presentation slide)
    ctx.fillStyle = '#2255aa'
    ctx.fillRect(2, 3, w - 4, 4)
    ctx.fillStyle = '#fff'
    ctx.font = '4px monospace'
    // Chart bars
    ctx.fillStyle = '#44aa88'
    ctx.fillRect(3, 9, 3, 4)
    ctx.fillStyle = '#aa4488'
    ctx.fillRect(7, 8, 3, 5)
    ctx.fillStyle = '#88aa44'
    ctx.fillRect(11, 10, 3, 3)
    // Border
    ctx.fillStyle = '#888'
    ctx.fillRect(0, 2, 1, h - 3)
    ctx.fillRect(w - 1, 2, 1, h - 3)
    ctx.fillRect(0, h - 1, w, 1)
  }

  private drawMeetingTable(w: number, h: number) {
    const ctx = this.ctx
    // Large conference table with wood grain
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const noise = seededRandom(x, y, 44)
        const grain = Math.sin(x * 0.3 + noise) * 5
        ctx.fillStyle = `rgb(${clamp(120 + grain + noise * 4)},${clamp(85 + grain * 0.7 + noise * 3)},${clamp(55 + grain * 0.4 + noise * 2)})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
    // Edge
    ctx.fillStyle = '#5a3a25'
    ctx.fillRect(0, 0, w, 1)
    ctx.fillRect(0, h - 1, w, 1)
    ctx.fillRect(0, 0, 1, h)
    ctx.fillRect(w - 1, 0, 1, h)
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(1, 1, w - 2, 1)
    // Legs
    ctx.fillStyle = '#4a2a18'
    ctx.fillRect(2, h - 1, 2, 2)
    ctx.fillRect(w - 4, h - 1, 2, 2)
    ctx.fillRect(2, 0, 2, -1)
    ctx.fillRect(w - 4, 0, 2, -1)
    drawShadow(ctx, 0, 0, w, h, 0.2)
  }

  private drawServerRack(T: number, ph: number) {
    const ctx = this.ctx
    // Rack body
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(1, 0, T - 2, ph)
    ctx.fillStyle = '#333'
    ctx.fillRect(2, 1, T - 4, ph - 2)
    // Server units
    for (let u = 0; u < Math.floor(ph / 5); u++) {
      const uy = 2 + u * 5
      ctx.fillStyle = '#444'
      ctx.fillRect(3, uy, T - 6, 4)
      // LED lights
      ctx.fillStyle = seededRandom(u, 0) > 0.3 ? '#00ff00' : '#ff4444'
      ctx.fillRect(4, uy + 1, 1, 1)
      ctx.fillStyle = seededRandom(u, 1) > 0.5 ? '#00ff00' : '#ffaa00'
      ctx.fillRect(6, uy + 1, 1, 1)
      // Vent holes
      ctx.fillStyle = '#333'
      for (let vx = 8; vx < T - 4; vx += 2) {
        ctx.fillRect(vx, uy + 1, 1, 2)
      }
    }
    drawShadow(ctx, 1, 0, T - 2, ph, 0.25)
  }

  private drawFilingCabinet(T: number, ph: number) {
    const ctx = this.ctx
    // Body
    ctx.fillStyle = '#8a8a8a'
    ctx.fillRect(1, 0, T - 2, ph)
    // Drawers
    const drawerCount = Math.floor(ph / 7)
    for (let d = 0; d < drawerCount; d++) {
      const dy = 1 + d * 7
      ctx.fillStyle = '#999'
      ctx.fillRect(2, dy, T - 4, 6)
      ctx.fillStyle = '#aaa'
      ctx.fillRect(3, dy + 1, T - 6, 4)
      // Handle
      ctx.fillStyle = '#777'
      ctx.fillRect(T / 2 - 2, dy + 2, 4, 2)
      ctx.fillStyle = '#888'
      ctx.fillRect(T / 2 - 1, dy + 2, 2, 1)
    }
    // Top
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(1, 0, T - 2, 1)
    drawShadow(ctx, 1, 0, T - 2, ph, 0.18)
  }

  private drawRug(w: number, h: number) {
    const ctx = this.ctx
    // Rug body with pattern
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const noise = seededRandom(x, y, 66)
        const isBorder = x < 2 || x >= w - 2 || y < 2 || y >= h - 2
        const isInnerBorder = x >= 3 && x < w - 3 && y >= 3 && y < h - 3 &&
          (x === 3 || x === w - 4 || y === 3 || y === h - 4)
        if (isBorder) {
          ctx.fillStyle = `rgb(${clamp(100 + noise * 10)},${clamp(40 + noise * 8)},${clamp(40 + noise * 8)})`
        } else if (isInnerBorder) {
          ctx.fillStyle = `rgb(${clamp(140 + noise * 8)},${clamp(100 + noise * 6)},${clamp(50 + noise * 6)})`
        } else {
          // Interior pattern
          const pattern = ((x + y) % 4 < 2) ? 15 : 0
          ctx.fillStyle = `rgb(${clamp(120 + pattern + noise * 8)},${clamp(60 + pattern + noise * 6)},${clamp(60 + pattern + noise * 6)})`
        }
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  private drawDecoration(deco: DecorationItem, roomX: number, roomY: number) {
    const ctx = this.ctx
    const dx = (deco.x - roomX) * TILE_SIZE
    const dy = (deco.y - roomY) * TILE_SIZE

    switch (deco.type) {
      case 'clock':
        // Clock face
        ctx.fillStyle = '#ddd'
        ctx.fillRect(dx + 3, dy + 2, 10, 10)
        ctx.fillStyle = '#eee'
        ctx.fillRect(dx + 4, dy + 3, 8, 8)
        // Hands
        ctx.fillStyle = '#333'
        ctx.fillRect(dx + 8, dy + 4, 1, 4)
        ctx.fillRect(dx + 6, dy + 7, 4, 1)
        // Center dot
        ctx.fillStyle = '#c00'
        ctx.fillRect(dx + 8, dy + 7, 1, 1)
        break

      case 'window':
        // Frame
        ctx.fillStyle = '#5a5a6a'
        ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE)
        // Glass
        ctx.fillStyle = '#6a8aaa'
        ctx.fillRect(dx + 1, dy + 1, TILE_SIZE - 2, TILE_SIZE - 2)
        // Sky/outside
        ctx.fillStyle = '#8ab4d8'
        ctx.fillRect(dx + 2, dy + 2, TILE_SIZE - 4, 6)
        ctx.fillStyle = '#6a94b8'
        ctx.fillRect(dx + 2, dy + 8, TILE_SIZE - 4, 4)
        // Cross frame
        ctx.fillStyle = '#5a5a6a'
        ctx.fillRect(dx + TILE_SIZE / 2, dy + 1, 1, TILE_SIZE - 2)
        ctx.fillRect(dx + 1, dy + TILE_SIZE / 2, TILE_SIZE - 2, 1)
        // Light reflection
        ctx.fillStyle = 'rgba(255,255,255,0.2)'
        ctx.fillRect(dx + 3, dy + 3, 3, 2)
        break

      case 'poster':
        ctx.fillStyle = '#3a3a5a'
        ctx.fillRect(dx + 2, dy + 1, 12, 14)
        ctx.fillStyle = '#4a4a6a'
        ctx.fillRect(dx + 3, dy + 2, 10, 12)
        // Random colored design
        ctx.fillStyle = `rgb(${Math.floor(seededRandom(deco.x, deco.y) * 200 + 55)},${Math.floor(seededRandom(deco.x + 1, deco.y) * 200 + 55)},${Math.floor(seededRandom(deco.x, deco.y + 1) * 200 + 55)})`
        ctx.fillRect(dx + 4, dy + 3, 8, 6)
        break

      case 'sign':
        ctx.fillStyle = '#2a4a2a'
        ctx.fillRect(dx + 1, dy + 3, 14, 8)
        if (deco.label) {
          ctx.fillStyle = '#88ff88'
          ctx.font = '5px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(deco.label, dx + 8, dy + 9)
          ctx.textAlign = 'start'
        }
        break
    }
  }

  drawDoorway(x: number, y: number, rt: Phaser.GameObjects.RenderTexture, floorColor: number) {
    const T = TILE_SIZE
    this.canvas.width = T
    this.canvas.height = T * 3
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.imageSmoothingEnabled = false

    // Draw doorway floor tiles
    for (let dy = 0; dy < 3; dy++) {
      drawTileFloor(this.ctx, 0, dy, T, floorColor)
    }

    // Door frame markers
    this.ctx.fillStyle = 'rgba(255,200,100,0.15)'
    this.ctx.fillRect(0, 0, T, 1)
    this.ctx.fillRect(0, T * 3 - 1, T, 1)

    const key = `door_${x}_${y}_${Date.now()}`
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key)
    this.scene.textures.addCanvas(key, this.canvas)
    const img = this.scene.add.image(x * T, (y - 1) * T, key)
    img.setOrigin(0, 0)
    rt.draw(img)
    img.destroy()
    this.scene.textures.remove(key)
  }

  destroy() {
    // No persistent graphics to clean up
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}
