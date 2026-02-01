import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function upsertUserByUsername(args: {
  username: string
  passwordPlain?: string
  sudo?: boolean
  data?: unknown
}) {
  const hashedPassword =
    typeof args.passwordPlain === 'string'
      ? await bcrypt.hash(args.passwordPlain, 10)
      : undefined

  return prisma.user.upsert({
    where: { username: args.username },
    update: {
      sudo: args.sudo ?? undefined,
      password: hashedPassword,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: args.data as any,
    },
    create: {
      username: args.username,
      sudo: args.sudo ?? false,
      password: hashedPassword,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: args.data as any,
    },
  })
}

async function main() {
  // eslint-disable-next-line no-console
  console.log('Start seeding ...')

  const password = process.env.SUDO_PASSWORD
  if (password) {
    const user = await upsertUserByUsername({
      username: 'admin',
      passwordPlain: password,
      sudo: true,
    })

    // eslint-disable-next-line no-console
    console.log(`Ensured admin user with id: ${user.id}`)
  }

  const MAIN_AI_AGENT_USERNAME = process.env.MAIN_AI_AGENT_USERNAME
  if (MAIN_AI_AGENT_USERNAME) {
    const user = await upsertUserByUsername({
      username: MAIN_AI_AGENT_USERNAME,
      passwordPlain: '',
      sudo: false,
      data: {
        aiAgentPrompt: process.env.MAIN_AI_AGENT_PROMPT ?? '',
      },
    })

    // eslint-disable-next-line no-console
    console.log(`Ensured AI agent user with id: ${user.id}`)
  }

  // Seed Challenge 09: Executor Find B
  if (password) {
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    })

    if (adminUser) {
      let challenge = await prisma.challenge.findFirst({
        where: { externalId: 'executor-find-b-01' },
      })

      if (!challenge) {
        challenge = await prisma.challenge.create({
          data: {
            externalId: 'executor-find-b-01',
            name: 'Исполнитель «Вычислитель»: найти b',
            description:
              'Даны команды исполнителя и программа. Известно, что программа переводит число start в target. Найдите b.',
            instructions:
              'У исполнителя «Вычислитель» две команды:\n1: умножить на 4\n2: вычесть b\n\nПрограмма: 21122\nНачальное значение: 4\nКонечное значение: 28\n\nНайдите значение b.',
            subject: 'Informatics',
            challengeType: 'Executor',
            difficulty: 'Elementary',
            estimatedTime: 5,
            maxScore: 100,
            isPublished: true,
            isOfficial: true,
            validationMode: 'Strict',
            content: {
              subtype: 'find_b',
              executor: {
                name: 'Вычислитель',
                commands: {
                  '1': { op: 'mul', k: 4 },
                  '2': { op: 'sub', var: 'b' },
                },
              },
              unknowns: {
                b: { type: 'natural' },
              },
              program: '21122',
              start: 4,
              target: 28,
              videoUrl: 'https://www.youtube.com/embed/2er45TxYgNQ?start=1',
            },
            createdById: adminUser.id,
          },
        })
      }

      const existingStep = await prisma.challengeStep.findFirst({
        where: {
          challengeId: challenge.id,
          order: 1,
        },
      })

      if (!existingStep) {
        await prisma.challengeStep.create({
          data: {
            challengeId: challenge.id,
            order: 1,
            title: 'Найдите b',
            description:
              'Определите значение переменной b, при котором программа переводит число 4 в число 28.',
            validationType: 'Exact',
            maxScore: 100,
            validation: {
              type: 'executor_find_b',
              expectedVar: 'b',
              program: '21122',
              start: 4,
              target: 28,
              commands: {
                '1': { op: 'mul', k: 4 },
                '2': { op: 'sub', var: 'b' },
              },
              constraints: {
                b: { type: 'natural' },
              },
            },
          },
        })
      }

      // eslint-disable-next-line no-console
      console.log(`Seeded Challenge: ${challenge.name} (${challenge.id})`)
    }
  }

  // eslint-disable-next-line no-console
  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
