import { useState, useRef, useEffect } from 'react'

interface ChatMessage {
  id: number
  role: 'user' | 'mayor'
  text: string
  timestamp: Date
}

export function MayorChat({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: 'mayor',
      text: "Welcome to Gas Town! I'm the Mayor. Ask me anything about the town, your rigs, or what the agents are up to.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (visible) inputRef.current?.focus()
  }, [visible])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = {
      id: messages.length,
      role: 'user',
      text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Send to bridge which forwards to mayor via gt nudge
      const res = await fetch('/api/mayor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      let reply = "I'm not available right now. The bridge server may be offline."
      if (res.ok) {
        const data = await res.json()
        reply = data.reply || reply
      }

      setMessages((prev) => [
        ...prev,
        { id: prev.length, role: 'mayor', text: reply, timestamp: new Date() },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length,
          role: 'mayor',
          text: 'Cannot reach the bridge server. Start it with: npm run server',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      right: 16,
      bottom: 16,
      width: 380,
      height: 500,
      background: '#0f0f23',
      border: '2px solid #533483',
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      fontFamily: "'Courier New', monospace",
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        background: '#0f3460',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderBottom: '2px solid #533483',
      }}>
        <span style={{ fontSize: 16 }}>&#x1F3A9;</span>
        <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: 13, flex: 1 }}>MAYOR</span>
        <span
          style={{ color: '#888', cursor: 'pointer', fontSize: 14, padding: '0 4px' }}
          onClick={onClose}
        >x</span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
          }}>
            <div style={{
              background: msg.role === 'user' ? '#1a3a5c' : '#1e1e3a',
              color: msg.role === 'user' ? '#88bbdd' : '#aaa',
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 11,
              lineHeight: 1.5,
              border: `1px solid ${msg.role === 'user' ? '#2a4a6e' : '#2a2a4e'}`,
            }}>
              {msg.text}
            </div>
            <div style={{
              fontSize: 8,
              color: '#444',
              marginTop: 2,
              textAlign: msg.role === 'user' ? 'right' : 'left',
            }}>
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: '#555', fontSize: 10, fontStyle: 'italic' }}>
            Mayor is thinking...
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid #2a2a4e',
        display: 'flex',
        gap: 8,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask the Mayor..."
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
          disabled={loading}
          style={{
            background: '#533483',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '6px 12px',
            fontSize: 11,
            cursor: loading ? 'wait' : 'pointer',
            fontFamily: 'monospace',
            opacity: loading ? 0.5 : 1,
          }}
        >Send</button>
      </div>
    </div>
  )
}
