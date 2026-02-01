import { builder } from '../../../builder'
import { ChallengeWhereUniqueInput } from '../inputs'

builder.queryField('challenge', (t) =>
  t.prismaField({
    type: 'Challenge',
    nullable: true,
    args: {
      where: t.arg({ type: ChallengeWhereUniqueInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      if (!args.where.id) {
        return null
      }

      return ctx.prisma.challenge.findUnique({
        ...query,
        where: { id: args.where.id },
      })
    },
  }),
)
