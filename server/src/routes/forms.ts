// routes/forms.ts — CRUD endpoints for form definitions.
//
// Public (no auth required):
//   GET  /api/forms/:id/public  — returns a published form for the embed script
//
// Protected (requires Authorization: Bearer <accessToken>):
//   GET    /api/forms           — list the logged-in user's forms
//   POST   /api/forms           — create a new form
//   GET    /api/forms/:id       — get a specific form (ownership enforced)
//   PUT    /api/forms/:id       — update a form (ownership enforced)
//   DELETE /api/forms/:id       — delete a form (ownership enforced)
//   PATCH  /api/forms/:id/publish — toggle published status
//
// Ownership enforcement: every protected route checks that the form's
// owner_id matches req.user.userId — a user can never read or edit
// another user's forms.

import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { forms } from '../db/queries'
import type { Step } from '../types'

const router = Router()

// ── Public route (BEFORE requireAuth middleware) ───────────────

// GET /api/forms/:id/public
// Used by the embed script to fetch the form definition.
// Only returns the form if is_published = 1.
router.get('/:id/public', async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string
  try {
    const form = await forms.getPublic(id)
    if (!form) {
      res.status(404).json({ message: 'Form not found or not published' })
      return
    }
    res.json(serializeForm(form))
  } catch (err) {
    console.error('Get public form error:', err)
    res.status(500).json({ message: 'Failed to load form' })
  }
})

// ── All routes below require a valid JWT ──────────────────────
router.use(requireAuth)

// ── GET /api/forms — list the user's forms ────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await forms.listByOwner(req.user!.userId)
    res.json(rows.map(serializeFormSummary))
  } catch (err) {
    console.error('List forms error:', err)
    res.status(500).json({ message: 'Failed to list forms' })
  }
})

// ── POST /api/forms — create a new form ───────────────────────
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as {
    title?: string
    description?: string
    steps?: Step[]
    hasPaymentStep?: boolean
    paymentAmount?: number
    paymentCurrency?: string
    paymentDescription?: string
  }

  if (!body.title?.trim()) {
    res.status(400).json({ message: 'Title is required' })
    return
  }

  try {
    const form = await forms.create(req.user!.userId, {
      title: body.title.trim(),
      description: body.description,
      steps: body.steps ?? [],
      hasPaymentStep: body.hasPaymentStep ?? false,
      paymentAmount: body.paymentAmount,
      paymentCurrency: body.paymentCurrency,
      paymentDescription: body.paymentDescription,
    })
    res.status(201).json(serializeForm(form))
  } catch (err) {
    console.error('Create form error:', err)
    res.status(500).json({ message: 'Failed to create form' })
  }
})

// ── GET /api/forms/:id — get a single form ────────────────────
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string
  try {
    const form = await forms.getById(id)
    if (!form) {
      res.status(404).json({ message: 'Form not found' })
      return
    }
    // Ownership check — users can only access their own forms
    if (form.owner_id !== req.user!.userId) {
      res.status(403).json({ message: 'Access denied' })
      return
    }
    res.json(serializeForm(form))
  } catch (err) {
    console.error('Get form error:', err)
    res.status(500).json({ message: 'Failed to get form' })
  }
})

// ── PUT /api/forms/:id — update a form ───────────────────────
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string
  try {
    const existing = await forms.getById(id)
    if (!existing) {
      res.status(404).json({ message: 'Form not found' })
      return
    }
    if (existing.owner_id !== req.user!.userId) {
      res.status(403).json({ message: 'Access denied' })
      return
    }

    const body = req.body as {
      title?: string
      description?: string
      steps?: Step[]
      hasPaymentStep?: boolean
      paymentAmount?: number
      paymentCurrency?: string
      paymentDescription?: string
    }

    const updated = await forms.update(id, {
      title: body.title,
      description: body.description,
      steps: body.steps,
      hasPaymentStep: body.hasPaymentStep,
      paymentAmount: body.paymentAmount,
      paymentCurrency: body.paymentCurrency,
      paymentDescription: body.paymentDescription,
    })
    res.json(serializeForm(updated))
  } catch (err) {
    console.error('Update form error:', err)
    res.status(500).json({ message: 'Failed to update form' })
  }
})

// ── DELETE /api/forms/:id — delete a form ────────────────────
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string
  try {
    const existing = await forms.getById(id)
    if (!existing) {
      res.status(404).json({ message: 'Form not found' })
      return
    }
    if (existing.owner_id !== req.user!.userId) {
      res.status(403).json({ message: 'Access denied' })
      return
    }
    await forms.delete(id)
    res.status(204).send()
  } catch (err) {
    console.error('Delete form error:', err)
    res.status(500).json({ message: 'Failed to delete form' })
  }
})

// ── PATCH /api/forms/:id/publish — toggle published status ───
router.patch('/:id/publish', async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'] as string
  const { isPublished } = req.body as { isPublished?: boolean }
  if (typeof isPublished !== 'boolean') {
    res.status(400).json({ message: 'isPublished (boolean) is required' })
    return
  }
  try {
    const existing = await forms.getById(id)
    if (!existing) {
      res.status(404).json({ message: 'Form not found' })
      return
    }
    if (existing.owner_id !== req.user!.userId) {
      res.status(403).json({ message: 'Access denied' })
      return
    }
    await forms.setPublished(id, isPublished)
    res.json({ id, isPublished })
  } catch (err) {
    console.error('Publish form error:', err)
    res.status(500).json({ message: 'Failed to update publish status' })
  }
})

// ── Serialisers ───────────────────────────────────────────────
// Convert raw DB rows into the shape the frontend expects.
// We parse the JSON `steps` field back into an object here.

import type { FormRow } from '../db/queries'

function serializeForm(row: FormRow) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description ?? '',
    steps: JSON.parse(row.steps) as Step[],
    hasPaymentStep: row.has_payment_step,
    paymentAmount: row.payment_amount ?? undefined,
    paymentCurrency: row.payment_currency ?? 'usd',
    paymentDescription: row.payment_description ?? undefined,
    isPublished: row.is_published,
    embedKey: row.embed_key,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

function serializeFormSummary(row: FormRow & { submission_count?: number }) {
  return {
    id: row.id,
    title: row.title,
    isPublished: row.is_published,
    submissionCount: (row as { submission_count?: number }).submission_count ?? 0,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export default router
