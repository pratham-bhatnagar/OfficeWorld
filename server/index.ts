import express from 'express'
import { WebSocketServer } from 'ws'
import http from 'http'
import { exec } from 'child_process'

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

const PORT = Number(process.env.PORT) || 3201
const GT_ROOT = process.env.GT_ROOT || '/home/pratham2/gt'
const CACHE_TTL_MS = 2000
const EXEC_TIMEOUT_MS = 5000
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

function runCommand(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, {
      cwd: GT_ROOT,
      timeout: EXEC_TIMEOUT_MS,
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

async function cachedCommand(key: string, cmd: string): Promise<string> {
  const cached = getCached(key)
  if (cached !== null) return cached

  const result = await runCommand(cmd)
  setCache(key, result)
  return result
}

app.use(express.json())

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
    const output = await runCommand(cmd + ' 2>&1')
    res.json({ ok: true, output })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Command failed'
    res.json({ ok: true, output: '', error: message })
  }
})

// --- REST endpoints ---

app.get('/api/status', async (_req, res) => {
  try {
    const output = await cachedCommand('status', 'gt status 2>/dev/null')
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get status' })
  }
})

app.get('/api/convoy', async (_req, res) => {
  try {
    const output = await cachedCommand('convoy', 'gt convoy list 2>/dev/null')
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get convoy' })
  }
})

app.get('/api/mail', async (_req, res) => {
  try {
    const output = await cachedCommand('mail', 'gt mail inbox 2>/dev/null')
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get mail' })
  }
})

app.get('/api/polecats', async (_req, res) => {
  try {
    const output = await cachedCommand('polecats', 'gt polecat list --all 2>/dev/null')
    res.json({ ok: true, data: output })
  } catch {
    res.status(500).json({ ok: false, error: 'Failed to get polecats' })
  }
})

// --- WebSocket ---

function broadcast(data: Record<string, unknown>) {
  const msg = JSON.stringify(data)
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg)
  }
}

async function pollAndBroadcast() {
  const endpoints = [
    { key: 'status', cmd: 'gt status 2>/dev/null', type: 'gt-status' },
    { key: 'convoy', cmd: 'gt convoy list 2>/dev/null', type: 'gt-convoy' },
    { key: 'polecats', cmd: 'gt polecat list --all 2>/dev/null', type: 'gt-polecats' },
    { key: 'mail', cmd: 'gt mail inbox 2>/dev/null', type: 'gt-mail' },
  ]

  for (const ep of endpoints) {
    try {
      const output = await cachedCommand(ep.key, ep.cmd)
      broadcast({ type: ep.type, data: output })
    } catch {
      // Command unavailable, skip
    }
  }
}

setInterval(pollAndBroadcast, POLL_INTERVAL_MS)

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to Gas Town Arcade' }))
  // Send initial state to new client
  pollAndBroadcast()
})

server.listen(PORT, () => {
  console.log(`Gas Town Arcade server listening on :${PORT}`)
})
