export interface Command {
  op: 'mul' | 'add' | 'sub' | 'div'
  k?: number
  var?: string
}

export interface Executor {
  name: string
  commands: Record<string, Command>
  start?: number
  target?: number
}

export interface ChallengeContent {
  executor?: Executor
  program?: string
  start?: number
  target?: number
  unknowns?: Record<string, unknown>
  videoUrl?: string
}

export interface ExecutionStep {
  stepNumber: number
  commandKey: string
  commandDescription: string
  expression: string
  value: number
}

export interface ExecutorChallengeProps {
  content: ChallengeContent
  description?: string
  instructions?: string
  onSubmit: (answer: { 
    b: number
    steps?: Array<{ command: string; expression: string }>
  }) => Promise<{
    isCorrect: boolean
    feedback: string
    trace?: ExecutionStep[]
  }>
}
