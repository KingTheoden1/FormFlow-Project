// routes/submissions.ts — form submission endpoints.
//
// POST /api/forms/:formId/submissions  — PUBLIC, no auth.
//   Called by the embedded form when a user submits their answers.
//   Anyone on the internet can POST here (that's the point of an embed).
//
// GET  /api/forms/:formId/submissions  — PROTECTED, requires auth.
//   Called by the FormFlow dashboard to show the response list.
//   Only the form owner can see their submissions.
//
// SECURITY NOTES:
//   - We never store the raw IP address. We store a SHA-256 hash of it.
//     This lets us detect abuse (many submissions from one IP) without
//     storing personally identifiable information.
//   - The `data` field is stored as JSON text — it's never executed or
//     interpolated into SQL (parameterized queries prevent injection).

import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import { requireAuth } from '../middleware/auth'
import { submissions, forms } from '../db/queries'

const router = Router({ mergeParams: true })

// Helper: hash an IP address for storage
function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex')
}

// ── POST /api/forms/:formId/submissions ───────────────────────
router.post('/:formId/submissions', async (req: Request, res: Response): Promise<void> => {
  const formId = req.params['formId'] as string
  const body = req.body as { data?: Record<string, unknown> }

  if (!body.data || typeof body.data !== 'object') {
    res.status(400).json({ message: 'Submission data is required' })
    return
  }

  try {
    // Verify the form exists and is published before accepting a submission
    const form = await forms.getPublic(formId)
    if (!form) {
      res.status(404).json({ message: 'Form not found or not published' })
      return
    }

    // Hash the IP for abuse detection — never store the raw IP
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      ''
    const ipHash = rawIp ? hashIp(rawIp) : undefined

    const submission = await submissions.create(formId, body.data, ipHash)

    // Emit to Socket.io so the dashboard updates in real time (M6)
    // The io instance is exported from index.ts
    try {
      const { io } = await import('../index')
      io.to(`form:${formId}`).emit('new_submission', {
        id: submission.id,
        formId: submission.form_id,
        submittedAt: submission.submitted_at,
      })
    } catch {
      // Socket.io emit failing should not fail the submission
    }

    res.status(201).json({
      id: submission.id,
      submittedAt: submission.submitted_at,
    })
  } catch (err) {
    console.error('Submission error:', err)
    res.status(500).json({ message: 'Submission failed' })
  }
})

// ── GET /api/forms/:formId/submissions ────────────────────────
router.get('/:formId/submissions', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const formId = req.params['formId'] as string

  try {
    // Ownership check — only the form owner can read submissions
    const form = await forms.getById(formId)
    if (!form) {
      res.status(404).json({ message: 'Form not found' })
      return
    }
    if (form.owner_id !== req.user!.userId) {
      res.status(403).json({ message: 'Access denied' })
      return
    }

    const rows = await submissions.listByFormId(formId)
    res.json(
      rows.map((s) => ({
        id: s.id,
        formId: s.form_id,
        data: JSON.parse(s.data) as Record<string, unknown>,
        stripePaymentIntentId: s.stripe_payment_intent_id ?? undefined,
        paymentStatus: s.payment_status ?? undefined,
        submittedAt: s.submitted_at,
      }))
    )
  } catch (err) {
    console.error('List submissions error:', err)
    res.status(500).json({ message: 'Failed to load submissions' })
  }
})

export default router
