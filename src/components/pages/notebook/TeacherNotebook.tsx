import { useEffect, useRef, useState } from 'react'
import { useSignaling } from './useSignaling'

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export function TeacherNotebook() {
  const [roomId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('room') || 'default'
    }
    return 'default'
  })

  const { connected, peerPresent, sendMessage, addHandler } = useSignaling(
    roomId,
    'teacher',
  )

  const videoRef = useRef<HTMLVideoElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const [status, setStatus] = useState('Ожидание ученика...')

  useEffect(() => {
    const remove = addHandler(async (msg) => {
      if (msg.type === 'offer') {
        // Close existing connection
        if (pcRef.current) {
          pcRef.current.close()
        }

        const pc = new RTCPeerConnection(ICE_SERVERS)
        pcRef.current = pc

        // When we receive the remote video track
        pc.ontrack = (event) => {
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0]
            setStatus('Видео получено')
          }
        }

        // Send ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendMessage({
              type: 'ice-candidate',
              candidate: event.candidate.toJSON(),
            })
          }
        }

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setStatus('Подключено к ученику')
          } else if (
            pc.connectionState === 'disconnected' ||
            pc.connectionState === 'failed'
          ) {
            setStatus('Соединение потеряно')
          }
        }

        // Set remote offer and create answer
        await pc.setRemoteDescription(
          new RTCSessionDescription({
            type: 'offer',
            sdp: msg.sdp as string,
          }),
        )

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        sendMessage({
          type: 'answer',
          sdp: answer.sdp,
        })

        setStatus('Отправлен answer, устанавливаем соединение...')
      }

      if (msg.type === 'ice-candidate' && pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(msg.candidate as RTCIceCandidateInit),
          )
        } catch {
          // ignore failed ICE candidates
        }
      }

      if (msg.type === 'peer-left') {
        setStatus('Ученик отключился')
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }
      }
    })

    return remove
  }, [addHandler, sendMessage])

  return (
    <div
      style={{
        padding: 16,
        fontFamily: 'sans-serif',
        maxWidth: 800,
        margin: '0 auto',
      }}
    >
      <h2>Тетрадная камера (учитель)</h2>

      <div style={{ marginBottom: 12, fontSize: 14 }}>
        <div>
          <strong>Комната:</strong> {roomId}
        </div>
        <div>
          <strong>WebSocket:</strong>{' '}
          <span style={{ color: connected ? 'green' : 'red' }}>
            {connected ? 'подключён' : 'отключён'}
          </span>
        </div>
        <div>
          <strong>Ученик:</strong>{' '}
          <span style={{ color: peerPresent ? 'green' : 'gray' }}>
            {peerPresent ? 'в комнате' : 'не подключён'}
          </span>
        </div>
        <div>
          <strong>Статус:</strong> {status}
        </div>
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          borderRadius: 8,
          background: '#000',
        }}
      />

      <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
        Здесь будет отображаться видеопоток с камеры ученика.
        <br />
        Ссылка для ученика:{' '}
        <code>
          {typeof window !== 'undefined'
            ? `${window.location.origin}/notebook/student?room=${roomId}`
            : ''}
        </code>
      </p>
    </div>
  )
}
