import { useEffect, useState } from 'react'
import { THEME } from '../constants'

interface StatusData {
  convoyProgress: string
  unreadMail: number
  activePolecat: number
  beadReady: number
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
  const [data, setData] = useState<StatusData>({
    convoyProgress: '--',
    unreadMail: 0,
    activePolecat: 0,
    beadReady: 0,
  })
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

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
          activePolecat: polecatRes?.data
            ? (polecatRes.data.match(/\u25CF/g) || []).length
            : prev.activePolecat,
        }))
      } catch {
        // Bridge not running
      }
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
        ws.onclose = () => {
          setWsStatus('disconnected')
          retryTimer = setTimeout(connect, 3000)
        }
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)
            if (msg.type === 'gt-mail') {
              setData((prev) => ({
                ...prev,
                unreadMail: parseCount(msg.data || '', /(\d+) unread/),
              }))
            } else if (msg.type === 'gt-polecats') {
              setData((prev) => ({
                ...prev,
                activePolecat: (msg.data?.match(/\u25CF/g) || []).length,
              }))
            }
          } catch { /* ignore */ }
        }
      } catch {
        setWsStatus('disconnected')
      }
    }

    connect()
    return () => {
      clearTimeout(retryTimer)
      ws?.close()
    }
  }, [])

  const wsColor = wsStatus === 'connected' ? THEME.green : wsStatus === 'connecting' ? THEME.orange : THEME.red

  return (
    <div
      style={{
        height: 40,
        background: THEME.bgHeader,
        color: THEME.textPrimary,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        fontFamily: THEME.fontFamily,
        fontSize: 12,
        letterSpacing: 1,
        borderBottom: `3px solid ${THEME.borderAccent}`,
        gap: 16,
        flexShrink: 0,
      }}
    >
      <span style={{ color: THEME.gold, fontWeight: 'bold', fontSize: 14, letterSpacing: 2 }}>
        GAS TOWN ARCADE
      </span>
      <span style={{ color: THEME.borderPanel }}>|</span>
      {selectedAgent && (
        <>
          <span style={{ color: THEME.orange }}>Following: {selectedAgent}</span>
          <span style={{ color: THEME.borderPanel }}>|</span>
        </>
      )}
      <span>
        Polecats: <span style={{ color: data.activePolecat > 0 ? THEME.green : THEME.textMuted }}>{data.activePolecat}</span>
      </span>
      <span>
        Mail: <span style={{ color: data.unreadMail > 0 ? THEME.orange : THEME.textMuted }}>{data.unreadMail}</span>
      </span>
      <span style={{ color: THEME.borderPanel }}>|</span>
      <span>
        Beads: <span style={{ color: beadCount > 5 ? THEME.red : beadCount > 0 ? THEME.orange : THEME.textMuted }}>{beadCount}</span>
      </span>
      <span>
        Cleaners: <span style={{ color: polecatCount > 0 ? THEME.gold : THEME.textMuted }}>{polecatCount}</span>
      </span>
      <span style={{ flex: 1 }} />
      <span style={{ color: wsColor, fontSize: 10 }}>
        WS: {wsStatus.toUpperCase()}
      </span>
    </div>
  )
}
