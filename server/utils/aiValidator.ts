/**
 * AI-валидатор для сравнения решений пользователя с правильными ответами
 * Использует бесплатную AI модель для генерации детального feedback
 */

interface AIValidationInput {
  userSolution: string
  expectedSolution: string
  problemDescription: string
  userSteps?: Array<{ command: string; expression: string }>
  expectedSteps?: Array<{ command: string; expression: string }>
}

interface AIValidationResult {
  isCorrect: boolean
  feedback: string
  suggestions?: string[]
}

/**
 * Сравнивает решение пользователя с правильным используя AI
 */
export async function validateWithAI(
  input: AIValidationInput,
): Promise<AIValidationResult> {
  const { userSolution, expectedSolution, problemDescription, userSteps, expectedSteps } = input

  // Формируем промпт для AI
  const prompt = `Ты - преподаватель информатики. Проверь решение ученика.

ЗАДАЧА:
${problemDescription}

ПРАВИЛЬНОЕ РЕШЕНИЕ:
${expectedSolution}

РЕШЕНИЕ УЧЕНИКА:
${userSolution}

${userSteps && expectedSteps ? `
ПОШАГОВОЕ СРАВНЕНИЕ:
Ожидаемые шаги:
${expectedSteps.map((s, i) => `${i + 1}. ${s.command} ${s.expression}`).join('\n')}

Шаги ученика:
${userSteps.map((s, i) => `${i + 1}. ${s.command} ${s.expression}`).join('\n')}
` : ''}

Проанализируй решение и дай конструктивный feedback:
1. Правильно ли решение? (да/нет)
2. Если неправильно - на каком шаге ошибка?
3. Что именно неправильно?
4. Подсказка как исправить (не давай прямой ответ)

Формат ответа (JSON):
{
  "isCorrect": true/false,
  "feedback": "детальное объяснение",
  "suggestions": ["подсказка 1", "подсказка 2"]
}`

  try {
    // Приоритет 1: Ollama (локальная модель, бесплатно)
    const USE_OLLAMA = process.env.USE_OLLAMA !== 'false' // По умолчанию включено
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
    
    if (USE_OLLAMA) {
      try {
        const ollamaResponse = await fetch(`${OLLAMA_URL}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3.2:3b', // Быстрая локальная модель
            prompt: `Ты - опытный преподаватель информатики. Проверяй решения учеников и давай конструктивный feedback.\n\n${prompt}`,
            stream: false,
            options: {
              temperature: 0.3,
              num_predict: 500,
            },
          }),
        })

        if (ollamaResponse.ok) {
          const ollamaData = await ollamaResponse.json()
          const aiResponse = ollamaData.response

          // Парсим JSON ответ от AI
          try {
            const parsed = JSON.parse(aiResponse)
            return {
              isCorrect: parsed.isCorrect,
              feedback: parsed.feedback,
              suggestions: parsed.suggestions,
            }
          } catch {
            // Если AI не вернул JSON, используем текст как feedback
            return {
              isCorrect: false,
              feedback: aiResponse,
            }
          }
        }
      } catch (ollamaError) {
        console.warn('Ollama не доступен, пробуем Groq API:', ollamaError)
      }
    }

    // Приоритет 2: Groq API (бесплатный облачный)
    const GROQ_API_KEY = process.env.GROQ_API_KEY
    
    if (GROQ_API_KEY) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Ты - опытный преподаватель информатики. Проверяй решения учеников и давай конструктивный feedback.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0]?.message?.content

      if (!aiResponse) {
        throw new Error('Empty AI response')
      }

      // Парсим JSON ответ от AI
      try {
        const parsed = JSON.parse(aiResponse)
        return {
          isCorrect: parsed.isCorrect,
          feedback: parsed.feedback,
          suggestions: parsed.suggestions,
        }
      } catch {
        // Если AI не вернул JSON, используем текст как feedback
        return {
          isCorrect: false,
          feedback: aiResponse,
        }
      }
    }
    
    // Если ни Ollama, ни Groq не доступны
    return {
      isCorrect: false,
      feedback: 'AI-валидация не настроена. Установите Ollama или добавьте GROQ_API_KEY.',
    }
  } catch (error) {
    console.error('AI validation error:', error)
    return {
      isCorrect: false,
      feedback: 'Ошибка AI-валидации. Используется базовая проверка.',
    }
  }
}

/**
 * Генерирует подсказку для пользователя используя AI
 */
export async function generateHint(
  problemDescription: string,
  userAttempt: string,
  stepNumber?: number,
): Promise<string> {
  const prompt = `Ты - преподаватель. Ученик застрял на задаче.

ЗАДАЧА:
${problemDescription}

ПОПЫТКА УЧЕНИКА:
${userAttempt}

${stepNumber ? `Ошибка на шаге ${stepNumber}` : ''}

Дай короткую подсказку (1-2 предложения), которая направит ученика в правильную сторону, но не даст прямой ответ.`

  try {
    // Используем Ollama для генерации подсказки
    const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
    
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:3b',
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 150,
        },
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.response || 'Проверьте последовательность команд и правильность вычислений на каждом шаге.'
    }
    
    return 'Проверьте последовательность команд и правильность вычислений на каждом шаге.'
  } catch (error) {
    console.error('Hint generation error:', error)
    return 'Попробуйте еще раз, внимательно следуя примеру.'
  }
}
