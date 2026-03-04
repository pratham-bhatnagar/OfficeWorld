import { useRef, useEffect, useState } from 'react'
import Phaser from 'phaser'
import { OfficeScene } from '../game/OfficeScene'
import { StatusHUD } from './StatusHUD'
import { Sidebar } from './Sidebar'

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [game, setGame] = useState<Phaser.Game | null>(null)

  useEffect(() => {
    if (!canvasRef.current || game) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      canvas: canvasRef.current,
      width: 960,
      height: 640,
      pixelArt: true,
      backgroundColor: '#1a1a2e',
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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#1a1a2e' }}>
      <StatusHUD />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  )
}
