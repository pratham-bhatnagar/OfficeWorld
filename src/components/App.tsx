import React, { useRef, useEffect, useState } from 'react'
import Phaser from 'phaser'
import { OfficeScene } from '../game/OfficeScene'
import { StatusHUD } from './StatusHUD'

export function App() {
  const gameRef = useRef<HTMLDivElement>(null)
  const [game, setGame] = useState<Phaser.Game | null>(null)

  useEffect(() => {
    if (!gameRef.current || game) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 960,
      height: 640,
      pixelArt: true,
      backgroundColor: '#16213e',
      scene: [OfficeScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    }

    const g = new Phaser.Game(config)
    setGame(g)

    return () => {
      g.destroy(true)
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <StatusHUD />
      <div ref={gameRef} style={{ flex: 1, minHeight: 0 }} />
    </div>
  )
}
