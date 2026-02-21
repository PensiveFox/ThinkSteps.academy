import cron from 'node-cron'
import { evaluateStudent } from './learningEngine'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Запускать каждый день в 3:00 ночи
cron.schedule('0 3 * * *', async () => {
  console.log('🚀 Starting auto-assignment for students...')
  
  try {
    const students = await prisma.user.findMany({
      where: { 
        // Предполагаем, что у студентов есть роль или поле isStudent
        // isStudent: true 
        // Или можно использовать другое условие
      }
    })

    let assignedCount = 0

    for (const student of students) {
      const assignment = await evaluateStudent(student.id)
      if (assignment) {
        assignedCount++
        console.log(`✅ Assigned challenge to student ${student.id}`)
      }
    }

    console.log(`🎉 Auto-assignment complete. Assigned ${assignedCount} challenges.`)
  } catch (error) {
    console.error('❌ Error in auto-assignment:', error)
  }
})

// Также можно запускать чаще для более активного обучения
// Например, каждые 6 часов
cron.schedule('0 */6 * * *', async () => {
  console.log('🔄 Running intermediate evaluation...')
  
  try {
    const students = await prisma.user.findMany({
      where: {
        // Только активные студенты
        // isStudent: true,
        // lastActivityAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    })

    for (const student of students) {
      await evaluateStudent(student.id)
    }
  } catch (error) {
    console.error('❌ Error in intermediate evaluation:', error)
  }
})

console.log('⏰ Learning engine scheduler started')
