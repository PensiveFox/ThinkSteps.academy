import { useEffect, useRef, useState, useCallback } from 'react'
import { useSignaling } from './useSignaling'
import { useOpenCV } from './useOpenCV'
import {
  detectSheet,
  warpSheet,
  drawSheetOutline,
  smoothCorners,
  defaultCorners,
} from './sheetDetector'
import type { SheetCorners, Point } from './sheetDetector'

/* eslint-disable @typescript-eslint/no-explicit-any */

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 15, max: 20 },
    facingMode: 'environment',
  },
  audio: false,
}

const WARP_WIDTH = 640
const WARP_HEIGHT = 480

export function StudentNotebook() {
  const [roomId] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('room') || 'default'
    }
    return 'default'
  })

  const { connected, peerPresent, sendMessage, addHandler } = useSignaling(
    roomId,
    'student',
  )

  const { ready: cvReady, error: cvError } = useOpenCV()

  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const warpCanvasRef = useRef<HTMLCanvasElement>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cornersRef = useRef<SheetCorners | null>(null)
  const smoothedCornersRef = useRef<SheetCorners | null>(null)
  const detectingRef = useRef(false)
  const frameCountRef = useRef(0)
  const draggingRef = useRef<string | null>(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Инициализация...')
  const [sheetDetected, setSheetDetected] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const storageKey = `notebook-corners-${roomId}`

  const [mode, setMode] = useState<'auto' | 'manual'>(() => {
    if (typeof window === 'undefined') {
      return 'auto'
    }
    const saved = localStorage.getItem(storageKey)
    return saved ? 'manual' : 'auto'
  })

  const [manualCorners, setManualCorners] = useState<SheetCorners | null>(
    () => {
      if (typeof window === 'undefined') {
        return null
      }
      try {
        const saved = localStorage.getItem(storageKey)
        return saved ? JSON.parse(saved) : null
      } catch {
        return null
      }
    },
  )

  // Save manual corners to localStorage
  useEffect(() => {
    if (manualCorners && mode === 'manual') {
      localStorage.setItem(storageKey, JSON.stringify(manualCorners))
    }
  }, [manualCorners, mode, storageKey])

  // Start camera
  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS)
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setCameraReady(true)
        setStatus('Камера готова')
      } catch (err) {
        setError(`Не удалось получить доступ к камере: ${err}`)
      }
    }

    startCamera()

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  // Warp helper: draw warped image onto warpCanvas using given corners
  const updateWarp = useCallback(
    (video: HTMLVideoElement, corners: SheetCorners) => {
      const cv = (window as any).cv
      const warpCanvas = warpCanvasRef.current
      if (!cv || !warpCanvas) {
        return
      }

      const w = video.videoWidth
      const h = video.videoHeight
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = w
      tempCanvas.height = h
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) {
        return
      }
      tempCtx.drawImage(video, 0, 0, w, h)
      const imageData = tempCtx.getImageData(0, 0, w, h)

      const src = new cv.Mat(h, w, cv.CV_8UC4)
      src.data.set(imageData.data)

      const warped = warpSheet(src, corners, WARP_WIDTH, WARP_HEIGHT)
      if (
        warpCanvas.width !== WARP_WIDTH ||
        warpCanvas.height !== WARP_HEIGHT
      ) {
        warpCanvas.width = WARP_WIDTH
        warpCanvas.height = WARP_HEIGHT
      }
      const warpCtx = warpCanvas.getContext('2d')
      if (warpCtx) {
        const warpedData = new ImageData(
          new Uint8ClampedArray(warped.data),
          WARP_WIDTH,
          WARP_HEIGHT,
        )
        warpCtx.putImageData(warpedData, 0, 0)
      }
      warped.delete()
      src.delete()
    },
    [],
  )

  // Sheet detection loop (auto mode)
  useEffect(() => {
    if (!cvReady || !cameraReady) {
      return
    }

    const cv = (window as any).cv
    let animId: number
    let stopped = false

    function processFrame() {
      if (stopped) {
        return
      }

      const video = videoRef.current
      const overlayCanvas = overlayCanvasRef.current

      if (!video || !overlayCanvas || video.readyState < 2) {
        animId = requestAnimationFrame(processFrame)
        return
      }

      const w = video.videoWidth
      const h = video.videoHeight

      if (w === 0 || h === 0) {
        animId = requestAnimationFrame(processFrame)
        return
      }

      if (overlayCanvas.width !== w || overlayCanvas.height !== h) {
        overlayCanvas.width = w
        overlayCanvas.height = h
      }

      const overlayCtx = overlayCanvas.getContext('2d')
      if (!overlayCtx) {
        animId = requestAnimationFrame(processFrame)
        return
      }

      overlayCtx.clearRect(0, 0, w, h)

      // Auto detection mode
      if (detectingRef.current) {
        frameCountRef.current++

        // Throttle: run detection every 3rd frame to save CPU
        if (frameCountRef.current % 3 === 0) {
          const src = new cv.Mat(h, w, cv.CV_8UC4)
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = w
          tempCanvas.height = h
          const tempCtx = tempCanvas.getContext('2d')
          if (!tempCtx) {
            src.delete()
            animId = requestAnimationFrame(processFrame)
            return
          }
          tempCtx.drawImage(video, 0, 0, w, h)
          const imgData = tempCtx.getImageData(0, 0, w, h)
          src.data.set(imgData.data)

          const rawCorners = detectSheet(src)

          if (rawCorners) {
            // Smooth corners to prevent jitter
            if (smoothedCornersRef.current) {
              smoothedCornersRef.current = smoothCorners(
                smoothedCornersRef.current,
                rawCorners,
                0.4,
              )
            } else {
              smoothedCornersRef.current = rawCorners
            }
            cornersRef.current = smoothedCornersRef.current
            setSheetDetected(true)

            drawSheetOutline(
              overlayCtx,
              smoothedCornersRef.current,
              '#00ff00',
              3,
            )
            updateWarp(video, smoothedCornersRef.current)
          } else {
            overlayCtx.fillStyle = 'rgba(255,0,0,0.7)'
            overlayCtx.font = '20px sans-serif'
            overlayCtx.textAlign = 'center'
            overlayCtx.fillText('Лист не найден', w / 2, 40)
            overlayCtx.font = '14px sans-serif'
            overlayCtx.fillText('Попробуйте ручной режим ↓', w / 2, 65)
          }

          src.delete()
        } else if (smoothedCornersRef.current) {
          // Between detection frames, just draw the outline
          drawSheetOutline(overlayCtx, smoothedCornersRef.current, '#00ff00', 3)
        }
      } else if (cornersRef.current) {
        drawSheetOutline(overlayCtx, cornersRef.current, '#3388ff', 2)
        // Update warp every 5th frame even when not detecting
        frameCountRef.current++
        if (frameCountRef.current % 5 === 0) {
          updateWarp(video, cornersRef.current)
        }
      }

      animId = requestAnimationFrame(processFrame)
    }

    animId = requestAnimationFrame(processFrame)

    return () => {
      stopped = true
      cancelAnimationFrame(animId)
    }
  }, [cvReady, cameraReady, updateWarp])

  // Manual mode: draw corners and handle drag on overlay canvas
  useEffect(() => {
    if (mode !== 'manual' || !manualCorners) {
      return
    }

    const overlayCanvas = overlayCanvasRef.current
    const video = videoRef.current
    if (!overlayCanvas || !video) {
      return
    }

    function draw() {
      if (!manualCorners || !overlayCanvas) {
        return
      }
      const ctx = overlayCanvas.getContext('2d')
      if (!ctx) {
        return
      }
      const w = overlayCanvas.width
      const h = overlayCanvas.height
      ctx.clearRect(0, 0, w, h)

      // Semi-transparent overlay outside the quad
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.moveTo(manualCorners.topLeft.x, manualCorners.topLeft.y)
      ctx.lineTo(manualCorners.topRight.x, manualCorners.topRight.y)
      ctx.lineTo(manualCorners.bottomRight.x, manualCorners.bottomRight.y)
      ctx.lineTo(manualCorners.bottomLeft.x, manualCorners.bottomLeft.y)
      ctx.closePath()
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'

      drawSheetOutline(ctx, manualCorners, '#ff9900', 3)

      // Draw larger drag handles
      const DOT = 14
      ctx.fillStyle = '#ff9900'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      for (const pt of [
        manualCorners.topLeft,
        manualCorners.topRight,
        manualCorners.bottomRight,
        manualCorners.bottomLeft,
      ]) {
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, DOT, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }

      // Labels
      ctx.fillStyle = '#fff'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('TL', manualCorners.topLeft.x, manualCorners.topLeft.y - 18)
      ctx.fillText(
        'TR',
        manualCorners.topRight.x,
        manualCorners.topRight.y - 18,
      )
      ctx.fillText(
        'BR',
        manualCorners.bottomRight.x,
        manualCorners.bottomRight.y + 28,
      )
      ctx.fillText(
        'BL',
        manualCorners.bottomLeft.x,
        manualCorners.bottomLeft.y + 28,
      )
    }

    draw()

    // Update warp with manual corners
    if (video.readyState >= 2) {
      cornersRef.current = manualCorners
      setSheetDetected(true)
      updateWarp(video, manualCorners)
    }
  }, [mode, manualCorners, updateWarp])

  // Touch/mouse handlers for manual corner dragging
  const getCanvasPoint = useCallback(
    (e: React.TouchEvent | React.MouseEvent): Point | null => {
      const canvas = overlayCanvasRef.current
      if (!canvas) {
        return null
      }
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      let clientX: number, clientY: number
      if ('touches' in e) {
        if (e.touches.length === 0) {
          return null
        }
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      return {
        x: Math.round((clientX - rect.left) * scaleX),
        y: Math.round((clientY - rect.top) * scaleY),
      }
    },
    [],
  )

  const findNearestCorner = useCallback(
    (pt: Point): string | null => {
      if (!manualCorners) {
        return null
      }
      const THRESHOLD = 40
      const corners: [string, Point][] = [
        ['topLeft', manualCorners.topLeft],
        ['topRight', manualCorners.topRight],
        ['bottomRight', manualCorners.bottomRight],
        ['bottomLeft', manualCorners.bottomLeft],
      ]
      let best: string | null = null
      let bestDist = THRESHOLD
      for (const [name, c] of corners) {
        const d = Math.sqrt((pt.x - c.x) ** 2 + (pt.y - c.y) ** 2)
        if (d < bestDist) {
          bestDist = d
          best = name
        }
      }
      return best
    },
    [manualCorners],
  )

  const handlePointerDown = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (mode !== 'manual') {
        return
      }
      const pt = getCanvasPoint(e)
      if (!pt) {
        return
      }
      const corner = findNearestCorner(pt)
      if (corner) {
        draggingRef.current = corner
        e.preventDefault()
      }
    },
    [mode, getCanvasPoint, findNearestCorner],
  )

  const handlePointerMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!draggingRef.current || !manualCorners) {
        return
      }
      const pt = getCanvasPoint(e)
      if (!pt) {
        return
      }
      e.preventDefault()
      setManualCorners({
        ...manualCorners,
        [draggingRef.current]: pt,
      })
    },
    [manualCorners, getCanvasPoint],
  )

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null
  }, [])

  // Toggle auto detection
  const toggleDetection = useCallback(() => {
    if (mode === 'manual') {
      return
    }
    detectingRef.current = !detectingRef.current
    setDetecting(detectingRef.current)
    if (detectingRef.current) {
      setSheetDetected(false)
      cornersRef.current = null
      smoothedCornersRef.current = null
    }
  }, [mode])

  // Switch to manual mode
  const switchToManual = useCallback(() => {
    detectingRef.current = false
    setDetecting(false)
    setMode('manual')

    const video = videoRef.current
    if (video && video.videoWidth > 0) {
      // Start with auto-detected corners if available, otherwise default
      const initial =
        cornersRef.current ||
        defaultCorners(video.videoWidth, video.videoHeight)
      setManualCorners(initial)
    }
  }, [])

  // Switch back to auto mode
  const switchToAuto = useCallback(() => {
    setMode('auto')
    setManualCorners(null)
    localStorage.removeItem(storageKey)
    detectingRef.current = true
    setDetecting(true)
    smoothedCornersRef.current = null
  }, [storageKey])

  // Create offer when peer (teacher) joins
  const createOffer = useCallback(async () => {
    if (!streamRef.current) {
      return
    }

    // Close existing connection
    if (pcRef.current) {
      pcRef.current.close()
    }

    const pc = new RTCPeerConnection(ICE_SERVERS)
    pcRef.current = pc

    // Add video track
    for (const track of streamRef.current.getTracks()) {
      pc.addTrack(track, streamRef.current)
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
        setStatus('Подключено к учителю')
      } else if (
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'failed'
      ) {
        setStatus('Соединение потеряно')
      }
    }

    // Create and send offer
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    sendMessage({
      type: 'offer',
      sdp: offer.sdp,
    })

    setStatus('Отправлен offer, ждём ответ...')
  }, [sendMessage])

  // Handle signaling messages
  useEffect(() => {
    const remove = addHandler(async (msg) => {
      if (msg.type === 'peer-joined' && msg.role === 'teacher' && cameraReady) {
        await createOffer()
      }

      if (msg.type === 'answer' && pcRef.current) {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription({
            type: 'answer',
            sdp: msg.sdp as string,
          }),
        )
        setStatus('Подключено к учителю')
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
    })

    return remove
  }, [addHandler, cameraReady, createOffer])

  // When both are connected and camera is ready, create offer
  useEffect(() => {
    if (peerPresent && cameraReady) {
      createOffer()
    }
  }, [peerPresent, cameraReady, createOffer])

  // Auto-start detection when OpenCV is ready
  useEffect(() => {
    if (cvReady && cameraReady && !detecting) {
      detectingRef.current = true
      setDetecting(true)
    }
  }, [cvReady, cameraReady, detecting])

  return (
    <div
      style={{
        padding: 16,
        fontFamily: 'sans-serif',
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      <h2>Тетрадная камера (ученик)</h2>

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
          <strong>Учитель:</strong>{' '}
          <span style={{ color: peerPresent ? 'green' : 'gray' }}>
            {peerPresent ? 'в комнате' : 'не подключён'}
          </span>
        </div>
        <div>
          <strong>OpenCV:</strong>{' '}
          <span style={{ color: cvReady ? 'green' : 'orange' }}>
            {cvReady ? 'загружен' : 'загрузка...'}
          </span>
        </div>
        <div>
          <strong>Лист:</strong>{' '}
          <span style={{ color: sheetDetected ? 'green' : 'gray' }}>
            {sheetDetected ? 'найден ✓' : 'не найден'}
          </span>
        </div>
        <div>
          <strong>Статус:</strong> {status}
        </div>
      </div>

      {(error || cvError) && (
        <div style={{ color: 'red', marginBottom: 12 }}>{error || cvError}</div>
      )}

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            borderRadius: 8,
            background: '#000',
            display: 'block',
          }}
        />
        <canvas
          ref={overlayCanvasRef}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: mode === 'manual' ? 'auto' : 'none',
            touchAction: mode === 'manual' ? 'none' : 'auto',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {mode === 'auto' ? (
          <>
            <button
              onClick={toggleDetection}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: 14,
                borderRadius: 6,
                border: 'none',
                background: detecting ? '#ff6600' : '#0066ff',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {detecting ? '⏸ Стоп' : '🔄 Авто-поиск'}
            </button>
            <button
              onClick={switchToManual}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: 14,
                borderRadius: 6,
                border: '2px solid #ff9900',
                background: '#fff',
                color: '#ff9900',
                cursor: 'pointer',
              }}
            >
              ✋ Ручной режим
            </button>
          </>
        ) : (
          <button
            onClick={switchToAuto}
            style={{
              flex: 1,
              padding: '10px 12px',
              fontSize: 14,
              borderRadius: 6,
              border: 'none',
              background: '#0066ff',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            🔄 Вернуться к авто-режиму
          </button>
        )}
      </div>

      {mode === 'manual' && (
        <p
          style={{
            fontSize: 13,
            color: '#ff9900',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Перетащите оранжевые точки на углы листа
        </p>
      )}

      {sheetDetected && (
        <div>
          <h3 style={{ fontSize: 14, marginBottom: 4 }}>Выровненный лист:</h3>
          <canvas
            ref={warpCanvasRef}
            style={{
              width: '100%',
              borderRadius: 8,
              border: '1px solid #ccc',
            }}
          />
        </div>
      )}

      <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
        {mode === 'auto'
          ? 'Зелёная рамка = лист найден. Если не находит — используйте ручной режим.'
          : 'Перетащите углы на края листа. Выровненный лист появится ниже.'}
      </p>
    </div>
  )
}
