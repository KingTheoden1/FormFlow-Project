import { Router } from 'express'

const router = Router()

// POST /api/auth/login
// POST /api/auth/logout
// POST /api/auth/refresh
// Full implementation: auth milestone

router.post('/login', (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' })
})

router.post('/logout', (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' })
})

router.post('/refresh', (_req, res) => {
  res.status(501).json({ message: 'Not implemented yet' })
})

export default router
