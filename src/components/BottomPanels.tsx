import { useEffect, useState } from 'react'
import { THEME } from '../constants'

interface AgentInfo {
  name: string
  role: string
  status: 'online' | 'offline'
  rig: string
}

interface BottomPanelsProps {
  activeRig: string
  onRigSelect: (rigId: string) => void
  onMayorChat: () => void
  onAgentClick: (agent: AgentInfo) => void
  onTerminalToggle: () => void
  selectedAgent: string | null
  beadCount: number
  polecatCount: number
}

const RIGS = [
  { id: 'planogram', name: 'Planogram', icon: '::' },
  { id: 'alc_ai', name: 'ALC AI', icon: '::' },
  { id: 'arcade', name: 'Arcade', icon: '::' },
]

const panelStyle: React.CSSProperties = {
  background: THEME.bgPanel,
  border: `4px solid ${THEME.borderDark}`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
}

const panelTitleStyle: React.CSSProperties = {
  color: THEME.gold,
  fontFamily: THEME.fontFamily,
  fontSize: 14,
  fontWeight: 'bold',
  letterSpacing: 2,
  padding: '10px 14px 6px',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${THEME.borderPanel}`,
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

// ─── Status / Feed Panel ────────────────────────────────────────────

function StatusPanel({
  selectedAgent,
  beadCount,
  polecatCount,
}: {
  selectedAgent: string | null
  beadCount: number
  polecatCount: number
}) {
  const [feed, setFeed] = useState<string[]>([])
  const [unreadMail, setUnreadMail] = useState(0)

  useEffect(() => {
    async function poll() {
      try {
        const [feedRes, mailRes] = await Promise.all([
          fetch('/api/feed').then((r) => r.json()).catch(() => null),
          fetch('/api/mail').then((r) => r.json()).catch(() => null),
        ])
        if (feedRes?.data) {
          const lines = feedRes.data.split('\n').filter((l: string) => l.trim()).slice(0, 12)
          setFeed(lines)
        }
        if (mailRes?.data) {
          const m = mailRes.data.match(/(\d+) unread/)
          if (m) setUnreadMail(parseInt(m[1], 10))
        }
      } catch { /* bridge not running */ }
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ ...panelStyle, flex: '1 1 460px', minWidth: 300 }}>
      <div style={panelTitleStyle}>Status</div>
      <div style={{ padding: '8px 14px', flex: 1, overflowY: 'auto' }}>
        {/* Quick stats row */}
        <div style={{
          display: 'flex',
          gap: 16,
          paddingBottom: 8,
          borderBottom: `1px solid ${THEME.borderPanel}`,
          marginBottom: 8,
          flexWrap: 'wrap',
        }}>
          <Stat label="Mail" value={unreadMail} color={unreadMail > 0 ? THEME.orange : THEME.textMuted} />
          <Stat label="Beads" value={beadCount} color={beadCount > 5 ? THEME.red : beadCount > 0 ? THEME.orange : THEME.textMuted} />
          <Stat label="Polecats" value={polecatCount} color={polecatCount > 0 ? THEME.green : THEME.textMuted} />
        </div>
        {selectedAgent && (
          <div style={{ fontSize: 11, color: THEME.orange, marginBottom: 6 }}>
            Following: {selectedAgent}
          </div>
        )}
        {/* Feed */}
        <div style={{ fontSize: 11, color: THEME.textSecondary, lineHeight: 1.6 }}>
          {feed.length > 0 ? feed.map((line, i) => (
            <div key={i} style={{ opacity: 1 - i * 0.05 }}>{line}</div>
          )) : (
            <div style={{ color: THEME.textMuted, fontStyle: 'italic' }}>Waiting for feed...</div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span style={{ fontFamily: THEME.fontFamily, fontSize: 11, color: THEME.textSecondary }}>
      {label}: <span style={{ color, fontWeight: 'bold' }}>{value}</span>
    </span>
  )
}

// ─── Control Panel ──────────────────────────────────────────────────

function ControlPanel({
  activeRig,
  onRigSelect,
  onTerminalToggle,
}: {
  activeRig: string
  onRigSelect: (rigId: string) => void
  onTerminalToggle: () => void
}) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{ ...panelStyle, flex: '1 1 390px', minWidth: 260 }}>
      <div style={panelTitleStyle}>Control</div>
      <div style={{ padding: '10px 14px', flex: 1 }}>
        {/* Rig selector */}
        <div style={{
          fontSize: 10,
          color: THEME.textMuted,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          Rig
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {RIGS.map((rig) => {
            const isActive = activeRig === rig.id
            const isHov = hovered === rig.id
            return (
              <button
                key={rig.id}
                onClick={() => onRigSelect(rig.id)}
                onMouseEnter={() => setHovered(rig.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  background: isActive ? THEME.borderPanel : isHov ? '#1e1a30' : 'transparent',
                  border: isActive ? `2px solid ${THEME.gold}` : `2px solid ${THEME.borderPanel}`,
                  color: isActive ? THEME.gold : THEME.textSecondary,
                  fontFamily: THEME.fontFamily,
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {rig.name}
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{
          fontSize: 10,
          color: THEME.textMuted,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          Actions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <ActionButton label="~ Terminal" onClick={onTerminalToggle} />
          <ActionButton label="M Mayor Chat" onClick={() => {}} />
        </div>

        {/* Keyboard hints */}
        <div style={{
          marginTop: 'auto',
          paddingTop: 12,
          fontSize: 10,
          color: THEME.textMuted,
          lineHeight: 1.8,
        }}>
          <div>Drag to pan | Scroll to zoom</div>
          <div>Click agent to view session</div>
          <div>Esc to close panels</div>
        </div>
      </div>
    </div>
  )
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '6px 10px',
        background: hov ? '#2a2540' : THEME.bgDark,
        border: `2px solid ${hov ? THEME.gold : THEME.borderPanel}`,
        color: hov ? THEME.gold : THEME.textSecondary,
        fontFamily: THEME.fontFamily,
        fontSize: 11,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// ─── Agents Panel ───────────────────────────────────────────────────

function AgentsPanel({
  onMayorChat,
  onAgentClick,
}: {
  onMayorChat: () => void
  onAgentClick: (agent: AgentInfo) => void
}) {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected')

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/status')
        if (res.ok) {
          const { data } = await res.json()
          if (data) {
            setAgents(parseAgentsFromStatus(data))
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

  const byRig = new Map<string, AgentInfo[]>()
  for (const a of agents) {
    const list = byRig.get(a.rig) || []
    list.push(a)
    byRig.set(a.rig, list)
  }

  return (
    <div style={{ ...panelStyle, flex: '1 1 390px', minWidth: 260 }}>
      <div style={{ ...panelTitleStyle, display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1 }}>Agents</span>
        <span style={{
          fontSize: 9,
          color: wsStatus === 'connected' ? THEME.green : THEME.red,
          fontWeight: 'normal',
          letterSpacing: 0,
        }}>
          {wsStatus === 'connected' ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {agents.length === 0 ? (
          <div style={{ padding: '8px 14px', color: THEME.textMuted, fontSize: 11 }}>
            Waiting for bridge...
          </div>
        ) : (
          Array.from(byRig.entries()).map(([rig, rigAgents]) => (
            <div key={rig}>
              <div style={{
                padding: '6px 14px 2px',
                color: THEME.goldDim,
                fontSize: 9,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}>
                {rig || 'hq'}
              </div>
              {rigAgents.map((a) => (
                <AgentRow
                  key={`${rig}-${a.name}`}
                  agent={a}
                  onClick={() => {
                    if (a.role === 'Mayor') onMayorChat()
                    else onAgentClick(a)
                  }}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function AgentRow({ agent, onClick }: { agent: AgentInfo; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  const statusColor = agent.status === 'online' ? THEME.green : THEME.textMuted
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '4px 14px',
        cursor: 'pointer',
        background: hov ? '#1e1a30' : 'transparent',
        transition: 'background 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        opacity: agent.status === 'offline' ? 0.5 : 1,
      }}
    >
      <span style={{ color: statusColor, fontSize: 8 }}>
        {agent.status === 'online' ? '\u25CF' : '\u25CB'}
      </span>
      <span style={{ color: THEME.textPrimary, fontSize: 12, flex: 1 }}>
        {agent.name}
      </span>
      <span style={{ color: THEME.textMuted, fontSize: 10 }}>
        {agent.role}
      </span>
    </div>
  )
}

// ─── Export ──────────────────────────────────────────────────────────

export function BottomPanels(props: BottomPanelsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: 0,
      maxWidth: 1280,
      width: '100%',
      margin: '0 auto',
      height: 280,
      flexShrink: 0,
    }}>
      <StatusPanel
        selectedAgent={props.selectedAgent}
        beadCount={props.beadCount}
        polecatCount={props.polecatCount}
      />
      <ControlPanel
        activeRig={props.activeRig}
        onRigSelect={props.onRigSelect}
        onTerminalToggle={props.onTerminalToggle}
      />
      <AgentsPanel
        onMayorChat={props.onMayorChat}
        onAgentClick={props.onAgentClick}
      />
    </div>
  )
}
