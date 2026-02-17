import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ChatForm, ChatTextarea, IconButton, SendButton, StopButton } from '../styles'
import { useChatContext } from '../context'

export const ChatInputForm: React.FC = () => {
  const { placeholder, isLoading, submitMessage, stopStreaming } =
    useChatContext()
  const [inputValue, setInputValue] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  const sttSupported =
    typeof window !== 'undefined' &&
    (!!(window as any).SpeechRecognition ||
      !!(window as any).webkitSpeechRecognition)

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(
        textarea.scrollHeight,
        window.innerHeight * 0.35,
      )}px`
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputValue, adjustTextareaHeight])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value)
    },
    [],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        const message = inputValue.trim()
        if (message && !isLoading) {
          submitMessage(message)
          setInputValue('')
        }
      }
    },
    [inputValue, isLoading, submitMessage],
  )

  const toggleRecording = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    // eslint-disable-next-line no-console
    console.log('[stt] mic click', {
      supported: !!SpeechRecognition,
      recording: !!recognitionRef.current,
    })

    if (!SpeechRecognition) {
      // eslint-disable-next-line no-console
      console.log('[stt] not supported in this browser')
      return
    }

    if (recognitionRef.current) {
      try {
        // eslint-disable-next-line no-console
        console.log('[stt] stop requested')
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
      setIsRecording(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'ru-RU'
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onstart = () => {
      // eslint-disable-next-line no-console
      console.log('[stt] started')
    }

    recognition.onresult = (event: any) => {
      let finalText = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        const transcript = res[0]?.transcript || ''
        if (res.isFinal) {
          finalText += transcript
        } else {
          interimText += transcript
        }
      }

      if (finalText.trim()) {
        // eslint-disable-next-line no-console
        console.log('[stt] final', finalText)
        setInputValue((prev) => {
          const sep = prev.trim() ? ' ' : ''
          return `${prev}${sep}${finalText}`.replace(/\s+/g, ' ')
        })
      }
      // We intentionally do not set interim text into the input to avoid flicker.
      void interimText
    }

    recognition.onend = () => {
      // eslint-disable-next-line no-console
      console.log('[stt] ended')
      recognitionRef.current = null
      setIsRecording(false)
    }

    recognition.onerror = (e: any) => {
      // eslint-disable-next-line no-console
      console.log('[stt] error', e)
      recognitionRef.current = null
      setIsRecording(false)
    }

    try {
      // eslint-disable-next-line no-console
      console.log('[stt] start requested')
      recognition.start()
      setIsRecording(true)
    } catch {
      // eslint-disable-next-line no-console
      console.log('[stt] start failed')
      recognitionRef.current = null
      setIsRecording(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {
          // ignore
        }
        recognitionRef.current = null
      }
    }
  }, [])

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const message = inputValue.trim()
      if (message && !isLoading) {
        submitMessage(message)
        setInputValue('')
      }
    },
    [inputValue, isLoading, submitMessage],
  )

  return (
    <ChatForm onSubmit={handleFormSubmit}>
      <IconButton
        type="button"
        onClick={toggleRecording}
        $active={isRecording}
        title={
          sttSupported
            ? isRecording
              ? 'Остановить запись'
              : 'Говорить (речь → текст)'
            : 'STT недоступен в этом браузере'
        }
        disabled={isLoading}
      >
        <svg viewBox="0 0 24 24">
          <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a1 1 0 0 0-2 0 3 3 0 0 1-6 0 1 1 0 0 0-2 0 5 5 0 0 0 4 4.9V19H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-3.1A5 5 0 0 0 17 11z" />
        </svg>
      </IconButton>
      <ChatTextarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        rows={1}
      />
      {isLoading ? (
        <StopButton type="button" onClick={stopStreaming}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </StopButton>
      ) : (
        <SendButton type="submit" $hasText={!!inputValue.trim()}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </SendButton>
      )}
    </ChatForm>
  )
}
