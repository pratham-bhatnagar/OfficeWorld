import React from 'react'

export function StatusHUD() {
  return (
    <div
      style={{
        height: 32,
        background: '#0f3460',
        color: '#e94560',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        fontFamily: "'Courier New', monospace",
        fontSize: 14,
        letterSpacing: 1,
      }}
    >
      <span style={{ color: '#53d8fb' }}>GAS TOWN ARCADE</span>
      <span style={{ margin: '0 12px', color: '#444' }}>|</span>
      <span>Mayor HQ</span>
    </div>
  )
}
