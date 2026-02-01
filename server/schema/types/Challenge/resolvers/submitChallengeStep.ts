import { builder } from '../../../builder'
import { SubmitChallengeStepInput, StepCompletionPayload } from '../inputs'
import { GraphQLError } from 'graphql'
import { Prisma } from '@prisma/client'
import { 
  validateExecutorFindB,
  ExecutorFindBValidation,
  ExecutorFindBAnswer,
} from '../../../../validators/executor/validateExecutorFindB'

builder.mutationField('submitChallengeStep', (t) =>
  t.field({
    type: StepCompletionPayload,
    args: {
      input: t.arg({ type: SubmitChallengeStepInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.currentUser) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const { challengeId, order, answer } = args.input

      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: challengeId },
        include: {
          steps: {
            where: { order },
          },
        },
      })

      if (!challenge) {
        throw new GraphQLError('Challenge not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      const step = challenge.steps[0]
      if (!step) {
        throw new GraphQLError('Step not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      const completion = await ctx.prisma.challengeCompletion.findUnique({
        where: {
          challengeId_userId: {
            challengeId,
            userId: ctx.currentUser.id,
          },
        },
        include: {
          StepCompletions: {
            where: { stepId: step.id },
          },
        },
      })

      if (!completion) {
        throw new GraphQLError('Challenge not started', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const existingStepCompletion = completion.StepCompletions[0]

      // Временно отключено для тестирования валидатора
      // if (existingStepCompletion?.isCorrect) {
      //   return {
      //     isCorrect: true,
      //     feedback: 'Already completed',
      //     score: existingStepCompletion.score,
      //     attempts: existingStepCompletion.attempts,
      //   }
      // }

      const currentAttempts = existingStepCompletion?.attempts ?? 0

      // Прямой вызов валидатора без dispatcher
      const validationResult = await validateExecutorFindB({
        validation: step.validation as unknown as ExecutorFindBValidation,
        answer: answer as unknown as ExecutorFindBAnswer,
      })

      const newAttempts = currentAttempts + 1

      if (existingStepCompletion) {
        await ctx.prisma.stepCompletion.update({
          where: { id: existingStepCompletion.id },
          data: {
            isCorrect: validationResult.isCorrect,
            answer: answer as Prisma.InputJsonValue,
            feedback: validationResult.feedback,
            score: validationResult.isCorrect ? validationResult.score : 0,
            attempts: newAttempts,
          },
        })
      } else {
        await ctx.prisma.stepCompletion.create({
          data: {
            completionId: completion.id,
            stepId: step.id,
            isCorrect: validationResult.isCorrect,
            answer: answer as Prisma.InputJsonValue,
            feedback: validationResult.feedback,
            score: validationResult.isCorrect ? validationResult.score : 0,
            attempts: newAttempts,
          },
        })
      }

      if (validationResult.isCorrect) {
        const allSteps = await ctx.prisma.challengeStep.findMany({
          where: { challengeId },
          orderBy: { order: 'asc' },
        })

        const allStepCompletions = await ctx.prisma.stepCompletion.findMany({
          where: {
            completionId: completion.id,
            isCorrect: true,
          },
        })

        const allCompleted = allSteps.length === allStepCompletions.length

        if (allCompleted) {
          const totalScore = allStepCompletions.reduce(
            (sum, sc) => sum + sc.score,
            0,
          )

          await ctx.prisma.challengeCompletion.update({
            where: { id: completion.id },
            data: {
              status: 'Completed',
              completedAt: new Date(),
              score: totalScore,
            },
          })
        }
      }

      return {
        isCorrect: validationResult.isCorrect,
        feedback: validationResult.feedback ?? null,
        score: validationResult.isCorrect ? validationResult.score : 0,
        attempts: newAttempts,
        trace: validationResult.trace ?? null,
      }
    },
  }),
)
