// routes/stripe.ts — Stripe payment endpoints.
//
// POST /api/stripe/create-payment-intent  — PUBLIC, no auth required.
//   Called by the embed widget just before it shows the payment step.
//   Body: { formId: string }
//   Returns: { clientSecret: string }
//
//   Why no auth?  The embed widget runs on any visitor's browser — they are
//   not logged in to FormFlow.  We never trust the client for the amount;
//   it is always fetched from the database using the formId.
//
// POST /api/stripe/webhook                — PUBLIC, called by Stripe.
//   IMPORTANT: rawBodyMiddleware is applied to this route in index.ts BEFORE
//   express.json().  That means req.rawBody contains the unmodified bytes
//   that Stripe signed — required for constructEvent() to verify the HMAC.
//
//   Handles:
//     payment_intent.succeeded      → update submission payment_status to 'paid'
//     payment_intent.payment_failed → update submission payment_status to 'failed'
//
// SECURITY NOTES:
//   - Amount is always read from the DB — the client cannot influence the charge.
//   - Webhook requests are rejected unless the HMAC signature matches.
//   - STRIPE_WEBHOOK_SECRET must be set to the signing secret shown in the
//     Stripe dashboard under Webhooks → your endpoint → Signing secret.

import { Router, type Request, type Response } from 'express'
import type Stripe from 'stripe'
import { getStripe } from '../lib/stripe'
import { forms, submissions } from '../db/queries'

const router = Router()

// ── POST /api/stripe/create-payment-intent ────────────────────────────────
// The embed widget calls this right before rendering the Stripe payment form.
// We fetch the amount + currency from the database (never from the client).
router.post('/create-payment-intent', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as { formId?: string }

  if (!body.formId) {
    res.status(400).json({ message: 'formId is required' })
    return
  }

  try {
    // Only published forms can accept payments — getPublic() checks is_published
    const form = await forms.getPublic(body.formId)
    if (!form) {
      res.status(404).json({ message: 'Form not found or not published' })
      return
    }

    if (!form.has_payment_step || !form.payment_amount) {
      res.status(400).json({ message: 'This form does not have a payment step' })
      return
    }

    const stripe = getStripe()

    // Stripe amounts are always in the smallest currency unit.
    // For USD that is cents — so $12.50 is stored and sent as 1250.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: form.payment_amount,
      currency: form.payment_currency ?? 'usd',
      description:
        form.payment_description ?? `Payment for "${form.title}"`,
      metadata: { formId: body.formId },
      // automatic_payment_methods shows all payment methods the Stripe
      // account has enabled in the dashboard (cards, Apple Pay, etc.)
      automatic_payment_methods: { enabled: true },
    })

    // clientSecret is given to the browser so Stripe Elements can complete
    // the payment.  It can only be used once and expires automatically.
    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('Create payment intent error:', err)
    res.status(500).json({ message: 'Failed to create payment intent' })
  }
})

// ── POST /api/stripe/webhook ──────────────────────────────────────────────
// Stripe calls this URL after payment events.  req.rawBody is set by
// rawBodyMiddleware (registered in index.ts before express.json()).
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string | undefined
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set — cannot verify webhooks')
    res.status(500).json({ message: 'Webhook secret not configured' })
    return
  }

  if (!sig) {
    res.status(400).json({ message: 'Missing stripe-signature header' })
    return
  }

  if (!req.rawBody) {
    res.status(400).json({ message: 'Missing raw request body' })
    return
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    // constructEvent throws a SignatureVerificationError if the signature
    // does not match — meaning the request did not come from Stripe, or
    // the body was modified in transit.  We reject it immediately.
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    res.status(400).json({ message: 'Invalid webhook signature' })
    return
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      // Cast to the specific object type Stripe sends with this event
      const intent = event.data.object as Stripe.PaymentIntent
      // Find the submission we created with this paymentIntentId and
      // mark it as paid so the dashboard can show a green ✓
      await submissions.updatePaymentStatus(intent.id, 'paid')

    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent
      await submissions.updatePaymentStatus(intent.id, 'failed')
    }
    // All other event types are silently acknowledged — Stripe requires
    // a 200 response or it will retry the webhook up to 72 hours.
    res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    res.status(500).json({ message: 'Webhook processing failed' })
  }
})

export default router
