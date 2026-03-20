// ============================================
// Admin API Routes Example
// ============================================

import { Router } from 'express'
import { 
  getStrategy, 
  updateStrategy, 
  updateSkillsOrder, 
  getSkills, 
  getEngineLogs 
} from '../admin/strategyAPI'

const router = Router()

// GET /admin/strategy
router.get('/strategy', async (_req, res) => {
  try {
    const strategy = await getStrategy()
    res.json(strategy)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get strategy' })
  }
})

// PATCH /admin/strategy
router.patch('/strategy', async (req, res) => {
  try {
    const strategy = await updateStrategy(req.body)
    res.json(strategy)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update strategy' })
  }
})

// GET /admin/skills
router.get('/skills', async (_req, res) => {
  try {
    const skills = await getSkills()
    res.json(skills)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get skills' })
  }
})

// PATCH /admin/skills/order
router.patch('/skills/order', async (req, res) => {
  try {
    await updateSkillsOrder(req.body)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update skills order' })
  }
})

// GET /admin/logs
router.get('/logs', async (req, res) => {
  try {
    const { userId, limit = 100 } = req.query
    const logs = await getEngineLogs(
      userId as string, 
      parseInt(limit as string)
    )
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get engine logs' })
  }
})

export default router
