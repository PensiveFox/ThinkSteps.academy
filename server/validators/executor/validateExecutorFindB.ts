import { ValidationResult } from '../validateStep'
import { validateWithAI } from '../../utils/aiValidator'

export interface ExecutorFindBValidation {
  type: 'executor_find_b'
  expectedVar: string
  program: string
  start: number
  target: number
  commands: Record<string, { op: string; k?: number; var?: string }>
  constraints?: Record<string, { type: string }>
  expectedTrace?: string[]
}

export interface ExecutorFindBAnswer {
  b: number
  trace?: string[]
  steps?: Array<{ command: string; expression: string }>
}

interface ExecutionStep {
  stepNumber: number
  commandKey: string
  commandDescription: string
  expression: string
  value: number
}

function buildSymbolicExpression(
  expr: string,
  op: string,
  value: string,
): string {
  const needsParens = expr.includes('+') || expr.includes('-')
  const leftSide = needsParens ? `(${expr})` : expr

  switch (op) {
    case 'add':
      return `${leftSide} + ${value}`
    case 'sub':
      return `${leftSide} - ${value}`
    case 'mul':
      return `${leftSide} * ${value}`
    case 'div':
      return `${leftSide} / ${value}`
    default:
      return expr
  }
}

function simplifyExpression(expr: string, bValue: number): string {
  try {
    const result = eval(expr.replace(/b/g, String(bValue)))
    return String(result)
  } catch {
    return expr
  }
}

function normalizeExpression(expr: string): string {
  return expr
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/(\d)([a-z])/gi, '$1*$2')  // 2b -> 2*b
    .replace(/([a-z])(\d)/gi, '$1*$2')  // b2 -> b*2
    .replace(/\)(\d)/g, ')*$1')         // )2 -> )*2
    .replace(/(\d)\(/g, '$1*(')         // 2( -> 2*(
    .replace(/\)([a-z])/gi, ')*$1')     // )b -> )*b
    .replace(/([a-z])\(/gi, '$1*(')     // b( -> b*(
    .toLowerCase()
}

function evaluateExpression(expr: string, bValue: number): number | null {
  try {
    // Заменяем b на значение и вычисляем
    const normalized = normalizeExpression(expr)
    const withValue = normalized.replace(/b/g, String(bValue))
    // eslint-disable-next-line no-eval
    const result = eval(withValue)
    return typeof result === 'number' && isFinite(result) ? result : null
  } catch {
    return null
  }
}

function areExpressionsEquivalent(
  expr1: string,
  expr2: string,
  bValue: number,
): boolean {
  // Сначала пробуем точное совпадение после нормализации
  const norm1 = normalizeExpression(expr1)
  const norm2 = normalizeExpression(expr2)
  
  if (norm1 === norm2) {
    return true
  }
  
  // Если строки не совпадают, сравниваем вычисленные значения
  const val1 = evaluateExpression(expr1, bValue)
  const val2 = evaluateExpression(expr2, bValue)
  
  if (val1 === null || val2 === null) {
    return false
  }
  
  // Сравниваем с небольшой погрешностью для чисел с плавающей точкой
  return Math.abs(val1 - val2) < 0.0001
}

async function validateStepByStep(
  userSteps: Array<{ command: string; expression: string }>,
  program: string,
  start: number,
  commands: Record<string, { op: string; k?: number; var?: string }>,
  expectedVar: string,
): Promise<{ isValid: boolean; errorStep?: number; errorMessage?: string; allErrors?: string[] }> {
  const errors: string[] = []
  
  if (userSteps.length !== program.length) {
    return {
      isValid: false,
      errorStep: userSteps.length + 1,
      errorMessage: `Неверное количество шагов. Ожидается ${program.length}, получено ${userSteps.length}`,
      allErrors: [`Неверное количество шагов. Ожидается ${program.length}, получено ${userSteps.length}`],
    }
  }

  let symbolicExpr = String(start)

  // Проверяем ВСЕ шаги и собираем ВСЕ ошибки
  for (let i = 0; i < program.length; i++) {
    const digit = program[i]
    const command = commands[digit]
    const userStep = userSteps[i]

    if (!command) {
      errors.push(`Шаг ${i + 1}: Некорректные данные задания - команда ${digit} не найдена`)
      continue
    }

    // Проверяем номер команды
    if (userStep.command !== digit + ')') {
      errors.push(`Шаг ${i + 1}: ❌ Неправильная команда. Ожидается: ${digit}), получено: ${userStep.command}`)
    }

    // Строим ожидаемое выражение
    const isVar = !!command.var
    const symbolicValue = isVar ? expectedVar : String(command.k)
    symbolicExpr = buildSymbolicExpression(symbolicExpr, command.op, symbolicValue)

    // Проверяем математическую эквивалентность выражений
    const testValues = [1, 2, 3, 5, 10]
    const isEquivalent = testValues.every(testB => 
      areExpressionsEquivalent(userStep.expression, symbolicExpr, testB)
    )

    if (!isEquivalent) {
      errors.push(`Шаг ${i + 1}: ❌ Неверное выражение\n  Ожидается: ${symbolicExpr}\n  Получено: ${userStep.expression}\n  💡 Подсказка: Проверьте правильность применения команды ${digit}`)
    }
  }

  if (errors.length > 0) {
    const errorMessage = `Найдено ошибок: ${errors.length}\n\n` + errors.join('\n\n')
    
    return {
      isValid: false,
      errorStep: 1,
      errorMessage,
      allErrors: errors,
    }
  }

  return { isValid: true }
}

export async function validateExecutorFindB(input: {
  validation: ExecutorFindBValidation
  answer: ExecutorFindBAnswer
}): Promise<ValidationResult> {
  const { validation, answer } = input

  if (typeof answer?.b !== 'number') {
    return {
      isCorrect: false,
      feedback: 'Ответ должен содержать число b',
      score: 0,
    }
  }

  const { expectedVar, program, start, target, commands, constraints, expectedTrace } =
    validation

    // Пошаговая проверка решения пользователя
  if (answer.steps && answer.steps.length > 0) {
    const stepValidation = await validateStepByStep(
      answer.steps,
      program,
      start,
      commands,
      expectedVar,
    )

    if (!stepValidation.isValid) {
      return {
        isCorrect: false,
        feedback: stepValidation.errorMessage || 'Ошибка в пошаговом решении',
        score: 0,
      }
    }
  }

  if (constraints?.[expectedVar]?.type === 'natural' && answer.b <= 0) {
    return {
      isCorrect: false,
      feedback: 'b должно быть натуральным числом (больше 0)',
      score: 0,
    }
  }

  if (!Number.isInteger(answer.b)) {
    return {
      isCorrect: false,
      feedback: 'b должно быть целым числом',
      score: 0,
    }
  }

  let current = start
  let symbolicExpr = String(start)
  const trace: ExecutionStep[] = []

  for (let i = 0; i < program.length; i++) {
    const digit = program[i]
    const command = commands[digit]
    if (!command) {
      return {
        isCorrect: false,
        feedback: `Некорректные данные задания: команда ${digit} не найдена`,
        score: 0,
      }
    }

    const isVar = !!command.var
    const value = isVar ? answer.b : command.k
    const symbolicValue = isVar ? expectedVar : String(command.k)

    if (value === undefined) {
      return {
        isCorrect: false,
        feedback: `Некорректные данные задания: отсутствует значение для команды ${digit}`,
        score: 0,
      }
    }

    const opDescriptions: Record<string, string> = {
      add: isVar ? `прибавить ${expectedVar}` : `прибавить ${command.k}`,
      sub: isVar ? `вычесть ${expectedVar}` : `вычесть ${command.k}`,
      mul: isVar ? `умножить на ${expectedVar}` : `умножить на ${command.k}`,
      div: isVar ? `разделить на ${expectedVar}` : `разделить на ${command.k}`,
    }

    symbolicExpr = buildSymbolicExpression(
      symbolicExpr,
      command.op,
      symbolicValue,
    )

    switch (command.op) {
      case 'add':
        current += value
        break
      case 'sub':
        current -= value
        break
      case 'mul':
        current *= value
        break
      case 'div':
        if (value === 0) {
          return {
            isCorrect: false,
            feedback: `При b=${answer.b} происходит деление на ноль`,
            score: 0,
          }
        }
        current = Math.floor(current / value)
        break
      default:
        return {
          isCorrect: false,
          feedback: `Неизвестная операция: ${command.op}`,
          score: 0,
        }
    }

    const simplified = simplifyExpression(symbolicExpr, answer.b)
    trace.push({
      stepNumber: i + 1,
      commandKey: digit,
      commandDescription: opDescriptions[command.op] || command.op,
      expression: `x = ${symbolicExpr}${simplified !== symbolicExpr ? ` = ${simplified}` : ''}`,
      value: current,
    })
  }

  const isCorrect = current === target
  
  
  if (isCorrect) {
      } else {
      }

  if (expectedTrace && answer.trace) {
    const traceMatches = trace.every((step, idx) => {
      const expected = expectedTrace[idx]
      return expected && step.expression.includes(expected)
    })

    if (!traceMatches) {
      const traceText = trace
        .map(s => `${s.stepNumber}) ${s.commandDescription}: ${s.expression}`)
        .join('\n')

      return {
        isCorrect: false,
        feedback: `Трассировка выполнения не совпадает с ожидаемой.\n\nВаша трассировка:\n${traceText}`,
        score: 0,
        trace,
      }
    }
  }

  const traceText = trace
    .map(s => `${s.stepNumber}) ${s.commandDescription}: ${s.expression}`)
    .join('\n')

  if (!isCorrect) {
    const baseFeedback = `Неверно. При b=${answer.b} получается ${current}, нужно ${target}\n\nТрассировка выполнения:\n${traceText}`

    // Пробуем получить AI-enhanced feedback (опционально)
    try {
      const aiResult = await validateWithAI({
        userSolution: `b = ${answer.b}`,
        expectedSolution: `Программа ${program} переводит ${start} в ${target}`,
        problemDescription: `Исполнитель "Вычислитель" имеет команды:\n${Object.entries(commands).map(([k, v]) => `${k}: ${v.op} ${v.k || v.var}`).join('\n')}\n\nПрограмма: ${program}\nНачальное значение: ${start}\nКонечное значение: ${target}\n\nНайти значение переменной ${expectedVar}`,
        userSteps: answer.steps,
      })

      if (aiResult.feedback && !aiResult.feedback.includes('не настроена')) {
        return {
          isCorrect: false,
          feedback: `${baseFeedback}\n\n💡 Подсказка от AI:\n${aiResult.feedback}`,
          score: 0,
          trace,
        }
      }
    } catch (aiError) {
      console.warn('[validateExecutorFindB] AI validation failed, using base feedback:', aiError)
    }

    return {
      isCorrect: false,
      feedback: baseFeedback,
      score: 0,
      trace,
    }
  }

  return {
    isCorrect: true,
    feedback: `Верно: b=${answer.b}\n\nТрассировка выполнения:\n${traceText}`,
    score: 100,
    trace,
  }
}
