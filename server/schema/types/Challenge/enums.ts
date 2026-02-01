import { builder } from '../../builder'
import {
  Subject,
  DifficultyLevel,
  ValidationMode,
  ValidationType,
  ChallengeCompletionStatus,
} from '@prisma/client'

// Subject enum
export const SubjectEnum = builder.enumType('Subject', {
  values: Object.values(Subject),
})

// DifficultyLevel enum
export const DifficultyLevelEnum = builder.enumType('DifficultyLevel', {
  values: Object.values(DifficultyLevel),
})

// ValidationMode enum
export const ValidationModeEnum = builder.enumType('ValidationMode', {
  values: Object.values(ValidationMode),
})

// ValidationType enum
export const ValidationTypeEnum = builder.enumType('ValidationType', {
  values: Object.values(ValidationType),
})

// ChallengeCompletionStatus enum
export const ChallengeCompletionStatusEnum = builder.enumType(
  'ChallengeCompletionStatus',
  {
    values: Object.values(ChallengeCompletionStatus),
  },
)
