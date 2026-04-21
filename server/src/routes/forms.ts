import { Router } from 'express'
import { requireAuth } from '../middleware/auth'

const router = Router()

// All form routes require authentication
router.use(requireAuth)

// GET    /api/forms          — list user's forms
// POST   /api/forms          — create form
// GET    /api/forms/:id      — get form definition
// PUT    /api/forms/:id      — update form definition
// DELETE /api/forms/:id      — delete form
// Full implementation: builder milestone

router.get('/', (_req, res) => res.status(501).json({ message: 'Not implemented yet' }))
router.post('/', (_req, res) => res.status(501).json({ message: 'Not implemented yet' }))
router.get('/:id', (_req, res) => res.status(501).json({ message: 'Not implemented yet' }))
router.put('/:id', (_req, res) => res.status(501).json({ message: 'Not implemented yet' }))
router.delete('/:id', (_req, res) => res.status(501).json({ message: 'Not implemented yet' }))

export default router
