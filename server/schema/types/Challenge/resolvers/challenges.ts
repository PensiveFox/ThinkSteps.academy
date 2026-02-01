import { builder } from '../../../builder'
import { ChallengeWhereInput, ChallengeOrderByInput } from '../inputs'

builder.queryField('challenges', (t) =>
  t.prismaField({
    type: ['Challenge'],
    args: {
      where: t.arg({ type: ChallengeWhereInput }),
      orderBy: t.arg({ type: ChallengeOrderByInput }),
      skip: t.arg.int(),
      take: t.arg.int(),
    },
    resolve: async (query, _root, args, ctx) => {
      const where: Record<string, unknown> = {}

      if (args.where?.subject) {
        where.subject = args.where.subject
      }
      if (args.where?.challengeType) {
        where.challengeType = args.where.challengeType
      }
      if (args.where?.difficulty) {
        where.difficulty = args.where.difficulty
      }
      if (args.where?.isPublished !== undefined) {
        where.isPublished = args.where.isPublished
      }

      return ctx.prisma.challenge.findMany({
        ...query,
        where,
        skip: args.skip ?? undefined,
        take: args.take ?? undefined,
        orderBy: args.orderBy?.createdAt
          ? { createdAt: args.orderBy.createdAt }
          : args.orderBy?.difficulty
            ? { difficulty: args.orderBy.difficulty }
            : { createdAt: 'desc' },
      })
    },
  }),
)
