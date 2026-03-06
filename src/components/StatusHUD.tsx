import { useEffect, useState } from 'react'

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

  const wsColor = wsStatus === 'connected' ? '#0f9b58' : wsStatus === 'connecting' ? '#ffaa00' : '#e94560'

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
        fontSize: 12,
        letterSpacing: 1,
        borderBottom: '2px solid #533483',
        gap: 16,
      }}
    >
      <span style={{ color: '#53d8fb', fontWeight: 'bold', fontSize: 13 }}>GAS TOWN ARCADE</span>
      <span style={{ color: '#222' }}>|</span>
      {selectedAgent && (
        <>
          <span style={{ color: '#ffaa00' }}>Following: {selectedAgent}</span>
          <span style={{ color: '#222' }}>|</span>
        </>
      )}
      <span title="Active polecats (real)">
        Polecats: <span style={{ color: data.activePolecat > 0 ? '#0f9b58' : '#555' }}>{data.activePolecat}</span>
      </span>
      <span title="Unread mail">
        Mail: <span style={{ color: data.unreadMail > 0 ? '#ffaa00' : '#555' }}>{data.unreadMail}</span>
      </span>
      <span style={{ color: '#222' }}>|</span>
      <span title="Beads on floor (game)">
        Beads: <span style={{ color: beadCount > 5 ? '#ff6644' : beadCount > 0 ? '#ffaa00' : '#555' }}>{beadCount}</span>
      </span>
      <span title="Cleaning polecats (game)">
        Cleaners: <span style={{ color: polecatCount > 0 ? '#ffcc00' : '#555' }}>{polecatCount}</span>
      </span>
      <span style={{ flex: 1 }} />
      <span style={{ color: wsColor, fontSize: 10 }}>
        WS: {wsStatus.toUpperCase()}
      </span>
    </div>
  )
}
