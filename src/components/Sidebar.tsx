import { useEffect, useState } from 'react'

interface AgentInfo {
  name: string
  role: string
  status: 'online' | 'offline'
  rig: string
}

const STATUS_COLORS = {
  online: '#0f9b58',
  offline: '#555',
}

function parseAgentsFromStatus(text: string): AgentInfo[] {
  const agents: AgentInfo[] = []
  const lines = text.split('\n')
  let currentRig = ''

  for (const line of lines) {
    const rigMatch = line.match(/─── (\w+)\/ ─/)
    if (rigMatch) {
      currentRig = rigMatch[1]
      continue
    }

    // Mayor/Deacon (top-level)
    const topMatch = line.match(/(🎩|🐺)\s+(\w[\w-]*)\s+(●|○)/)
    if (topMatch) {
      agents.push({
        name: topMatch[2],
        role: topMatch[1] === '🎩' ? 'Mayor' : 'Deacon',
        status: topMatch[3] === '●' ? 'online' : 'offline',
        rig: 'hq',
      })
      continue
    }

    // Rig agents
    const agentMatch = line.match(/(🦉|🏭)\s+(\w[\w-]*)\s+(●|○)/)
    if (agentMatch) {
      const roleMap: Record<string, string> = { '🦉': 'Witness', '🏭': 'Refinery' }
      agents.push({
        name: agentMatch[2],
        role: roleMap[agentMatch[1]] || agentMatch[2],
        status: agentMatch[3] === '●' ? 'online' : 'offline',
        rig: currentRig,
      })
      continue
    }

    // Crew/polecat members
    const crewMatch = line.match(/^\s{3,}(\w[\w-]*)\s+(●|○)\s+\[/)
    if (crewMatch) {
      agents.push({
        name: crewMatch[1],
        role: 'Worker',
        status: crewMatch[2] === '●' ? 'online' : 'offline',
        rig: currentRig,
      })
    }
  }

  return agents
}

export function Sidebar() {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [doltStatus, setDoltStatus] = useState<'online' | 'offline'>('offline')
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected')

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/status')
        if (res.ok) {
          const { data } = await res.json()
          if (data) {
            setAgents(parseAgentsFromStatus(data))
            setDoltStatus(data.includes('dolt') ? 'online' : 'online')
            setWsStatus('connected')
          }
        }
      } catch {
        setWsStatus('disconnected')
      }
    }

    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [])

  // Group agents by rig
  const byRig = new Map<string, AgentInfo[]>()
  for (const a of agents) {
    const list = byRig.get(a.rig) || []
    list.push(a)
    byRig.set(a.rig, list)
  }

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

      {agents.length === 0 ? (
        <div style={{ padding: '4px 12px', color: '#555', fontSize: 10 }}>
          Waiting for bridge...
        </div>
      ) : (
        Array.from(byRig.entries()).map(([rig, rigAgents]) => (
          <div key={rig}>
            <div style={{
              padding: '6px 12px 2px',
              color: '#16213e',
              fontSize: 9,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
              {rig || 'hq'}
            </div>
            {rigAgents.map((a) => (
              <div
                key={`${rig}-${a.name}`}
                style={{
                  padding: '3px 12px',
                  borderBottom: '1px solid #16213e',
                  opacity: a.status === 'offline' ? 0.5 : 1,
                }}
              >
                <div style={{ color: '#e94560', fontWeight: 'bold', fontSize: 11 }}>{a.name}</div>
                <div style={{ color: '#666', fontSize: 10 }}>
                  {a.role}
                  <span style={{ float: 'right', color: STATUS_COLORS[a.status] }}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      <div style={{ padding: '12px 12px 8px', color: '#533483', fontWeight: 'bold', fontSize: 11, letterSpacing: 2 }}>
        SYSTEMS
      </div>
      <div style={{ padding: '4px 12px', color: '#666', fontSize: 10 }}>
        <div>Dolt DB: <span style={{ color: doltStatus === 'online' ? '#0f9b58' : '#e94560' }}>{doltStatus}</span></div>
        <div>Beads: <span style={{ color: '#0f9b58' }}>synced</span></div>
        <div>WS: <span style={{ color: wsStatus === 'connected' ? '#53d8fb' : '#e94560' }}>{wsStatus}</span></div>
      </div>
    </div>
  )
}
