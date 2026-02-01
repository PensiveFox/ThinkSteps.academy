export interface Command {
  op: 'mul' | 'add' | 'sub' | 'div'
  k?: number
  var?: string
}

export interface ExecutorTheoryProps {
  executorName: string
  commands: Record<string, Command>
  program: string
  start: number
  target: number
  unknowns?: Record<string, unknown>
  description?: string
  instructions?: string
  videoUrl?: string
  onSubmit?: () => void
  canSubmit?: boolean
  isLoading?: boolean
}
