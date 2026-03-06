import { useEffect, useState } from 'react'
import { THEME } from '../constants'

interface StatusData {
  unreadMail: number
  activePolecat: number
}

function parseCount(text: string, pattern: RegExp): number {
  const match = text.match(pattern)
  return match ? parseInt(match[1], 10) : 0
}

export function StatusHUD({
  selectedAgent,
  beadCount,
  polecatCount,
}: {
  selectedAgent: string | null
  beadCount: number
  polecatCount: number
}) {
  const [data, setData] = useState<StatusData>({ unreadMail: 0, activePolecat: 0 })
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [time, setTime] = useState('')
  const [paused, setPaused] = useState(false)

  // Clock
  useEffect(() => {
    function tick() {
      const now = new Date()
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      setTime(`${days[now.getDay()]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)
    }
    tick()
    const interval = setInterval(tick, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function fetchStatus() {
      try {
        const [mailRes, polecatRes] = await Promise.all([
          fetch('/api/mail').then((r) => r.json()).catch(() => null),
          fetch('/api/polecats').then((r) => r.json()).catch(() => null),
        ])
        setData((prev) => ({
          ...prev,
          unreadMail: mailRes?.data ? parseCount(mailRes.data, /(\d+) unread/) : prev.unreadMail,
          activePolecat: polecatRes?.data ? (polecatRes.data.match(/\u25CF/g) || []).length : prev.activePolecat,
        }))
      } catch { /* Bridge not running */ }
    }
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let ws: WebSocket | null = null
    let retryTimer: ReturnType<typeof setTimeout>
    function connect() {
      try {
        ws = new WebSocket(`ws://${window.location.host}/ws`)
        ws.onopen = () => setWsStatus('connected')
        ws.onclose = () => { setWsStatus('disconnected'); retryTimer = setTimeout(connect, 3000) }
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)
            if (msg.type === 'gt-mail') setData((prev) => ({ ...prev, unreadMail: parseCount(msg.data || '', /(\d+) unread/) }))
            else if (msg.type === 'gt-polecats') setData((prev) => ({ ...prev, activePolecat: (msg.data?.match(/\u25CF/g) || []).length }))
          } catch { /* ignore */ }
        }
      } catch { setWsStatus('disconnected') }
    }
    connect()
    return () => { clearTimeout(retryTimer); ws?.close() }
  }, [])

  const wsColor = wsStatus === 'connected' ? THEME.green : wsStatus === 'connecting' ? THEME.orange : THEME.red

  return (
    <div style={{
      height: 44,
      background: THEME.bgDark,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      fontFamily: THEME.fontFamily,
      fontSize: 12,
      borderBottom: `3px solid ${THEME.borderAccent}`,
      gap: 8,
      flexShrink: 0,
    }}>
      {/* Game speed controls */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <HudButton icon={paused ? '\u25B6' : '\u23F8'} onClick={() => setPaused(!paused)} active={!paused} />
        <HudButton icon="\u23E9" onClick={() => {}} />
      </div>

      {/* Time display */}
      <div style={{
        background: '#0a1a10',
        border: `2px solid ${THEME.borderPanel}`,
        padding: '3px 10px',
        color: THEME.green,
        fontSize: 13,
        fontWeight: 'bold',
        letterSpacing: 2,
        minWidth: 100,
        textAlign: 'center',
      }}>
        {time}
      </div>

      {/* Title */}
      <span style={{ color: THEME.gold, fontWeight: 'bold', fontSize: 13, letterSpacing: 2, marginLeft: 4 }}>
        GAS TOWN
      </span>

      <div style={{ flex: 1 }} />

      {/* Status badges */}
      {selectedAgent && (
        <Badge icon="\u{1F441}" label={selectedAgent} color={THEME.orange} />
      )}
      <Badge icon="\u2709" label={String(data.unreadMail)} color={data.unreadMail > 0 ? THEME.orange : THEME.textMuted} />
      <Badge icon="\u26A0" label={String(beadCount)} color={beadCount > 5 ? THEME.red : beadCount > 0 ? THEME.orange : THEME.textMuted} />
      <Badge icon="\u{1F43E}" label={String(polecatCount)} color={polecatCount > 0 ? THEME.green : THEME.textMuted} />

      {/* Connection status */}
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: wsColor,
        boxShadow: wsStatus === 'connected' ? `0 0 6px ${THEME.green}` : 'none',
        marginLeft: 4,
      }} />
    </div>
  )
}

function HudButton({ icon, onClick, active }: { icon: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        background: active ? '#1a2a1a' : THEME.bgPanel,
        border: `2px solid ${active ? THEME.green : THEME.borderPanel}`,
        color: active ? THEME.green : THEME.textSecondary,
        fontFamily: THEME.fontFamily,
        fontSize: 14,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      {icon}
    </button>
  )
}

function Badge({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      background: THEME.bgPanel,
      border: `1px solid ${THEME.borderPanel}`,
      padding: '2px 8px',
      fontSize: 11,
      color,
    }}>
      <span>{icon}</span>
      <span style={{ fontWeight: 'bold' }}>{label}</span>
    </div>
  )
}
