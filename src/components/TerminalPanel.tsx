import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

const ALLOWED_PREFIXES = ['gt ', 'bd ']

export function TerminalPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const termRef = useRef<HTMLDivElement>(null)
  const termInstance = useRef<Terminal | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)
  const inputRef = useRef('')
  const hasInitialized = useRef(false)

  // Initialize terminal only when first made visible
  useEffect(() => {
    if (!visible || !termRef.current || hasInitialized.current) {
      // Just fit if already initialized and becoming visible again
      if (visible && fitAddon.current && hasInitialized.current) {
        setTimeout(() => fitAddon.current?.fit(), 50)
      }
      return
    }

    hasInitialized.current = true

    const term = new Terminal({
      theme: {
        background: '#0a0a1a',
        foreground: '#00ff88',
        cursor: '#53d8fb',
        selectionBackground: '#533483',
      },
      fontFamily: "'Courier New', monospace",
      fontSize: 12,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
    })

    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(termRef.current)

    // Delay fit until container is actually visible
    setTimeout(() => fit.fit(), 100)

    termInstance.current = term
    fitAddon.current = fit

    // Welcome message
    term.writeln('\x1b[36m╔══════════════════════════════════════════╗\x1b[0m')
    term.writeln('\x1b[36m║\x1b[0m  \x1b[1;33mGas Town Arcade Terminal\x1b[0m               \x1b[36m║\x1b[0m')
    term.writeln('\x1b[36m║\x1b[0m  Type gt or bd commands                 \x1b[36m║\x1b[0m')
    term.writeln('\x1b[36m║\x1b[0m  Press ~ to toggle panel                \x1b[36m║\x1b[0m')
    term.writeln('\x1b[36m╚══════════════════════════════════════════╝\x1b[0m')
    term.writeln('')
    writePrompt(term)

    // Handle keyboard input
    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey

      if (domEvent.key === 'Enter') {
        const cmd = inputRef.current.trim()
        term.writeln('')

        if (cmd) {
          executeCommand(term, cmd)
        } else {
          writePrompt(term)
        }

        inputRef.current = ''
      } else if (domEvent.key === 'Backspace') {
        if (inputRef.current.length > 0) {
          inputRef.current = inputRef.current.slice(0, -1)
          term.write('\b \b')
        }
      } else if (printable && key.length === 1) {
        inputRef.current += key
        term.write(key)
      }
    })
  }, [visible])

  // Resize handler
  useEffect(() => {
    function handleResize() {
      if (visible && fitAddon.current) fitAddon.current.fit()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [visible])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: visible ? '40vh' : 0,
        transition: 'height 0.3s ease',
        background: '#0a0a1a',
        borderTop: visible ? '2px solid #533483' : 'none',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: 28,
          background: '#0f3460',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          fontFamily: "'Courier New', monospace",
          fontSize: 11,
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#53d8fb', fontWeight: 'bold' }}>TERMINAL</span>
        <span style={{ flex: 1 }} />
        <span
          style={{ color: '#e94560', cursor: 'pointer', fontSize: 14 }}
          onClick={onClose}
        >
          x
        </span>
      </div>
      {/* Terminal container */}
      <div ref={termRef} style={{ flex: 1, padding: '4px 8px', overflow: 'hidden' }} />
    </div>
  )
}

function writePrompt(term: Terminal) {
  term.write('\x1b[33mgt-arcade\x1b[0m \x1b[36m>\x1b[0m ')
}

async function executeCommand(term: Terminal, cmd: string) {
  const isAllowed = ALLOWED_PREFIXES.some((p) => cmd.startsWith(p))

  if (!isAllowed) {
    term.writeln(`\x1b[31mOnly gt and bd commands are allowed\x1b[0m`)
    writePrompt(term)
    return
  }

  term.writeln(`\x1b[90mExecuting: ${cmd}\x1b[0m`)

  try {
    const res = await fetch(`/api/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.output) {
        const lines = data.output.split('\n')
        for (const line of lines) {
          term.writeln(line)
        }
      }
      if (data.error) {
        term.writeln(`\x1b[31m${data.error}\x1b[0m`)
      }
    } else {
      term.writeln(`\x1b[31mBridge server error: ${res.status}\x1b[0m`)
    }
  } catch {
    term.writeln(`\x1b[31mCannot reach bridge server. Start with: npm run server\x1b[0m`)
  }

  writePrompt(term)
}
