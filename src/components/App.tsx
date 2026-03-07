import { useRef, useEffect, useState, useCallback } from 'react'
import Phaser from 'phaser'
import { ArcadeScene } from '../game/ArcadeScene'
import { StatusHUD } from './StatusHUD'
import { BottomPanels } from './BottomPanels'
import { TerminalPanel } from './TerminalPanel'
import { SessionViewer, agentToSession } from './SessionViewer'
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, THEME } from '../constants'
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

  function openAgentSession(agentState: AgentState | { rig: string; role: string; name: string }) {
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
      backgroundColor: THEME.bgCanvas,
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
  const toggleTerminal = useCallback(() => setTerminalOpen((prev) => !prev), [])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: THEME.bgBody,
      overflow: 'hidden',
      fontFamily: THEME.fontFamily,
    }}>
      {/* Top status bar */}
      <StatusHUD
        selectedAgent={selectedAgent}
        beadCount={beadCount}
        polecatCount={polecatCount}
      />

      {/* Game canvas area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 0,
        padding: '4px 0',
      }}>
        <div
          ref={gameRef}
          style={{
            maxWidth: 1280,
            maxHeight: 720,
            width: '100%',
            height: '100%',
            border: `4px solid ${THEME.borderAccent}`,
            boxShadow: '0 0 24px rgba(100, 71, 125, 0.3)',
          }}
        />
      </div>

      {/* Bottom 3-panel UI */}
      <BottomPanels
        activeRig={activeRig}
        onRigSelect={handleRigSelect}
        onMayorChat={openMayorSession}
        onAgentClick={(agent) => openAgentSession(agent)}
        onTerminalToggle={toggleTerminal}
        selectedAgent={selectedAgent}
        beadCount={beadCount}
        polecatCount={polecatCount}
      />

      {/* Overlays */}
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
