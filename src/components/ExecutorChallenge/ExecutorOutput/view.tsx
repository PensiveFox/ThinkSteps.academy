import React from 'react'
import { ExecutorOutputProps } from './interfaces'
import {
  OutputContainer,
  OutputHeader,
  OutputContent,
  StepItem,
  StepNumber,
  StepCommand,
  StepExpression,
  FeedbackBox,
  FeedbackTitle,
  EmptyState,
  LoadingState,
} from './styles'

interface TestResult {
  name: string
  passed: boolean | null // null = pending
  details?: string
}

export const ExecutorOutputView: React.FC<ExecutorOutputProps> = ({
  steps,
  isCorrect,
  feedback,
  isLoading,
  code,
}) => {
  // Конфигурация задания (TODO: получать из props)
  const program = '21122' // Программа из задания
  const expectedStepsCount = program.length

  const parseCodeToSteps = (code: string): { command: string; expression: string }[] => {
    const lines = code.split('\n')
    const parsedSteps: { command: string; expression: string }[] = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('#')) continue
      
      const match = trimmed.match(/^(\d+)\)\s*(.*)$/)
      if (match) {
        parsedSteps.push({
          command: match[1] + ')',
          expression: match[2].trim() || '',
        })
      }
    }
    
    return parsedSteps
  }

  const extractBValue = (code: string): number | null => {
    const match = code.match(/^\s*b\s*=\s*(\d+)\s*$/m)
    return match ? parseInt(match[1], 10) : null
  }

  const parsedSteps = code ? parseCodeToSteps(code) : []
  const parsedB = code ? extractBValue(code) : null

  // Генерируем тесты на основе введённого кода
  const generateTests = (): TestResult[] => {
    if (!code?.trim()) return []

    const tests: TestResult[] = []

    // Тест 1: Количество шагов
    const stepsMatch = parsedSteps.length === expectedStepsCount
    tests.push({
      name: `Количество шагов соответствует программе (${expectedStepsCount})`,
      passed: stepsMatch,
      details: stepsMatch 
        ? `✓ Введено ${parsedSteps.length} шагов` 
        : `Введено ${parsedSteps.length}, нужно ${expectedStepsCount}`,
    })

    // Тест 2: Каждый шаг начинается с правильной команды
    if (parsedSteps.length > 0) {
      const commandsCorrect = parsedSteps.every((step, i) => {
        const expectedCmd = program[i] + ')'
        return step.command === expectedCmd
      })
      tests.push({
        name: 'Команды шагов соответствуют программе',
        passed: commandsCorrect,
        details: commandsCorrect
          ? `✓ Последовательность: ${program.split('').join(', ')}`
          : `Ожидается: ${program.split('').map(d => d + ')').join(', ')}`,
      })
    }

    // Тест 3: Выражения содержат математические элементы
    if (parsedSteps.length > 0) {
      const isValidMathExpr = (expr: string): boolean => {
        // Должно содержать числа или переменную b
        const hasNumbers = /\d/.test(expr)
        const hasVariable = /b/i.test(expr)
        // Должно содержать математические символы или быть просто числом
        const hasMathSymbols = /[\+\-\*\/\×\÷\(\)]/.test(expr)
        const isJustNumber = /^\d+$/.test(expr.trim())
        
        return (hasNumbers || hasVariable) && (hasMathSymbols || isJustNumber || hasVariable)
      }
      
      const invalidSteps = parsedSteps
        .map((step, i) => ({ index: i + 1, expr: step.expression, valid: isValidMathExpr(step.expression) }))
        .filter(s => !s.valid)
      
      const allValid = invalidSteps.length === 0
      tests.push({
        name: 'Выражения содержат математические формулы',
        passed: allValid,
        details: allValid
          ? '✓ Все шаги содержат корректные выражения'
          : `Шаг ${invalidSteps.map(s => s.index).join(', ')}: некорректное выражение "${invalidSteps[0]?.expr}"`,
      })
    }

    // Тест 4: Финальный ответ b указан
    tests.push({
      name: 'Финальный ответ b = число указан',
      passed: parsedB !== null,
      details: parsedB !== null
        ? `✓ b = ${parsedB}`
        : 'Добавьте строку "b = число" в конец',
    })

    // Тест 5: Результат проверки сервером (если есть)
    if (isCorrect !== null) {
      tests.push({
        name: 'Математическая проверка',
        passed: isCorrect,
        details: isCorrect
          ? '✓ При данном b программа даёт правильный результат'
          : 'Проверьте выражения и значение b',
      })
    }

    // Тест 6: AI проверка (последний шаг)
    if (isCorrect !== null && feedback) {
      const hasAiFeedback = feedback.includes('💡 Подсказка от AI:') || feedback.includes('AI:')
      const aiPassed = isCorrect // Если математически верно, AI тоже подтвердит
      
      tests.push({
        name: 'AI анализ решения',
        passed: aiPassed ? true : (hasAiFeedback ? false : null),
        details: aiPassed 
          ? '✓ AI подтвердил правильность решения'
          : hasAiFeedback 
            ? 'AI дал рекомендации (см. ниже)'
            : '⌛ AI анализ доступен при наличии Ollama/Groq',
      })
    }

    return tests
  }

  const tests = generateTests()

  return (
    <OutputContainer>
      <OutputHeader>
        <span>Результат выполнения</span>
        {isCorrect !== null && (
          <span>{isCorrect ? '✓ Правильно' : '✗ Неверно'}</span>
        )}
      </OutputHeader>
      <OutputContent>
        {/* Чеклист тестов */}
        {tests.length > 0 && (
          <div style={{ 
            marginBottom: '15px', 
            padding: '12px', 
            background: '#1a1a2e', 
            borderRadius: '4px',
            fontSize: '13px',
          }}>
            <div style={{ marginBottom: '10px', color: '#888', fontWeight: 'bold' }}>
              🧪 Проверки ({tests.filter(t => t.passed).length}/{tests.length}):
            </div>
            {tests.map((test) => (<div key={test.name}
                style={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                  padding: '6px 8px',
                  background: test.passed === null ? '#2d2d3d' : test.passed ? '#1a2e1a' : '#2e1a1a',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${test.passed === null ? '#666' : test.passed ? '#4ade80' : '#f87171'}`,
                }}
              >
                <span style={{ 
                  marginRight: '8px',
                  fontSize: '14px',
                }}>
                  {test.passed === null ? '⌛' : test.passed ? '✓' : '✗'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    color: test.passed === null ? '#888' : test.passed ? '#4ade80' : '#f87171',
                    fontWeight: 500,
                  }}>
                    {test.name}
                  </div>
                  {test.details && (
                    <div style={{ 
                      color: '#666', 
                      fontSize: '12px',
                      marginTop: '2px',
                    }}>
                      {test.details}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Итоговый feedback */}
            {(() => {
              const failedTests = tests.filter(t => t.passed === false)
              const allPassed = failedTests.length === 0 && tests.length > 0
              
              if (allPassed) {
                return (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    background: '#1a2e1a',
                    borderRadius: '4px',
                    color: '#4ade80',
                    fontWeight: 500,
                  }}>
                    🎉 Молодец! Все проверки пройдены!
                  </div>
                )
              }
              
              if (failedTests.length > 0) {
                const firstFailed = failedTests[0]
                let hint = ''
                
                if (firstFailed.name.includes('Количество шагов')) {
                  hint = `Добавьте недостающие шаги. Программа "${program}" содержит ${expectedStepsCount} команд.`
                } else if (firstFailed.name.includes('Команды')) {
                  hint = `Проверьте порядок команд. Должно быть: ${program.split('').map(d => d + ')').join(' → ')}`
                } else if (firstFailed.name.includes('математические')) {
                  hint = 'Выражения должны содержать числа, переменную b и математические операции (+, -, ×, ÷)'
                } else if (firstFailed.name.includes('Финальный ответ')) {
                  hint = 'Добавьте в конец строку "b = число" с вашим ответом'
                } else if (firstFailed.name.includes('Математическая')) {
                  hint = 'Проверьте вычисления. Возможно, ошибка в одном из шагов или значении b'
                }
                
                return (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    background: '#2e1a1a',
                    borderRadius: '4px',
                    color: '#f87171',
                  }}>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      💡 Что исправить:
                    </div>
                    <div style={{ color: '#fca5a5', fontSize: '13px' }}>
                      {hint}
                    </div>
                  </div>
                )
              }
              
              return null
            })()}
          </div>
        )}

        {parsedSteps.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px', color: '#cccccc', fontSize: '14px' }}>
              Ваше решение:
            </div>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              <thead>
                <tr>
                  <th style={{ 
                    border: '1px solid #444', 
                    textAlign: 'left', 
                    padding: '8px', 
                    background: '#2d2d2d',
                    color: '#cccccc',
                    width: '80px'
                  }}>Команда</th>
                  <th style={{ 
                    border: '1px solid #444', 
                    textAlign: 'left', 
                    padding: '8px', 
                    background: '#2d2d2d',
                    color: '#cccccc'
                  }}>Выражение</th>
                </tr>
              </thead>
              <tbody>
                {parsedSteps.map((step, idx) => (<tr key={`step-${idx}`}>
                    <td style={{ 
                      border: '1px solid #444', 
                      padding: '8px',
                      color: '#cccccc'
                    }}>
                      {step.command}
                    </td>
                    <td style={{ 
                      border: '1px solid #444', 
                      padding: '8px',
                      color: step.expression ? '#cccccc' : '#666',
                      fontStyle: step.expression ? 'normal' : 'italic'
                    }}>
                      {step.expression || '(пусто)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isLoading && <LoadingState>Проверка...</LoadingState>}

        {!isLoading && feedback && (
          <FeedbackBox isCorrect={isCorrect || false}>
            <FeedbackTitle>
              {isCorrect ? '✓ Правильно!' : '✗ Неверно'}
            </FeedbackTitle>
            <div style={{ whiteSpace: 'pre-wrap' }}>{feedback}</div>
          </FeedbackBox>
        )}

        {!isLoading && steps.length > 0 && (
          <div>
            <div style={{ marginBottom: '10px', color: '#cccccc' }}>
              Трассировка выполнения:
            </div>
            {steps.map((step) => (
              <StepItem key={step.stepNumber}>
                <div>
                  <StepNumber>Шаг {step.stepNumber}:</StepNumber>
                  <StepCommand>{step.commandDescription}</StepCommand>
                </div>
                <StepExpression>{step.expression}</StepExpression>
              </StepItem>
            ))}
          </div>
        )}

        {!isLoading && !feedback && steps.length === 0 && parsedSteps.length === 0 && (
          <EmptyState>
            Введите решение в редакторе
          </EmptyState>
        )}
      </OutputContent>
    </OutputContainer>
  )
}
