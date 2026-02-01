import { useState, useCallback, useMemo } from 'react'
import { ExecutionStep } from './interfaces'

export const useExecutorChallenge = (
  onSubmit: (answer: { 
    b: number
    steps?: Array<{ command: string; expression: string }>
  }) => Promise<{
    isCorrect: boolean
    feedback: string
    trace?: ExecutionStep[]
  }>,
  program?: string // Программа для определения ожидаемого количества шагов
) => {
  const expectedSteps = program?.length || 5 // По умолчанию 5 шагов
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [steps, setSteps] = useState<ExecutionStep[]>([])

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode)
  }, [])

  const parseSteps = useCallback((code: string): { command: string; expression: string }[] => {
    const lines = code.split('\n')
    const steps: { command: string; expression: string }[] = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      // Парсим строки формата "2) выражение"
      const match = trimmed.match(/^(\d+)\)\s*(.*)$/)
      if (match) {
        steps.push({
          command: match[1] + ')', // Включаем скобку в команду
          expression: match[2].trim(),
        })
      }
    }
    
    return steps
  }, [])

  const extractBValue = useCallback((code: string): number | null => {
    // Ищем строку, которая начинается с "b = число" (может быть пробелы в начале)
    const match = code.match(/^\s*b\s*=\s*(\d+)\s*$/m)
    if (match) {
      return parseInt(match[1], 10)
    }
    return null
  }, [])

  const handleSubmit = useCallback(async () => {
    const bValue = extractBValue(code)
    const userSteps = parseSteps(code)
    const codeLines = code.trim().split('\n').filter(line => line.trim().length > 0)

    // Случай 1: Пустой редактор
    if (codeLines.length === 0) {
      setFeedback('❌ Редактор пустой.\n\nОжидаемый формат решения:\n2) выражение\n1) выражение\n1) выражение\n2) выражение\n2) выражение\n\nb = число')
      setIsCorrect(false)
      setSteps([])
      return
    }
    
    // Случай 2: Нет финального ответа b
    if (bValue === null) {
      let feedbackMessage = '❌ Не хватает финального ответа: b = число\n\n'
      
      if (userSteps.length > 0) {
        if (userSteps.length !== expectedSteps) {
          feedbackMessage += `⚠️ Вы ввели ${userSteps.length} шагов, а должно быть ${expectedSteps} (по количеству команд в программе).\n\n`
        } else {
          feedbackMessage += `✓ Количество шагов верное (${userSteps.length}).\n\n`
        }
      }
      
      feedbackMessage += 'Добавьте в конец решения строку с ответом, например:\nb = 2'
      
      setFeedback(feedbackMessage)
      setIsCorrect(false)
      setSteps([])
      return
    }

    // Случай 3: Есть b → отправляем на сервер для проверки
    setIsLoading(true)
    setFeedback(null)
    setIsCorrect(null)
    setSteps([])

    try {
      const result = await onSubmit({ 
        b: bValue,
        steps: userSteps.length > 0 ? userSteps : undefined
      })
      setIsCorrect(result.isCorrect)
      setFeedback(result.feedback)
      if (result.trace) {
        setSteps(result.trace)
      }
    } catch {
      setFeedback('Ошибка при проверке решения')
      setIsCorrect(false)
      setSteps([])
    } finally {
      setIsLoading(false)
    }
  }, [code, extractBValue, parseSteps, onSubmit, expectedSteps])

  const canSubmit = useMemo(() => {
    return !isLoading && code.trim().length > 0
  }, [isLoading, code])

  return {
    code,
    isLoading,
    feedback,
    isCorrect,
    steps,
    canSubmit,
    handleCodeChange,
    handleSubmit,
  }
}
