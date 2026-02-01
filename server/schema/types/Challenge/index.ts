import { builder } from '../../builder'

// Import enums first (before inputs that depend on them)
import './enums'

// Import inputs
import './inputs'

// Import resolvers
import './resolvers/challenge'
import './resolvers/challenges'
import './resolvers/startChallenge'
import './resolvers/submitChallengeStep'

// Export all types
export * from './enums'
export * from './inputs'

// Import enums for use in object types
import {
  SubjectEnum,
  DifficultyLevelEnum,
  ValidationTypeEnum,
  ChallengeCompletionStatusEnum,
} from './enums'

// Challenge object type
builder.prismaObject('Challenge', {
  fields: (t) => ({
    id: t.exposeID('id'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    subject: t.field({
      type: SubjectEnum,
      resolve: (parent) => parent.subject,
    }),
    challengeType: t.exposeString('challengeType'),
    difficulty: t.field({
      type: DifficultyLevelEnum,
      resolve: (parent) => parent.difficulty,
    }),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    instructions: t.exposeString('instructions', { nullable: true }),
    content: t.expose('content', { type: 'Json' }),
    isPublished: t.exposeBoolean('isPublished'),
    steps: t.relation('steps'),
    Completions: t.relation('Completions'),
  }),
})

// ChallengeStep object type
builder.prismaObject('ChallengeStep', {
  fields: (t) => ({
    id: t.exposeID('id'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    challengeId: t.exposeID('challengeId'),
    order: t.exposeInt('order'),
    title: t.exposeString('title'),
    description: t.exposeString('description'),
    validationType: t.field({
      type: ValidationTypeEnum,
      resolve: (parent) => parent.validationType,
    }),
    validation: t.expose('validation', { type: 'Json' }),
    maxScore: t.exposeInt('maxScore'),
    Challenge: t.relation('Challenge'),
    StepCompletions: t.relation('StepCompletions'),
  }),
})

// ChallengeCompletion object type
builder.prismaObject('ChallengeCompletion', {
  fields: (t) => ({
    id: t.exposeID('id'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    challengeId: t.exposeID('challengeId'),
    userId: t.exposeID('userId'),
    status: t.field({
      type: ChallengeCompletionStatusEnum,
      resolve: (parent) => parent.status,
    }),
    startedAt: t.expose('startedAt', { type: 'DateTime' }),
    completedAt: t.expose('completedAt', { type: 'DateTime', nullable: true }),
    score: t.exposeInt('score'),
    maxScore: t.exposeInt('maxScore'),
    Challenge: t.relation('Challenge'),
    User: t.relation('User'),
    StepCompletions: t.relation('StepCompletions'),
  }),
})

// StepCompletion object type
builder.prismaObject('StepCompletion', {
  fields: (t) => ({
    id: t.exposeID('id'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
    completionId: t.exposeID('completionId'),
    stepId: t.exposeID('stepId'),
    isCorrect: t.exposeBoolean('isCorrect'),
    answer: t.expose('answer', { type: 'Json', nullable: true }),
    feedback: t.exposeString('feedback', { nullable: true }),
    score: t.exposeInt('score'),
    attempts: t.exposeInt('attempts'),
    Completion: t.relation('Completion'),
    Step: t.relation('Step'),
  }),
})
