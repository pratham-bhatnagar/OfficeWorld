import { useState, useRef, useEffect, useCallback } from 'react'
import { THEME } from '../constants'

const RIG_PREFIX: Record<string, string> = {
  planogram: 'vap',
  alc_ai: 'vaa',
  arcade: 'gta',
}

export function agentToSession(rig: string, role: string, name: string): string {
  if (role === 'mayor') return 'hq-mayor'
  if (role === 'deacon') return 'hq-deacon'

  const prefix = RIG_PREFIX[rig] || rig
  if (role === 'witness' || role === 'refinery') return `${prefix}-${role}`
  return `${prefix}-crew-${name}`
}

interface SessionViewerProps {
  visible: boolean
  onClose: () => void
  sessionName: string | null
  title?: string
}

export function SessionViewer({ visible, onClose, sessionName, title }: SessionViewerProps) {
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const outputRef = useRef<HTMLPreElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  const [width, setWidth] = useState(520)
  const [height, setHeight] = useState(560)
  const [pos, setPos] = useState({ x: -1, y: -1 })
  const dragging = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)
  const resizing = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)

  // WebSocket connection for real-time terminal streaming
  useEffect(() => {
    if (!visible || !sessionName) {
      // Cleanup WebSocket when hidden
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setIsLive(false)
      return
    }

    setError(null)
    setOutput('')
    setIsLive(false)

    // Determine WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsLive(true)
      setError(null)
      // Subscribe to terminal session
      ws.send(JSON.stringify({
        type: 'terminal-subscribe',
        session: sessionName
      }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        
        if (msg.type === 'terminal-output' && msg.session === sessionName) {
          setOutput(msg.data || '')
          setError(null)
        } else if (msg.type === 'terminal-error') {
          setError(msg.error || 'Session error')
          setIsLive(false)
        } else if (msg.type === 'welcome') {
          // Connected successfully
        }
      } catch {
        // Non-JSON message, ignore
      }
    }

    ws.onerror = () => {
      setError('WebSocket connection failed')
      setIsLive(false)
    }

    ws.onclose = () => {
      setIsLive(false)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'terminal-unsubscribe' }))
      }
      ws.close()
      wsRef.current = null
    }
  }, [visible, sessionName])

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  // Focus input when visible
  useEffect(() => {
    if (visible && inputRef.current) inputRef.current.focus()
  }, [visible])

  // Send message to mayor (via REST API)
  const sendMessage = useCallback(async () => {
    const text = msgInput.trim()
    if (!text || sending) return

    setSending(true)
    try {
      if (sessionName === 'hq-mayor') {
        await fetch('/api/mayor-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        })
      }
    } catch {
      // ignore
    } finally {
      setMsgInput('')
      setSending(false)
    }
  }, [msgInput, sending, sessionName])

  // Send terminal input via WebSocket
  const sendTerminalInput = useCallback((input: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && sessionName) {
      wsRef.current.send(JSON.stringify({
        type: 'terminal-input',
        session: sessionName,
        data: input
      }))
    }
  }, [sessionName])

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const rect = (e.target as HTMLElement).closest('[data-session-panel]')?.getBoundingClientRect()
    if (!rect) return
    dragging.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x === -1 ? window.innerWidth - width - 16 : pos.x,
      startPosY: pos.y === -1 ? window.innerHeight - height - 16 : pos.y,
    }

    function onMove(e: MouseEvent) {
      if (!dragging.current) return
      setPos({
        x: dragging.current.startPosX + (e.clientX - dragging.current.startX),
        y: dragging.current.startPosY + (e.clientY - dragging.current.startY),
      })
    }
    function onUp() {
      dragging.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [pos, width, height])

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizing.current = { startX: e.clientX, startY: e.clientY, startW: width, startH: height }

    function onMove(e: MouseEvent) {
      if (!resizing.current) return
      setWidth(Math.max(360, resizing.current.startW - (e.clientX - resizing.current.startX)))
      setHeight(Math.max(300, resizing.current.startH - (e.clientY - resizing.current.startY)))
    }
    function onUp() {
      resizing.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [width, height])

  if (!visible) return null

  const isMayor = sessionName === 'hq-mayor'
  const displayTitle = title || sessionName || 'Session'

  const left = pos.x === -1 ? undefined : pos.x
  const top = pos.y === -1 ? undefined : pos.y
  const right = pos.x === -1 ? 16 : undefined
  const bottom = pos.y === -1 ? 16 : undefined

  return (
    <div
      data-session-panel
      style={{
        position: 'fixed',
        left,
        top,
        right,
        bottom,
        width,
        height,
        background: THEME.bgDark,
        border: `3px solid ${THEME.borderAccent}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        fontFamily: THEME.fontFamily,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {/* Resize handle (top-left corner) */}
      <div
        onMouseDown={onResizeStart}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 12,
          height: 12,
          cursor: 'nw-resize',
          zIndex: 2,
        }}
      />

      {/* Header / drag handle */}
      <div
        onMouseDown={onDragStart}
        style={{
          padding: '8px 14px',
          background: THEME.bgHeader,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: `2px solid ${THEME.borderAccent}`,
          cursor: 'grab',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <span style={{
          color: isMayor ? THEME.gold : THEME.textPrimary,
          fontWeight: 'bold',
          fontSize: 12,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {displayTitle}
        </span>
        <span style={{
          color: error ? THEME.red : isLive ? THEME.green : THEME.textMuted,
          fontSize: 9,
          letterSpacing: 1,
        }}>
          {error ? 'ERROR' : isLive ? 'LIVE' : 'CONNECTING'}
        </span>
        <span
          style={{ color: THEME.textMuted, cursor: 'pointer', fontSize: 14, padding: '0 4px' }}
          onClick={onClose}
        >
          x
        </span>
      </div>

      {/* Session output */}
      <pre
        ref={outputRef}
        style={{
          flex: 1,
          margin: 0,
          padding: '8px 12px',
          overflowY: 'auto',
          overflowX: 'hidden',
          fontSize: 11,
          lineHeight: 1.4,
          color: THEME.green,
          background: THEME.bgDark,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {error ? (
          <span style={{ color: THEME.red }}>{error}</span>
        ) : output ? (
          output
        ) : (
          <span style={{ color: THEME.textMuted }}>Connecting to {sessionName}...</span>
        )}
      </pre>

      {/* Input (only for mayor) */}
      {isMayor && (
        <div style={{
          padding: '8px 12px',
          borderTop: `1px solid ${THEME.borderPanel}`,
          display: 'flex',
          gap: 8,
          flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Send to Mayor (gt nudge)..."
            style={{
              flex: 1,
              background: THEME.bgBody,
              border: `1px solid ${THEME.borderPanel}`,
              color: THEME.textPrimary,
              padding: '6px 10px',
              fontSize: 11,
              fontFamily: THEME.fontFamily,
              outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sending}
            style={{
              background: THEME.borderAccent,
              color: THEME.textBright,
              border: 'none',
              padding: '6px 12px',
              fontSize: 11,
              cursor: sending ? 'wait' : 'pointer',
              fontFamily: THEME.fontFamily,
              opacity: sending ? 0.5 : 1,
            }}
          >Send</button>
        </div>
      )}
    </div>
  )
}
