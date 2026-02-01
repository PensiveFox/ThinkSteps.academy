import { ValidationType } from '@prisma/client'
import { validateExecutorFindB } from './executor/validateExecutorFindB'

export interface ValidationInput {
  validationType: ValidationType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validation: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answer: any
  challengeType: string
}

export interface ValidationResult {
  isCorrect: boolean
  feedback?: string
  score: number
  trace?: any
}

export async function validateStep(
  input: ValidationInput,
): Promise<ValidationResult> {
  const { validationType, validation, answer } = input

  switch (validationType) {
    case 'Exact':
    case 'Numeric':
      if (validation.type === 'executor_find_b') {
        return validateExecutorFindB({ validation, answer })
      }
      throw new Error(
        `Unknown validation type for ${validationType}: ${validation.type}`,
      )

    case 'TestCases':
    case 'Pattern':
    case 'AICheck':
    case 'PeerReview':
      throw new Error(`Validation type ${validationType} not yet implemented`)

    default:
      throw new Error(`Unknown validation type: ${validationType}`)
  }
}
