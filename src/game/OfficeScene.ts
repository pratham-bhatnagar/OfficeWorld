import Phaser from 'phaser'

const TILE = 32
const COLS = 30
const ROWS = 20

const COLORS = {
  floor: 0x1a1a2e,
  wall: 0x16213e,
  desk: 0x533483,
  agent: 0xe94560,
  mayor: 0x53d8fb,
}

export class OfficeScene extends Phaser.Scene {
  private mayor!: Phaser.GameObjects.Rectangle
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private agents: Phaser.GameObjects.Rectangle[] = []
  private nameLabels: Phaser.GameObjects.Text[] = []

  constructor() {
    super({ key: 'OfficeScene' })
  }

  create() {
    // Draw floor grid
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const isWall = y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1
        this.add.rectangle(
          x * TILE + TILE / 2,
          y * TILE + TILE / 2,
          TILE - 1,
          TILE - 1,
          isWall ? COLORS.wall : COLORS.floor,
        )
      }
    }

    // Place some desks
    const desks = [
      { x: 5, y: 4 }, { x: 5, y: 8 }, { x: 5, y: 12 },
      { x: 15, y: 4 }, { x: 15, y: 8 }, { x: 15, y: 12 },
      { x: 24, y: 4 }, { x: 24, y: 8 }, { x: 24, y: 12 },
    ]
    for (const d of desks) {
      this.add.rectangle(d.x * TILE + TILE / 2, d.y * TILE + TILE / 2, TILE * 2, TILE, COLORS.desk)
    }

    // Place agent sprites at desks
    const agentNames = ['witness', 'refinery', 'polecat-1', 'polecat-2', 'deacon', 'manager']
    agentNames.forEach((name, i) => {
      const desk = desks[i % desks.length]
      const agent = this.add.rectangle(
        desk.x * TILE + TILE / 2,
        (desk.y + 1) * TILE + TILE / 2,
        TILE * 0.6,
        TILE * 0.6,
        COLORS.agent,
      )
      this.agents.push(agent)

      const label = this.add.text(
        desk.x * TILE + TILE / 2,
        (desk.y + 2) * TILE,
        name,
        { fontSize: '10px', color: '#e94560', fontFamily: 'Courier New' },
      )
      label.setOrigin(0.5, 0)
      this.nameLabels.push(label)
    })

    // Mayor character (player-controlled)
    this.mayor = this.add.rectangle(
      14 * TILE + TILE / 2,
      10 * TILE + TILE / 2,
      TILE * 0.7,
      TILE * 0.7,
      COLORS.mayor,
    )

    const mayorLabel = this.add.text(
      14 * TILE + TILE / 2,
      11 * TILE,
      'MAYOR',
      { fontSize: '10px', color: '#53d8fb', fontFamily: 'Courier New', fontStyle: 'bold' },
    )
    mayorLabel.setOrigin(0.5, 0)

    this.cursors = this.input.keyboard!.createCursorKeys()
  }

  update() {
    const speed = 3

    if (this.cursors.left.isDown) this.mayor.x -= speed
    if (this.cursors.right.isDown) this.mayor.x += speed
    if (this.cursors.up.isDown) this.mayor.y -= speed
    if (this.cursors.down.isDown) this.mayor.y += speed

    // Clamp to bounds
    this.mayor.x = Phaser.Math.Clamp(this.mayor.x, TILE, (COLS - 1) * TILE)
    this.mayor.y = Phaser.Math.Clamp(this.mayor.y, TILE, (ROWS - 1) * TILE)
  }
}
