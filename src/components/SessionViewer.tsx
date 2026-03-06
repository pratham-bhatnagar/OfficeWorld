import { useState, useRef, useEffect, useCallback } from 'react'

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
  const outputRef = useRef<HTMLPreElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Drag-resize state
  const [width, setWidth] = useState(520)
  const [height, setHeight] = useState(560)
  const [pos, setPos] = useState({ x: -1, y: -1 }) // -1 = default position
  const dragging = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)
  const resizing = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)

  // Poll session output
  useEffect(() => {
    if (!visible || !sessionName) return

    setError(null)
    setOutput('')

    async function poll() {
      try {
        const res = await fetch(`/api/sessions/${sessionName}/capture?lines=80`)
        if (res.ok) {
          const data = await res.json()
          if (data.ok) {
            setOutput(data.data || '')
            setError(null)
          } else {
            setError(data.error || 'Session not available')
          }
        } else {
          setError('Bridge server not reachable')
        }
      } catch {
        setError('Bridge server not reachable')
      }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [visible, sessionName])

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  useEffect(() => {
    if (visible && inputRef.current) inputRef.current.focus()
  }, [visible])

  // Send message to mayor
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

  // Drag handlers
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

  // Resize handlers
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
        background: '#0a0a1a',
        border: '2px solid #533483',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        fontFamily: "'Courier New', monospace",
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
          background: '#0f3460',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '2px solid #533483',
          cursor: 'grab',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14 }}>{isMayor ? '\u{1F3A9}' : '\u{1F4BB}'}</span>
        <span style={{
          color: isMayor ? '#d4af37' : '#53d8fb',
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
          color: error ? '#e94560' : '#0f9b58',
          fontSize: 8,
        }}>
          {error ? 'OFFLINE' : 'LIVE'}
        </span>
        <span
          style={{ color: '#888', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}
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
          color: '#00ff88',
          background: '#0a0a1a',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {error ? (
          <span style={{ color: '#e94560' }}>{error}</span>
        ) : output ? (
          output
        ) : (
          <span style={{ color: '#555' }}>Connecting to {sessionName}...</span>
        )}
      </pre>

      {/* Input (only for mayor) */}
      {isMayor && (
        <div style={{
          padding: '8px 12px',
          borderTop: '1px solid #2a2a4e',
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
              background: '#1a1a2e',
              border: '1px solid #333',
              borderRadius: 4,
              color: '#ccc',
              padding: '6px 10px',
              fontSize: 11,
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sending}
            style={{
              background: '#533483',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '6px 12px',
              fontSize: 11,
              cursor: sending ? 'wait' : 'pointer',
              fontFamily: 'monospace',
              opacity: sending ? 0.5 : 1,
            }}
          >Send</button>
        </div>
      )}
    </div>
  )
}
