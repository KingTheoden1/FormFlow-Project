import { Router } from 'express'
import { requireAuth } from '../middleware/auth'

const router = Router()

// POST /api/stripe/create-payment-intent  — protected, creates intent before form submit
// POST /api/stripe/webhook               — public, called by Stripe (raw body required)
//
// IMPORTANT: The webhook route is registered in index.ts BEFORE express.json()
// using rawBodyMiddleware so Stripe can verify the signature.
// Full implementation: Stripe milestone

router.post('/create-payment-intent', requireAuth, (_req, res) =>
  res.status(501).json({ message: 'Not implemented yet' })
)

// Webhook handler — note: registered in index.ts with rawBodyMiddleware,
// not here, to ensure correct middleware ordering
router.post('/webhook', (_req, res) =>
  res.status(501).json({ message: 'Not implemented yet' })
)

export default router
