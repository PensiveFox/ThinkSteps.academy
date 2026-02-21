import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding skills learning engine...')

  // Создаем стратегию по умолчанию
  const strategy = await prisma.strategyConfig.upsert({
    where: { id: 'default-strategy' },
    update: {},
    create: {
      id: 'default-strategy',
      evaluationOrder: ["review", "weak", "new"],
      minConfidence: 80,
      reviewDelayDays: 3
    }
  })

  console.log('✅ Strategy config created:', strategy)

  // Создаем тестовые навыки с порядком
  const skills = [
    { title: "Basic Arithmetic", order: 0 },
    { title: "Algebra Basics", order: 1 },
    { title: "Geometry Fundamentals", order: 2 },
    { title: "Advanced Calculus", order: 3 }
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
    console.log(`✅ Skill created: ${skill.title} (order: ${skill.order})`)

    // Создаем по одному challenge для каждого навыка
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

  console.log('🎉 Skills learning engine seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
