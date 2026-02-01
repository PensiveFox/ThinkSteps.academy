import { builder } from '../../builder'
import { SortOrder } from '../common'
import { SubjectEnum, DifficultyLevelEnum } from './enums'

export const ChallengeWhereUniqueInput = builder.inputType(
  'ChallengeWhereUniqueInput',
  {
    fields: (t) => ({
      id: t.string(),
    }),
  },
)

export const ChallengeWhereInput = builder.inputType('ChallengeWhereInput', {
  fields: (t) => ({
    subject: t.field({ type: SubjectEnum }),
    challengeType: t.string(),
    difficulty: t.field({ type: DifficultyLevelEnum }),
    isPublished: t.boolean(),
  }),
})

export const ChallengeOrderByInput = builder.inputType(
  'ChallengeOrderByInput',
  {
    fields: (t) => ({
      createdAt: t.field({ type: SortOrder }),
      difficulty: t.field({ type: SortOrder }),
    }),
  },
)

export const SubmitChallengeStepInput = builder.inputType(
  'SubmitChallengeStepInput',
  {
    fields: (t) => ({
      challengeId: t.string({ required: true }),
      order: t.int({ required: true }),
      answer: t.field({ type: 'Json', required: true }),
    }),
  },
)

export const StepCompletionPayload = builder.simpleObject(
  'StepCompletionPayload',
  {
    fields: (t) => ({
      isCorrect: t.boolean(),
      feedback: t.string({ nullable: true }),
      score: t.int(),
      attempts: t.int(),
      trace: t.field({ type: 'Json', nullable: true }),
    }),
  },
)
