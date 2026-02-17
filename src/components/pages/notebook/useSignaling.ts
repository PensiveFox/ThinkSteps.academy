import { useEffect, useRef, useCallback, useState } from 'react'

type MessageHandler = (msg: Record<string, unknown>) => void

export function useSignaling(roomId: string, role: 'student' | 'teacher') {
  const wsRef = useRef<WebSocket | null>(null)
  const handlersRef = useRef<MessageHandler[]>([])
  const [connected, setConnected] = useState(false)
  const [peerPresent, setPeerPresent] = useState(false)

  const addHandler = useCallback((handler: MessageHandler) => {
    handlersRef.current.push(handler)
    return () => {
      handlersRef.current = handlersRef.current.filter((h) => h !== handler)
    }
  }, [])

  const sendMessage = useCallback((data: Record<string, unknown>) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }, [])

  useEffect(() => {
    if (!roomId) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/notebook`

    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false
    let attempt = 0

    function connect() {
      if (stopped) {
        return
      }

      // Close previous connection if still open
      if (ws && ws.readyState <= WebSocket.OPEN) {
        ws.onclose = null
        ws.close()
      }

      ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        attempt = 0
        setConnected(true)
        ws?.send(JSON.stringify({ type: 'join', roomId, role }))
      }

      ws.onmessage = (event) => {
        let msg: Record<string, unknown>
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }

        if (msg.type === 'peer-joined') {
          setPeerPresent(true)
        } else if (msg.type === 'peer-left') {
          setPeerPresent(false)
        }

        for (const handler of handlersRef.current) {
          handler(msg)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        if (!stopped) {
          // Exponential backoff: 2s, 4s, 8s, max 30s
          const delay = Math.min(2000 * Math.pow(2, attempt), 30000)
          attempt++
          reconnectTimer = setTimeout(connect, delay)
        }
      }

      ws.onerror = () => {
        // Don't call ws.close() here — onclose will fire automatically
      }
    }

    connect()

    return () => {
      stopped = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [roomId, role])

  return { connected, peerPresent, sendMessage, addHandler }
}
