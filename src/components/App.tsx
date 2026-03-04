import { useRef, useEffect, useState } from 'react'
import Phaser from 'phaser'
import { ArcadeScene } from '../game/ArcadeScene'
import { StatusHUD } from './StatusHUD'
import { Sidebar } from './Sidebar'
import { CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE } from '../constants'

export function App() {
  const gameRef = useRef<HTMLDivElement>(null)
  const [game, setGame] = useState<Phaser.Game | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

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

    // Listen for agent selection from Phaser scene
    g.events.on('agent-selected', (agentId: string | null) => {
      setSelectedAgent(agentId)
    })

    return () => {
      g.destroy(true)
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a1a', overflow: 'hidden' }}>
      <StatusHUD selectedAgent={selectedAgent} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Sidebar />
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
        <span>1-8: Jump to room</span>
        <span>Click agent to follow</span>
        <span style={{ flex: 1 }} />
        <span>World: {WORLD_WIDTH}x{WORLD_HEIGHT} ({TILE_SIZE}px tiles)</span>
      </div>
    </div>
  )
}
