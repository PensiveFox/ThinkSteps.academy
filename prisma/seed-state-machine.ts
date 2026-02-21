import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Seeding state machine test data...')

  // Очищаем старые данные
  await prisma.studentChallenge.deleteMany()
  await prisma.skillProgress.deleteMany()
  await prisma.challenge.deleteMany()
  await prisma.skill.deleteMany()
  await prisma.strategyConfig.deleteMany()
  await prisma.user.deleteMany()

  // Создаем глобальную стратегию
  const globalStrategy = await prisma.strategyConfig.create({
    data: {
      name: 'Default Strategy',
      evaluationOrder: ['review', 'weak', 'new'],
      stableThreshold: 80,
      masteredThreshold: 95,
      weakeningThreshold: 70,
      reviewDelayDays: 3,
      teacherId: null // глобальная
    }
  })

  console.log('✅ Created global strategy:', globalStrategy.name)

  // Создаем студента
  const student = await prisma.user.create({
    data: {
      email: 'math.student@test.com',
      username: 'math_student',
      fullname: 'Математик Тестовый',
      // Используем глобальную стратегию (strategyId не указан)
    }
  })

  console.log('✅ Created student:', student.username)

  // Создаем навыки по математике
  const skill1 = await prisma.skill.create({
    data: {
      title: 'Линейные уравнения',
      description: 'Решение линейных уравнений вида ax + b = c',
      masteryThreshold: 80,
      decayRate: 5,
      order: 1 // первый в очереди
    }
  })

  const skill2 = await prisma.skill.create({
    data: {
      title: 'Квадратные уравнения',
      description: 'Решение квадратных уравнений через дискриминант',
      masteryThreshold: 80,
      decayRate: 5,
      order: 2
    }
  })

  const skill3 = await prisma.skill.create({
    data: {
      title: 'Модуль',
      description: 'Работа с модулем числа и уравнениями с модулем',
      masteryThreshold: 80,
      decayRate: 5,
      order: 3
    }
  })

  const skill4 = await prisma.skill.create({
    data: {
      title: 'Тригонометрия',
      description: 'Основы тригонометрии: sin, cos, tg',
      masteryThreshold: 80,
      decayRate: 5,
      order: 4
    }
  })

  console.log('✅ Created 4 skills')

  // Создаем задания для каждого навыка
  for (const skill of [skill1, skill2, skill3, skill4]) {
    await prisma.challenge.create({
      data: {
        skillId: skill.id,
        difficulty: 1,
        maxScore: 10,
        timeLimit: 300, // 5 минут
        createdById: student.id
      }
    })
  }

  console.log('✅ Created challenges for all skills')

  // === НАСТРОЙКА ВРЕМЕНИ ===
  const now = new Date()
  const twoDaysAgo = new Date(now)
  twoDaysAgo.setDate(now.getDate() - 2)
  
  const tenDaysAgo = new Date(now)
  tenDaysAgo.setDate(now.getDate() - 10)
  
  const fiveDaysAgo = new Date(now)
  fiveDaysAgo.setDate(now.getDate() - 5)
  
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  // 1️⃣ STABLE навык - Линейные уравнения
  await prisma.skillProgress.create({
    data: {
      userId: student.id,
      skillId: skill1.id,
      attempts: 12,
      correct: 10,
      confidence: 83,
      state: 'STABLE',
      lastPracticed: twoDaysAgo,
      nextReviewAt: new Date(now.getTime() + 2 * 86400000) // через 2 дня
    }
  })

  // 2️⃣ LEARNING навык - Квадратные уравнения
  await prisma.skillProgress.create({
    data: {
      userId: student.id,
      skillId: skill2.id,
      attempts: 8,
      correct: 4,
      confidence: 50,
      state: 'LEARNING',
      lastPracticed: yesterday,
      nextReviewAt: new Date(now.getTime() + 2 * 86400000)
    }
  })

  // 3️⃣ WEAKENING (просрочен) - Модуль
  await prisma.skillProgress.create({
    data: {
      userId: student.id,
      skillId: skill3.id,
      attempts: 10,
      correct: 7, // 70% confidence - ниже stableThreshold!
      confidence: 70,
      state: 'STABLE', // намеренно - resolveState должен изменить на WEAKENING
      lastPracticed: tenDaysAgo,
      nextReviewAt: fiveDaysAgo // уже просрочен!
    }
  })

  // 4️⃣ NEW навык - Тригонометрия
  // НЕ создаем SkillProgress - это означает NEW состояние

  console.log('✅ Created skill progress with different states')

  // Выводим текущее состояние для проверки
  const progress = await prisma.skillProgress.findMany({
    where: { userId: student.id },
    include: { skill: true },
    orderBy: { skill: { order: 'asc' } }
  })

  console.log('\n📊 Current student progress:')
  progress.forEach(p => {
    console.log(`${p.skill.title}: ${p.state} (confidence: ${p.confidence}%, attempts: ${p.attempts})`)
  })

  // Проверяем состояние skill3 (должен стать WEAKENING после resolveState)
  const weakeningSkill = progress.find(p => p.skill.title === 'Модуль')
  if (weakeningSkill && weakeningSkill.nextReviewAt && weakeningSkill.nextReviewAt < now) {
    console.log(`\n⚠️  ${weakeningSkill.skill.title} is OVERDUE for review!`)
    console.log(`   nextReviewAt was: ${weakeningSkill.nextReviewAt}`)
    console.log(`   current time: ${now}`)
  }

  console.log('\n🎯 Test scenarios ready:')
  console.log('1. evaluateStudent() should assign "Модуль" first (WEAKENING)')
  console.log('2. Change stableThreshold to 85 → "Линейные уравнения" becomes LEARNING')
  console.log('3. Complete "Квадратные уравнения" successfully → confidence increases')
  console.log('4. "Тригонометрия" should be assigned last (NEW)')

  console.log('\n✅ State machine test data seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding state machine:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
