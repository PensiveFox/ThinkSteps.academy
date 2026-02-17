import { WebSocketServer, WebSocket } from 'ws'
import type { Server as HttpServer } from 'http'

interface Room {
  student: WebSocket | null
  teacher: WebSocket | null
}

const rooms = new Map<string, Room>()

function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { student: null, teacher: null })
  }
  const room = rooms.get(roomId)
  if (!room) {
    const newRoom: Room = { student: null, teacher: null }
    rooms.set(roomId, newRoom)
    return newRoom
  }
  return room
}

function cleanupRoom(roomId: string) {
  const room = rooms.get(roomId)
  if (room && !room.student && !room.teacher) {
    rooms.delete(roomId)
  }
}

function send(ws: WebSocket | null, data: Record<string, unknown>) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

export function setupSignalingServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/notebook',
  })

  // eslint-disable-next-line no-console
  console.log('📓 Notebook signaling WebSocket ready at /ws/notebook')

  wss.on('connection', (ws) => {
    let currentRoom: string | null = null
    let currentRole: 'student' | 'teacher' | null = null

    ws.on('message', (raw) => {
      let msg: Record<string, unknown>
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return
      }

      const { type } = msg

      if (type === 'join') {
        const roomId = msg.roomId as string
        const role = msg.role as 'student' | 'teacher'

        if (!roomId || !role) {
          return
        }

        currentRoom = roomId
        currentRole = role

        const room = getOrCreateRoom(roomId)
        room[role] = ws

        // Notify the other peer that someone joined
        const otherRole = role === 'student' ? 'teacher' : 'student'
        send(room[otherRole], { type: 'peer-joined', role })

        // If both are in the room, tell the new joiner the other is already here
        if (room[otherRole]) {
          send(ws, { type: 'peer-joined', role: otherRole })
        }

        // eslint-disable-next-line no-console
        console.log(`[notebook] ${role} joined room ${roomId}`)
        return
      }

      // Relay signaling messages (offer, answer, ice-candidate)
      if (type === 'offer' || type === 'answer' || type === 'ice-candidate') {
        if (!currentRoom || !currentRole) {
          return
        }
        const room = rooms.get(currentRoom)
        if (!room) {
          return
        }

        const target = currentRole === 'student' ? room.teacher : room.student
        send(target, msg)
        return
      }
    })

    ws.on('close', () => {
      if (currentRoom && currentRole) {
        const room = rooms.get(currentRoom)
        if (room) {
          // Notify the other peer
          const otherRole = currentRole === 'student' ? 'teacher' : 'student'
          send(room[otherRole], {
            type: 'peer-left',
            role: currentRole,
          })

          room[currentRole] = null
          cleanupRoom(currentRoom)
        }
        // eslint-disable-next-line no-console
        console.log(`[notebook] ${currentRole} left room ${currentRoom}`)
      }
    })
  })

  return wss
}
