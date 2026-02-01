import { builder } from '../../../builder'
import { GraphQLError } from 'graphql'

builder.mutationField('startChallenge', (t) =>
  t.prismaField({
    type: 'ChallengeCompletion',
    args: {
      challengeId: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      if (!ctx.currentUser) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const challenge = await ctx.prisma.challenge.findUnique({
        where: { id: args.challengeId },
      })

      if (!challenge) {
        throw new GraphQLError('Challenge not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      if (!challenge.isPublished) {
        throw new GraphQLError('Challenge is not published', {
          extensions: { code: 'FORBIDDEN' },
        })
      }

      const existingCompletion = await ctx.prisma.challengeCompletion.findUnique(
        {
          where: {
            challengeId_userId: {
              challengeId: args.challengeId,
              userId: ctx.currentUser.id,
            },
          },
        },
      )

      if (existingCompletion) {
        return existingCompletion
      }

      return ctx.prisma.challengeCompletion.create({
        ...query,
        data: {
          challengeId: args.challengeId,
          userId: ctx.currentUser.id,
          status: 'InProgress',
          startedAt: new Date(),
          score: 0,
          maxScore: challenge.maxScore,
        },
      })
    },
  }),
)
