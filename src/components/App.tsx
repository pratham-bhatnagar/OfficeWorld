import { useRef, useEffect, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { ArcadeScene } from '../game/ArcadeScene'
import { StatusHUD } from './StatusHUD'
import { Sidebar } from './Sidebar'
import { TerminalPanel } from './TerminalPanel'
import { SessionViewer, agentToSession } from './SessionViewer'
import { RigSwivel } from './RigSwivel'
import { CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE } from '../constants'
import { AgentState } from '../types'

export function App() {
  const gameRef = useRef<HTMLDivElement>(null)
  const [game, setGame] = useState<Phaser.Game | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [sessionViewerOpen, setSessionViewerOpen] = useState(false)
  const [sessionName, setSessionName] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState<string>('')
  const [activeRig, setActiveRig] = useState('planogram')
  const [beadCount, setBeadCount] = useState(0)
  const [polecatCount, setPolecatCount] = useState(0)

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === '`' || e.key === '~') {
        e.preventDefault()
        setTerminalOpen((prev) => !prev)
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        openMayorSession()
      }
      if (e.key === 'Escape') {
        setSessionViewerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function openMayorSession() {
    setSessionName('hq-mayor')
    setSessionTitle("Mayor's Session")
    setSessionViewerOpen(true)
  }

  function openAgentSession(agentState: AgentState) {
    const session = agentToSession(agentState.rig, agentState.role, agentState.name)
    setSessionName(session)
    setSessionTitle(`${agentState.rig}/${agentState.name}`)
    setSessionViewerOpen(true)
  }

  useEffect(() => {
    if (!gameRef.current || game) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      parent: gameRef.current,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      pixelArt: true,
      backgroundColor: '#0a0a1a',
      scene: [ArcadeScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
    }

    const g = new Phaser.Game(config)
    setGame(g)

    g.events.on('agent-selected', (agentId: string | null, agentState: AgentState | null) => {
      setSelectedAgent(agentId)
      if (agentState) {
        openAgentSession(agentState)
      }
    })

    g.events.on('bead-count', (count: number) => setBeadCount(count))
    g.events.on('polecat-count', (count: number) => setPolecatCount(count))

    return () => {
      g.destroy(true)
    }
  }, [])

  // Jump camera to rig when swivel changes
  const handleRigSelect = useCallback((rigId: string) => {
    setActiveRig(rigId)
    if (!game) return
    const scene = game.scene.getScene('ArcadeScene') as ArcadeScene
    if (!scene) return

    const positions: Record<string, { x: number; y: number }> = {
      planogram: { x: 15 * TILE_SIZE, y: 12 * TILE_SIZE },
      alc_ai: { x: 55 * TILE_SIZE, y: 12 * TILE_SIZE },
      arcade: { x: 82 * TILE_SIZE, y: 12 * TILE_SIZE },
    }
    const pos = positions[rigId]
    if (pos) {
      scene.cameras.main.pan(pos.x, pos.y, 500, 'Power2')
    }
  }, [game])

  const closeTerminal = useCallback(() => setTerminalOpen(false), [])
  const closeSession = useCallback(() => setSessionViewerOpen(false), [])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a1a',
      overflow: 'hidden',
    }}>
      <StatusHUD
        selectedAgent={selectedAgent}
        beadCount={beadCount}
        polecatCount={polecatCount}
      />
      <RigSwivel activeRig={activeRig} onRigSelect={handleRigSelect} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Sidebar onMayorChat={openMayorSession} />
        <div
          ref={gameRef}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}
        />
      </div>
      <div style={{
        height: 24,
        background: '#0f0f23',
        borderTop: '1px solid #16213e',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        fontFamily: "'Courier New', monospace",
        fontSize: 10,
        color: '#555',
        gap: 16,
      }}>
        <span>Drag to pan</span>
        <span>Scroll to zoom</span>
        <span>Click agent to view session</span>
        <span style={{ color: '#53d8fb' }}>~ Terminal</span>
        <span style={{ color: '#d4af37' }}>M Mayor</span>
        <span style={{ color: '#888' }}>Esc Close</span>
        <span style={{ flex: 1 }} />
        <span>World: {WORLD_WIDTH}x{WORLD_HEIGHT} ({TILE_SIZE}px tiles)</span>
      </div>
      <TerminalPanel visible={terminalOpen} onClose={closeTerminal} />
      <SessionViewer
        visible={sessionViewerOpen}
        onClose={closeSession}
        sessionName={sessionName}
        title={sessionTitle}
      />
    </div>
  )
}
