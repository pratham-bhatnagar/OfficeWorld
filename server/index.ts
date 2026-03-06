import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
import { exec, execFile } from 'child_process'

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

const PORT = Number(process.env.PORT) || 3201
const GT_ROOT = process.env.GT_ROOT || '/home/pratham2/gt'
const ARCADE_ROOT = process.env.ARCADE_ROOT || '/home/pratham2/gt/gt_arcade/crew/manager'
const CACHE_TTL_MS = 2000
const EXEC_TIMEOUT_MS = 10000
const POLL_INTERVAL_MS = 10000

// --- Cache layer ---

interface CacheEntry {
  data: string
  timestamp: number
}

const cache = new Map<string, CacheEntry>()

function getCached(key: string): string | null {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data
  }
  return null
}

function setCache(key: string, data: string): void {
  cache.set(key, { data, timestamp: Date.now() })
}

// --- Command execution ---

function runCommand(cmd: string, timeout = EXEC_TIMEOUT_MS, cwd = GT_ROOT): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, {
      cwd,
      timeout,
      encoding: 'utf-8',
      env: { ...process.env, NO_COLOR: '1' },
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message))
      } else {
        resolve(stdout)
      }
    })
  })
}

function runBdCommand(cmd: string): Promise<string> {
  return runCommand(cmd, EXEC_TIMEOUT_MS, ARCADE_ROOT)
}

async function cachedCommand(key: string, cmd: string, cwd?: string): Promise<string> {
  const cached = getCached(key)
  if (cached !== null) return cached

  const result = await runCommand(cmd, EXEC_TIMEOUT_MS, cwd)
  setCache(key, result)
  return result
}

app.use(express.json())

// --- Structured status parser ---

interface AgentInfo {
  name: string
  role: string
  rig: string
  online: boolean
  model: string
  type: 'mayor' | 'deacon' | 'witness' | 'refinery' | 'crew' | 'polecat'
  extra?: string // e.g. "MQ:1"
}

function parseGtStatus(raw: string): { agents: AgentInfo[]; rigs: string[] } {
  const agents: AgentInfo[] = []
  const rigs: string[] = []
  let currentRig = ''
  let currentSection: 'global' | 'crew' | 'polecats' | '' = 'global'

  for (const line of raw.split('\n')) {
    // Rig header: ─── rig_name/ ───
    const rigMatch = line.match(/─── (.+?)\/ ─/)
    if (rigMatch) {
      currentRig = rigMatch[1]
      rigs.push(currentRig)
      currentSection = ''
      continue
    }

    // Section headers
    if (line.includes('Crew (')) { currentSection = 'crew'; continue }
    if (line.includes('Polecats (')) { currentSection = 'polecats'; continue }

    // Global agents (mayor, deacon)
    const globalMatch = line.match(/^.+?(mayor|deacon)\s+(●|○)\s+\[(.+?)\]/)
    if (globalMatch) {
      agents.push({
        name: globalMatch[1],
        role: globalMatch[1],
        rig: 'global',
        online: globalMatch[2] === '●',
        model: globalMatch[3],
        type: globalMatch[1] as 'mayor' | 'deacon',
      })
      continue
    }

    // Rig-level agents (witness, refinery)
    const rigAgentMatch = line.match(/^.+?(witness|refinery)\s+(●|○)\s+\[(.+?)\](.*)/)
    if (rigAgentMatch && currentRig) {
      agents.push({
        name: rigAgentMatch[1],
        role: rigAgentMatch[1],
        rig: currentRig,
        online: rigAgentMatch[2] === '●',
        model: rigAgentMatch[3],
        type: rigAgentMatch[1] as 'witness' | 'refinery',
        extra: rigAgentMatch[4].trim() || undefined,
      })
      continue
    }

    // Crew/polecat members (indented: "   name   ● [model]")
    const memberMatch = line.match(/^\s{3,}(\S+)\s+(●|○)\s+\[(.+?)\]/)
    if (memberMatch && currentRig) {
      agents.push({
        name: memberMatch[1],
        role: memberMatch[1],
        rig: currentRig,
        online: memberMatch[2] === '●',
        model: memberMatch[3],
        type: currentSection === 'polecats' ? 'polecat' : 'crew',
      })
    }
  }

  return { agents, rigs }
}

// --- Command execution endpoint (terminal) ---

const ALLOWED_CMD_PREFIXES = ['gt ', 'bd ']

app.post('/api/exec', async (req, res) => {
  const { cmd } = req.body
  if (!cmd || typeof cmd !== 'string') {
    res.status(400).json({ ok: false, error: 'Missing cmd' })
    return
  }

  const isAllowed = ALLOWED_CMD_PREFIXES.some((p) => cmd.startsWith(p))
  if (!isAllowed) {
    res.status(403).json({ ok: false, error: 'Only gt and bd commands are allowed' })
    return
  }

  try {
    // bd commands run from arcade root for correct bead resolution
    const cwd = cmd.startsWith('bd ') ? ARCADE_ROOT : GT_ROOT
    const output = await runCommand(cmd + ' 2>&1', EXEC_TIMEOUT_MS, cwd)
    res.json({ ok: true, output })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Command failed'
    res.json({ ok: true, output: '', error: message })
  }
})

// --- REST endpoints: status ---

app.get('/api/status', async (_req, res) => {
  try {
    const output = await cachedCommand('status', 'gt status 2>/dev/null')
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get status' })
  }
})

app.get('/api/status/parsed', async (_req, res) => {
  try {
    const output = await cachedCommand('status', 'gt status 2>/dev/null')
    const parsed = parseGtStatus(output)
    res.json({ ok: true, ...parsed })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get status' })
  }
})

// --- REST endpoints: convoy ---

app.get('/api/convoy', async (_req, res) => {
  try {
    const output = await cachedCommand('convoy', 'gt convoy list 2>/dev/null')
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get convoy' })
  }
})

// --- REST endpoints: mail ---

app.get('/api/mail', async (_req, res) => {
  try {
    const output = await cachedCommand('mail', 'gt mail inbox 2>/dev/null')
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get mail' })
  }
})

// --- REST endpoints: polecats ---

app.get('/api/polecats', async (_req, res) => {
  try {
    const output = await cachedCommand('polecats', 'gt polecat list --all 2>/dev/null')
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get polecats' })
  }
})

// --- REST endpoints: beads ---

app.get('/api/beads', async (_req, res) => {
  try {
    const output = await cachedCommand('beads', 'bd list 2>/dev/null', ARCADE_ROOT)
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get beads' })
  }
})

app.get('/api/beads/ready', async (_req, res) => {
  try {
    const output = await cachedCommand('beads-ready', 'bd ready 2>/dev/null', ARCADE_ROOT)
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get ready beads' })
  }
})

app.get('/api/beads/blocked', async (_req, res) => {
  try {
    const output = await cachedCommand('beads-blocked', 'bd blocked 2>/dev/null', ARCADE_ROOT)
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get blocked beads' })
  }
})

app.get('/api/beads/:id', async (req, res) => {
  const { id } = req.params
  // Sanitize bead ID
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    res.status(400).json({ ok: false, error: 'Invalid bead ID' })
    return
  }
  try {
    const output = await runBdCommand(`bd show ${id} 2>/dev/null`)
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: `Failed to get bead ${id}` })
  }
})

// --- REST endpoints: feed ---

app.get('/api/feed', async (req, res) => {
  const lines = Number(req.query.lines) || 50
  try {
    const output = await cachedCommand('feed', `gt feed 2>/dev/null | tail -${lines}`)
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get feed' })
  }
})

// --- REST endpoints: sessions (tmux) ---

app.get('/api/sessions', async (_req, res) => {
  try {
    const output = await cachedCommand('sessions', 'tmux list-sessions 2>/dev/null')
    const sessions = output.trim().split('\n').filter(Boolean).map((line) => {
      const match = line.match(/^(.+?):\s+(\d+)\s+windows?\s+\(created\s+(.+?)\)(\s+\(attached\))?/)
      if (!match) return { name: line.split(':')[0], raw: line }
      return {
        name: match[1],
        windows: Number(match[2]),
        created: match[3],
        attached: !!match[4],
      }
    })
    res.json({ ok: true, sessions })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to list sessions' })
  }
})

app.get('/api/sessions/:name/capture', async (req, res) => {
  const { name } = req.params
  const lines = Number(req.query.lines) || 100
  // Sanitize session name to prevent injection
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    res.status(400).json({ ok: false, error: 'Invalid session name' })
    return
  }
  try {
    const output = await runCommand(
      `tmux capture-pane -t "${name}" -p -S -${lines} 2>/dev/null`
    )
    res.json({ ok: true, data: output, session: name })
  } catch {
    res.status(500).json({ ok: false, error: `Failed to capture session: ${name}` })
  }
})

// --- REST endpoints: mayor chat ---

app.post('/api/mayor-chat', async (req, res) => {
  const { message } = req.body
  if (!message || typeof message !== 'string') {
    res.status(400).json({ ok: false, error: 'Missing message' })
    return
  }

  // Sanitize: strip shell-dangerous characters for the nudge command
  const sanitized = message.replace(/[`$\\!"]/g, '')

  try {
    // Send message to mayor via gt nudge
    await runCommand(`gt nudge mayor '${sanitized.replace(/'/g, "'\\''")}'`)
    res.json({
      ok: true,
      reply: "Message sent to the Mayor. They'll respond when available.",
      delivered: true,
    })
  } catch {
    // If nudge fails, try via mail as fallback
    try {
      await runCommand(
        `gt mail send mayor/ -s "Arcade Chat" -m '${sanitized.replace(/'/g, "'\\''")}'`
      )
      res.json({
        ok: true,
        reply: "Mayor is busy. Message queued via mail.",
        delivered: true,
        method: 'mail',
      })
    } catch {
      res.json({
        ok: false,
        reply: "Couldn't reach the Mayor right now. Try again later.",
        delivered: false,
      })
    }
  }
})

// Get mayor session output (for polling responses)
app.get('/api/mayor-chat/history', async (_req, res) => {
  try {
    const output = await runCommand(
      'tmux capture-pane -t "hq-mayor" -p -S -200 2>/dev/null'
    )
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Mayor session not available' })
  }
})

// --- WebSocket ---

interface WsClient extends WebSocket {
  terminalSubscription?: string
}

function broadcast(data: Record<string, unknown>) {
  const msg = JSON.stringify(data)
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(msg)
  }
}

const POLL_ENDPOINTS = [
  { key: 'status', cmd: 'gt status 2>/dev/null', type: 'gt-status' },
  { key: 'convoy', cmd: 'gt convoy list 2>/dev/null', type: 'gt-convoy' },
  { key: 'polecats', cmd: 'gt polecat list --all 2>/dev/null', type: 'gt-polecats' },
  { key: 'mail', cmd: 'gt mail inbox 2>/dev/null', type: 'gt-mail' },
  { key: 'beads-ready', cmd: 'bd ready 2>/dev/null', type: 'gt-beads', cwd: ARCADE_ROOT },
  { key: 'feed', cmd: 'gt feed 2>/dev/null | tail -30', type: 'gt-feed' },
  { key: 'sessions', cmd: 'tmux list-sessions 2>/dev/null', type: 'gt-sessions' },
]

async function pollAndBroadcast() {
  for (const ep of POLL_ENDPOINTS) {
    try {
      const output = await cachedCommand(ep.key, ep.cmd, (ep as { cwd?: string }).cwd)
      broadcast({ type: ep.type, data: output })
    } catch {
      // Command unavailable, skip
    }
  }

  // Also broadcast parsed status for structured consumers
  try {
    const raw = getCached('status')
    if (raw) {
      broadcast({ type: 'gt-status-parsed', ...parseGtStatus(raw) })
    }
  } catch {
    // Skip
  }
}

setInterval(pollAndBroadcast, POLL_INTERVAL_MS)

// --- WebSocket terminal streaming ---

function cleanupTerminal(ws: WsClient) {
  ws.terminalSubscription = undefined
}

wss.on('connection', (rawWs) => {
  const ws = rawWs as WsClient
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to Gas Town Arcade' }))

  // Send initial state
  pollAndBroadcast()

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())

      switch (msg.type) {
        // Subscribe to a tmux session's output (read-only stream)
        case 'terminal-subscribe': {
          const session = msg.session
          if (!session || !/^[a-zA-Z0-9_-]+$/.test(session)) {
            ws.send(JSON.stringify({ type: 'error', error: 'Invalid session name' }))
            return
          }

          // Clean up any existing subscription
          cleanupTerminal(ws)
          ws.terminalSubscription = session

          // Start streaming session output via periodic capture
          const intervalId = setInterval(async () => {
            if (ws.readyState !== WebSocket.OPEN || ws.terminalSubscription !== session) {
              clearInterval(intervalId)
              return
            }
            try {
              const output = await runCommand(
                `tmux capture-pane -t "${session}" -p -S -50 2>/dev/null`
              )
              ws.send(JSON.stringify({ type: 'terminal-output', session, data: output }))
            } catch {
              ws.send(JSON.stringify({ type: 'terminal-error', session, error: 'Session ended' }))
              clearInterval(intervalId)
            }
          }, 2000) // Capture every 2s
          break
        }

        // Send input to a tmux session
        case 'terminal-input': {
          const session = msg.session
          const input = msg.data
          if (!session || !/^[a-zA-Z0-9_-]+$/.test(session)) {
            ws.send(JSON.stringify({ type: 'error', error: 'Invalid session name' }))
            return
          }
          // Use execFile to avoid shell injection - pass input as literal
          execFile('tmux', ['send-keys', '-t', session, '-l', input], {
            cwd: GT_ROOT,
            timeout: 3000
          }, (error) => {
            if (error) {
              console.error('tmux send-keys error:', error)
            }
          })
          break
        }

        // Unsubscribe from terminal
        case 'terminal-unsubscribe': {
          cleanupTerminal(ws)
          ws.send(JSON.stringify({ type: 'terminal-closed' }))
          break
        }

        // Request immediate data refresh
        case 'refresh': {
          cache.clear()
          pollAndBroadcast()
          break
        }
      }
    } catch {
      // Non-JSON or malformed message, ignore
    }
  })

  ws.on('close', () => {
    cleanupTerminal(ws)
  })
})

server.listen(PORT, () => {
  console.log(`Gas Town Arcade bridge server listening on :${PORT}`)
  console.log(`  REST API: http://localhost:${PORT}/api/*`)
  console.log(`  WebSocket: ws://localhost:${PORT}/ws`)
  console.log(`  GT_ROOT: ${GT_ROOT}`)
})
