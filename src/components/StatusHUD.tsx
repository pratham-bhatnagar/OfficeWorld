
export function StatusHUD() {
  return (
    <div
      style={{
        height: 36,
        background: '#0f3460',
        color: '#e94560',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        fontFamily: "'Courier New', monospace",
        fontSize: 13,
        letterSpacing: 1,
        borderBottom: '2px solid #533483',
      }}
    >
      <span style={{ color: '#53d8fb', fontWeight: 'bold' }}>GAS TOWN ARCADE</span>
      <span style={{ margin: '0 12px', color: '#333' }}>|</span>
      <span>Mayor HQ</span>
      <span style={{ margin: '0 12px', color: '#333' }}>|</span>
      <span style={{ color: '#555', fontSize: 11 }}>Arrow keys to move</span>
      <span style={{ flex: 1 }} />
      <span style={{ color: '#0f9b58', fontSize: 11 }}>ONLINE</span>
    </div>
  )
}
