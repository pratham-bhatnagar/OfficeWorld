import Phaser from 'phaser'
import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from '../constants'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.0
const LERP_SPEED = 0.05

export class CameraController {
  private scene: Phaser.Scene
  private camera: Phaser.Cameras.Scene2D.Camera
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private dragScrollX = 0
  private dragScrollY = 0
  private trackingTarget: { x: number; y: number } | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.camera = scene.cameras.main

    // Set world bounds
    this.camera.setBounds(0, 0, WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE)
    this.camera.setZoom(1)

    // Center on the building initially
    this.camera.scrollX = 20 * TILE_SIZE
    this.camera.scrollY = 5 * TILE_SIZE

    this.setupInput()
  }

  private setupInput() {
    // Click and drag to pan
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) return
      this.isDragging = true
      this.dragStartX = pointer.x
      this.dragStartY = pointer.y
      this.dragScrollX = this.camera.scrollX
      this.dragScrollY = this.camera.scrollY
      this.trackingTarget = null
    })

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return
      const dx = (this.dragStartX - pointer.x) / this.camera.zoom
      const dy = (this.dragStartY - pointer.y) / this.camera.zoom
      this.camera.scrollX = this.dragScrollX + dx
      this.camera.scrollY = this.dragScrollY + dy
    })

    this.scene.input.on('pointerup', () => {
      this.isDragging = false
    })

    // Mouse wheel to zoom
    this.scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
      const zoomDelta = deltaY > 0 ? -0.1 : 0.1
      this.camera.zoom = Phaser.Math.Clamp(this.camera.zoom + zoomDelta, MIN_ZOOM, MAX_ZOOM)
    })

    // Number keys to jump to rooms
    if (this.scene.input.keyboard) {
      const roomPositions = [
        { x: 15, y: 12 },   // 1: Planogram
        { x: 35, y: 12 },   // 2: Hallway
        { x: 55, y: 12 },   // 3: ALC AI
        { x: 85, y: 12 },   // 4: Arcade
        { x: 12, y: 35 },   // 5: Break Room
        { x: 35, y: 35 },   // 6: Smoke Area
        { x: 52, y: 35 },   // 7: Bathroom
        { x: 75, y: 35 },   // 8: Play Area
      ]

      for (let i = 0; i < roomPositions.length; i++) {
        const key = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE + i)
        const pos = roomPositions[i]
        key.on('down', () => {
          this.trackingTarget = null
          this.panTo(pos.x * TILE_SIZE, pos.y * TILE_SIZE)
        })
      }
    }
  }

  /** Smoothly pan camera to a world position */
  panTo(worldX: number, worldY: number) {
    this.scene.tweens.add({
      targets: this.camera,
      scrollX: worldX - this.camera.width / (2 * this.camera.zoom),
      scrollY: worldY - this.camera.height / (2 * this.camera.zoom),
      duration: 500,
      ease: 'Power2',
    })
  }

  /** Track a moving target (e.g., selected agent) */
  followTarget(target: { x: number; y: number } | null) {
    this.trackingTarget = target
  }

  update() {
    if (this.trackingTarget && !this.isDragging) {
      const targetX = this.trackingTarget.x - this.camera.width / (2 * this.camera.zoom)
      const targetY = this.trackingTarget.y - this.camera.height / (2 * this.camera.zoom)
      this.camera.scrollX += (targetX - this.camera.scrollX) * LERP_SPEED
      this.camera.scrollY += (targetY - this.camera.scrollY) * LERP_SPEED
    }
  }
}
