import express from 'express'
import { WebSocketServer } from 'ws'
import http from 'http'
import { execSync } from 'child_process'

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

const PORT = Number(process.env.PORT) || 3201

// Broadcast to all connected clients
function broadcast(data: Record<string, unknown>) {
  const msg = JSON.stringify(data)
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg)
  }
}

// Periodically poll gt status and broadcast
function pollStatus() {
  try {
    const output = execSync('gt status 2>/dev/null', {
      cwd: process.env.GT_ROOT || '/home/pratham2/gt',
      timeout: 5000,
      encoding: 'utf-8',
    })
    broadcast({ type: 'gt-status', data: output })
  } catch {
    // gt not available, skip
  }
}

setInterval(pollStatus, 10000)

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to Gas Town Arcade' }))
  pollStatus()
})

server.listen(PORT, () => {
  console.log(`Gas Town Arcade server listening on :${PORT}`)
})
