import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding hierarchical strategy system...')

  // 1. Создаем глобальную стратегию
  const globalStrategy = await prisma.strategyConfig.upsert({
    where: { id: 'global-strategy' },
    update: {},
    create: {
      id: 'global-strategy',
      name: 'Global Default Strategy',
      teacherId: null, // null = global
      evaluationOrder: ["review", "weak", "new"],
      stableThreshold: 80,
      masteredThreshold: 95,
      weakeningThreshold: 70,
      reviewDelayDays: 3
    }
  })

  console.log('✅ Global strategy created:', globalStrategy.name)

  // 2. Создаем учителя
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      fullname: 'John Teacher',
      isMentor: true,
      mentorSubjects: ['Mathematics', 'Informatics']
    }
  })

  console.log('✅ Teacher created:', teacher.fullname)

  // 3. Создаем стратегию учителя
  const teacherStrategy = await prisma.strategyConfig.upsert({
    where: { id: 'teacher-strategy' },
    update: {},
    create: {
      id: 'teacher-strategy',
      name: 'Teacher Experimental Strategy',
      teacherId: teacher.id,
      evaluationOrder: ["weak", "review", "new"], // Другой порядок!
      stableThreshold: 75, // Более мягкие пороги
      masteredThreshold: 90,
      weakeningThreshold: 65,
      reviewDelayDays: 5
    }
  })

  console.log('✅ Teacher strategy created:', teacherStrategy.name)

  // 4. Создаем студентов
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@example.com' },
    update: {},
    create: {
      email: 'student1@example.com',
      fullname: 'Alice Student',
      teacherId: teacher.id // Привязываем к учителю
    }
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@example.com' },
    update: {},
    create: {
      email: 'student2@example.com',
      fullname: 'Bob Student',
      teacherId: teacher.id,
      strategyId: teacherStrategy.id // Прямая стратегия
    }
  })

  console.log('✅ Students created:')
  console.log(`  - ${student1.fullname} (uses teacher strategy)`)
  console.log(`  - ${student2.fullname} (uses direct strategy)`)

  // 5. Создаем навыки
  const skills = [
    { title: "Basic Arithmetic", order: 0 },
    { title: "Algebra Basics", order: 1 },
    { title: "Geometry Fundamentals", order: 2 }
  ]

  for (const skillData of skills) {
    const skill = await prisma.skill.upsert({
      where: { title: skillData.title },
      update: { order: skillData.order },
      create: {
        title: skillData.title,
        description: `Learn ${skillData.title.toLowerCase()}`,
        order: skillData.order
      }
    })

    // Создаем challenge для каждого навыка
    await prisma.challenge.upsert({
      where: { skillId: skill.id },
      update: {},
      create: {
        skillId: skill.id,
        difficulty: 1,
        maxScore: 10
      }
    })
  }

  console.log('✅ Skills and challenges created')

  // 6. Демонстрация иерархии
  console.log('\n🧠 Strategy Hierarchy Demo:')
  console.log(`1. ${student2.fullname} → Direct strategy: ${teacherStrategy.name}`)
  console.log(`2. ${student1.fullname} → Teacher strategy: ${teacherStrategy.name}`)
  console.log(`3. New student → Global strategy: ${globalStrategy.name}`)

  console.log('\n🎉 Hierarchical strategy system seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
