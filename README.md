# OfficeWorld

**Gamified Gas Town Dashboard**

A Gather.Town-inspired visualization layer for Gas Town multi-agent systems. Monitor your AI agents in a pixel-art office environment with real-time status, terminal streaming, and interactive controls.

[![Release](https://img.shields.io/github/v/release/Deepwork-AI/OfficeWorld?include_prereleases)](https://github.com/Deepwork-AI/OfficeWorld/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Features

- **Real-time Agent Visualization** — See agents as pixel-art characters moving between rooms
- **Live Terminal Streaming** — WebSocket-based terminal output from agent tmux sessions
- **Interactive Map** — Click agents to view their sessions, click rooms to focus
- **Mayor Chat Integration** — Real-time conversation with your Mayor agent
- **GT Mesh Compatible** — Works with GT Mesh federation protocol

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
```

---

## Release Notes

### v0.2.0 (2026-03-06)

#### New Features
- **WebSocket Terminal Streaming** — Real-time terminal output via WebSocket (`/ws` endpoint)
- **Security Hardening** — Switched from `exec` to `execFile` to prevent command injection
- **Session Viewer Panel** — Draggable, resizable terminal viewer with LIVE/ERROR status indicators

#### Improvements
- Replaced REST API polling with WebSocket for terminal updates
- Added proper cleanup on WebSocket disconnect
- Status indicators for connection state (LIVE/ERROR/CONNECTING)

#### Security
- Fixed command injection vulnerability in terminal-input handler
- All user input now passed as literal arguments using `tmux send-keys -l`

---

## Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   React Frontend │ ◄────────────────► │  Express Server │
│   (Phaser 3)     │                    │   (Node.js)     │
└─────────────────┘                    └─────────────────┘
                                              │
                                              │ tmux
                                              ▼
                                       ┌─────────────────┐
                                       │  Gas Town CLI   │
                                       │  (gt status)    │
                                       └─────────────────┘
```

---

## GT Mesh Integration

OfficeWorld is a **shared rig** in the GT Mesh network:

```yaml
shared_rigs:
  - name: "OfficeWorld"
    visibility: "mesh"
    description: "Gamified Gas Town dashboard"
```

Contributors can:
- View the codebase
- Create beads for features
- Submit contributions via review gate

Coordinators:
- Accept/reject contributions
- Their polecats build accepted work

---

## Contributing

This project uses **GT Mesh** for collaboration:

1. Join the mesh: `gt mesh join MESH-CODE`
2. Create a bead for your feature
3. Submit for review
4. Coordinator's agents build it

See [GT Mesh documentation](https://github.com/Deepwork-AI/gt-mesh) for details.

---

## License

MIT — Part of Deepwork-AI GT Mesh Network
