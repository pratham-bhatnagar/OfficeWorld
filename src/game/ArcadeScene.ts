import Phaser from 'phaser'
import { AgentState, TileData } from '../types'
import { BREAK_TIMING } from '../constants'
import { WorldBuilder } from './world/WorldBuilder'
import { ROOMS } from './world/RoomDefinitions'
import { CameraController } from './CameraController'
import { CharacterSprite } from './sprites/CharacterSprite'
import { generateSpritesheet, traitsFromName } from './sprites/SpriteGenerator'
import { findPath } from './world/Pathfinding'

/** Default agents — populated from real data when bridge is connected */
const DEFAULT_AGENTS: AgentState[] = [
  // Planogram rig
  { id: 'vap-witness', name: 'witness', role: 'witness', rig: 'planogram', status: 'working', position: { x: 5, y: 7 }, currentRoom: 'planogram' },
  { id: 'vap-refinery', name: 'refinery', role: 'refinery', rig: 'planogram', status: 'working', position: { x: 5, y: 12 }, currentRoom: 'planogram' },
  { id: 'vap-manager', name: 'manager', role: 'manager', rig: 'planogram', status: 'working', position: { x: 16, y: 7 }, currentRoom: 'planogram' },
  { id: 'vap-frontend', name: 'frontend', role: 'worker', rig: 'planogram', status: 'working', position: { x: 16, y: 12 }, currentRoom: 'planogram' },
  { id: 'vap-backend', name: 'backend', role: 'worker', rig: 'planogram', status: 'idle', position: { x: 5, y: 17 }, currentRoom: 'planogram' },
  { id: 'vap-ml', name: 'ml', role: 'worker', rig: 'planogram', status: 'idle', position: { x: 16, y: 17 }, currentRoom: 'planogram' },
  // ALC AI rig
  { id: 'alc-witness', name: 'witness', role: 'witness', rig: 'alc_ai', status: 'working', position: { x: 45, y: 7 }, currentRoom: 'alc_ai' },
  { id: 'alc-refinery', name: 'refinery', role: 'refinery', rig: 'alc_ai', status: 'working', position: { x: 45, y: 12 }, currentRoom: 'alc_ai' },
  { id: 'alc-manager', name: 'manager', role: 'manager', rig: 'alc_ai', status: 'idle', position: { x: 56, y: 7 }, currentRoom: 'alc_ai' },
  { id: 'alc-backend', name: 'backend', role: 'worker', rig: 'alc_ai', status: 'working', position: { x: 56, y: 12 }, currentRoom: 'alc_ai' },
  // Arcade rig
  { id: 'arc-witness', name: 'witness', role: 'witness', rig: 'arcade', status: 'working', position: { x: 75, y: 7 }, currentRoom: 'arcade_dept' },
  { id: 'arc-game', name: 'game', role: 'worker', rig: 'arcade', status: 'working', position: { x: 75, y: 12 }, currentRoom: 'arcade_dept' },
  // Special agents
  { id: 'mayor', name: 'MAYOR', role: 'mayor', rig: 'mayor', status: 'working', position: { x: 35, y: 5 }, currentRoom: 'hallway' },
  { id: 'deacon', name: 'deacon', role: 'deacon', rig: 'deacon', status: 'idle', position: { x: 35, y: 10 }, currentRoom: 'hallway' },
]

export class ArcadeScene extends Phaser.Scene {
  private cameraController!: CameraController
  private characters = new Map<string, CharacterSprite>()
  private agentStates = new Map<string, AgentState>()
  private paths = new Map<string, { x: number; y: number }[]>()
  private pathIndices = new Map<string, number>()
  private grid: TileData[][] = []
  private moveTimer = 0
  private pollTimer = 0
  private breakTimers = new Map<string, number>()
  private selectedAgent: string | null = null

  constructor() {
    super({ key: 'ArcadeScene' })
  }

  create() {
    // Build world
    const builder = new WorldBuilder(this)
    const { grid } = builder.buildWorld()
    this.grid = grid

    // Camera
    this.cameraController = new CameraController(this)

    // Create agent sprites
    for (const agent of DEFAULT_AGENTS) {
      this.agentStates.set(agent.id, { ...agent })
      this.createCharacter(agent)

      // Random initial break timer
      this.breakTimers.set(
        agent.id,
        Date.now() + BREAK_TIMING.minWorkTime + Math.random() * (BREAK_TIMING.maxWorkTime - BREAK_TIMING.minWorkTime),
      )
    }

    // Click handler for agent selection
    this.input.on('gameobjectdown', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
      // Find which character was clicked
      for (const [id, char] of this.characters) {
        if (char.container === gameObject || char.container.list.includes(gameObject)) {
          this.selectAgent(id)
          return
        }
      }
    })

    // Emit event so React can listen for selection
    this.events.on('agent-selected', (agentId: string | null) => {
      this.game.events.emit('agent-selected', agentId)
    })

    // Start polling bridge for live agent status
    this.pollBridge()
  }

  private createCharacter(agent: AgentState) {
    const textureKey = `char_${agent.id}`
    const traits = traitsFromName(agent.name, agent.rig)
    generateSpritesheet(this, textureKey, traits)

    const displayName = agent.role === 'mayor' ? 'MAYOR' : `${agent.rig}/${agent.name}`
    const char = new CharacterSprite(this, agent.id, displayName, textureKey, agent.position.x, agent.position.y)
    char.updateStatus(agent.status)

    // Click handler on container
    char.container.on('pointerdown', () => {
      this.selectAgent(agent.id)
    })

    this.characters.set(agent.id, char)
  }

  private selectAgent(id: string) {
    // Deselect previous
    if (this.selectedAgent) {
      this.characters.get(this.selectedAgent)?.deselect()
    }

    if (this.selectedAgent === id) {
      this.selectedAgent = null
      this.cameraController.followTarget(null)
      this.events.emit('agent-selected', null)
    } else {
      this.selectedAgent = id
      const char = this.characters.get(id)
      char?.select()
      if (char) {
        this.cameraController.followTarget(char.getPosition())
      }
      this.events.emit('agent-selected', id)
    }
  }

  update(_time: number, delta: number) {
    this.cameraController.update()
    this.moveTimer += delta
    this.pollTimer += delta

    // Move agents along paths every 150ms
    if (this.moveTimer >= 150) {
      this.moveTimer = 0
      this.updateAgentMovement()
    }

    // Poll bridge every 3s
    if (this.pollTimer >= 3000) {
      this.pollTimer = 0
      this.pollBridge()
    }

    // Check break timers
    this.updateBreaks()

    // Update camera follow target position
    if (this.selectedAgent) {
      const char = this.characters.get(this.selectedAgent)
      if (char) {
        this.cameraController.followTarget(char.getPosition())
      }
    }
  }

  private updateAgentMovement() {
    for (const [id, state] of this.agentStates) {
      if (state.status === 'offline') continue

      const path = this.paths.get(id)
      if (!path || path.length === 0) continue

      const idx = this.pathIndices.get(id) ?? 0
      if (idx >= path.length) {
        // Arrived at destination
        this.paths.delete(id)
        this.pathIndices.delete(id)
        const char = this.characters.get(id)
        char?.setDirection(0, 0)

        // If was walking, update status to destination activity
        if (state.targetPosition) {
          const targetRoom = this.grid[state.targetPosition.y]?.[state.targetPosition.x]?.roomId
          if (targetRoom === 'breakroom') state.status = 'eating'
          else if (targetRoom === 'smoke_area') state.status = 'smoking'
          else if (targetRoom === 'bathroom') state.status = 'bathroom'
          else state.status = 'working'
          char?.updateStatus(state.status)
          state.targetPosition = undefined
        }
        continue
      }

      const next = path[idx]
      const prev = idx > 0 ? path[idx - 1] : state.position
      const dx = next.x - prev.x
      const dy = next.y - prev.y

      state.position = { x: next.x, y: next.y }
      const char = this.characters.get(id)
      char?.setTilePosition(next.x, next.y)
      char?.setDirection(dx, dy)
      this.pathIndices.set(id, idx + 1)
    }
  }

  private updateBreaks() {
    const now = Date.now()

    for (const [id, state] of this.agentStates) {
      if (state.status === 'offline') continue

      const breakTime = this.breakTimers.get(id)
      if (!breakTime || now < breakTime) continue

      // Time for a break — pick random destination
      if (state.status === 'working') {
        const destinations = ['breakroom', 'smoke_area', 'bathroom']
        const destRoomId = destinations[Math.floor(Math.random() * destinations.length)]
        const room = ROOMS.find((r) => r.id === destRoomId)
        if (room) {
          const targetX = room.x + 3 + Math.floor(Math.random() * (room.width - 6))
          const targetY = room.y + 3 + Math.floor(Math.random() * (room.height - 6))

          // Ensure target is walkable
          if (this.grid[targetY]?.[targetX]?.walkable) {
            const path = findPath(state.position, { x: targetX, y: targetY }, this.grid)
            if (path.length > 0) {
              this.paths.set(id, path)
              this.pathIndices.set(id, 0)
              state.status = 'walking'
              state.targetPosition = { x: targetX, y: targetY }
              this.characters.get(id)?.updateStatus('walking')

              // Schedule return
              let breakDuration = BREAK_TIMING.breakDuration
              if (destRoomId === 'smoke_area') breakDuration = BREAK_TIMING.smokeDuration
              if (destRoomId === 'bathroom') breakDuration = BREAK_TIMING.bathroomDuration
              this.breakTimers.set(id, now + breakDuration + path.length * 150)
            }
          }
        }
      } else if (state.status === 'eating' || state.status === 'smoking' || state.status === 'bathroom') {
        // Break is over — return to desk
        const deskRoom = ROOMS.find((r) => r.id === state.currentRoom)
        if (deskRoom && deskRoom.deskPositions.length > 0) {
          // Find original desk position
          const agentIdx = DEFAULT_AGENTS.findIndex((a) => a.id === id)
          const deskPos = deskRoom.deskPositions[agentIdx % deskRoom.deskPositions.length]
          if (deskPos) {
            const path = findPath(state.position, deskPos, this.grid)
            if (path.length > 0) {
              this.paths.set(id, path)
              this.pathIndices.set(id, 0)
              state.status = 'walking'
              state.targetPosition = deskPos
              this.characters.get(id)?.updateStatus('walking')
            }
          }
        }
        // Schedule next break
        this.breakTimers.set(
          id,
          now + BREAK_TIMING.minWorkTime + Math.random() * (BREAK_TIMING.maxWorkTime - BREAK_TIMING.minWorkTime),
        )
      }
    }
  }

  /** Poll bridge server for live agent status */
  private async pollBridge() {
    try {
      const res = await fetch('/api/status')
      if (!res.ok) return
      const { data } = await res.json()
      if (!data || typeof data !== 'string') return

      // Parse gt status output to find agent statuses
      // Format: "🎩 mayor        ● [claude]" or "   backend      ○ [claude]"
      const lines = data.split('\n')
      let currentRig = ''

      for (const line of lines) {
        // Detect rig header: "─── villa_ai_planogram/ ──"
        const rigMatch = line.match(/─── (\w+)\/ ─/)
        if (rigMatch) {
          currentRig = rigMatch[1]
          continue
        }

        // Detect agent: emoji + name + ● or ○
        const agentMatch = line.match(/(?:🎩|🐺|🦉|🏭|👷|😺)\s+(\w[\w-]*)\s+(●|○)/)
        if (agentMatch) {
          const [, name, statusSymbol] = agentMatch
          const isOnline = statusSymbol === '●'

          // Find matching agent in our state
          for (const [id, state] of this.agentStates) {
            const matchesName = state.name.toLowerCase() === name.toLowerCase()
            const matchesRig = currentRig
              ? state.rig === currentRig ||
                state.rig === 'planogram' && currentRig === 'villa_ai_planogram' ||
                state.rig === 'alc_ai' && currentRig === 'villa_alc_ai' ||
                state.rig === 'arcade' && currentRig === 'gt_arcade'
              : state.role === 'mayor' && name === 'mayor' ||
                state.role === 'deacon' && name === 'deacon'

            if (matchesName && matchesRig) {
              const newStatus = isOnline
                ? (state.status === 'offline' ? 'working' : state.status)
                : 'offline'

              if (newStatus !== state.status && state.status !== 'walking') {
                state.status = newStatus as AgentState['status']
                const char = this.characters.get(id)
                if (char) {
                  char.updateStatus(state.status)
                  if (state.status === 'offline') {
                    char.container.setAlpha(0.4)
                  } else {
                    char.container.setAlpha(1)
                  }
                }
              }
              break
            }
          }
        }

        // Detect crew members: "   name      ● [claude]" or "   name      ○ [claude]"
        const crewMatch = line.match(/^\s{3,}(\w[\w-]*)\s+(●|○)\s+\[/)
        if (crewMatch) {
          const [, name, statusSymbol] = crewMatch
          const isOnline = statusSymbol === '●'

          for (const [id, state] of this.agentStates) {
            if (state.name.toLowerCase() === name.toLowerCase() &&
              (currentRig === '' ||
                state.rig === currentRig ||
                state.rig === 'planogram' && currentRig === 'villa_ai_planogram' ||
                state.rig === 'alc_ai' && currentRig === 'villa_alc_ai' ||
                state.rig === 'arcade' && currentRig === 'gt_arcade')) {
              const newStatus = isOnline
                ? (state.status === 'offline' ? 'working' : state.status)
                : 'offline'

              if (newStatus !== state.status && state.status !== 'walking') {
                state.status = newStatus as AgentState['status']
                const char = this.characters.get(id)
                if (char) {
                  char.updateStatus(state.status)
                  if (state.status === 'offline') {
                    char.container.setAlpha(0.4)
                  } else {
                    char.container.setAlpha(1)
                  }
                }
              }
              break
            }
          }
        }
      }
    } catch {
      // Bridge not available — agents stay in their current state
    }
  }

  /** Get agent state for React components */
  getAgentState(id: string): AgentState | undefined {
    return this.agentStates.get(id)
  }
}
