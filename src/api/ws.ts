export type MessageHandler = (data: Record<string, unknown>) => void

let socket: WebSocket | null = null
const handlers: MessageHandler[] = []

export function connect(url = `ws://${window.location.host}/ws`) {
  socket = new WebSocket(url)

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      for (const h of handlers) h(data)
    } catch {
      // ignore non-JSON messages
    }
  }

  socket.onclose = () => {
    setTimeout(() => connect(url), 3000)
  }
}

export function onMessage(handler: MessageHandler) {
  handlers.push(handler)
  return () => {
    const idx = handlers.indexOf(handler)
    if (idx >= 0) handlers.splice(idx, 1)
  }
}

export function send(data: Record<string, unknown>) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data))
  }
}
