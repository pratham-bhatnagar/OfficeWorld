
const AGENTS = [
  { name: 'witness', role: 'Monitor', status: 'watching' },
  { name: 'refinery', role: 'Merge Queue', status: 'idle' },
  { name: 'polecat-1', role: 'Worker', status: 'coding' },
  { name: 'polecat-2', role: 'Worker', status: 'coding' },
  { name: 'deacon', role: 'Advisor', status: 'idle' },
  { name: 'manager', role: 'Coordinator', status: 'planning' },
]

const STATUS_COLORS: Record<string, string> = {
  watching: '#53d8fb',
  idle: '#555',
  coding: '#0f9b58',
  planning: '#e94560',
}

export function Sidebar() {
  return (
    <div
      style={{
        width: 200,
        background: '#0f0f23',
        borderRight: '1px solid #16213e',
        padding: '12px 0',
        overflowY: 'auto',
        fontFamily: "'Courier New', monospace",
        fontSize: 12,
      }}
    >
      <div style={{ padding: '0 12px 8px', color: '#533483', fontWeight: 'bold', fontSize: 11, letterSpacing: 2 }}>
        AGENTS
      </div>
      {AGENTS.map((a) => (
        <div
          key={a.name}
          style={{
            padding: '6px 12px',
            borderBottom: '1px solid #16213e',
            cursor: 'pointer',
          }}
        >
          <div style={{ color: '#e94560', fontWeight: 'bold' }}>{a.name}</div>
          <div style={{ color: '#666', fontSize: 10 }}>
            {a.role}
            <span style={{ float: 'right', color: STATUS_COLORS[a.status] || '#555' }}>
              {a.status}
            </span>
          </div>
        </div>
      ))}
      <div style={{ padding: '12px 12px 8px', color: '#533483', fontWeight: 'bold', fontSize: 11, letterSpacing: 2 }}>
        SYSTEMS
      </div>
      <div style={{ padding: '4px 12px', color: '#666', fontSize: 10 }}>
        <div>Dolt DB: <span style={{ color: '#0f9b58' }}>online</span></div>
        <div>Beads: <span style={{ color: '#0f9b58' }}>synced</span></div>
        <div>WS: <span style={{ color: '#53d8fb' }}>connected</span></div>
      </div>
    </div>
  )
}
