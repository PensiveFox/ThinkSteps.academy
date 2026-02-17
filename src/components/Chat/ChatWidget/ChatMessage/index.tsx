import React, { useCallback, useRef, useState } from 'react'
import { MessageActionButton, MessageStyled } from '../styles'
import { Markdown } from 'src/components/Markdown'

interface ChatMessageProps {
  id: string
  isUser: boolean
  text?: string
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  isUser,
  text,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const stopSpeak = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.speechSynthesis?.cancel()
    utteranceRef.current = null
    setIsSpeaking(false)
  }, [])

  const toggleSpeak = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (!text) {
      return
    }
    if (!('speechSynthesis' in window)) {
      return
    }
    if (isSpeaking) {
      stopSpeak()
      return
    }

    // Cancel any previous speech (from other messages)
    window.speechSynthesis.cancel()

    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ru-RU'
    u.rate = 1
    u.pitch = 1

    u.onend = () => {
      utteranceRef.current = null
      setIsSpeaking(false)
    }
    u.onerror = () => {
      utteranceRef.current = null
      setIsSpeaking(false)
    }

    utteranceRef.current = u
    setIsSpeaking(true)
    window.speechSynthesis.speak(u)
  }, [isSpeaking, stopSpeak, text])

  return (
    <MessageStyled key={id} $isUser={isUser}>
      {text ? <Markdown>{text}</Markdown> : null}
      {!isUser && text ? (
        <div>
          <MessageActionButton type="button" onClick={toggleSpeak}>
            <svg viewBox="0 0 24 24">
              <path d="M3 10v4a2 2 0 0 0 2 2h3l4 4V4L8 8H5a2 2 0 0 0-2 2zm13.5 2a4.5 4.5 0 0 0-2.1-3.8 1 1 0 1 0-1.1 1.7A2.5 2.5 0 0 1 14.5 12a2.5 2.5 0 0 1-1.2 2.1 1 1 0 1 0 1.1 1.7A4.5 4.5 0 0 0 16.5 12zm2.9 0a7.4 7.4 0 0 0-3.5-6.2 1 1 0 1 0-1.1 1.7A5.4 5.4 0 0 1 17.4 12a5.4 5.4 0 0 1-2.6 4.5 1 1 0 1 0 1.1 1.7A7.4 7.4 0 0 0 19.4 12z" />
            </svg>
            {isSpeaking ? 'Стоп' : 'Озвучить'}
          </MessageActionButton>
        </div>
      ) : null}
    </MessageStyled>
  )
}

export const ChatMessageMemo = React.memo(ChatMessage)
