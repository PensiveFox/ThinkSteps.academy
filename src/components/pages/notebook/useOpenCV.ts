import { useEffect, useState } from 'react'

declare global {
  interface Window {
    cv: unknown
    Module: unknown
  }
}

const OPENCV_CDN = 'https://docs.opencv.org/4.9.0/opencv.js'

let loadPromise: Promise<void> | null = null

function loadOpenCV(): Promise<void> {
  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    if (
      window.cv &&
      typeof (window.cv as Record<string, unknown>).Mat === 'function'
    ) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = OPENCV_CDN
    script.async = true

    window.Module = {
      onRuntimeInitialized: () => {
        resolve()
      },
    }

    script.onerror = () => {
      loadPromise = null
      reject(new Error('Failed to load OpenCV.js'))
    }

    document.head.appendChild(script)
  })

  return loadPromise
}

export function useOpenCV() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOpenCV()
      .then(() => {
        setReady(true)
      })
      .catch((err) => {
        setError(String(err))
      })
  }, [])

  return { ready, error }
}
