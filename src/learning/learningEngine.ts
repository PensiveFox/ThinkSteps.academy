import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 🧠 State machine resolver
export function resolveState(progress: any, strategy: any): 'NEW' | 'LEARNING' | 'STABLE' | 'WEAKENING' | 'MASTERED' {
  const now = new Date()

  const overdue =
    progress.nextReviewAt &&
    progress.nextReviewAt < now

  if (progress.attempts === 0) {
    return "NEW"
  }

  if (progress.confidence >= strategy.masteredThreshold) {
    return "MASTERED"
  }

  if (overdue && progress.confidence < strategy.stableThreshold) {
    return "WEAKENING"
  }

  if (progress.confidence >= strategy.stableThreshold) {
    return "STABLE"
  }

  return "LEARNING"
}

export async function evaluateStudent(userId: string) {
  // Защита от дублирования
  const active = await prisma.studentChallenge.findFirst({
    where: {
      userId,
      status: "assigned"
    }
  })

  if (active) {
    await logEngineDecision(userId, "has_active_challenge", { activeChallengeId: active.id })
    return active
  }

  // 🧠 Иерархия выбора стратегии
  const strategy = await getStrategyForUser(userId)
  if (!strategy) {
    await logEngineDecision(userId, "no_strategy", null)
    return null
  }

  await logEngineDecision(userId, "strategy_selected", { 
    strategyId: strategy.id, 
    strategyName: strategy.name,
    isGlobal: !strategy.teacherId 
  })

  const order = strategy.evaluationOrder as string[]

  for (const rule of order) {
    if (rule === "review") {
      const skillId = await findReviewSkill(userId)
      if (skillId) {
        const assignment = await assignChallenge(userId, skillId)
        if (assignment) {
          await logEngineDecision(userId, "assigned_challenge", { reason: "review", skillId, strategyId: strategy.id })
          return assignment
        }
      }
    }

    if (rule === "weak") {
      const skillId = await findWeakSkill(userId, strategy.stableThreshold)
      if (skillId) {
        const assignment = await assignChallenge(userId, skillId)
        if (assignment) {
          await logEngineDecision(userId, "assigned_challenge", { reason: "weak", skillId, stableThreshold: strategy.stableThreshold, strategyId: strategy.id })
          return assignment
        }
      }
    }

    if (rule === "new") {
      const newSkill = await findNextSkill(userId)
      if (newSkill) {
        const assignment = await assignChallenge(userId, newSkill.id)
        if (assignment) {
          await logEngineDecision(userId, "assigned_challenge", { reason: "new", skillId: newSkill.id, strategyId: strategy.id })
          return assignment
        }
      }
    }
  }

  await logEngineDecision(userId, "no_assignment", { strategy: order, strategyId: strategy.id })
  return null
}

// 🧠 Иерархия выбора стратегии
async function getStrategyForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Strategy: true,
      Teacher: {
        include: { TeachingStrategies: true }
      },
      Students: true // Добавляем для полноты
    }
  })

  if (!user) return null

  // 1. Если у ученика есть strategyId → используем её
  if (user.Strategy) {
    return user.Strategy
  }

  // 2. Иначе если у учителя есть стратегия → её
  if (user.Teacher && user.Teacher.TeachingStrategies.length > 0) {
    return user.Teacher.TeachingStrategies[0] // Первая стратегия учителя
  }

  // 3. Иначе глобальную
  return prisma.strategyConfig.findFirst({
    where: { teacherId: null }
  })
}

async function findReviewSkill(userId: string) {
  const review = await prisma.skillProgress.findFirst({
    where: {
      userId,
      state: "WEAKENING"
    },
    include: { skill: true }
  })

  return review ? review.skillId : null
}

async function findWeakSkill(userId: string, _stableThreshold: number) {
  const weakSkill = await prisma.skillProgress.findFirst({
    where: {
      userId,
      state: {
        in: ["LEARNING", "WEAKENING"]
      }
    },
    include: { skill: true }
  })

  return weakSkill ? weakSkill.skillId : null
}

async function findNextSkill(userId: string) {
  const learned = await prisma.skillProgress.findMany({
    where: { userId },
    select: { skillId: true }
  })

  return prisma.skill.findFirst({
    where: {
      id: {
        notIn: learned.map(s => s.skillId)
      }
    },
    orderBy: { order: "asc" }
  })
}

export async function completeChallenge(
  userId: string,
  skillId: string,
  isCorrect: boolean
) {
  const progress = await prisma.skillProgress.findFirst({
    where: { userId, skillId }
  })

  const strategy = await getStrategyForUser(userId)
  if (!strategy) return

  if (!progress) {
    // Создать новый прогресс если не существует
    const newProgress = await prisma.skillProgress.create({
      data: {
        userId,
        skillId,
        attempts: 1,
        correct: isCorrect ? 1 : 0,
        confidence: isCorrect ? 100 : 0,
        lastPracticed: new Date(),
        nextReviewAt: calculateNextReview(isCorrect, strategy.reviewDelayDays),
        state: "NEW" // Будет обновлено ниже
      }
    })

    // Обновляем состояние
    const newState = resolveState(newProgress, strategy)
    await prisma.skillProgress.update({
      where: { id: newProgress.id },
      data: { state: newState }
    })

    return
  }

  const attempts = progress.attempts + 1
  const correct = isCorrect ? progress.correct + 1 : progress.correct
  const confidence = (correct / attempts) * 100

  const updatedProgress = await prisma.skillProgress.update({
    where: { id: progress.id },
    data: {
      attempts,
      correct,
      confidence,
      lastPracticed: new Date(),
      nextReviewAt: calculateNextReview(isCorrect, strategy.reviewDelayDays)
    }
  })

  // 🧠 Обновляем состояние на основе новой стратегии
  const newState = resolveState(updatedProgress, strategy)
  
  await prisma.skillProgress.update({
    where: { id: progress.id },
    data: { state: newState }
  })

  await logEngineDecision(userId, "progress_updated", {
    skillId,
    isCorrect,
    confidence,
    newState,
    strategyId: strategy.id
  })
}

async function assignChallenge(userId: string, skillId: string) {
  const challenge = await prisma.challenge.findFirst({
    where: { skillId }
  })

  if (!challenge) return null

  return prisma.studentChallenge.create({
    data: {
      userId,
      challengeId: challenge.id,
      skillId,
      status: "assigned",
      maxScore: challenge.maxScore
    }
  })
}

function calculateNextReview(isCorrect: boolean, reviewDelayDays?: number): Date {
  const now = new Date()
  const days = isCorrect ? (reviewDelayDays ?? 3) : 1 // Правильно - через N дней, неправильно - завтра
  now.setDate(now.getDate() + days)
  return now
}

async function logEngineDecision(userId: string, action: string, meta: any) {
  await prisma.engineLog.create({
    data: {
      userId,
      action,
      meta
    }
  })
}
