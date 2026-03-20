import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 🧠 Enhanced State Resolver with Time and Decay
export function resolveStateWithTime(
  progress: any, 
  strategy: any, 
  currentDate: Date = new Date()
): 'NEW' | 'LEARNING' | 'STABLE' | 'WEAKENING' | 'MASTERED' {
  
  // Calculate effective confidence with decay
  const effectiveConfidence = calculateEffectiveConfidence(progress, currentDate, strategy.decayRate || 5)
  
  const overdue = progress.nextReviewAt && progress.nextReviewAt < currentDate

  if (progress.attempts === 0) return 'NEW'
  if (effectiveConfidence >= strategy.masteredThreshold) return 'MASTERED'
  if (overdue && effectiveConfidence < strategy.stableThreshold) return 'WEAKENING'
  if (effectiveConfidence >= strategy.stableThreshold) return 'STABLE'
  return 'LEARNING'
}

// 📉 Confidence Decay Calculation
export function calculateEffectiveConfidence(
  progress: any, 
  currentDate: Date, 
  decayRate: number = 5
): number {
  if (!progress.lastPracticed || progress.attempts === 0) {
    return progress.confidence || 0
  }

  const daysSinceLastPractice = Math.floor(
    (currentDate.getTime() - progress.lastPracticed.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceLastPractice <= 1) {
    return progress.confidence
  }

  // Apply decay: confidence - (decayRate * (daysSinceLastPractice - 1))
  const decayedConfidence = progress.confidence - (decayRate * (daysSinceLastPractice - 1))
  return Math.max(0, decayedConfidence)
}

// 🎯 Student Personality Types
export type StudentPersonality = 'ideal' | 'average' | 'forgetful' | 'lazy'

export interface StudentProfile {
  id: string
  name: string
  personality: StudentPersonality
  skills: SkillProfile[]
}

export interface SkillProfile {
  title: string
  attempts: number
  correct: number
  confidence: number
  lastPracticed: Date | null
  nextReviewAt: Date | null
  state: string
}

// 📊 Daily Simulation Result
export interface DayResult {
  day: number
  date: Date
  skills: SkillResult[]
  actions: SimulationAction[]
  summary: {
    totalPractices: number
    skillsInWeakening: number
    skillsStable: number
    skillsLearning: number
    skillsNew: number
  }
}

export interface SkillResult {
  title: string
  attempts: number
  correct: number
  confidence: number
  effectiveConfidence: number
  state: string
  lastPracticed: Date | null
  nextReviewAt: Date | null
  practiced: boolean
  decayApplied: number
}

export interface SimulationAction {
  timestamp: Date
  type: 'PRACTICE' | 'STATE_CHANGE' | 'STRATEGY_EVALUATION'
  skill: string
  details: string
  oldState?: string
  newState?: string
}

// 🎭 Personality Behaviors
const personalityBehaviors = {
  ideal: {
    dailyPracticeCount: 3,
    accuracy: 0.9,
    consistency: 1.0, // всегда практикует
    skillPreference: 'balanced' // равномерно все навыки
  },
  average: {
    dailyPracticeCount: 2,
    accuracy: 0.7,
    consistency: 0.8, // иногда пропускает
    skillPreference: 'focused' // концентрируется на слабых
  },
  forgetful: {
    dailyPracticeCount: 2,
    accuracy: 0.6,
    consistency: 0.6, // часто пропускает
    skillPreference: 'random' // хаотично
  },
  lazy: {
    dailyPracticeCount: 1,
    accuracy: 0.5,
    consistency: 0.5, // часто пропускает
    skillPreference: 'easiest' // выбирает простые
  }
}

// 🎲 Random utilities
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  let random = Math.random() * totalWeight
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i]
    if (random <= 0) return items[i]
  }
  
  return items[items.length - 1]
}

// 🚀 Main Learning Simulator Class
export class LearningSimulator {
  private strategy: any
  private currentDate: Date
  private results: DayResult[] = []
  private engineLogs: any[] = []

  constructor(
    private student: StudentProfile,
    private strategyConfig: any,
    private startDate: Date = new Date()
  ) {
    this.strategy = strategyConfig
    this.currentDate = new Date(startDate)
  }

  // 🎯 Run full simulation
  async runSimulation(days: number = 30): Promise<DayResult[]> {
    console.log(`🚀 Starting ${days}-day simulation for ${this.student.name} (${this.student.personality})`)
    
    for (let day = 1; day <= days; day++) {
      const dayResult = await this.simulateDay(day)
      this.results.push(dayResult)
      
      // Log summary every 7 days
      if (day % 7 === 0) {
        console.log(`📊 Week ${Math.floor(day / 7)} summary:`, this.getWeeklySummary(day))
      }
    }
    
    console.log(`✅ Simulation completed for ${this.student.name}`)
    return this.results
  }

  // 📅 Simulate single day
  private async simulateDay(day: number): Promise<DayResult> {
    const dayDate = new Date(this.currentDate)
    const actions: SimulationAction[] = []
    const behavior = personalityBehaviors[this.student.personality]
    
    // Check if student practices today (based on consistency)
    const willPracticeToday = Math.random() < behavior.consistency
    
    if (!willPracticeToday) {
      actions.push({
        timestamp: new Date(dayDate),
        type: 'PRACTICE',
        skill: 'NONE',
        details: `${this.student.name} skipped practice today`
      })
    } else {
      // Determine how many skills to practice today
      const practiceCount = Math.floor(behavior.dailyPracticeCount)
      
      for (let i = 0; i < practiceCount; i++) {
        const skillToPractice = this.selectSkillToPractice(behavior.skillPreference)
        if (skillToPractice) {
          await this.practiceSkill(skillToPractice, dayDate, behavior.accuracy, actions)
        }
      }
    }
    
    // Update all states with current date and decay
    const skillResults: SkillResult[] = this.student.skills.map(skill => {
      const effectiveConfidence = calculateEffectiveConfidence(skill, dayDate, this.strategy.decayRate)
      const oldState = skill.state
      const newState = resolveStateWithTime(skill, this.strategy, dayDate)
      
      if (oldState !== newState) {
        actions.push({
          timestamp: new Date(dayDate),
          type: 'STATE_CHANGE',
          skill: skill.title,
          details: `${oldState} → ${newState} (effective confidence: ${effectiveConfidence}%)`,
          oldState,
          newState
        })
      }
      
      const decayApplied = skill.confidence - effectiveConfidence
      
      return {
        title: skill.title,
        attempts: skill.attempts,
        correct: skill.correct,
        confidence: skill.confidence,
        effectiveConfidence,
        state: newState,
        lastPracticed: skill.lastPracticed,
        nextReviewAt: skill.nextReviewAt,
        practiced: skill.lastPracticed?.toDateString() === dayDate.toDateString(),
        decayApplied
      }
    })
    
    // Move to next day
    this.currentDate.setDate(this.currentDate.getDate() + 1)
    
    return {
      day,
      date: dayDate,
      skills: skillResults,
      actions,
      summary: this.calculateDaySummary(skillResults)
    }
  }

  // 🎯 Select skill to practice based on personality
  private selectSkillToPractice(preference: string): SkillProfile | null {
    const availableSkills = this.student.skills.filter(skill => {
      // Don't practice mastered skills too often
      if (skill.state === 'MASTERED' && Math.random() < 0.8) return false
      return true
    })
    
    if (availableSkills.length === 0) return null
    
    switch (preference) {
      case 'balanced':
        return availableSkills[Math.floor(Math.random() * availableSkills.length)]
      
      case 'focused':
        // Prioritize weak and learning skills
        const weakSkills = availableSkills.filter(s => s.state === 'WEAKENING' || s.state === 'LEARNING')
        if (weakSkills.length > 0) {
          return weakSkills[Math.floor(Math.random() * weakSkills.length)]
        }
        return availableSkills[Math.floor(Math.random() * availableSkills.length)]
      
      case 'easiest':
        // Prioritize stable and mastered skills
        const easySkills = availableSkills.filter(s => s.state === 'STABLE' || s.state === 'MASTERED')
        if (easySkills.length > 0) {
          return easySkills[Math.floor(Math.random() * easySkills.length)]
        }
        return availableSkills[Math.floor(Math.random() * availableSkills.length)]
      
      case 'random':
      default:
        return availableSkills[Math.floor(Math.random() * availableSkills.length)]
    }
  }

  // 🎯 Practice a skill
  private async practiceSkill(
    skill: SkillProfile, 
    date: Date, 
    accuracy: number, 
    actions: SimulationAction[]
  ): Promise<void> {
    const isCorrect = Math.random() < accuracy
    
    // Update skill statistics
    skill.attempts += 1
    if (isCorrect) skill.correct += 1
    skill.confidence = Math.round((skill.correct / skill.attempts) * 100)
    skill.lastPracticed = new Date(date)
    
    // Calculate next review date
    const reviewDelayDays = this.strategy.reviewDelayDays || 3
    const nextReview = new Date(date)
    nextReview.setDate(nextReview.getDate() + reviewDelayDays)
    skill.nextReviewAt = nextReview
    
    actions.push({
      timestamp: new Date(date),
      type: 'PRACTICE',
      skill: skill.title,
      details: `${isCorrect ? '✅' : '❌'} Practice #${skill.attempts} (confidence: ${skill.confidence}%)`
    })
  }

  // 📊 Calculate day summary
  private calculateDaySummary(skills: SkillResult[]) {
    return {
      totalPractices: skills.filter(s => s.practiced).length,
      skillsInWeakening: skills.filter(s => s.state === 'WEAKENING').length,
      skillsStable: skills.filter(s => s.state === 'STABLE').length,
      skillsLearning: skills.filter(s => s.state === 'LEARNING').length,
      skillsNew: skills.filter(s => s.state === 'NEW').length
    }
  }

  // 📈 Get weekly summary
  private getWeeklySummary(day: number) {
    const weekStart = Math.max(0, day - 7)
    const weekResults = this.results.slice(weekStart, day)
    
    const totalPractices = weekResults.reduce((sum, day) => sum + day.summary.totalPractices, 0)
    const avgWeakSkills = weekResults.reduce((sum, day) => sum + day.summary.skillsInWeakening, 0) / 7
    
    return {
      totalPractices,
      avgWeakSkills: avgWeakSkills.toFixed(1),
      currentStates: this.getCurrentSkillStates()
    }
  }

  // 🎯 Get current skill states
  private getCurrentSkillStates() {
    return this.student.skills.map(skill => ({
      title: skill.title,
      state: skill.state,
      confidence: skill.confidence
    }))
  }

  // 📊 Get full results
  getResults(): DayResult[] {
    return this.results
  }

  // 📈 Generate statistics
  generateStatistics() {
    const stats = {
      totalDays: this.results.length,
      totalPractices: this.results.reduce((sum, day) => sum + day.summary.totalPractices, 0),
      averagePracticesPerDay: 0,
      skillStateDistribution: {} as Record<string, number>,
      weakeningEvents: 0,
      masteryEvents: 0,
      decayImpact: 0
    }

    stats.averagePracticesPerDay = stats.totalPractices / stats.totalDays

    // Count state transitions
    this.results.forEach(day => {
      day.actions.forEach(action => {
        if (action.type === 'STATE_CHANGE') {
          if (action.newState === 'WEAKENING') stats.weakeningEvents++
          if (action.newState === 'MASTERED') stats.masteryEvents++
        }
      })
      
      // Calculate total decay impact
      day.skills.forEach(skill => {
        stats.decayImpact += skill.decayApplied
      })
    })

    // Final state distribution
    const finalDay = this.results[this.results.length - 1]
    if (finalDay) {
      finalDay.skills.forEach(skill => {
        stats.skillStateDistribution[skill.state] = (stats.skillStateDistribution[skill.state] || 0) + 1
      })
    }

    return stats
  }

  // 📋 Generate detailed report
  generateReport(): string {
    const stats = this.generateStatistics()
    
    let report = `\n🎓 ${this.student.name} Simulation Report (${this.student.personality} personality)\n`
    report += `📅 Period: ${this.results.length} days\n`
    report += `📊 Total practices: ${stats.totalPractices} (avg: ${stats.averagePracticesPerDay.toFixed(1)}/day)\n`
    report += `⚠️  Weakening events: ${stats.weakeningEvents}\n`
    report += `🏆 Mastery events: ${stats.masteryEvents}\n`
    report += `📉 Total decay impact: ${stats.decayImpact.toFixed(1)} confidence points\n\n`
    
    report += `📈 Final skill distribution:\n`
    Object.entries(stats.skillStateDistribution).forEach(([state, count]) => {
      report += `  ${state}: ${count}\n`
    })
    
    report += `\n📋 Daily breakdown:\n`
    this.results.forEach(day => {
      const weakening = day.summary.skillsInWeakening > 0 ? ` ⚠️${day.summary.skillsInWeakening}` : ''
      report += `Day ${day.day}: ${day.summary.totalPractices} practices${weakening}\n`
    })
    
    return report
  }
}

// 🎮 Factory function to create students
export function createStudent(name: string, personality: StudentPersonality): StudentProfile {
  const baseSkills = [
    { title: 'Linear Equations', attempts: 0, correct: 0, confidence: 0, lastPracticed: null, nextReviewAt: null, state: 'NEW' },
    { title: 'Quadratic Equations', attempts: 0, correct: 0, confidence: 0, lastPracticed: null, nextReviewAt: null, state: 'NEW' },
    { title: 'Fractions', attempts: 0, correct: 0, confidence: 0, lastPracticed: null, nextReviewAt: null, state: 'NEW' }
  ]
  
  return {
    id: `student_${name.toLowerCase()}`,
    name,
    personality,
    skills: baseSkills
  }
}

// 🚀 Main simulation runner
export async function runFullSimulation() {
  console.log('🎬 Starting comprehensive learning simulation...\n')
  
  const strategy = {
    evaluationOrder: ['review', 'weak', 'new'],
    stableThreshold: 80,
    masteredThreshold: 95,
    weakeningThreshold: 70,
    reviewDelayDays: 3,
    decayRate: 5
  }
  
  const personalities: StudentPersonality[] = ['ideal', 'average', 'forgetful', 'lazy']
  const results: Array<{ student: StudentProfile, simulator: LearningSimulator }> = []
  
  for (const personality of personalities) {
    const student = createStudent(`${personality.charAt(0).toUpperCase() + personality.slice(1)} Student`, personality)
    const simulator = new LearningSimulator(student, strategy)
    
    await simulator.runSimulation(30)
    results.push({ student, simulator })
    
    console.log(simulator.generateReport())
    console.log('─'.repeat(50))
  }
  
  // Comparative analysis
  console.log('\n📊 Comparative Analysis:')
  results.forEach(({ student, simulator }) => {
    const stats = simulator.generateStatistics()
    console.log(`${student.name}: ${stats.totalPractices} practices, ${stats.weakeningEvents} weakening events`)
  })
  
  return results
}

// 🧪 Quick test function
export async function quickTest() {
  const student = createStudent('Test Student', 'average')
  const strategy = {
    stableThreshold: 80,
    masteredThreshold: 95,
    reviewDelayDays: 3,
    decayRate: 5
  }
  
  const simulator = new LearningSimulator(student, strategy)
  const results = await simulator.runSimulation(7)
  
  console.log('🧪 Quick 7-day test completed:')
  console.log(simulator.generateReport())
  
  return results
}

// Run if called directly
if (require.main === module) {
  runFullSimulation().catch(console.error)
}
