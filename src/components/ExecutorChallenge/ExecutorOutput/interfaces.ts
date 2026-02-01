export interface ExecutionStep {
  stepNumber: number
  commandKey: string
  commandDescription: string
  expression: string
  value: number
}

export interface ExecutorOutputProps {
  steps: ExecutionStep[]
  isCorrect: boolean | null
  feedback: string | null
  isLoading?: boolean
  onSubmit?: () => void
  canSubmit?: boolean
  code?: string
}
