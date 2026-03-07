import { useEffect, useRef, useState, useCallback } from 'react'
import { THEME } from '../constants'

type EventType = 'file' | 'tool' | 'git' | 'mail' | 'bead' | 'agent' | 'all'

interface LogEvent {
  id: string
  type: EventType
  timestamp: Date
  message: string
  details?: string
}

const ICONS: Record<EventType, string> = {
  file: '✏️',
  tool: '🔧',
  git: '🌿',
  mail: '✉️',
  bead: '💎',
  agent: '🐱',
  all: '📋',
}

const COLORS: Record<EventType, string> = {
  file: THEME.blue,
  tool: THEME.orange,
  git: THEME.green,
  mail: THEME.purple,
  bead: THEME.gold,
  agent: THEME.pink,
  all: THEME.textSecondary,
}

interface ActivityLogPanelProps {
  visible: boolean
  onClose: () => void
}

const MAX_ENTRIES = 200

export function ActivityLogPanel({ visible, onClose }: ActivityLogPanelProps) {
  const [events, setEvents] = useState<LogEvent[]>([])
  const [filter, setFilter] = useState<EventType>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events, autoScroll, visible])

  // WebSocket connection for real-time events
  useEffect(() => {
    if (!visible) return

    const ws = new WebSocket(`ws://${window.location.host}/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[ActivityLog] WebSocket connected')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // Handle activity events from bridge
        if (data.type === 'activity-event' || data.type === 'gt-feed') {
          const parsed = parseFeedEvent(data.data || data.message)
          if (parsed) {
            addEvent(parsed)
          }
        }

        // Also parse status updates for agent spawn/despawn
        if (data.type === 'gt-status-parsed') {
          const currentAgents = data.agents || []
          checkAgentChanges(currentAgents)
        }
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onerror = () => {
      // Silent fail - will retry
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [visible])

  // Poll for feed updates as fallback
  useEffect(() => {
    if (!visible) return

    async function pollFeed() {
      try {
        const res = await fetch('/api/feed?lines=20')
        if (res.ok) {
          const { data } = await res.json()
          if (data) {
            const lines = data.split('\n').filter((l: string) => l.trim())
            lines.forEach((line: string) => {
              const parsed = parseFeedEvent(line)
              if (parsed) addEvent(parsed)
            })
          }
        }
      } catch {
        // Bridge offline
      }
    }

    pollFeed()
    const interval = setInterval(pollFeed, 3000)
    return () => clearInterval(interval)
  }, [visible])

  const addEvent = useCallback((event: Omit<LogEvent, 'id' | 'timestamp'>) => {
    setEvents((prev) => {
      const newEvent: LogEvent = {
        ...event,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date(),
      }
      const updated = [...prev, newEvent]
      // Prune oldest if over max
      if (updated.length > MAX_ENTRIES) {
        return updated.slice(updated.length - MAX_ENTRIES)
      }
      return updated
    })
  }, [])

  // Track agent changes for spawn/despawn events
  const prevAgentsRef = useRef<Set<string>>(new Set())
  const checkAgentChanges = useCallback((agents: Array<{ name: string; status: string }>) => {
    const currentNames = new Set(agents.map((a) => a.name))
    const prevNames = prevAgentsRef.current

    // Check for new agents (spawned)
    currentNames.forEach((name) => {
      if (!prevNames.has(name)) {
        addEvent({
          type: 'agent',
          message: `${name} spawned`,
          details: 'Agent started',
        })
      }
    })

    // Check for removed agents (despawned)
    prevNames.forEach((name) => {
      if (!currentNames.has(name)) {
        addEvent({
          type: 'agent',
          message: `${name} stopped`,
          details: 'Agent ended',
        })
      }
    })

    prevAgentsRef.current = currentNames
  }, [addEvent])

  const filteredEvents = filter === 'all'
    ? events
    : events.filter((e) => e.type === filter)

  const filters: EventType[] = ['all', 'git', 'bead', 'mail', 'agent', 'file', 'tool']

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 60,
        right: 16,
        width: 420,
        height: 'calc(100vh - 320px)',
        background: THEME.bgPanel,
        border: `3px solid ${THEME.borderDark}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        fontFamily: THEME.fontFamily,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${THEME.borderPanel}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: THEME.gold, fontWeight: 'bold', fontSize: 12 }}>
          ACTIVITY LOG
        </span>
        <span style={{ color: THEME.textMuted, fontSize: 10 }}>
          ({filteredEvents.length}/{events.length})
        </span>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: THEME.textMuted,
            cursor: 'pointer',
            fontSize: 14,
            padding: '0 4px',
          }}
        >
          ×
        </button>
      </div>

      {/* Filter buttons */}
      <div
        style={{
          padding: '6px 8px',
          borderBottom: `1px solid ${THEME.borderPanel}`,
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '3px 8px',
              fontSize: 10,
              background: filter === f ? THEME.borderDark : 'transparent',
              border: `1px solid ${filter === f ? THEME.goldDim : THEME.borderPanel}`,
              color: filter === f ? THEME.gold : THEME.textSecondary,
              cursor: 'pointer',
              fontFamily: THEME.fontFamily,
              textTransform: 'uppercase',
            }}
          >
            {ICONS[f]} {f}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 0',
          fontSize: 11,
          lineHeight: 1.5,
        }}
        onScroll={() => {
          if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
            setAutoScroll(scrollHeight - scrollTop - clientHeight < 20)
          }
        }}
      >
        {filteredEvents.length === 0 ? (
          <div
            style={{
              padding: '20px',
              color: THEME.textMuted,
              textAlign: 'center',
              fontSize: 11,
            }}
          >
            No events yet...
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              style={{
                padding: '3px 10px',
                borderBottom: `1px solid ${THEME.borderDark}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 10, marginTop: 1 }}>
                {ICONS[event.type]}
              </span>
              <span style={{ color: THEME.textMuted, fontSize: 9, minWidth: 50 }}>
                {formatTime(event.timestamp)}
              </span>
              <span style={{ color: COLORS[event.type], flex: 1, wordBreak: 'break-word' }}>
                {event.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '4px 10px',
          borderTop: `1px solid ${THEME.borderPanel}`,
          fontSize: 9,
          color: THEME.textMuted,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>L=toggle</span>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            style={{ marginRight: 4 }}
          />
          auto-scroll
        </label>
      </div>
    </div>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Parse gt feed output into structured events
function parseFeedEvent(line: string): Omit<LogEvent, 'id' | 'timestamp'> | null {
  if (!line.trim()) return null

  // File edits
  if (line.includes('✓') && (line.includes('file') || line.includes('edit'))) {
    return { type: 'file', message: extractFileName(line) || line }
  }

  // Git operations
  if (line.includes('git') || line.includes('commit') || line.includes('push') || line.includes('merge')) {
    return { type: 'git', message: line }
  }

  // Bead updates
  if (line.includes('bead') || line.includes('bd ') || line.includes('sling') || line.includes('close')) {
    const match = line.match(/(bead|bd)\s+([a-z0-9-]+)/i)
    return {
      type: 'bead',
      message: match ? `Bead ${match[2]}` : line,
      details: line,
    }
  }

  // Mail
  if (line.includes('mail') || line.includes('msg') || line.includes('inbox')) {
    return { type: 'mail', message: line }
  }

  // Tool calls
  if (line.includes('tool') || line.includes('exec') || line.includes('run')) {
    return { type: 'tool', message: line }
  }

  // Agent events
  if (line.includes('polecat') || line.includes('agent') || line.includes('spawn')) {
    return { type: 'agent', message: line }
  }

  // Default: file type for any activity
  return { type: 'file', message: line }
}

function extractFileName(line: string): string | null {
  const match = line.match(/[\w-]+\.\w+/) || line.match(/src\/[\w/]+\.\w+/)
  return match ? match[0] : null
}
