import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /admin/strategy
export async function getStrategy() {
  return prisma.strategyConfig.findFirst({
    where: { teacherId: null } // Global strategy
  })
}

// GET /admin/strategies - все стратегии
export async function getAllStrategies() {
  return prisma.strategyConfig.findMany({
    include: {
      teacher: { select: { id: true, fullname: true, email: true } },
      usersUsingStrategy: { select: { id: true, fullname: true } }
    }
  })
}

// POST /admin/strategy - создать новую стратегию
export async function createStrategy(data: {
  name: string
  teacherId?: string
  evaluationOrder: string[]
  stableThreshold?: number
  masteredThreshold?: number
  weakeningThreshold?: number
  reviewDelayDays?: number
}) {
  return prisma.strategyConfig.create({
    data
  })
}

// PATCH /admin/strategy
export async function updateStrategy(data: {
  id: string
  evaluationOrder: string[]
  stableThreshold?: number
  masteredThreshold?: number
  weakeningThreshold?: number
  reviewDelayDays?: number
}) {
  return prisma.strategyConfig.update({
    where: { id: data.id },
    data: {
      evaluationOrder: data.evaluationOrder,
      stableThreshold: data.stableThreshold,
      masteredThreshold: data.masteredThreshold,
      weakeningThreshold: data.weakeningThreshold,
      reviewDelayDays: data.reviewDelayDays
    }
  })
}

// PATCH /admin/skills/order
export async function updateSkillsOrder(data: Array<{ id: string; order: number }>) {
  return prisma.$transaction(
    data.map(skill =>
      prisma.skill.update({
        where: { id: skill.id },
        data: { order: skill.order }
      })
    )
  )
}

// GET /admin/skills (for drag & drop)
export async function getSkills() {
  return prisma.skill.findMany({
    orderBy: { order: 'asc' }
  })
}

// GET /admin/logs (engine decision logging)
export async function getEngineLogs(userId?: string, limit = 100) {
  return prisma.engineLog.findMany({
    where: userId ? { userId } : {},
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

// PATCH /admin/users/{userId}/strategy - назначить стратегию пользователю
export async function assignUserStrategy(userId: string, strategyId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { strategyId }
  })
}

// PATCH /admin/users/{userId}/teacher - назначить учителя
export async function assignUserTeacher(userId: string, teacherId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { teacherId }
  })
}
