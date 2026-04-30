// lib/stripe.ts — lazy Stripe SDK instance.
//
// Why lazy?
// The original version threw immediately on import if STRIPE_SECRET_KEY was
// missing. That crashed the server at startup even when Stripe wasn't being
// used (e.g. running tests, or before Stripe is configured).
//
// The lazy pattern connects only when a route actually calls getStripe(),
// so the server can start and handle non-payment requests without the key.
//
// SECURITY: STRIPE_SECRET_KEY is a server-side secret — it must never appear
// in frontend code or environment variables prefixed with VITE_. Only the
// publishable key (pk_test_... / pk_live_...) is safe to expose to the client.

import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY environment variable is not set. ' +
      'Get your key from https://dashboard.stripe.com/apikeys'
    )
  }

  _stripe = new Stripe(key, {
    apiVersion: '2025-02-24.acacia',
    telemetry: false, // Don't send usage data to Stripe
  })

  return _stripe
}
