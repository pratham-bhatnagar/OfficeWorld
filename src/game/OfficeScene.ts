import Phaser from 'phaser'

const TILE = 32
const COLS = 30
const ROWS = 20

const COLORS = {
  floor: 0x1a1a2e,
  floorAlt: 0x1c1c32,
  wall: 0x16213e,
  wallTop: 0x0f3460,
  desk: 0x533483,
  deskTop: 0x6a42a0,
  chair: 0x3a2568,
  agent: 0xe94560,
  agentOutline: 0xb8304f,
  mayor: 0x53d8fb,
  mayorOutline: 0x3aa8d0,
  carpet: 0x1e1e3a,
}

interface AgentSprite {
  body: Phaser.GameObjects.Rectangle
  head: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  deskX: number
  deskY: number
}

export class OfficeScene extends Phaser.Scene {
  private mayor!: Phaser.GameObjects.Container
  private mayorLabel!: Phaser.GameObjects.Text
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private agents: AgentSprite[] = []
  private moveSpeed = 3

  constructor() {
    super({ key: 'OfficeScene' })
  }

  create() {
    this.drawFloor()
    this.drawWalls()
    this.drawDesksAndAgents()
    this.createMayor()

    this.cursors = this.input.keyboard!.createCursorKeys()
  }

  private drawFloor() {
    for (let y = 1; y < ROWS - 1; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        const checkerboard = (x + y) % 2 === 0
        this.add.rectangle(
          x * TILE + TILE / 2,
          y * TILE + TILE / 2,
          TILE,
          TILE,
          checkerboard ? COLORS.floor : COLORS.floorAlt,
        )
      }
    }

    // Carpet runner down center aisle
    for (let y = 2; y < ROWS - 2; y++) {
      for (let x = 10; x <= 11; x++) {
        this.add.rectangle(
          x * TILE + TILE / 2,
          y * TILE + TILE / 2,
          TILE,
          TILE,
          COLORS.carpet,
        )
      }
    }
  }

  private drawWalls() {
    for (let x = 0; x < COLS; x++) {
      // Top wall (thicker with header)
      this.add.rectangle(x * TILE + TILE / 2, TILE / 2, TILE, TILE, COLORS.wallTop)
      // Bottom wall
      this.add.rectangle(x * TILE + TILE / 2, (ROWS - 1) * TILE + TILE / 2, TILE, TILE, COLORS.wall)
    }
    for (let y = 0; y < ROWS; y++) {
      this.add.rectangle(TILE / 2, y * TILE + TILE / 2, TILE, TILE, COLORS.wall)
      this.add.rectangle((COLS - 1) * TILE + TILE / 2, y * TILE + TILE / 2, TILE, TILE, COLORS.wall)
    }

    // Door opening in top wall
    this.add.rectangle(10 * TILE + TILE / 2, TILE / 2, TILE * 2, TILE, COLORS.floor)
  }

  private drawDesksAndAgents() {
    const deskPositions = [
      // Left pod
      { x: 4, y: 4 }, { x: 4, y: 7 }, { x: 4, y: 10 },
      // Right pod
      { x: 16, y: 4 }, { x: 16, y: 7 }, { x: 16, y: 10 },
      // Far right pod
      { x: 24, y: 4 }, { x: 24, y: 7 }, { x: 24, y: 10 },
    ]

    // Draw all desks
    for (const d of deskPositions) {
      // Desk surface
      this.add.rectangle(d.x * TILE + TILE / 2, d.y * TILE + TILE / 2, TILE * 2, TILE - 4, COLORS.desk)
      // Desk top edge highlight
      this.add.rectangle(d.x * TILE + TILE / 2, d.y * TILE + TILE / 2 - (TILE / 2 - 3), TILE * 2, 2, COLORS.deskTop)
      // Chair
      this.add.rectangle(d.x * TILE + TILE / 2, (d.y + 1) * TILE + TILE / 4, TILE * 0.5, TILE * 0.4, COLORS.chair)
    }

    // Place agents at first 6 desks
    const agentNames = ['witness', 'refinery', 'polecat-1', 'polecat-2', 'deacon', 'manager']
    agentNames.forEach((name, i) => {
      const desk = deskPositions[i]
      if (!desk) return

      const ax = desk.x * TILE + TILE / 2
      const ay = (desk.y + 1) * TILE + TILE / 2

      // Agent body
      const body = this.add.rectangle(ax, ay + 2, TILE * 0.5, TILE * 0.4, COLORS.agent)
      // Agent head
      const head = this.add.rectangle(ax, ay - 6, TILE * 0.35, TILE * 0.35, COLORS.agent)
        .setStrokeStyle(1, COLORS.agentOutline)

      const label = this.add.text(ax, ay + TILE * 0.5, name, {
        fontSize: '9px',
        color: '#e94560',
        fontFamily: 'Courier New',
      })
      label.setOrigin(0.5, 0)

      this.agents.push({ body, head, label, deskX: desk.x, deskY: desk.y })
    })
  }

  private createMayor() {
    const mx = 10 * TILE + TILE / 2
    const my = 14 * TILE + TILE / 2

    // Mayor is a container so label follows
    const body = this.add.rectangle(0, 2, TILE * 0.55, TILE * 0.45, COLORS.mayor)
    const head = this.add.rectangle(0, -8, TILE * 0.4, TILE * 0.4, COLORS.mayor)
      .setStrokeStyle(1, COLORS.mayorOutline)

    this.mayor = this.add.container(mx, my, [body, head])

    this.mayorLabel = this.add.text(mx, my + TILE * 0.55, 'MAYOR', {
      fontSize: '10px',
      color: '#53d8fb',
      fontFamily: 'Courier New',
      fontStyle: 'bold',
    })
    this.mayorLabel.setOrigin(0.5, 0)
  }

  update() {
    let dx = 0
    let dy = 0

    if (this.cursors.left.isDown) dx = -this.moveSpeed
    if (this.cursors.right.isDown) dx = this.moveSpeed
    if (this.cursors.up.isDown) dy = -this.moveSpeed
    if (this.cursors.down.isDown) dy = this.moveSpeed

    // Diagonal normalization
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707
      dy *= 0.707
    }

    this.mayor.x += dx
    this.mayor.y += dy

    // Clamp to bounds (inside walls)
    this.mayor.x = Phaser.Math.Clamp(this.mayor.x, TILE * 1.5, (COLS - 1.5) * TILE)
    this.mayor.y = Phaser.Math.Clamp(this.mayor.y, TILE * 1.5, (ROWS - 1.5) * TILE)

    // Label follows mayor
    this.mayorLabel.setPosition(this.mayor.x, this.mayor.y + TILE * 0.55)
  }
}
