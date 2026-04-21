import { Router } from 'express'
import { requireAuth } from '../middleware/auth'

const router = Router()

// POST   /api/forms/:formId/submissions  — public, no auth (embedded form submits here)
// GET    /api/forms/:formId/submissions  — protected, dashboard only
// Full implementation: responses + embed milestones

router.post('/:formId/submissions', (_req, res) =>
  res.status(501).json({ message: 'Not implemented yet' })
)

router.get('/:formId/submissions', requireAuth, (_req, res) =>
  res.status(501).json({ message: 'Not implemented yet' })
)

export default router
