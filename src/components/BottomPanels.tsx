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
  { id: 'planogram', name: 'Planogram', icon: '\u{1F4CA}' },
  { id: 'alc_ai', name: 'ALC AI', icon: '\u{1F9EA}' },
  { id: 'arcade', name: 'Arcade', icon: '\u{1F579}' },
]

const panelStyle: React.CSSProperties = {
  background: THEME.bgPanel,
  border: `3px solid ${THEME.borderDark}`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const panelTitleStyle: React.CSSProperties = {
  color: THEME.gold,
  fontFamily: THEME.fontFamily,
  fontSize: 12,
  fontWeight: 'bold',
  letterSpacing: 2,
  padding: '6px 12px 4px',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${THEME.borderPanel}`,
  display: 'flex',
  alignItems: 'center',
}

function parseAgentsFromStatus(text: string): AgentInfo[] {
  const agents: AgentInfo[] = []
  const lines = text.split('\n')
  let currentRig = ''
  for (const line of lines) {
    const rigMatch = line.match(/─── (\w+)\/ ─/)
    if (rigMatch) { currentRig = rigMatch[1]; continue }
    const topMatch = line.match(/(🎩|🐺)\s+(\w[\w-]*)\s+(●|○)/)
    if (topMatch) { agents.push({ name: topMatch[2], role: topMatch[1] === '🎩' ? 'Mayor' : 'Deacon', status: topMatch[3] === '●' ? 'online' : 'offline', rig: 'hq' }); continue }
    const agentMatch = line.match(/(🦉|🏭)\s+(\w[\w-]*)\s+(●|○)/)
    if (agentMatch) { const roleMap: Record<string, string> = { '🦉': 'Witness', '🏭': 'Refinery' }; agents.push({ name: agentMatch[2], role: roleMap[agentMatch[1]] || agentMatch[2], status: agentMatch[3] === '●' ? 'online' : 'offline', rig: currentRig }); continue }
    const crewMatch = line.match(/^\s{3,}(\w[\w-]*)\s+(●|○)\s+\[/)
    if (crewMatch) { agents.push({ name: crewMatch[1], role: 'Worker', status: crewMatch[2] === '●' ? 'online' : 'offline', rig: currentRig }) }
  }
  return agents
}

// ─── Status Panel (left) ────────────────────────────────────────────

function StatusPanel({ selectedAgent, beadCount, polecatCount }: { selectedAgent: string | null; beadCount: number; polecatCount: number }) {
  const [feed, setFeed] = useState<string[]>([])

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/feed').then((r) => r.json()).catch(() => null)
        if (res?.data) setFeed(res.data.split('\n').filter((l: string) => l.trim()).slice(0, 8))
      } catch { /* */ }
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ ...panelStyle, flex: '1 1 420px', minWidth: 280 }}>
      <div style={panelTitleStyle}>
        <span style={{ flex: 1 }}>Memo</span>
      </div>
      <div style={{ padding: '6px 12px', flex: 1, overflowY: 'auto', fontSize: 11, color: THEME.textSecondary, lineHeight: 1.5 }}>
        {selectedAgent && (
          <div style={{ color: THEME.orange, marginBottom: 4, fontWeight: 'bold' }}>
            {'\u{1F441}'} Watching: {selectedAgent}
          </div>
        )}
        {feed.length > 0 ? feed.map((line, i) => (
          <div key={i} style={{ opacity: 1 - i * 0.06, borderBottom: `1px solid ${THEME.borderDark}`, padding: '2px 0' }}>{line}</div>
        )) : (
          <div style={{ color: THEME.textMuted }}>
            <div style={{ marginBottom: 4 }}>--- Gas Town Arcade ---</div>
            <div>Beads on floor: {beadCount}</div>
            <div>Active polecats: {polecatCount}</div>
            <div style={{ marginTop: 8, color: THEME.textMuted }}>Waiting for activity feed...</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Control Panel (center) ─────────────────────────────────────────

function ControlPanel({ activeRig, onRigSelect, onTerminalToggle, onMayorChat }: { activeRig: string; onRigSelect: (rigId: string) => void; onTerminalToggle: () => void; onMayorChat: () => void }) {
  return (
    <div style={{ ...panelStyle, flex: '1 1 360px', minWidth: 240 }}>
      <div style={panelTitleStyle}>
        <span style={{ flex: 1 }}>Control</span>
      </div>
      <div style={{ padding: '8px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Rig buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          {RIGS.map((rig) => {
            const isActive = activeRig === rig.id
            return (
              <button
                key={rig.id}
                onClick={() => onRigSelect(rig.id)}
                style={{
                  flex: 1,
                  padding: '5px 2px',
                  background: isActive ? '#2a2520' : THEME.bgDark,
                  border: `2px solid ${isActive ? THEME.gold : THEME.borderPanel}`,
                  color: isActive ? THEME.gold : THEME.textSecondary,
                  fontFamily: THEME.fontFamily,
                  fontSize: 10,
                  cursor: 'pointer',
                }}
              >
                <div>{rig.icon}</div>
                <div style={{ marginTop: 2 }}>{rig.name}</div>
              </button>
            )
          })}
        </div>

        {/* Action icon grid */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <IconBtn icon=">" label="Terminal" onClick={onTerminalToggle} />
          <IconBtn icon="\u{1F3A9}" label="Mayor" onClick={onMayorChat} />
          <IconBtn icon="\u{1F4CB}" label="Beads" onClick={() => {}} />
          <IconBtn icon="\u2699" label="Settings" onClick={() => {}} />
        </div>

        {/* Hints */}
        <div style={{ marginTop: 'auto', fontSize: 9, color: THEME.textMuted, lineHeight: 1.6 }}>
          Drag=pan | Scroll=zoom | Click=select | ~=term | M=mayor | L=activity | Esc=close
        </div>
      </div>
    </div>
  )
}

function IconBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 52,
        height: 44,
        background: hov ? '#2a2520' : THEME.bgDark,
        border: `2px solid ${hov ? THEME.goldDim : THEME.borderPanel}`,
        color: hov ? THEME.gold : THEME.textSecondary,
        fontFamily: THEME.fontFamily,
        fontSize: 10,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: 0,
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

// ─── Agents Panel (right) ───────────────────────────────────────────

function AgentsPanel({ onMayorChat, onAgentClick }: { onMayorChat: () => void; onAgentClick: (agent: AgentInfo) => void }) {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/status')
        if (res.ok) { const { data } = await res.json(); if (data) { setAgents(parseAgentsFromStatus(data)) } }
      } catch { /* bridge offline */ }
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [])

  const byRig = new Map<string, AgentInfo[]>()
  for (const a of agents) { const list = byRig.get(a.rig) || []; list.push(a); byRig.set(a.rig, list) }

  const online = agents.filter((a) => a.status === 'online').length
  const total = agents.length

  return (
    <div style={{ ...panelStyle, flex: '1 1 360px', minWidth: 240 }}>
      <div style={panelTitleStyle}>
        <span style={{ flex: 1 }}>Agents</span>
        <span style={{ fontSize: 9, color: online > 0 ? THEME.green : THEME.textMuted, fontWeight: 'normal', letterSpacing: 0 }}>
          {online}/{total}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {agents.length === 0 ? (
          <div style={{ padding: '8px 12px', color: THEME.textMuted, fontSize: 10 }}>Waiting for bridge...</div>
        ) : (
          Array.from(byRig.entries()).map(([rig, rigAgents]) => (
            <div key={rig}>
              <div style={{ padding: '4px 12px 1px', color: THEME.goldDim, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' }}>
                {rig || 'hq'}
              </div>
              {rigAgents.map((a) => (
                <div
                  key={`${rig}-${a.name}`}
                  onClick={() => a.role === 'Mayor' ? onMayorChat() : onAgentClick(a)}
                  style={{
                    padding: '3px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: a.status === 'offline' ? 0.4 : 1,
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: a.status === 'online' ? THEME.green : THEME.textMuted, fontSize: 7 }}>{'\u25CF'}</span>
                  <span style={{ color: THEME.textPrimary, flex: 1 }}>{a.name}</span>
                  <span style={{ color: THEME.textMuted, fontSize: 9 }}>{a.role}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
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
      height: 240,
      flexShrink: 0,
    }}>
      <StatusPanel selectedAgent={props.selectedAgent} beadCount={props.beadCount} polecatCount={props.polecatCount} />
      <ControlPanel activeRig={props.activeRig} onRigSelect={props.onRigSelect} onTerminalToggle={props.onTerminalToggle} onMayorChat={props.onMayorChat} />
      <AgentsPanel onMayorChat={props.onMayorChat} onAgentClick={props.onAgentClick} />
    </div>
  )
}
